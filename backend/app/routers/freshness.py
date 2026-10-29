from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from backend.app.services.freshness_service import FreshnessService
from backend.app.models.schemas import FreshnessAssessmentResponse

router = APIRouter(prefix="/freshness", tags=["Freshness & Spoilage Assessment"])

@router.post("/assess", response_model=FreshnessAssessmentResponse)
async def assess_produce_freshness(
    file: UploadFile = File(...),
    category: str = Form("vegetable"),
    storage_method: str = Form("ambient"),
    storage_hours: float = Form(4.0)
):
    """
    Evaluates produce surface quality, checks FDA/FSSAI danger zone storage hours,
    and returns a scientifically calibrated Spoilage Risk Index (SRI) with safety disclaimers.
    """
    try:
        content = await file.read()
        return FreshnessService.assess_freshness(
            image_bytes=content,
            category=category,
            storage_method=storage_method,
            storage_hours=storage_hours
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Freshness evaluation failure: {str(e)}")
