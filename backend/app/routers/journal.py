from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.journal import JournalEntry
from app.models.user import User
from app.schemas.journal import JournalEntryCreate, JournalEntryRead
from app.sentiment import analyze_sentiment
from app.vectorstore import index_entry

router = APIRouter(prefix="/journal", tags=["journal"])


@router.post("/analyze")
def analyze(
    payload: JournalEntryCreate,
    current_user: User = Depends(get_current_user),
):
    # Score text WITHOUT saving — used for the live sentiment chip while the user types.
    return analyze_sentiment(payload.content)


@router.post("", response_model=JournalEntryRead, status_code=201)
def create_entry(
    payload: JournalEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    analysis = analyze_sentiment(payload.content)
    entry = JournalEntry(user_id=current_user.id, content=payload.content, **analysis)
    db.add(entry)
    db.commit()
    db.refresh(entry)

    index_entry(
        user_id=current_user.id,
        source="Journal",
        entry_id=entry.id,
        entry_date=str(entry.created_at.date()),
        text=entry.content,
    )
    return entry


@router.get("", response_model=list[JournalEntryRead])
def list_entries(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(JournalEntry)
        .filter(JournalEntry.user_id == current_user.id)
        .order_by(JournalEntry.created_at.desc())
        .limit(limit)
        .all()
    )


@router.get("/mood-series")
def mood_series(
    days: int = 14,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    day_col = func.date(JournalEntry.created_at)
    rows = (
        db.query(
            day_col.label("day"),
            func.avg(JournalEntry.sentiment_score).label("avg_sentiment"),
        )
        .filter(JournalEntry.user_id == current_user.id, JournalEntry.created_at >= since)
        .group_by(day_col)
        .order_by(day_col)
        .all()
    )
    return [{"date": str(r.day), "avg_sentiment": r.avg_sentiment} for r in rows]
