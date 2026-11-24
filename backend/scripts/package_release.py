"""Create a compact backend snapshot without generating or changing embeddings."""

import json
import os
import shutil
import tempfile
from pathlib import Path

from app.config import BACKEND_DIR, get_settings
from app.rag.errors import RagError
from app.rag.loader import content_snapshot
from app.rag.store import (
    check_compatibility,
    close_clients,
    get_client,
    get_collection,
    read_manifest,
    validate_index,
)
from app.release import (
    RELEASE_DIR,
    ReleaseManifest,
    file_hash,
    release_identity,
    verify_release,
)


def main() -> None:
    settings = get_settings()
    content_hash = content_snapshot(settings)[1]
    index = read_manifest(settings)
    check_compatibility(index, settings, content_hash)
    validate_index(settings, index)
    revision = os.environ.get("GITHUB_SHA") or index.source_revision or "local"
    if revision != (index.source_revision or "local"):
        raise RagError(
            "Run ingestion for the checked-out revision before packaging.",
            code="release_revision_mismatch",
        )
    data_dir = (BACKEND_DIR / "data").resolve()
    data_dir.mkdir(exist_ok=True)
    stage = Path(tempfile.mkdtemp(prefix="release-stage-", dir=data_dir)).resolve()
    assert stage.parent == data_dir and RELEASE_DIR.resolve().parent == data_dir
    try:
        (stage / "content").mkdir()
        for filename in ("portfolio.json", "portfolio.schema.json"):
            shutil.copy2(settings.content_dir / filename, stage / "content" / filename)
        rows = get_collection(settings, index).get(
            include=["documents", "metadatas", "embeddings"]
        )
        target_settings = settings.model_copy(update={"index_dir": stage / "index"})
        client = get_client(target_settings)
        collection = client.create_collection(
            index.collection_name,
            embedding_function=None,
            configuration={"hnsw": {"space": "cosine"}},
            metadata={"content_hash": content_hash},
        )
        batch_size = min(100, client.get_max_batch_size())
        for offset in range(0, len(rows["ids"]), batch_size):
            stop = offset + batch_size
            collection.upsert(
                ids=rows["ids"][offset:stop],
                documents=rows["documents"][offset:stop],
                metadatas=rows["metadatas"][offset:stop],
                embeddings=rows["embeddings"][offset:stop].tolist(),
            )
        (stage / "index" / "manifest.json").write_text(
            index.model_dump_json(indent=2) + "\n", encoding="utf-8"
        )
        validate_index(target_settings, index)
        close_clients()  # Flush SQLite/HNSW before computing immutable file checksums.
        files = {
            path.relative_to(stage).as_posix(): file_hash(path)
            for path in sorted(stage.rglob("*"))
            if path.is_file()
        }
        release = ReleaseManifest(
            release_id=release_identity(revision, index.index_id, files),
            source_revision=revision,
            content_hash=content_hash,
            index_id=index.index_id,
            files=files,
        )
        (stage / "release.json").write_text(
            release.model_dump_json(indent=2) + "\n", encoding="utf-8"
        )
        verify_release(stage, settings, revision=revision)
        if RELEASE_DIR.exists():
            if RELEASE_DIR.is_symlink() or RELEASE_DIR.resolve().parent != data_dir:
                raise RuntimeError("Refusing to replace an unexpected release path.")
            shutil.rmtree(RELEASE_DIR)
        stage.replace(RELEASE_DIR)
        print(
            json.dumps(
                {
                    "status": "packaged",
                    "source_revision": revision,
                    "release_id": release.release_id,
                    "content_hash": content_hash,
                    "chunks": index.chunk_count,
                    "files": len(files),
                }
            )
        )
    finally:
        close_clients()
        if stage.exists():
            assert stage.parent == data_dir and not stage.is_symlink()
            shutil.rmtree(stage)


if __name__ == "__main__":
    main()
