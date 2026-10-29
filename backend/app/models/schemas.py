from typing import Optional, List
from pydantic import BaseModel, Field

# ==========================================
# 1. Nutrition & Meal Recognition Schemas
# ==========================================

class Macronutrients(BaseModel):
    protein_g: float = Field(..., description="Protein content in grams")
    carbohydrates_g: float = Field(..., description="Carbohydrates in grams")
    fat_g: float = Field(..., description="Total fat in grams")
    fiber_g: float = Field(0.0, description="Dietary fiber in grams")

class Micronutrients(BaseModel):
    calcium_mg: Optional[float] = 0.0
    iron_mg: Optional[float] = 0.0
    potassium_mg: Optional[float] = 0.0
    sodium_mg: Optional[float] = 0.0
    vitamin_c_mg: Optional[float] = 0.0

class IdentifiedDishItem(BaseModel):
    name: str = Field(..., description="Name of dish or ingredient")
    category: str = Field(..., description="Food category e.g., Cereal, Curry, Dairy")
    estimated_weight_g: float = Field(..., description="Estimated serving weight in grams")
    weight_min_g: float = Field(..., description="Lower bound of mass estimation")
    weight_max_g: float = Field(..., description="Upper bound of mass estimation")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Recognition confidence")
    calories: float = Field(..., description="Energy in kilocalories")
    calorie_min: float = Field(..., description="Lower calorie confidence interval")
    calorie_max: float = Field(..., description="Upper calorie confidence interval")
    macronutrients: Macronutrients
    micronutrients: Optional[Micronutrients] = None
    source_database: str = Field(..., description="Citation: ICMR-NIN IFCT 2017 or USDA FoodData Central")

class NutritionTotals(BaseModel):
    total_calories: float
    calorie_range_min: float
    calorie_range_max: float
    total_protein_g: float
    total_carbohydrates_g: float
    total_fat_g: float
    total_fiber_g: float

class NutritionAnalysisResponse(BaseModel):
    status: str = "success"
    meal_id: str
    timestamp: str
    image_filename: Optional[str] = None
    dishes: List[IdentifiedDishItem]
    totals: NutritionTotals
    uncertainty_level: str = "Medium (+/- 15-20%)"
    disclaimer: str = (
        "Calculated estimates based on laboratory food composition tables. "
        "Actual nutritional content varies based on culinary preparation, oil absorption, and portion density."
    )

# ==========================================
# 2. Freshness & Spoilage Schemas
# ==========================================

class ObservedDefect(BaseModel):
    defect_type: str
    severity: str  # "none", "slight", "moderate", "severe"
    affected_area_pct: float

class StorageRiskEvaluation(BaseModel):
    storage_method: str  # "ambient", "refrigerated", "frozen"
    storage_hours: float
    danger_zone_hours: float
    max_safe_ambient_hours: float
    is_danger_zone_exceeded: bool

class FreshnessAssessmentResponse(BaseModel):
    status: str = "success"
    assessment_id: str
    timestamp: str
    food_name: str
    category: str
    visual_quality_score: float = Field(..., ge=0.0, le=100.0, description="Visual score (100 = flawless)")
    spoilage_risk_index: float = Field(..., ge=0.0, le=100.0, description="0 = Fresh, 100 = High Spoilage Hazard")
    risk_level: str  # "LOW", "MODERATE", "HIGH", "UNSAFE"
    observed_defects: List[ObservedDefect]
    storage_evaluation: StorageRiskEvaluation
    actionable_recommendation: str
    non_diagnostic_disclaimer: str = (
        "CRITICAL FOOD SAFETY NOTICE: Visual assessment can only detect macroscopic surface defects. "
        "It CANNOT rule out colorless, odorless bacterial toxins (Salmonella, Listeria, E. coli, Botulinum). "
        "Never consume food that smells off, has unusual texture, or has been in the temperature danger zone > 2 hours."
    )

# ==========================================
# 3. Kitchen Hygiene & Smart Kitchen Schemas
# ==========================================

