import httpx

from app.config import settings

# Map each mood to a wellness-content search query (design: mood-based Discover feed).
MOOD_QUERIES = {
    "excited": "upbeat energizing wellness music",
    "good": "positive motivation wellness",
    "calm": "calming meditation relaxation",
    "sleepy": "sleep relaxation calming sounds",
    "sad": "comforting uplifting wellness",
    "anxious": "anxiety relief calming breathing",
}

SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"


def _stub_videos(mood: str) -> list[dict]:
    """Deterministic placeholder cards used when no YouTube API key is configured."""
    query = MOOD_QUERIES.get(mood, MOOD_QUERIES["calm"])
    return [
        {
            "video_id": "",
            "title": f"{query.title()} - Session {i + 1}",
            "channel": "Ojas Wellness (sample)",
            "thumbnail_url": "",
            "is_stub": True,
        }
        for i in range(6)
    ]


def get_recommendations(mood: str) -> list[dict]:
    if not settings.youtube_api_key:
        return _stub_videos(mood)

    query = MOOD_QUERIES.get(mood, MOOD_QUERIES["calm"])
    params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "maxResults": 6,
        "key": settings.youtube_api_key,
    }
    response = httpx.get(SEARCH_URL, params=params, timeout=10)
    response.raise_for_status()
    items = response.json().get("items", [])

    return [
        {
            "video_id": item["id"]["videoId"],
            "title": item["snippet"]["title"],
            "channel": item["snippet"]["channelTitle"],
            "thumbnail_url": item["snippet"]["thumbnails"]["medium"]["url"],
            "is_stub": False,
        }
        for item in items
    ]
