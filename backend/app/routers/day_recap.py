from datetime import date

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.day_recap_analysis import analyze_transcript, transcribe
from app.dependencies import get_current_user
from app.models.day_recap import DayRecap
from app.models.user import User

router = APIRouter(prefix="/day-recap", tags=["day-recap"])


@router.post("/analyze")
async def analyze(
    audio: UploadFile = File(...),
    duration_seconds: int = Form(0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    audio_bytes = await audio.read()
    transcript = transcribe(audio_bytes, audio.filename or "recap.webm")
    result = analyze_transcript(transcript)

    # Persist only the derived summary — never the raw audio/video (privacy by design).
    recap = DayRecap(
        user_id=current_user.id,
        date=date.today(),
        duration_seconds=duration_seconds,
        transcript_summary=result["transcript_summary"],
        overall_read=result["overall_read"],
        confidence=result["confidence"],
        stress_score=result["stress_score"],
        energy_score=result["energy_score"],
        positivity_score=result["positivity_score"],
        themes=result["themes"],
        mood_label=result["mood_label"],
    )
    db.add(recap)
    db.commit()
    db.refresh(recap)

    return {**result, "id": recap.id, "duration_seconds": duration_seconds}


@router.get("")
def recent(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    recaps = (
        db.query(DayRecap)
        .filter(DayRecap.user_id == current_user.id)
        .order_by(DayRecap.created_at.desc())
        .limit(4)
        .all()
    )
    return [
        {
            "id": r.id,
            "date": str(r.date),
            "duration_seconds": r.duration_seconds,
            "mood_label": r.mood_label,
            "overall_read": r.overall_read,
        }
        for r in recaps
    ]
