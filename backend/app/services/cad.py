from __future__ import annotations


def build_viewer_hints(source_url: str, existing_urn: str | None = None) -> dict[str, str | None]:
    """
    Keeps MVP simple: return metadata placeholders that frontend can use
    for Autodesk APS viewer integration in production.
    """
    return {
        "source_url": source_url,
        "viewer_urn": existing_urn,
        "viewer_script": "https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js",
    }
