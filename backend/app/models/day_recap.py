from datetime import date, datetime, timezone

from sqlalchemy import ARRAY, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class DayRecap(Base):
    __tablename__ = "day_recaps"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    date: Mapped[date] = mapped_column(Date, nullable=False)
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False)

    # Only the derived summary is stored, never raw video/audio (privacy requirement from the spec)
    transcript_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    overall_read: Mapped[str | None] = mapped_column(Text, nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    stress_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    energy_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    positivity_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    themes: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    mood_label: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
