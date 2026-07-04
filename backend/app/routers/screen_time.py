from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.screen_time import ScreenTimeLog
from app.models.user import User
from app.schemas.screen_time import (
    ScreenTimeGoalUpdate,
    ScreenTimeLogCreate,
    ScreenTimeLogRead,
)
from app.vectorstore import index_entry

router = APIRouter(prefix="/screen-time", tags=["screen-time"])


@router.post("", response_model=ScreenTimeLogRead, status_code=201)
def log_screen_time(
    payload: ScreenTimeLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(ScreenTimeLog)
        .filter(ScreenTimeLog.user_id == current_user.id, ScreenTimeLog.date == payload.date)
        .first()
    )
    if existing is not None:
        existing.hours = payload.hours
        log = existing
    else:
        log = ScreenTimeLog(user_id=current_user.id, **payload.model_dump())
        db.add(log)

    db.commit()
    db.refresh(log)

    index_entry(
        user_id=current_user.id,
        source="ScreenTime",
        entry_id=log.id,
        entry_date=str(log.date),
        text=f"Logged {log.hours} hours of screen time.",
    )
    return log


@router.get("", response_model=list[ScreenTimeLogRead])
def list_logs(
    days: int = 7,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    since = date.today() - timedelta(days=days - 1)
    return (
        db.query(ScreenTimeLog)
        .filter(ScreenTimeLog.user_id == current_user.id, ScreenTimeLog.date >= since)
        .order_by(ScreenTimeLog.date)
        .all()
    )


@router.get("/today")
def today_vs_goal(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    log = (
        db.query(ScreenTimeLog)
        .filter(ScreenTimeLog.user_id == current_user.id, ScreenTimeLog.date == date.today())
        .first()
    )
    return {
        "hours": log.hours if log else 0,
        "goal_hours": current_user.screen_time_goal_hours,
        "over_goal": (log.hours if log else 0) > current_user.screen_time_goal_hours,
    }


@router.patch("/goal")
def update_goal(
    payload: ScreenTimeGoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.screen_time_goal_hours = payload.goal_hours
    db.commit()
    return {"goal_hours": current_user.screen_time_goal_hours}
