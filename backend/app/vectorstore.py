import chromadb

from app.config import settings

_client = None
_collection = None


def _get_collection():
    global _client, _collection
    if _collection is None:
        _client = chromadb.HttpClient(host=settings.chroma_host, port=settings.chroma_port)
        _collection = _client.get_or_create_collection("ojas_entries")
    return _collection


def index_entry(user_id: int, source: str, entry_id: int, entry_date: str, text: str) -> None:
    collection = _get_collection()
    collection.upsert(
        ids=[f"{source}:{entry_id}"],
        documents=[text],
        metadatas=[{"user_id": user_id, "source": source, "date": entry_date}],
    )


def query_entries(user_id: int, question: str, n_results: int = 5) -> list[dict]:
    collection = _get_collection()
    results = collection.query(
        query_texts=[question],
        n_results=n_results,
        where={"user_id": user_id},
    )

    documents = results["documents"][0] if results["documents"] else []
    metadatas = results["metadatas"][0] if results["metadatas"] else []

    return [
        {"source": meta["source"], "date": meta["date"], "text": doc}
        for doc, meta in zip(documents, metadatas)
    ]
