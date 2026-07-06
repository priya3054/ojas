from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.insights import generate_insight, generate_weekly_reflection
from app.models.user import User

router = APIRouter(prefix="/insights", tags=["insights"])


@router.get("/summary")
def insight_summary(
    focus: str = "general",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return {"insight": generate_insight(db, current_user, focus)}


@router.get("/weekly-reflection")
def weekly_reflection(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return {"reflection": generate_weekly_reflection(db, current_user)}
