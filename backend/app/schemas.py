from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class UserRegister(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    mobile: str = Field(min_length=8, max_length=20)
    password: str = Field(min_length=8, max_length=120)
    email: str | None = None


class UserLogin(BaseModel):
    mobile: str
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    mobile: str
    email: str | None
    created_at: datetime


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class FloorPlanOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    level: str
    file_format: str
    source_url: str
    viewer_url: str | None
    viewer_urn: str | None


class UnitOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    unit_code: str
    floor: int
    area_m2: float
    bedrooms: int
    price: int
    status: str


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    slug: str
    description: str
    address: str
    status: str
    cover_image: str | None
    plans: list[FloorPlanOut]
    units: list[UnitOut]


class ProjectListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    slug: str
    description: str
    address: str
    status: str
    cover_image: str | None
    available_units: int
    min_price: int | None


class PurchaseRequestCreate(BaseModel):
    unit_id: int
    note: str = ""


class PurchaseRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    unit_id: int
    user_id: int
    status: str
    tracking_code: str
    note: str
    created_at: datetime
    updated_at: datetime
    unit: UnitOut


class PaymentInitRequest(BaseModel):
    request_id: int
    gateway: str = "mock"


class PaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    request_id: int
    amount: int
    gateway: str
    authority: str
    status: str
    ref_id: str | None
    created_at: datetime
    verified_at: datetime | None


class PaymentInitResponse(BaseModel):
    payment: PaymentOut
    payment_url: str
