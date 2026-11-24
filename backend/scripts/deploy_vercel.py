"""Deploy a production candidate without moving aliases; publish its URL to Actions."""

import json
import os
import re
import shutil
import subprocess
from pathlib import Path


def main() -> None:
    executable = shutil.which("vercel")
    token = os.environ.get("VERCEL_TOKEN")
    revision = os.environ.get("GITHUB_SHA")
    if not executable or not token or not revision:
        raise RuntimeError(
            "Vercel CLI, deployment token, and commit revision are required."
        )
    result = subprocess.run(
        [
            executable,
            "deploy",
            "--prod",
            "--skip-domain",
            "--archive=tgz",
            "--yes",
            "--meta",
            f"githubCommitSha={revision}",
            "--meta",
            "githubCommitRef=main",
            "--token",
            token,
        ],
        capture_output=True,
        text=True,
        timeout=900,
    )
    if result.returncode:
        raise RuntimeError(
            "Vercel deployment failed. Inspect the project's build logs in Vercel."
        )
    raw = result.stdout.strip()
    try:
        response = json.loads(raw)
    except ValueError:
        url = raw.splitlines()[-1] if raw else ""
    else:
        url = response.get("deployment", {}).get("url") or response.get("url", "")
        if url and not url.startswith("https://"):
            url = f"https://{url}"
    if not re.fullmatch(r"https://[a-zA-Z0-9.-]+\.vercel\.app", url):
        raise RuntimeError("Vercel did not return a valid deployment URL.")
    with Path(os.environ["GITHUB_OUTPUT"]).open("a", encoding="utf-8") as output:
        output.write(f"url={url}\n")
    print(
        json.dumps(
            {"status": "candidate_ready", "url": url, "production_promoted": False}
        )
    )


if __name__ == "__main__":
    main()
