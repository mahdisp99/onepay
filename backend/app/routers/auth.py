from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.security import create_access_token, get_password_hash, verify_password
from ..deps import get_current_user, get_db
from ..models import User
from ..schemas import TokenOut, UserLogin, UserOut, UserRegister

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    normalized_email = payload.email.strip().lower() if payload.email else None
    existing_mobile = db.query(User).filter(User.mobile == payload.mobile).first()
    if existing_mobile:
        raise HTTPException(status_code=409, detail="Mobile already registered")

    if normalized_email:
        existing_email = db.query(User).filter(User.email == normalized_email).first()
        if existing_email:
            raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        full_name=payload.full_name,
        mobile=payload.mobile,
        email=normalized_email,
        hashed_password=get_password_hash(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(str(user.id))
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenOut)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.mobile == payload.mobile).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid mobile or password")
    token = create_access_token(str(user.id))
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)