class WorkerCompliance(BaseModel):
    worker_index: int
    hairnet_detected: bool
    mask_detected: bool
    apron_detected: bool
    gloves_detected: bool
    bounding_box: List[float] = []  # [ymin, xmin, ymax, xmax]
    violations: List[str] = []

class ComplianceSummary(BaseModel):
    workers_present: int
    hairnet_compliance_pct: float
    mask_compliance_pct: float
    apron_compliance_pct: float
    glove_compliance_pct: float
    overall_station_score: float

class HygieneFrameResponse(BaseModel):
    status: str = "success"
    frame_id: str
    timestamp: str
    station_id: str
    anonymized_faces: bool = True
    summary: ComplianceSummary
    workers: List[WorkerCompliance]
    cross_contamination_hazard: bool = False
    alerts: List[str] = []
    privacy_notice: str = "Facial keypoints are anonymized at the edge via automated Gaussian blurring."

# ==========================================
# 4. Smart Cooking Assistant Schemas
# ==========================================

class FoodSafetyMilestone(BaseModel):
    ingredient: str
    safe_internal_temp_c: float
    safe_internal_temp_f: float
    guideline_source: str = "USDA-FSIS Safe Cooking Guidelines"
    rest_time_minutes: int = 0

class RecipeStep(BaseModel):
    step_number: int
    instruction: str
    duration_minutes: Optional[int] = None
    technique: str
    safety_note: Optional[str] = None

class RecipeResponse(BaseModel):
    status: str = "success"
    recipe_id: str
    title: str
    cuisine: str
    prep_time_minutes: int
    cook_time_minutes: int
    servings: int
    difficulty: str  # "Easy", "Medium", "Advanced"
    ingredients: List[str]
    missing_staples: List[str] = []
    steps: List[RecipeStep]
    safety_milestones: List[FoodSafetyMilestone]
    macronutrients_per_serving: Macronutrients
    calories_per_serving: float

# ==========================================
# 5. Personalized Meal Planner Schemas
# ==========================================

class UserProfileRequest(BaseModel):
    age: int = Field(..., ge=10, le=100)
    biological_sex: str = Field(..., description="'male' or 'female'")
    height_cm: float = Field(..., ge=90.0, le=250.0)
    weight_kg: float = Field(..., ge=30.0, le=250.0)
    activity_level: str = Field("sedentary", description="'sedentary', 'light', 'moderate', 'active', 'very_active'")
    goal: str = Field("maintenance", description="'fat_loss', 'maintenance', 'muscle_gain'")
    dietary_preference: str = Field("vegetarian", description="'vegetarian', 'vegan', 'non_veg', 'jain', 'eggetarian'")
    allergies: List[str] = []

class NutritionTargets(BaseModel):
    bmr_kcal: float
    tdee_kcal: float
    target_calories: float
    target_protein_g: float
    target_carbohydrates_g: float
    target_fat_g: float
    target_fiber_g: float
    formula_used: str = "Mifflin-St Jeor (1990) & ICMR-NIN 2020 RDA"

class PlannedMeal(BaseModel):
    meal_type: str  # "Breakfast", "Lunch", "Snack", "Dinner"
    dish_name: str
    serving_description: str
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float

class DailyMealPlan(BaseModel):
    day: str
    meals: List[PlannedMeal]
    day_total_calories: float
    day_total_protein_g: float
    day_total_carbs_g: float
    day_total_fat_g: float

class WeeklyMealPlanResponse(BaseModel):
    status: str = "success"
    plan_id: str
    user_targets: NutritionTargets
    weekly_schedule: List[DailyMealPlan]
    shopping_list: List[str]
    medical_disclaimer: str = (
        "Calculated for educational and informational purposes. "
        "Not a substitute for clinical nutritional therapy or personalized medical care."
    )

# ==========================================
# 6. System Health Check
# ==========================================

class HealthCheckResponse(BaseModel):
    status: str = "healthy"
    version: str = "1.0.0"
    project: str = "Food Verse AI"
    python_runtime: str
    database_records_loaded: int
    models_ready: bool
