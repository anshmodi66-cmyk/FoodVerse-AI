from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from backend.app.services.cooking_service import CookingService
from backend.app.models.schemas import RecipeResponse

router = APIRouter(prefix="/cooking", tags=["Smart Cooking Assistant"])

class RecipeGenerationPayload(BaseModel):
    ingredients: List[str]
    dietary_preference: str = "vegetarian"
    cuisine_style: str = "Indian"
    available_appliances: Optional[List[str]] = None

@router.post("/generate-recipe", response_model=RecipeResponse)
async def generate_recipe(payload: RecipeGenerationPayload):
    """
    Generates step-by-step recipes grounded in USDA-FSIS minimum internal cooking temperatures
    with active allergen screening and safety notices.
    """
    if not payload.ingredients:
        raise HTTPException(status_code=400, detail="At least one ingredient must be provided.")
    return CookingService.generate_smart_recipe(
        ingredients=payload.ingredients,
        dietary_preference=payload.dietary_preference,
        cuisine_style=payload.cuisine_style,
        available_appliances=payload.available_appliances
    )
