from datetime import datetime, timezone

from sqlalchemy import ARRAY, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    content: Mapped[str] = mapped_column(Text, nullable=False)

    # Filled in automatically by the sentiment model (Phase 4) — nullable until then
    sentiment_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    mood_label: Mapped[str | None] = mapped_column(String, nullable=True)
    emotion_tags: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
