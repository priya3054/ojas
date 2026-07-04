# Deliberately simple and deterministic — a keyword match, not a model. A safety fallback
# needs to be predictable and easy to audit, not "probably right most of the time."
CRISIS_KEYWORDS = [
    "suicide",
    "kill myself",
    "end my life",
    "want to die",
    "self harm",
    "self-harm",
    "hurting myself",
    "no reason to live",
    "can't go on",
    "cant go on",
]

CRISIS_MESSAGE = (
    "It sounds like you might be going through something really heavy right now. I'm not "
    "able to help with this myself, but please reach out to people who can. If you're in "
    "India, the AASRA helpline (9820466726) is available 24/7, or iCall (9152987821). If "
    "you're elsewhere, please contact your local emergency services or a crisis helpline. "
    "You deserve real support — please reach out to someone who can help."
)


def is_crisis_signal(text: str) -> bool:
    lowered = text.lower()
    return any(keyword in lowered for keyword in CRISIS_KEYWORDS)
