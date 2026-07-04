from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.integrations import google_calendar
from app.models.user import User

router = APIRouter(prefix="/integrations/google", tags=["integrations"])


@router.get("/authorize")
def authorize(current_user: User = Depends(get_current_user)):
    if not google_calendar.is_configured():
        raise HTTPException(status_code=503, detail="Google integration is not configured")
    return {"authorization_url": google_calendar.get_authorization_url()}


@router.get("/callback")
def callback(code: str, db: Session = Depends(get_db)):
    # NOTE: Google redirects the browser here after consent. In a full build we'd tie this
    # back to the logged-in user via the OAuth `state` parameter; kept simple for now.
    raise HTTPException(
        status_code=501,
        detail="Callback received. Wire this to the authenticated user via OAuth state to store tokens.",
    )


@router.post("/sync")
def sync(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not google_calendar.is_configured():
        raise HTTPException(status_code=503, detail="Google integration is not configured")
    return google_calendar.sync_medicine_schedules(current_user, db)
