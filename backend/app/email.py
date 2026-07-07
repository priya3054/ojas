"""Transactional email via Resend.

If no RESEND_API_KEY is configured, the email is logged instead of sent — so the flow still
works in development, and turns real the moment a key is added.
"""

import httpx

from app.config import settings

RESEND_URL = "https://api.resend.com/emails"


def send_email(to: str, subject: str, html: str) -> bool:
    if not settings.resend_api_key:
        print(f"[email] (not sent — no RESEND_API_KEY) to={to} subject={subject!r}\n{html}")
        return False
    resp = httpx.post(
        RESEND_URL,
        headers={"Authorization": f"Bearer {settings.resend_api_key}"},
        json={"from": settings.email_from, "to": [to], "subject": subject, "html": html},
        timeout=15,
    )
    resp.raise_for_status()
    return True


def send_password_reset(to: str, reset_url: str) -> bool:
    html = (
        f'<div style="font-family:sans-serif;line-height:1.5">'
        f"<h2>Reset your Ojas password</h2>"
        f"<p>We received a request to reset your password. Click the link below — it expires in 30 minutes.</p>"
        f'<p><a href="{reset_url}" style="background:#2F6DB0;color:#fff;padding:10px 18px;'
        f'border-radius:8px;text-decoration:none">Reset password</a></p>'
        f"<p>If you didn't request this, you can safely ignore this email.</p></div>"
    )
    return send_email(to, "Reset your Ojas password", html)
