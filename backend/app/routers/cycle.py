from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.cycle import CycleEntry
from app.models.user import User
from app.schemas.cycle import CycleEntryCreate, CycleEntryRead, CycleSettingsUpdate
from app.vectorstore import index_entry

router = APIRouter(prefix="/cycle", tags=["cycle"])


@router.post("", response_model=CycleEntryRead, status_code=201)
def log_entry(
    payload: CycleEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(CycleEntry)
        .filter(CycleEntry.user_id == current_user.id, CycleEntry.date == payload.date)
        .first()
    )
    if existing is not None:
        existing.period_start = payload.period_start
        existing.symptoms = payload.symptoms
        existing.notes = payload.notes
        entry = existing
    else:
        entry = CycleEntry(user_id=current_user.id, **payload.model_dump())
        db.add(entry)

    db.commit()
    db.refresh(entry)

    parts = []
    if entry.period_start:
        parts.append("period start")
    if entry.symptoms:
        parts.append(f"symptoms: {', '.join(entry.symptoms)}")
    if entry.notes:
        parts.append(entry.notes)
    text = "Logged " + (", ".join(parts) if parts else "a cycle check-in") + "."

    index_entry(
        user_id=current_user.id,
        source="Cycle",
        entry_id=entry.id,
        entry_date=str(entry.date),
        text=text,
    )
    return entry


@router.get("", response_model=list[CycleEntryRead])
def list_entries(
    days: int = 90,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    since = date.today() - timedelta(days=days - 1)
    return (
        db.query(CycleEntry)
        .filter(CycleEntry.user_id == current_user.id, CycleEntry.date >= since)
        .order_by(CycleEntry.date)
        .all()
    )


@router.get("/status")
def cycle_status(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    last_period = (
        db.query(CycleEntry)
        .filter(CycleEntry.user_id == current_user.id, CycleEntry.period_start.is_(True))
        .order_by(CycleEntry.date.desc())
        .first()
    )
    if last_period is None:
        return {"cycle_day": None, "phase": None, "next_period_predicted": None}

    cycle_length = current_user.cycle_length_days
    days_since = (date.today() - last_period.date).days
    cycle_day = (days_since % cycle_length) + 1

    # Luteal phase length is fairly constant (~14 days) even when total cycle length varies,
    # so we anchor ovulation relative to the end of the cycle rather than a fixed day number.
    menstrual_end = 5
    ovulation_center = max(cycle_length - 14, menstrual_end + 1)
    ovulation_start = max(ovulation_center - 1, menstrual_end + 1)
    ovulation_end = ovulation_center + 1

    if cycle_day <= menstrual_end:
        phase = "menstrual"
    elif cycle_day < ovulation_start:
        phase = "follicular"
    elif cycle_day <= ovulation_end:
        phase = "ovulation"
    else:
        phase = "luteal"

    next_period_predicted = last_period.date + timedelta(days=cycle_length)

    return {
        "cycle_day": cycle_day,
        "cycle_length_days": cycle_length,
        "phase": phase,
        "next_period_predicted": str(next_period_predicted),
    }


@router.patch("/settings")
def update_settings(
    payload: CycleSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.cycle_length_days = payload.cycle_length_days
    db.commit()
    return {"cycle_length_days": current_user.cycle_length_days}
