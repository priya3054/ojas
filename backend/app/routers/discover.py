from fastapi import APIRouter, Depends

from app.dependencies import get_current_user
from app.integrations.youtube import get_recommendations
from app.models.user import User

router = APIRouter(prefix="/discover", tags=["discover"])


@router.get("")
def discover(
    mood: str | None = None,
    current_user: User = Depends(get_current_user),
):
    # Default to the user's current mood if no explicit mood is passed.
    selected_mood = mood or current_user.current_mood
    return {
        "mood": selected_mood,
        "videos": get_recommendations(selected_mood),
    }
