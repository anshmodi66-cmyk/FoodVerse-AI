from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from backend.app.services.nutrition_service import NutritionService
from backend.app.models.schemas import NutritionAnalysisResponse
from backend.app.db.database import query_food_by_name

router = APIRouter(prefix="/nutrition", tags=["Food Recognition & Nutrition"])

@router.post("/analyze", response_model=NutritionAnalysisResponse)
async def analyze_food_image(
    file: UploadFile = File(...),
    meal_type: str = Form("lunch")
):
    """
    Accepts meal image, performs dish decomposition, maps items to ICMR-NIN IFCT 2017
    and USDA FoodData Central databases, and calculates calibrated calorie intervals (+/- 20%).
    """
    try:
        content = await file.read()
        return NutritionService.analyze_meal_image(content, meal_type)
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image analysis failure: {str(e)}")

@router.get("/search")
async def search_food_database(query: str):
    """Searches local IFCT 2017 composition database for foods by name or category."""
    if not query.strip():
        raise HTTPException(status_code=400, detail="Search query cannot be empty.")
    results = query_food_by_name(query)
    return {"status": "success", "count": len(results), "data": results}
