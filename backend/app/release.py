"""Validate the immutable content/index snapshot bundled with a backend release."""

import hashlib
import json
from pathlib import Path, PurePosixPath
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field

from app.config import BACKEND_DIR, Settings
from app.rag.errors import RagError
from app.rag.loader import content_snapshot
from app.rag.store import IndexManifest, check_compatibility

RELEASE_DIR = BACKEND_DIR / "data" / "release"
Sha256 = Annotated[str, Field(pattern=r"^[0-9a-f]{64}$")]


class ReleaseManifest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    format_version: Literal[1] = 1
    release_id: Sha256
    source_revision: str
    content_hash: Sha256
    index_id: Sha256
    files: dict[str, Sha256]


def file_hash(path: Path) -> str:
    with path.open("rb") as source:
        return hashlib.file_digest(source, "sha256").hexdigest()


def release_identity(revision: str, index_id: str, files: dict[str, str]) -> str:
    return hashlib.sha256(
        json.dumps(
            {"revision": revision, "index_id": index_id, "files": files}, sort_keys=True
        ).encode()
    ).hexdigest()


def verify_release(
    directory: Path, settings: Settings, *, revision: str | None = None
) -> ReleaseManifest:
    """Check bytes and content compatibility without opening the immutable SQLite DB."""
    directory = directory.resolve()
    try:
        release = ReleaseManifest.model_validate_json(
            (directory / "release.json").read_text(encoding="utf-8")
        )
        required = {
            "content/portfolio.json",
            "content/portfolio.schema.json",
            "index/manifest.json",
            "index/chroma/chroma.sqlite3",
        }
        if not required.issubset(release.files):
            raise ValueError("Required release files are missing.")
        if revision and release.source_revision != revision:
            raise ValueError("Release revision does not match this workflow.")
        if release.release_id != release_identity(
            release.source_revision, release.index_id, release.files
        ):
            raise ValueError("Release identity does not match its manifest.")
        for name, digest in release.files.items():
            relative = PurePosixPath(name)
            if (
                relative.is_absolute()
                or ".." in relative.parts
                or "\\" in name
                or ":" in name
            ):
                raise ValueError("Invalid release file path.")
            path = directory.joinpath(*relative.parts)
            if (
                path.is_symlink()
                or not path.resolve().is_relative_to(directory)
                or file_hash(path) != digest
            ):
                raise ValueError("Release file checksum mismatch.")
        actual = {
            path.relative_to(directory).as_posix()
            for path in directory.rglob("*")
            if path.is_file() and path.name != "release.json"
        }
        if actual != set(release.files):
            raise ValueError("The release contains unexpected or missing files.")
        snapshot_settings = settings.model_copy(
            update={"content_dir": directory / "content"}
        )
        content_hash = content_snapshot(snapshot_settings)[1]
        index = IndexManifest.model_validate_json(
            (directory / "index" / "manifest.json").read_text(encoding="utf-8")
        )
        check_compatibility(index, settings, content_hash)
        if content_hash != release.content_hash or index.index_id != release.index_id:
            raise ValueError("Content and index do not match the release.")
        if release.source_revision != (index.source_revision or "local"):
            raise ValueError("Index and release revisions differ.")
        return release
    except RagError:
        raise
    except (OSError, ValueError) as error:
        raise RagError(
            "The packaged content/index snapshot is missing or invalid. Rebuild and deploy the backend through GitHub Actions.",
            code="invalid_release",
        ) from error
