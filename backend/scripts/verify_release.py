"""Verify the immutable snapshot before it is sent to Vercel's Linux builder."""

import argparse
import json
import os
from pathlib import Path

from app.config import get_settings
from app.rag.errors import RagError
from app.rag.loader import content_snapshot
from app.release import RELEASE_DIR, verify_release


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--directory", type=Path, default=RELEASE_DIR)
    parser.add_argument("--revision", default=os.environ.get("GITHUB_SHA"))
    args = parser.parse_args()
    settings = get_settings()
    release = verify_release(args.directory, settings, revision=args.revision)
    if content_snapshot(settings)[1] != release.content_hash:
        raise RagError(
            "Release content differs from the checked-out canonical content.",
            code="release_revision_mismatch",
        )
    print(
        json.dumps(
            {
                "status": "verified",
                "source_revision": release.source_revision,
                "content_hash": release.content_hash,
                "release_id": release.release_id,
                "files": len(release.files),
            }
        )
    )


if __name__ == "__main__":
    main()
