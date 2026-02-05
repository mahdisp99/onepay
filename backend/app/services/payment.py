from __future__ import annotations

import secrets

from ..core.config import settings


def create_authority() -> str:
    return f"AUTH-{secrets.token_hex(8).upper()}"


def create_reference_id() -> str:
    return f"REF-{secrets.token_hex(6).upper()}"


def build_mock_gateway_url(authority: str) -> str:
    return f"{settings.backend_public_url}/api/v1/payments/mock-gateway/{authority}"
