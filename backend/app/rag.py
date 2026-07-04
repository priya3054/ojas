from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq

from app.config import settings
from app.crisis import CRISIS_MESSAGE, is_crisis_signal
from app.vectorstore import query_entries

_llm = None

SYSTEM_PROMPT = (
    "You are Ojas, a warm and honest wellness companion. Answer the user's question using ONLY "
    "the CONTEXT below, which is retrieved from the user's own logged journal, medicine, habit, "
    "screen-time, and cycle data. Speak directly to the user. Never provide medical diagnoses or "
    "medical advice — frame any observation as a pattern in their own data, not a diagnosis. If "
    "the context doesn't contain enough to answer, say so honestly instead of guessing.\n\n"
    "CONTEXT:\n{context}"
)

prompt = ChatPromptTemplate.from_messages(
    [("system", SYSTEM_PROMPT), ("human", "{question}")]
)


def _get_llm() -> ChatGroq:
    global _llm
    if _llm is None:
        _llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            api_key=settings.groq_api_key,
            temperature=0.3,
        )
    return _llm


def answer_question(user_id: int, question: str) -> dict:
    if is_crisis_signal(question):
        return {"answer": CRISIS_MESSAGE, "sources": [], "crisis": True}

    retrieved = query_entries(user_id, question, n_results=5)
    context = (
        "\n".join(f"[{r['source']} · {r['date']}] {r['text']}" for r in retrieved)
        or "No relevant logged data was found for this question."
    )

    chain = prompt | _get_llm()
    response = chain.invoke({"context": context, "question": question})

    return {
        "answer": response.content,
        "sources": [{"source": r["source"], "date": r["date"]} for r in retrieved],
        "crisis": False,
    }
