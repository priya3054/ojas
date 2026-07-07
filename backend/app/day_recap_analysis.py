"""Real end-of-day recap analysis.

Transcribes the recording's audio with Groq Whisper, then analyses the *words the user
actually said* with the local Hugging Face emotion model and Groq — genuinely grounded in the
recording. (Facial-expression recognition from video is a separate, heavier ML task; this
focuses on the spoken content, which is a real multimodal signal: voice → text → emotion.)
"""

from langchain_core.prompts import ChatPromptTemplate

from app.config import settings
from app.crisis import CRISIS_MESSAGE, is_crisis_signal
from app.rag import _get_llm
from app.sentiment import MOOD_MAP, analyze_emotions


def transcribe(audio_bytes: bytes, filename: str = "recap.webm") -> str:
    from groq import Groq

    client = Groq(api_key=settings.groq_api_key)
    result = client.audio.transcriptions.create(
        file=(filename, audio_bytes),
        model="whisper-large-v3",
    )
    return (result.text or "").strip()


_READ_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are Ojas. Below is a transcript of someone's short end-of-day spoken reflection. "
        "Respond in exactly two parts separated by a line with only '---':\n"
        "1) A warm, plain-language 2-sentence read of how they seem, grounded ONLY in what they said. "
        "Speak directly to them. Never diagnose.\n"
        "2) Three one-word themes, comma-separated.\n\nTRANSCRIPT:\n{transcript}",
    ),
])


def _read_and_themes(transcript: str) -> tuple[str, list[str]]:
    chain = _READ_PROMPT | _get_llm()
    out = chain.invoke({"transcript": transcript}).content
    if "---" in out:
        read_part, themes_part = out.split("---", 1)
    else:
        read_part, themes_part = out, ""
    themes = [t.strip().lstrip("#").lower() for t in themes_part.replace("\n", ",").split(",") if t.strip()][:3]
    return read_part.strip(), themes


def analyze_transcript(transcript: str) -> dict:
    if not transcript:
        return {
            "transcript_summary": "",
            "overall_read": "The recording was too quiet to hear clearly — try again in a calmer spot.",
            "confidence": 0.0,
            "stress_score": 0.0,
            "energy_score": 0.0,
            "positivity_score": 0.0,
            "themes": [],
            "mood_label": "calm",
            "crisis": False,
        }

    if is_crisis_signal(transcript):
        return {
            "transcript_summary": transcript[:400],
            "overall_read": CRISIS_MESSAGE,
            "confidence": 0.0,
            "stress_score": None,
            "energy_score": None,
            "positivity_score": None,
            "themes": [],
            "mood_label": "sad",
            "crisis": True,
        }

    emo = analyze_emotions(transcript)
    g = lambda k: emo.get(k, 0.0)  # noqa: E731
    positive = g("joy") + g("surprise")
    negative = g("sadness") + g("fear") + g("anger") + g("disgust")

    positivity = round(positive - negative, 2)                       # -1..1
    stress = round((g("fear") + g("anger") + g("disgust")) * 100)     # %
    energy = round((g("joy") + g("surprise") + g("fear") + g("anger")) * 100)  # arousal %
    top = max(emo, key=emo.get)
    mood = MOOD_MAP.get(top, "calm")
    confidence = round(max(emo.values()) * 100)

    read, themes = _read_and_themes(transcript)

    return {
        "transcript_summary": transcript[:400],
        "overall_read": read,
        "confidence": float(confidence),
        "stress_score": float(stress),
        "energy_score": float(energy),
        "positivity_score": positivity,
        "themes": themes,
        "mood_label": mood,
        "crisis": False,
    }
