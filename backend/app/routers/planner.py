from fastapi import APIRouter
from backend.app.services.planner_service import PlannerService
from backend.app.models.schemas import (
    UserProfileRequest,
    NutritionTargets,
    WeeklyMealPlanResponse
)

router = APIRouter(prefix="/meal-planner", tags=["Personalized Meal Planner"])

@router.post("/calculate-targets", response_model=NutritionTargets)
async def calculate_targets(profile: UserProfileRequest):
    """Deterministically computes BMR, TDEE, and macro targets using Mifflin-St Jeor & ICMR 2020 RDA."""
    return PlannerService.calculate_targets(profile)

@router.post("/generate-plan", response_model=WeeklyMealPlanResponse)
async def generate_weekly_plan(profile: UserProfileRequest):
    """Generates a personalized 7-day meal plan and aggregated grocery shopping checklist."""
    return PlannerService.generate_weekly_plan(profile)
