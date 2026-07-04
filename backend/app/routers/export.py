from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.integrations.storage import generate_pdf, upload_to_s3
from app.models.user import User

router = APIRouter(prefix="/export", tags=["export"])


@router.post("")
def export_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pdf_bytes = generate_pdf(current_user, db)
    key = f"exports/user-{current_user.id}-{datetime.now(timezone.utc):%Y%m%d%H%M%S}.pdf"

    url = upload_to_s3(pdf_bytes, key)
    if url is not None:
        # S3 configured: hand back a temporary download link.
        return {"url": url, "stored": "s3"}

    # No S3 configured: return the PDF file directly as a download.
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="ojas-summary.pdf"'},
    )
