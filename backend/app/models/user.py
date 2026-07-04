from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)

    # Persisted UI preferences (per the design spec: mood, accent, ambientMotion, showMascot)
    current_mood: Mapped[str] = mapped_column(String, default="calm")
    accent_theme: Mapped[str] = mapped_column(String, default="sky")
    ambient_motion: Mapped[bool] = mapped_column(Boolean, default=True)
    show_mascot: Mapped[bool] = mapped_column(Boolean, default=True)

    # Used by the Cycle and Screen Time screens to compute predictions/goals
    cycle_length_days: Mapped[int] = mapped_column(Integer, default=28)
    screen_time_goal_hours: Mapped[float] = mapped_column(Float, default=3.5)

    # Google Calendar OAuth tokens (Phase 7) — null until the user connects their account
    google_access_token: Mapped[str | None] = mapped_column(String, nullable=True)
    google_refresh_token: Mapped[str | None] = mapped_column(String, nullable=True)
    google_token_expiry: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
