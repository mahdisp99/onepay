from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session, joinedload

from ..deps import get_current_user, get_db
from ..models import Payment, PurchaseRequest, Unit, User
from ..schemas import PaymentInitRequest, PaymentInitResponse, PaymentOut
from ..services.payment import build_mock_gateway_url, create_authority, create_reference_id

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/initiate", response_model=PaymentInitResponse)
def initiate_payment(
    payload: PaymentInitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    request_row = (
        db.query(PurchaseRequest)
        .options(joinedload(PurchaseRequest.unit))
        .filter(PurchaseRequest.id == payload.request_id, PurchaseRequest.user_id == current_user.id)
        .first()
    )
    if not request_row:
        raise HTTPException(status_code=404, detail="Request not found")
    if request_row.status not in ["submitted", "pending_payment"]:
        raise HTTPException(status_code=409, detail="Request status is not payable")

    existing_payment = (
        db.query(Payment)
        .filter(Payment.request_id == request_row.id, Payment.status == "initiated")
        .order_by(Payment.id.desc())
        .first()
    )
    if existing_payment:
        return PaymentInitResponse(
            payment=PaymentOut.model_validate(existing_payment),
            payment_url=build_mock_gateway_url(existing_payment.authority),
        )

    authority = create_authority()
    amount = int(max(request_row.unit.price * 0.05, 10000000))

    payment = Payment(
        request_id=request_row.id,
        amount=amount,
        gateway=payload.gateway,
        authority=authority,
        status="initiated",
    )
    request_row.status = "pending_payment"
    request_row.updated_at = datetime.now(timezone.utc)
    db.add(payment)
    db.commit()
    db.refresh(payment)
    db.refresh(request_row)

    return PaymentInitResponse(
        payment=PaymentOut.model_validate(payment),
        payment_url=build_mock_gateway_url(authority),
    )


@router.get("/mock-gateway/{authority}", response_class=HTMLResponse)
def mock_gateway(authority: str):
    ok_url = f"/api/v1/payments/callback?authority={authority}&status=OK"
    fail_url = f"/api/v1/payments/callback?authority={authority}&status=NOK"
    return f"""
    <html lang="fa" dir="rtl">
      <head>
        <title>درگاه پرداخت آزمایشی</title>
        <meta charset="utf-8" />
        <style>
          body {{ font-family: sans-serif; background: #f5f7fa; padding: 24px; }}
          .card {{ max-width: 640px; margin: 0 auto; background: white; border-radius: 12px; padding: 24px; }}
          a {{ display: inline-block; padding: 10px 16px; margin-left: 8px; border-radius: 8px; text-decoration: none; }}
          .ok {{ background: #1d7f4d; color: white; }}
          .fail {{ background: #a32929; color: white; }}
        </style>
      </head>
      <body>
        <div class="card">
          <h1>درگاه پرداخت آزمایشی</h1>
          <p>کد رهگیری درگاه: <b>{authority}</b></p>
          <p>برای شبیه‌سازی نتیجه پرداخت، یکی از گزینه‌های زیر را انتخاب کنید.</p>
          <a class="ok" href="{ok_url}">پرداخت موفق</a>
          <a class="fail" href="{fail_url}">پرداخت ناموفق</a>
        </div>
      </body>
    </html>
    """


@router.get("/callback")
def payment_callback(
    authority: str = Query(...),
    status: str = Query(...),
    db: Session = Depends(get_db),
):
    payment = db.query(Payment).filter(Payment.authority == authority).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    request_row = db.query(PurchaseRequest).filter(PurchaseRequest.id == payment.request_id).first()
    if not request_row:
        raise HTTPException(status_code=404, detail="Request not found")

    unit = db.query(Unit).filter(Unit.id == request_row.unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    if payment.status == "success":
        return {
            "ok": True,
            "request_status": request_row.status,
            "payment_status": payment.status,
            "ref_id": payment.ref_id,
            "message": "پرداخت قبلا تایید شده است",
        }

    if status.upper() == "OK":
        payment.status = "success"
        payment.ref_id = create_reference_id()
        payment.verified_at = datetime.now(timezone.utc)
        request_row.status = "paid"
        request_row.updated_at = datetime.now(timezone.utc)
        if unit.status == "available":
            unit.status = "reserved"
    else:
        payment.status = "failed"
        request_row.status = "submitted"
        request_row.updated_at = datetime.now(timezone.utc)

    db.commit()
    return {
        "ok": status.upper() == "OK",
        "request_status": request_row.status,
        "payment_status": payment.status,
        "ref_id": payment.ref_id,
        "message": "نتیجه پرداخت با موفقیت ثبت شد",
    }
