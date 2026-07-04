from fastapi import APIRouter, Depends

from app.dependencies import get_current_user
from app.models.user import User
from app.rag import answer_question
from app.schemas.chat import ChatRequest, ChatResponse

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
def chat(payload: ChatRequest, current_user: User = Depends(get_current_user)):
    return answer_question(current_user.id, payload.question)
