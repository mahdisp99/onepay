from __future__ import annotations

from sqlalchemy.orm import Session

from .core.security import get_password_hash
from .db import Base, SessionLocal, engine
from .models import FloorPlan, Project, Unit, User


def seed(db: Session):
    if db.query(Project).count() > 0:
        return

    project = Project(
        title="برج باغ وان‌پی",
        slug="onepay-garden-residence",
        description="مجتمع مسکونی مدرن با فضاهای عمومی باکیفیت، پارکینگ هوشمند و امکانات کامل خانوادگی.",
        address="تهران، منطقه ۲۲",
        status="pre_sale",
        cover_image="https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80",
    )
    db.add(project)
    db.flush()

    plans = [
        FloorPlan(
            project_id=project.id,
            title="نقشه کلی - بلوک A",
            level="همکف",
            file_format="dwg",
            source_url="https://example.com/cad/block-a-master-plan.dwg",
            viewer_url="https://example.com/viewer/block-a-master-plan",
            viewer_urn=None,
        ),
        FloorPlan(
            project_id=project.id,
            title="نقشه تیپ طبقه چهار",
            level="طبقه ۴",
            file_format="dwg",
            source_url="https://example.com/cad/floor-4-typical.dwg",
            viewer_url="https://example.com/viewer/floor-4-typical",
            viewer_urn=None,
        ),
    ]
    db.add_all(plans)

    units = [
        Unit(project_id=project.id, unit_code="A-401", floor=4, area_m2=118.5, bedrooms=3, price=14500000000),
        Unit(project_id=project.id, unit_code="A-402", floor=4, area_m2=102.0, bedrooms=2, price=12100000000),
        Unit(project_id=project.id, unit_code="A-503", floor=5, area_m2=128.2, bedrooms=3, price=15600000000),
        Unit(project_id=project.id, unit_code="A-601", floor=6, area_m2=140.0, bedrooms=3, price=17200000000),
        Unit(project_id=project.id, unit_code="A-602", floor=6, area_m2=98.4, bedrooms=2, price=11800000000),
    ]
    db.add_all(units)

    demo_user = User(
        full_name="Demo Buyer",
        mobile="09120000000",
        email="demo@onepay.local",
        hashed_password=get_password_hash("Onepay123!"),
    )
    db.add(demo_user)

    db.commit()


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed(db)
        print("Seed completed.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
