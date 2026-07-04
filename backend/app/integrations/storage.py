from datetime import date

from fpdf import FPDF
from sqlalchemy.orm import Session

from app.config import settings
from app.models.habit import Habit, HabitEntry
from app.models.journal import JournalEntry
from app.models.medicine import DoseLog
from app.models.user import User


def generate_pdf(user: User, db: Session) -> bytes:
    """Build a simple one-page PDF summary of the user's logged data."""
    journal_count = db.query(JournalEntry).filter(JournalEntry.user_id == user.id).count()
    latest_journal = (
        db.query(JournalEntry)
        .filter(JournalEntry.user_id == user.id)
        .order_by(JournalEntry.created_at.desc())
        .first()
    )
    total_doses = db.query(DoseLog).filter(DoseLog.user_id == user.id).count()
    taken_doses = (
        db.query(DoseLog)
        .filter(DoseLog.user_id == user.id, DoseLog.taken.is_(True))
        .count()
    )
    habit_count = db.query(Habit).filter(Habit.user_id == user.id).count()

    pdf = FPDF()
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 20)
    pdf.cell(0, 12, "Ojas - Your Wellness Summary", new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 8, f"Prepared for {user.name} on {date.today().isoformat()}", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    def section(title: str, lines: list[str]) -> None:
        pdf.set_font("Helvetica", "B", 13)
        pdf.cell(0, 9, title, new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", "", 11)
        for line in lines:
            pdf.cell(0, 7, f"  {line}", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(3)

    adherence = f"{round(taken_doses / total_doses * 100)}%" if total_doses else "no data yet"
    section("Journal & Mood", [
        f"Entries logged: {journal_count}",
        f"Most recent mood: {latest_journal.mood_label if latest_journal else 'no entries yet'}",
    ])
    section("Medicine", [
        f"Doses logged: {total_doses}",
        f"Overall adherence: {adherence}",
    ])
    section("Habits", [f"Habits tracked: {habit_count}"])

    pdf.ln(6)
    pdf.set_font("Helvetica", "I", 9)
    pdf.multi_cell(0, 5, "This summary reflects patterns in your own logged data. It is not a "
                         "medical document and contains no diagnoses.")

    return bytes(pdf.output())


def upload_to_s3(data: bytes, key: str) -> str | None:
    """Upload the PDF to S3 and return a temporary download URL, or None if S3 isn't configured."""
    if not (settings.aws_access_key_id and settings.s3_bucket):
        return None

    import boto3

    client = boto3.client(
        "s3",
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        region_name=settings.aws_region,
    )
    client.put_object(Bucket=settings.s3_bucket, Key=key, Body=data, ContentType="application/pdf")
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.s3_bucket, "Key": key},
        ExpiresIn=3600,
    )
