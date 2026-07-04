from datetime import datetime, time

from pydantic import BaseModel, ConfigDict


class MedicineScheduleCreate(BaseModel):
    name: str
    dosage: str
    time_of_day: time
    frequency: str = "Daily"
    pill_count: int = 0


class MedicineScheduleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    name: str
    dosage: str
    time_of_day: time
    frequency: str
    pill_count: int
    active: bool
    created_at: datetime


class MedicineScheduleUpdate(BaseModel):
    name: str | None = None
    dosage: str | None = None
    time_of_day: time | None = None
    frequency: str | None = None
    pill_count: int | None = None
    active: bool | None = None


class DoseLogCreate(BaseModel):
    schedule_id: int
    scheduled_for: datetime


class DoseLogMarkTaken(BaseModel):
    taken: bool = True


class DoseLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    schedule_id: int
    scheduled_for: datetime
    taken: bool
    taken_at: datetime | None
    created_at: datetime
