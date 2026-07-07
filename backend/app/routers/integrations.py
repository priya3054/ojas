from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.integrations import google_calendar
from app.models.user import User

router = APIRouter(prefix="/integrations/google", tags=["integrations"])


@router.get("/status")
def status(current_user: User = Depends(get_current_user)):
    return {
        "configured": google_calendar.is_configured(),
        "connected": google_calendar.is_connected(current_user),
    }


@router.get("/authorize")
def authorize(current_user: User = Depends(get_current_user)):
    if not google_calendar.is_configured():
        raise HTTPException(status_code=503, detail="Google integration is not configured")
    # Pass the current user's id through the OAuth flow (signed) so the callback knows who it's for.
    return {"authorization_url": google_calendar.get_authorization_url(current_user.id)}


@router.get("/callback")
def callback(code: str, state: str, db: Session = Depends(get_db)):
    # Google redirects the browser here after the user consents. We store the tokens against
    # the user encoded in `state`, then send the browser back to the app.
    ok = False
    try:
        ok = google_calendar.exchange_code_and_store(code, state, db)
    except Exception:
        ok = False
    result = "google_connected" if ok else "google_failed"
    return RedirectResponse(url=f"{settings.frontend_url}/medicine?{result}=1")


@router.post("/sync")
def sync(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not google_calendar.is_configured():
        raise HTTPException(status_code=503, detail="Google integration is not configured")
    return google_calendar.sync_medicine_schedules(current_user, db)
