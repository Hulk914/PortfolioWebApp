"""Initialize a writable, per-release Chroma copy on a Vercel function instance."""

import os
import shutil
import tempfile
from pathlib import Path
from threading import Lock

from filelock import FileLock

from app.config import Settings
from app.rag.store import check_compatibility, read_manifest, validate_index
from app.release import RELEASE_DIR, verify_release

_initialization_lock = Lock()
_ready_release: str | None = None


def initialize_runtime(settings: Settings) -> None:
    global _ready_release
    if not settings.is_hosted:
        return
    with _initialization_lock:
        release = verify_release(RELEASE_DIR, settings)
        root = (Path(tempfile.gettempdir()) / "portfolio-chroma").resolve()
        root.mkdir(exist_ok=True)
        target = root / release.release_id
        if _ready_release != release.release_id:
            with FileLock(root / f"{release.release_id}.lock", timeout=30):
                if not target.exists():
                    stage = Path(
                        tempfile.mkdtemp(prefix="initializing-", dir=root)
                    ).resolve()
                    assert stage.parent == root
                    try:
                        shutil.copytree(RELEASE_DIR / "index", stage / "index")
                        os.replace(stage / "index", target)
                    finally:
                        assert stage.parent == root and not stage.is_symlink()
                        shutil.rmtree(stage)
                if target.is_symlink() or target.resolve().parent != root:
                    raise RuntimeError("Unexpected runtime index path.")
                settings.index_dir = target
                settings.content_dir = RELEASE_DIR / "content"
                manifest = read_manifest(settings)
                check_compatibility(manifest, settings, release.content_hash)
                validate_index(settings, manifest)
                _ready_release = release.release_id
        settings.index_dir = target
        settings.content_dir = RELEASE_DIR / "content"
