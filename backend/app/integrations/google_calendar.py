from datetime import date, datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.config import settings
from app.models.medicine import MedicineSchedule
from app.models.user import User

SCOPES = ["https://www.googleapis.com/auth/calendar.events"]


class GoogleNotConfigured(Exception):
    """Raised when Google OAuth client credentials aren't set in the environment."""


def is_configured() -> bool:
    return bool(settings.google_client_id and settings.google_client_secret)


def _build_flow():
    from google_auth_oauthlib.flow import Flow

    return Flow.from_client_config(
        {
            "web": {
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [settings.google_redirect_uri],
            }
        },
        scopes=SCOPES,
        redirect_uri=settings.google_redirect_uri,
    )


def get_authorization_url() -> str:
    if not is_configured():
        raise GoogleNotConfigured()
    flow = _build_flow()
    # access_type=offline + prompt=consent ensures we get a long-lived refresh token.
    auth_url, _state = flow.authorization_url(access_type="offline", prompt="consent")
    return auth_url


def exchange_code_and_store(code: str, user: User, db: Session) -> None:
    if not is_configured():
        raise GoogleNotConfigured()
    flow = _build_flow()
    flow.fetch_token(code=code)
    creds = flow.credentials

    user.google_access_token = creds.token
    user.google_refresh_token = creds.refresh_token
    user.google_token_expiry = creds.expiry
    db.commit()


def _credentials_for(user: User):
    from google.oauth2.credentials import Credentials

    return Credentials(
        token=user.google_access_token,
        refresh_token=user.google_refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        scopes=SCOPES,
    )


def sync_medicine_schedules(user: User, db: Session) -> dict:
    if not is_configured():
        raise GoogleNotConfigured()
    if not user.google_refresh_token:
        return {"connected": False, "created": 0}

    from googleapiclient.discovery import build

    service = build("calendar", "v3", credentials=_credentials_for(user))
    schedules = (
        db.query(MedicineSchedule)
        .filter(MedicineSchedule.user_id == user.id, MedicineSchedule.active.is_(True))
        .all()
    )

    created = 0
    for schedule in schedules:
        start = datetime.combine(date.today(), schedule.time_of_day, tzinfo=timezone.utc)
        event = {
            "summary": f"Take {schedule.name} ({schedule.dosage})",
            "description": "Ojas medicine reminder. Auto-reschedules missed doses.",
            "start": {"dateTime": start.isoformat()},
            "end": {"dateTime": (start + timedelta(minutes=15)).isoformat()},
            "recurrence": ["RRULE:FREQ=DAILY"],
        }
        service.events().insert(calendarId="primary", body=event).execute()
        created += 1

    return {"connected": True, "created": created}
