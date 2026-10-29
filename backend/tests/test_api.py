import io
import pytest
from PIL import Image
from backend.app.main import health_check
from backend.app.db.database import query_food_by_name
from backend.app.services.nutrition_service import NutritionService
from backend.app.services.freshness_service import FreshnessService
from backend.app.services.hygiene_service import HygieneService
from backend.app.services.cooking_service import CookingService
from backend.app.services.planner_service import PlannerService
from backend.app.models.schemas import UserProfileRequest

def create_test_image_bytes(color=(180, 140, 60), size=(100, 100)) -> bytes:
    img = Image.new("RGB", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

def test_health_check():
    """Verify server status and database record seeding."""
    data = health_check()
    assert data.status == "healthy"
    assert data.database_records_loaded >= 20
    assert data.models_ready is True

def test_nutrition_search():
    """Verify local IFCT 2017 search functionality."""
    results = query_food_by_name("roti")
    assert len(results) >= 1
    assert any("roti" in item["name"].lower() for item in results)

def test_nutrition_image_analysis():
    """Verify meal decomposition, calorie intervals, and disclaimer presence."""
    img_bytes = create_test_image_bytes(color=(210, 160, 50))
    res = NutritionService.analyze_meal_image(img_bytes, meal_type="lunch")
    assert len(res.dishes) >= 1
    assert res.totals.total_calories > 0
    assert res.totals.calorie_range_min < res.totals.total_calories
    assert res.disclaimer is not None

def test_freshness_danger_zone_enforcement():
    """Verify that excessive ambient storage triggers UNSAFE rating even with normal visuals."""
    img_bytes = create_test_image_bytes(color=(200, 40, 40))
    res = FreshnessService.assess_freshness(
        image_bytes=img_bytes,
        category="vegetable",
        storage_method="ambient",
        storage_hours=90.0  # Exceeds max 72 hrs ambient threshold
    )
    assert res.risk_level in ("HIGH", "UNSAFE")
    assert res.storage_evaluation.is_danger_zone_exceeded is True
    assert "CRITICAL FOOD SAFETY NOTICE" in res.non_diagnostic_disclaimer

def test_hygiene_compliance_and_face_blur():
    """Verify worker PPE evaluation and simulated compliance score."""
    img_bytes = create_test_image_bytes(size=(640, 480))
    res = HygieneService.analyze_station_frame(img_bytes, station_id="prep_station_1")
    assert res.anonymized_faces is True
    assert res.summary.workers_present >= 1
    assert 0.0 <= res.summary.overall_station_score <= 100.0

def test_cooking_assistant_temperature_validation():
    """Verify USDA safe internal temperature (165°F) for chicken recipes."""
    recipe = CookingService.generate_smart_recipe(
        ingredients=["Chicken breast", "Onion", "Tomatoes", "Garam masala"],
        dietary_preference="non_veg",
        cuisine_style="Indian"
    )
    assert "Chicken" in recipe.title
    has_temp_milestone = any(
        m.safe_internal_temp_f == 165.0 for m in recipe.safety_milestones
    )
    assert has_temp_milestone, "Poultry recipes must include 165°F USDA internal temperature safety milestone."

def test_mifflin_st_jeor_deterministic_math():
    """Verify mathematical correctness of Mifflin-St Jeor formula."""
    # Test case: 25-year-old male, 70kg, 175cm, sedentary
    # BMR = 10(70) + 6.25(175) - 5(25) + 5 = 700 + 1093.75 - 125 + 5 = 1673.75 kcal
    # TDEE (sedentary x 1.2) = 1673.75 * 1.2 = 2008.5 kcal
    profile = UserProfileRequest(
        age=25,
        biological_sex="male",
        height_cm=175.0,
        weight_kg=70.0,
        activity_level="sedentary",
        goal="maintenance",
        dietary_preference="vegetarian"
    )
    targets = PlannerService.calculate_targets(profile)
    assert abs(targets.bmr_kcal - 1673.8) <= 0.2
    assert abs(targets.tdee_kcal - 2008.5) <= 0.2
    assert targets.target_calories == targets.tdee_kcal
