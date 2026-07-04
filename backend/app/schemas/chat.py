from pydantic import BaseModel


class ChatRequest(BaseModel):
    question: str


class ChatSource(BaseModel):
    source: str
    date: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[ChatSource]
    crisis: bool
