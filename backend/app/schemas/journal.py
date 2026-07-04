from datetime import datetime

from pydantic import BaseModel, ConfigDict


class JournalEntryCreate(BaseModel):
    content: str


class JournalEntryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    content: str
    sentiment_score: float | None
    mood_label: str | None
    emotion_tags: list[str] | None
    created_at: datetime
