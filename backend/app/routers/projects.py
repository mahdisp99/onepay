from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import case, func
from sqlalchemy.orm import Session, joinedload

from ..deps import get_db
from ..models import Project, Unit
from ..schemas import ProjectListItem, ProjectOut, UnitOut
from ..services.cad import build_viewer_hints

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectListItem])
def list_projects(db: Session = Depends(get_db)):
    units_agg = (
        db.query(
            Unit.project_id.label("project_id"),
            func.sum(case((Unit.status == "available", 1), else_=0)).label("available_units"),
            func.min(case((Unit.status == "available", Unit.price), else_=None)).label("min_price"),
        )
        .group_by(Unit.project_id)
        .subquery()
    )
    rows = (
        db.query(Project, units_agg.c.available_units, units_agg.c.min_price)
        .outerjoin(units_agg, units_agg.c.project_id == Project.id)
        .order_by(Project.id.desc())
        .all()
    )
    result: list[ProjectListItem] = []
    for project, available_units, min_price in rows:
        result.append(
            ProjectListItem(
                id=project.id,
                title=project.title,
                slug=project.slug,
                description=project.description,
                address=project.address,
                status=project.status,
                cover_image=project.cover_image,
                available_units=int(available_units or 0),
                min_price=min_price,
            )
        )
    return result


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = (
        db.query(Project)
        .options(joinedload(Project.units), joinedload(Project.plans))
        .filter(Project.id == project_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    for plan in project.plans:
        if not plan.viewer_url:
            hints = build_viewer_hints(plan.source_url, plan.viewer_urn)
            plan.viewer_url = hints["source_url"]
    return ProjectOut.model_validate(project)


@router.get("/{project_id}/units", response_model=list[UnitOut])
def list_project_units(project_id: int, status: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Unit).filter(Unit.project_id == project_id)
    if status:
        query = query.filter(Unit.status == status)
    return [UnitOut.model_validate(item) for item in query.order_by(Unit.floor, Unit.unit_code).all()]
