"""Groq-powered insights generated from the user's own logged data.

Unlike the templated client-side text these replace, these are real LLM outputs grounded in a
compact summary of the user's recent entries — framed as patterns, never diagnoses.
"""

from datetime import datetime, timedelta, timezone

from langchain_core.prompts import ChatPromptTemplate
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.habit import Habit, HabitEntry
from app.models.journal import JournalEntry
from app.models.medicine import DoseLog
from app.models.screen_time import ScreenTimeLog
from app.models.user import User
from app.rag import _get_llm

_INSIGHT_SYSTEM = (
    "You are Ojas, a warm wellness companion. Using ONLY the data summary below, write ONE short, "
    "specific observation (2-3 sentences) about a pattern across the user's own logs. {focus} Speak "
    "directly to them. Frame it as a gentle pattern, never a diagnosis or medical advice. If the data is "
    "too sparse, say something encouraging about building the habit of logging. Do not invent numbers."
    "\n\nDATA:\n{data}"
)

_FOCUS_HINTS = {
    "general": "",
    "habits": "Focus on how their habits relate to mood, sleep, or screen time.",
    "screen_time": "Focus on how screen time relates to sleep or next-day mood.",
    "cycle": "Focus gently on how mood may shift across their cycle, being medically cautious.",
}

_REFLECTION_SYSTEM = (
    "You are Ojas. Using ONLY the journal summary below, write a short, kind weekly reflection (2-3 "
    "sentences) about the user's mood this week. Speak directly to them, notice any shift, and end with "
    "a gentle encouragement. Never diagnose. Do not invent entries.\n\nJOURNAL:\n{data}"
)


def _recent_summary(db: Session, user: User) -> str:
    since = datetime.now(timezone.utc) - timedelta(days=14)
    lines: list[str] = []

    moods = (
        db.query(func.date(JournalEntry.created_at), JournalEntry.mood_label, JournalEntry.sentiment_score)
        .filter(JournalEntry.user_id == user.id, JournalEntry.created_at >= since)
        .order_by(JournalEntry.created_at)
        .all()
    )
    if moods:
        recent = ", ".join(f"{d}: {m or 'n/a'} ({s:+.2f})" for d, m, s in moods[-7:] if s is not None)
        lines.append(f"Recent journal moods: {recent or 'logged, no scores'}")

    total = db.query(DoseLog).filter(DoseLog.user_id == user.id, DoseLog.scheduled_for >= since).count()
    taken = db.query(DoseLog).filter(DoseLog.user_id == user.id, DoseLog.scheduled_for >= since, DoseLog.taken.is_(True)).count()
    if total:
        lines.append(f"Medicine: took {taken} of {total} doses in the last 2 weeks ({round(taken / total * 100)}%).")

    st = (
        db.query(func.date(ScreenTimeLog.date), ScreenTimeLog.hours)
        .filter(ScreenTimeLog.user_id == user.id, ScreenTimeLog.date >= since.date())
        .order_by(ScreenTimeLog.date)
        .all()
    )
    if st:
        vals = ", ".join(f"{d}: {h}h" for d, h in st[-7:])
        lines.append(f"Screen time (goal {user.screen_time_goal_hours}h): {vals}")

    habits = db.query(Habit).filter(Habit.user_id == user.id).all()
    for h in habits:
        kept = db.query(HabitEntry).filter(HabitEntry.habit_id == h.id, HabitEntry.kept.is_(True)).count()
        slipped = db.query(HabitEntry).filter(HabitEntry.habit_id == h.id, HabitEntry.kept.is_(False)).count()
        lines.append(f"Habit '{h.name}': kept {kept}, slipped {slipped}.")

    return "\n".join(lines) if lines else "No data logged yet."


def _journal_summary(db: Session, user: User) -> str:
    since = datetime.now(timezone.utc) - timedelta(days=7)
    entries = (
        db.query(JournalEntry)
        .filter(JournalEntry.user_id == user.id, JournalEntry.created_at >= since)
        .order_by(JournalEntry.created_at)
        .all()
    )
    if not entries:
        return "No journal entries this week."
    return "\n".join(
        f"{e.created_at.date()}: {e.mood_label or 'n/a'} ({(e.sentiment_score or 0):+.2f}) — {e.content[:120]}"
        for e in entries
    )


def _run(system_prompt: str, data: str, **extra) -> str:
    prompt = ChatPromptTemplate.from_messages([("system", system_prompt)])
    chain = prompt | _get_llm()
    return chain.invoke({"data": data, **extra}).content


def generate_insight(db: Session, user: User, focus: str = "general") -> str:
    hint = _FOCUS_HINTS.get(focus, "")
    return _run(_INSIGHT_SYSTEM, _recent_summary(db, user), focus=hint)


def generate_weekly_reflection(db: Session, user: User) -> str:
    return _run(_REFLECTION_SYSTEM, _journal_summary(db, user))
