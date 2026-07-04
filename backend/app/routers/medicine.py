from collections import Counter
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.medicine import DoseLog, MedicineSchedule
from app.models.user import User
from app.schemas.medicine import (
    MedicineScheduleCreate,
    MedicineScheduleRead,
    MedicineScheduleUpdate,
)
from app.vectorstore import index_entry

router = APIRouter(prefix="/medicine", tags=["medicine"])


def _ensure_doses_for_date(db: Session, user: User, target_date: date) -> None:
    """Materialize a DoseLog row for every active schedule on the given date, if missing."""
    schedules = (
        db.query(MedicineSchedule)
        .filter(MedicineSchedule.user_id == user.id, MedicineSchedule.active.is_(True))
        .all()
    )
    for schedule in schedules:
        scheduled_for = datetime.combine(target_date, schedule.time_of_day, tzinfo=timezone.utc)
        exists = (
            db.query(DoseLog)
            .filter(DoseLog.schedule_id == schedule.id, DoseLog.scheduled_for == scheduled_for)
            .first()
        )
        if exists is None:
            db.add(
                DoseLog(
                    user_id=user.id,
                    schedule_id=schedule.id,
                    scheduled_for=scheduled_for,
                )
            )
    db.commit()


@router.post("/schedules", response_model=MedicineScheduleRead, status_code=201)
def create_schedule(
    payload: MedicineScheduleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    schedule = MedicineSchedule(user_id=current_user.id, **payload.model_dump())
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.get("/schedules", response_model=list[MedicineScheduleRead])
def list_schedules(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return (
        db.query(MedicineSchedule)
        .filter(MedicineSchedule.user_id == current_user.id)
        .order_by(MedicineSchedule.time_of_day)
        .all()
    )


@router.patch("/schedules/{schedule_id}", response_model=MedicineScheduleRead)
def update_schedule(
    schedule_id: int,
    payload: MedicineScheduleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    schedule = (
        db.query(MedicineSchedule)
        .filter(MedicineSchedule.id == schedule_id, MedicineSchedule.user_id == current_user.id)
        .first()
    )
    if schedule is None:
        raise HTTPException(status_code=404, detail="Schedule not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(schedule, field, value)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.get("/doses/today")
def doses_today(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    _ensure_doses_for_date(db, current_user, today)

    doses = (
        db.query(DoseLog, MedicineSchedule)
        .join(MedicineSchedule, DoseLog.schedule_id == MedicineSchedule.id)
        .filter(DoseLog.user_id == current_user.id, func.date(DoseLog.scheduled_for) == today)
        .order_by(DoseLog.scheduled_for)
        .all()
    )
    return [
        {
            "id": dose.id,
            "schedule_id": schedule.id,
            "name": schedule.name,
            "dosage": schedule.dosage,
            "frequency": schedule.frequency,
            "scheduled_for": dose.scheduled_for,
            "taken": dose.taken,
            "taken_at": dose.taken_at,
        }
        for dose, schedule in doses
    ]


@router.patch("/doses/{dose_id}/take")
def mark_dose_taken(
    dose_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dose = (
        db.query(DoseLog)
        .filter(DoseLog.id == dose_id, DoseLog.user_id == current_user.id)
        .first()
    )
    if dose is None:
        raise HTTPException(status_code=404, detail="Dose not found")

    dose.taken = True
    dose.taken_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(dose)

    schedule = db.query(MedicineSchedule).filter(MedicineSchedule.id == dose.schedule_id).first()
    index_entry(
        user_id=current_user.id,
        source="DoseLog",
        entry_id=dose.id,
        entry_date=str(dose.scheduled_for.date()),
        text=f"Took {schedule.name} ({schedule.dosage}) as scheduled.",
    )
    return {"id": dose.id, "taken": dose.taken, "taken_at": dose.taken_at}


@router.get("/adherence")
def adherence(
    days: int = 14,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    day_col = func.date(DoseLog.scheduled_for)
    rows = (
        db.query(
            day_col.label("day"),
            func.count(DoseLog.id).label("total"),
            func.sum(case((DoseLog.taken.is_(True), 1), else_=0)).label("taken"),
        )
        .filter(DoseLog.user_id == current_user.id, DoseLog.scheduled_for >= since)
        .group_by(day_col)
        .order_by(day_col)
        .all()
    )
    return [
        {"date": str(r.day), "total": r.total, "taken": int(r.taken or 0)} for r in rows
    ]


@router.get("/summary")
def summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    _ensure_doses_for_date(db, current_user, today)

    today_doses = (
        db.query(DoseLog)
        .filter(DoseLog.user_id == current_user.id, func.date(DoseLog.scheduled_for) == today)
        .order_by(DoseLog.scheduled_for)
        .all()
    )
    taken = sum(1 for d in today_doses if d.taken)
    total = len(today_doses)
    next_dose = next((d for d in today_doses if not d.taken), None)

    return {
        "taken": taken,
        "total": total,
        "adherence_pct": round(taken / total * 100) if total else None,
        "next_dose_at": next_dose.scheduled_for if next_dose else None,
    }


@router.get("/refill")
def refill_prediction(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    schedules = (
        db.query(MedicineSchedule)
        .filter(MedicineSchedule.user_id == current_user.id, MedicineSchedule.active.is_(True))
        .all()
    )
    results = []
    for schedule in schedules:
        run_out_date = (
            date.today() + timedelta(days=schedule.pill_count) if schedule.pill_count else None
        )
        results.append(
            {
                "schedule_id": schedule.id,
                "name": schedule.name,
                "pill_count": schedule.pill_count,
                "estimated_run_out_date": str(run_out_date) if run_out_date else None,
            }
        )
    return results


@router.get("/risk-pattern")
def risk_pattern(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    missed = (
        db.query(DoseLog)
        .filter(
            DoseLog.user_id == current_user.id,
            DoseLog.taken.is_(False),
            DoseLog.scheduled_for < datetime.now(timezone.utc),
        )
        .all()
    )
    if not missed:
        return {"pattern": None}

    counts = Counter((d.scheduled_for.strftime("%A"), d.scheduled_for.hour) for d in missed)
    (day_name, hour), count = counts.most_common(1)[0]
    return {
        "day_of_week": day_name,
        "hour": hour,
        "missed_count_at_slot": count,
        "total_missed": len(missed),
    }
