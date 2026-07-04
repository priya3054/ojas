from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.habit import Habit, HabitEntry
from app.models.user import User
from app.schemas.habit import HabitCreate, HabitEntryCreate, HabitRead
from app.vectorstore import index_entry

router = APIRouter(prefix="/habits", tags=["habits"])


def _compute_streak(db: Session, habit_id: int) -> int:
    entries = db.query(HabitEntry).filter(HabitEntry.habit_id == habit_id).all()
    entries_by_date = {entry.date: entry for entry in entries}

    day = date.today()
    if day not in entries_by_date:
        # today hasn't been checked in yet — don't break the streak for that alone
        day -= timedelta(days=1)

    streak = 0
    while day in entries_by_date and entries_by_date[day].kept:
        streak += 1
        day -= timedelta(days=1)
    return streak


@router.post("", response_model=HabitRead, status_code=201)
def create_habit(
    payload: HabitCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    habit = Habit(user_id=current_user.id, **payload.model_dump())
    db.add(habit)
    db.commit()
    db.refresh(habit)
    return habit


@router.get("")
def list_habits(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    habits = db.query(Habit).filter(Habit.user_id == current_user.id).all()

    today = date.today()
    result = []
    for habit in habits:
        today_entry = (
            db.query(HabitEntry)
            .filter(HabitEntry.habit_id == habit.id, HabitEntry.date == today)
            .first()
        )
        result.append(
            {
                "id": habit.id,
                "name": habit.name,
                "goal": habit.goal,
                "icon": habit.icon,
                "streak": _compute_streak(db, habit.id),
                "checked_in_today": today_entry is not None,
                "kept_today": today_entry.kept if today_entry else None,
            }
        )
    return result


@router.post("/{habit_id}/check-in")
def check_in(
    habit_id: int,
    payload: HabitEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    habit = (
        db.query(Habit)
        .filter(Habit.id == habit_id, Habit.user_id == current_user.id)
        .first()
    )
    if habit is None:
        raise HTTPException(status_code=404, detail="Habit not found")

    existing = (
        db.query(HabitEntry)
        .filter(HabitEntry.habit_id == habit_id, HabitEntry.date == payload.date)
        .first()
    )
    if existing is not None:
        existing.kept = payload.kept
        existing.trigger_note = payload.trigger_note
        entry = existing
    else:
        entry = HabitEntry(habit_id=habit_id, **payload.model_dump())
        db.add(entry)

    db.commit()
    db.refresh(entry)

    status_text = "kept" if entry.kept else "slipped on"
    trigger_text = f" (trigger: {entry.trigger_note})" if entry.trigger_note else ""
    index_entry(
        user_id=current_user.id,
        source="Habit",
        entry_id=entry.id,
        entry_date=str(entry.date),
        text=f"{status_text.capitalize()} habit '{habit.name}'{trigger_text}.",
    )

    return {
        "id": entry.id,
        "habit_id": entry.habit_id,
        "date": entry.date,
        "kept": entry.kept,
        "trigger_note": entry.trigger_note,
        "streak": _compute_streak(db, habit_id),
    }


@router.get("/{habit_id}/week")
def week_entries(
    habit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    habit = (
        db.query(Habit)
        .filter(Habit.id == habit_id, Habit.user_id == current_user.id)
        .first()
    )
    if habit is None:
        raise HTTPException(status_code=404, detail="Habit not found")

    since = date.today() - timedelta(days=6)
    entries = (
        db.query(HabitEntry)
        .filter(HabitEntry.habit_id == habit_id, HabitEntry.date >= since)
        .all()
    )
    entries_by_date = {entry.date: entry for entry in entries}

    days = []
    for offset in range(7):
        day = since + timedelta(days=offset)
        entry = entries_by_date.get(day)
        days.append(
            {
                "date": str(day),
                "kept": entry.kept if entry else None,
                "is_today": day == date.today(),
            }
        )
    return days
