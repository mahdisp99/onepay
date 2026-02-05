from __future__ import annotations

from datetime import datetime, timezone
import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..deps import get_current_user, get_db
from ..models import PurchaseRequest, Unit, User
from ..schemas import PurchaseRequestCreate, PurchaseRequestOut

router = APIRouter(prefix="/requests", tags=["requests"])


def create_tracking_code() -> str:
    return f"REQ-{secrets.token_hex(5).upper()}"


@router.post("", response_model=PurchaseRequestOut, status_code=201)
def create_request(
    payload: PurchaseRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    unit = db.query(Unit).filter(Unit.id == payload.unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    if unit.status == "sold":
        raise HTTPException(status_code=409, detail="Unit already sold")
    unit_has_active_request = (
        db.query(PurchaseRequest)
        .filter(
            PurchaseRequest.unit_id == unit.id,
            PurchaseRequest.status.in_(["submitted", "pending_payment", "paid"]),
        )
        .first()
    )
    if unit_has_active_request and unit_has_active_request.user_id != current_user.id:
        raise HTTPException(status_code=409, detail="Unit already in another active request")

    existing = (
        db.query(PurchaseRequest)
        .filter(
            PurchaseRequest.user_id == current_user.id,
            PurchaseRequest.unit_id == unit.id,
            PurchaseRequest.status.in_(["draft", "submitted", "pending_payment", "paid"]),
        )
        .first()
    )
    if existing:
        return PurchaseRequestOut.model_validate(existing)

    request_row = PurchaseRequest(
        user_id=current_user.id,
        unit_id=unit.id,
        note=payload.note,
        status="draft",
        tracking_code=create_tracking_code(),
    )
    db.add(request_row)
    db.commit()
    request_row = (
        db.query(PurchaseRequest)
        .options(joinedload(PurchaseRequest.unit))
        .filter(PurchaseRequest.id == request_row.id)
        .first()
    )
    if not request_row:
        raise HTTPException(status_code=500, detail="Failed to load request")
    return PurchaseRequestOut.model_validate(request_row)


@router.get("/my", response_model=list[PurchaseRequestOut])
def my_requests(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = (
        db.query(PurchaseRequest)
        .options(joinedload(PurchaseRequest.unit))
        .filter(PurchaseRequest.user_id == current_user.id)
        .order_by(PurchaseRequest.created_at.desc())
        .all()
    )
    return [PurchaseRequestOut.model_validate(item) for item in rows]


@router.post("/{request_id}/submit", response_model=PurchaseRequestOut)
def submit_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = (
        db.query(PurchaseRequest)
        .options(joinedload(PurchaseRequest.unit))
        .filter(PurchaseRequest.id == request_id, PurchaseRequest.user_id == current_user.id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Request not found")
    if row.status in ["paid", "cancelled", "rejected"]:
        raise HTTPException(status_code=409, detail="Request can not be submitted")

    row.status = "submitted"
    row.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(row)
    return PurchaseRequestOut.model_validate(row)
