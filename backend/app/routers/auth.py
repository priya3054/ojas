import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.email import send_password_reset
from app.models.user import User
from app.schemas.auth import Token
from app.schemas.user import UserCreate, UserRead
from app.security import (
    create_access_token,
    create_reset_token,
    hash_password,
    verify_password,
    verify_reset_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])


class GoogleLogin(BaseModel):
    credential: str  # the ID token returned by Google Identity Services


class ForgotPassword(BaseModel):
    email: str


class ResetPassword(BaseModel):
    token: str
    password: str


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing is not None:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        name=payload.name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if user is None or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=user.email)
    return Token(access_token=access_token)


@router.post("/google", response_model=Token)
def google_login(payload: GoogleLogin, db: Session = Depends(get_db)):
    if not settings.google_client_id:
        raise HTTPException(status_code=503, detail="Google sign-in is not configured")

    from google.auth.transport import requests as google_requests
    from google.oauth2 import id_token

    try:
        # Verifies the token's signature, expiry, and that it was issued for OUR app.
        info = id_token.verify_oauth2_token(
            payload.credential, google_requests.Request(), settings.google_client_id
        )
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    email = info.get("email")
    if not email or not info.get("email_verified"):
        raise HTTPException(status_code=401, detail="Google account email not verified")

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        # First time signing in with Google → create the account (random unusable password).
        user = User(
            email=email,
            name=info.get("name") or email.split("@")[0],
            hashed_password=hash_password(secrets.token_urlsafe(32)),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return Token(access_token=create_access_token(subject=user.email))


@router.post("/forgot-password")
def forgot_password(payload: ForgotPassword, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    # Only send if the account exists — but always return the same response so we never
    # reveal whether an email is registered.
    if user is not None:
        token = create_reset_token(user.email)
        reset_url = f"{settings.frontend_url}/reset-password?token={token}"
        send_password_reset(user.email, reset_url)
    return {"message": "If that email is registered, a reset link has been sent."}


@router.post("/reset-password")
def reset_password(payload: ResetPassword, db: Session = Depends(get_db)):
    email = verify_reset_token(payload.token)
    if email is None:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired.")
    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(status_code=400, detail="Account not found.")
    user.hashed_password = hash_password(payload.password)
    db.commit()
    return {"message": "Your password has been reset. You can now sign in."}


@router.get("/me", response_model=UserRead)
def read_me(current_user: User = Depends(get_current_user)):
    return current_user
