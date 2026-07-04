"""Rebuild the Chroma vector store from Postgres.

On hosts with ephemeral storage (e.g. Hugging Face Spaces), the embedded Chroma data is lost
when the container restarts. Postgres is the durable source of truth, so on startup we re-index
every entry back into Chroma. `index_entry` is an upsert, so running this repeatedly is safe.
"""

from sqlalchemy.orm import Session

from app.models.cycle import CycleEntry
from app.models.habit import Habit, HabitEntry
from app.models.journal import JournalEntry
from app.models.medicine import DoseLog, MedicineSchedule
from app.models.screen_time import ScreenTimeLog
from app.vectorstore import index_entry


def reindex_all(db: Session) -> int:
    count = 0

    for e in db.query(JournalEntry).all():
        index_entry(e.user_id, "Journal", e.id, str(e.created_at.date()), e.content)
        count += 1

    for s in db.query(ScreenTimeLog).all():
        index_entry(s.user_id, "ScreenTime", s.id, str(s.date), f"Logged {s.hours} hours of screen time.")
        count += 1

    schedules = {m.id: m for m in db.query(MedicineSchedule).all()}
    for d in db.query(DoseLog).filter(DoseLog.taken.is_(True)).all():
        sched = schedules.get(d.schedule_id)
        name = sched.name if sched else "medicine"
        index_entry(d.user_id, "DoseLog", d.id, str(d.scheduled_for.date()), f"Took {name} as scheduled.")
        count += 1

    habits = {h.id: h for h in db.query(Habit).all()}
    for he in db.query(HabitEntry).all():
        habit = habits.get(he.habit_id)
        if habit is None:
            continue
        status = "Kept" if he.kept else "Slipped on"
        index_entry(habit.user_id, "Habit", he.id, str(he.date), f"{status} habit '{habit.name}'.")
        count += 1

    for c in db.query(CycleEntry).all():
        parts = []
        if c.period_start:
            parts.append("period start")
        if c.symptoms:
            parts.append("symptoms: " + ", ".join(c.symptoms))
        text = "Logged " + (", ".join(parts) if parts else "a cycle check-in") + "."
        index_entry(c.user_id, "Cycle", c.id, str(c.date), text)
        count += 1

    return count
