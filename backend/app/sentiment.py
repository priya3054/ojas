from transformers import pipeline

_emotion_pipeline = None

# The model's own 7 fixed categories, mapped onto our product's language.
POSITIVE_EMOTIONS = {"joy", "surprise"}
NEGATIVE_EMOTIONS = {"anger", "disgust", "fear", "sadness"}

MOOD_MAP = {
    "joy": "good",
    "surprise": "excited",
    "neutral": "calm",
    "sadness": "sad",
    "fear": "anxious",
    "anger": "anxious",
    "disgust": "anxious",
}


def _get_pipeline():
    global _emotion_pipeline
    if _emotion_pipeline is None:
        _emotion_pipeline = pipeline(
            "text-classification",
            model="j-hartmann/emotion-english-distilroberta-base",
            top_k=None,
        )
    return _emotion_pipeline


def analyze_sentiment(text: str) -> dict:
    scores = _get_pipeline()(text)[0]
    scores_by_label = {item["label"]: item["score"] for item in scores}

    positive = sum(scores_by_label.get(label, 0.0) for label in POSITIVE_EMOTIONS)
    negative = sum(scores_by_label.get(label, 0.0) for label in NEGATIVE_EMOTIONS)
    sentiment_score = round(positive - negative, 2)

    top_label = max(scores_by_label, key=scores_by_label.get)
    mood_label = MOOD_MAP.get(top_label, "calm")

    ranked = sorted(scores_by_label.items(), key=lambda kv: kv[1], reverse=True)
    emotion_tags = [label for label, score in ranked[:2] if score > 0.15]

    return {
        "sentiment_score": sentiment_score,
        "mood_label": mood_label,
        "emotion_tags": emotion_tags,
    }
