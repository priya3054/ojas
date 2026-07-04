from datetime import date, datetime, timezone

from sqlalchemy import ARRAY, Boolean, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class CycleEntry(Base):
    __tablename__ = "cycle_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    date: Mapped[date] = mapped_column(Date, nullable=False)
    period_start: Mapped[bool] = mapped_column(Boolean, default=False)
    symptoms: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    notes: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
