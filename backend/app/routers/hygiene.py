from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from backend.app.services.hygiene_service import HygieneService
from backend.app.models.schemas import HygieneFrameResponse

router = APIRouter(prefix="/hygiene", tags=["Kitchen Hygiene & Smart Kitchen"])

@router.post("/analyze-frame", response_model=HygieneFrameResponse)
async def analyze_hygiene_frame(
    frame: UploadFile = File(...),
    station_id: str = Form("prep_station_1")
):
    """
    Applies real-time Gaussian face blurring for privacy, evaluates PPE compliance
    (hairnets, face masks, aprons, gloves), and alerts on cross-contamination hazards.
    """
    try:
        content = await frame.read()
        return HygieneService.analyze_station_frame(content, station_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hygiene analysis failure: {str(e)}")

@router.get("/simulated-frame", response_model=HygieneFrameResponse)
async def get_simulated_frame(station_id: str = "prep_station_1"):
    """Returns a real-time compliance audit evaluation for interactive simulation."""
    return HygieneService.analyze_station_frame(b"", station_id)
