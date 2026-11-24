"""Release verification: readiness, revision, citations, and one real hosted chat."""

import argparse
import json
import os
import shutil
import subprocess
import tempfile
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

from app.models import ChatResponse
from app.release import RELEASE_DIR, ReleaseManifest


def request_json(
    base_url: str, path: str, *, body: dict | None = None, via_cli: bool = False
):
    data = json.dumps(body).encode() if body is not None else None
    if not via_cli:
        request = Request(
            base_url + path,
            data=data,
            headers={"Content-Type": "application/json"} if data else {},
            method="POST" if data else "GET",
        )
        with urlopen(request, timeout=150) as response:
            return json.load(response)
    executable = shutil.which("vercel")
    prefix = [executable] if executable else []
    if not prefix:
        npx = shutil.which("npx.cmd" if os.name == "nt" else "npx")
        if npx:
            prefix = [npx, "--no-install", "vercel"]
    if not prefix:
        raise RuntimeError("Vercel CLI is required to verify a protected deployment.")
    with tempfile.TemporaryDirectory(prefix="portfolio-http-") as temporary:
        assert Path(temporary).resolve().parent == Path(tempfile.gettempdir()).resolve()
        output = Path(temporary) / "response.json"
        payload = Path(temporary) / "request.json"
        command = [*prefix, "curl", path, "--deployment", base_url, "--yes"]
        if os.environ.get("VERCEL_TOKEN"):
            command += ["--token", os.environ["VERCEL_TOKEN"]]
        command += [
            "--",
            "--silent",
            "--show-error",
            "--fail-with-body",
            "--max-time",
            "150",
            "--output",
            str(output),
        ]
        if data:
            payload.write_bytes(data)
            command += [
                "--request",
                "POST",
                "--header",
                "Content-Type: application/json",
                "--data-binary",
                f"@{payload}",
            ]
        process = subprocess.run(command, capture_output=True, timeout=180)
        if process.returncode:
            # CLI stderr can contain authentication details; never echo it into CI.
            raise RuntimeError(
                "Hosted request failed. Check Vercel function logs and deployment protection."
            )
        return json.loads(output.read_text(encoding="utf-8"))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("url")
    parser.add_argument("--release", type=Path, default=RELEASE_DIR / "release.json")
    parser.add_argument("--protected", action="store_true")
    parser.add_argument("--health-only", action="store_true")
    args = parser.parse_args()
    base_url = args.url.rstrip("/")
    parsed = urlsplit(base_url)
    if (
        parsed.scheme != "https"
        or not parsed.hostname
        or parsed.username
        or parsed.query
        or parsed.fragment
        or parsed.path
    ):
        raise RuntimeError("Verification requires an HTTPS deployment origin.")
    release = ReleaseManifest.model_validate_json(
        args.release.read_text(encoding="utf-8")
    )
    readiness = None
    for attempt in range(3):
        try:
            readiness = request_json(base_url, "/api/health", via_cli=args.protected)
            break
        except (OSError, URLError, ValueError, RuntimeError, subprocess.TimeoutExpired):
            if attempt == 2:
                raise RuntimeError(
                    "Hosted readiness failed; the release was not verified."
                ) from None
            time.sleep(3)
    if readiness.get("status") != "ok" or not readiness.get("rag_index_loaded"):
        raise RuntimeError("Hosted Chroma is not ready.")
    for field in ("content_hash", "index_id", "source_revision"):
        if readiness.get(field) != getattr(release, field):
            raise RuntimeError(f"Hosted {field} differs from the prepared release.")
    result = {
        "status": "verified",
        "url": base_url,
        "content_hash": release.content_hash,
        "source_revision": release.source_revision,
        "chat_verified": False,
    }
    if not args.health_only:
        answer = ChatResponse.model_validate(
            request_json(
                base_url,
                "/api/chat",
                body={
                    "question": "What frontend architecture skills are documented in the portfolio?"
                },
                via_cli=args.protected,
            )
        )
        if (
            answer.content_hash != release.content_hash
            or not answer.citations
            or not answer.retrieved_chunks
        ):
            raise RuntimeError(
                "Hosted chat did not return a grounded answer from the matching snapshot."
            )
        evidence = {chunk.chunk_id: chunk for chunk in answer.retrieved_chunks}
        for citation in answer.citations:
            if not citation.chunk_ids:
                raise RuntimeError("Hosted citation has no evidence chunks.")
            for chunk_id in citation.chunk_ids:
                chunk = evidence.get(chunk_id)
                if (
                    chunk is None
                    or not chunk.used_in_answer
                    or chunk.document_id != citation.document_id
                    or not chunk.text.strip()
                    or chunk.url != citation.url
                ):
                    raise RuntimeError("Hosted citation evidence is inconsistent.")
        result.update(
            {
                "chat_verified": True,
                "citations": len(answer.citations),
                "trace_id": answer.trace_id,
            }
        )
    print(json.dumps(result))


if __name__ == "__main__":
    main()
