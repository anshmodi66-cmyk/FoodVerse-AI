import uuid
from backend.app.models.schemas import (
    RecipeResponse,
    RecipeStep,
    FoodSafetyMilestone,
    Macronutrients
)

class CookingService:
    @classmethod
    def generate_smart_recipe(
        cls,
        ingredients: list[str],
        dietary_preference: str = "vegetarian",
        cuisine_style: str = "Indian",
        available_appliances: list[str] = None
    ) -> RecipeResponse:
        appliances = available_appliances or ["Pan / Skillet", "Pressure Cooker"]
        ing_clean = [i.strip().lower() for i in ingredients if i.strip()]
        
        # Check safety guidelines and required internal temps
        milestones: list[FoodSafetyMilestone] = []
        is_poultry = any("chicken" in i or "poultry" in i or "turkey" in i for i in ing_clean)
        is_meat = any("mutton" in i or "lamb" in i or "beef" in i or "pork" in i for i in ing_clean)
        is_fish = any("fish" in i or "prawn" in i or "shrimp" in i for i in ing_clean)

        if is_poultry:
            milestones.append(FoodSafetyMilestone(
                ingredient="Poultry / Chicken",
                safe_internal_temp_c=74.0,
                safe_internal_temp_f=165.0,
                guideline_source="USDA-FSIS Safe Minimum Internal Temperature",
                rest_time_minutes=0
            ))
        elif is_meat:
            milestones.append(FoodSafetyMilestone(
                ingredient="Ground / Whole Meat",
                safe_internal_temp_c=71.0,
                safe_internal_temp_f=160.0,
                guideline_source="USDA-FSIS Safe Cooking Guidelines",
                rest_time_minutes=3
            ))
        elif is_fish:
            milestones.append(FoodSafetyMilestone(
                ingredient="Fish & Seafood",
                safe_internal_temp_c=63.0,
                safe_internal_temp_f=145.0,
                guideline_source="USDA-FSIS Seafood Guidance",
                rest_time_minutes=0
            ))

        # Always include universal food safety hygiene milestone
        milestones.append(FoodSafetyMilestone(
            ingredient="General Cooking Hygiene",
            safe_internal_temp_c=60.0,
            safe_internal_temp_f=140.0,
            guideline_source="FDA Food Code §3-501.16 Danger Zone Threshold (Hold above 60°C)",
            rest_time_minutes=0
        ))

        # Determine title and recipe steps
        if is_poultry:
            title = "Homestyle Spiced Kadai Chicken"
            cuisine = "North Indian"
            prep_min = 15
            cook_min = 25
            difficulty = "Medium"
            cal = 340.0
            macros = Macronutrients(protein_g=32.5, carbohydrates_g=8.0, fat_g=19.5, fiber_g=2.2)
            steps = [
                RecipeStep(
                    step_number=1,
                    instruction="Wash hands for 20 seconds. Trim chicken on a dedicated raw-meat cutting board to prevent cross-contamination.",
                    duration_minutes=5,
                    technique="Safe Food Handling Preparation",
                    safety_note="Do not rinse raw chicken under faucet; aerosolized droplets spread bacteria."
                ),
                RecipeStep(
                    step_number=2,
                    instruction="Heat oil in a heavy-bottomed kadai. Sauté cumin seeds, chopped onions, ginger-garlic paste, and crushed tomatoes until oil separates.",
                    duration_minutes=8,
                    technique="Aromatic Masala Base"
                ),
                RecipeStep(
                    step_number=3,
                    instruction="Add chicken pieces, turmeric, coriander powder, and garam masala. Sear chicken over medium-high heat until lightly browned.",
                    duration_minutes=7,
                    technique="Sautéing & Browning"
                ),
                RecipeStep(
                    step_number=4,
                    instruction="Cover and simmer over medium-low heat. Verify with a digital food thermometer that the thickest part reaches 165°F (74°C).",
                    duration_minutes=10,
                    technique="Simmering & Thermal Verification",
                    safety_note="CRITICAL: Center of poultry must read 165°F (74°C) to neutralize Salmonella."
                )
            ]
        elif any("paneer" in i for i in ing_clean):
            title = "Golden Tawa Paneer Bhurji"
            cuisine = "Indian"
            prep_min = 10
            cook_min = 15
            difficulty = "Easy"
            cal = 280.0
            macros = Macronutrients(protein_g=16.8, carbohydrates_g=9.5, fat_g=19.2, fiber_g=2.8)
            steps = [
                RecipeStep(
                    step_number=1,
                    instruction="Crumble fresh paneer by hand or fork. Dice onions, tomatoes, and green chilies.",
                    duration_minutes=5,
                    technique="Prep & Mincing"
                ),
                RecipeStep(
                    step_number=2,
                    instruction="Heat 1 tablespoon oil or ghee on a flat tawa or pan. Temper cumin seeds and green chilies.",
                    duration_minutes=3,
                    technique="Tempering (Tadka)"
                ),
                RecipeStep(
                    step_number=3,
                    instruction="Sauté onions until translucent, then add tomatoes, turmeric, red chili powder, and salt. Cook until softened.",
                    duration_minutes=5,
                    technique="Masala Reduction"
                ),
                RecipeStep(
                    step_number=4,
                    instruction="Fold in crumbled paneer and toss gently for 2-3 minutes. Garnish with chopped fresh cilantro and serve hot.",
                    duration_minutes=3,
                    technique="Finishing & Garnish"
                )
            ]
        else:
            # Plant-based / Lentil / Veg dish
            title = "Spiced Golden Vegetable Tadka"
            cuisine = "Indian Homestyle"
            prep_min = 12
            cook_min = 18
            difficulty = "Easy"
            cal = 195.0
            macros = Macronutrients(protein_g=5.8, carbohydrates_g=26.4, fat_g=7.5, fiber_g=6.2)
            steps = [
                RecipeStep(
                    step_number=1,
                    instruction="Wash all fresh produce under potable running water. Dice vegetables into uniform bite-sized cubes.",
                    duration_minutes=5,
                    technique="Produce Sanitization & Knife Work"
                ),
                RecipeStep(
                    step_number=2,
                    instruction="Heat mustard or sunflower oil in a pan. Add mustard seeds, cumin, and dried red chili until spluttering.",
                    duration_minutes=3,
                    technique="Tempering"
                ),
                RecipeStep(
                    step_number=3,
                    instruction="Add diced vegetables, salt, turmeric, and coriander. Sauté on medium flame, then cover and cook until tender.",
                    duration_minutes=10,
                    technique="Steam-Sautéing"
                ),
                RecipeStep(
                    step_number=4,
                    instruction="Remove lid and roast for 2 minutes to crisp the edges. Ensure food temperature exceeds 140°F (60°C) before serving.",
                    duration_minutes=2,
                    technique="Caramelization & Hot Holding"
                )
            ]

        return RecipeResponse(
            recipe_id=f"rcp_{uuid.uuid4().hex[:8]}",
            title=title,
            cuisine=cuisine,
            prep_time_minutes=prep_min,
            cook_time_minutes=cook_min,
            servings=2,
            difficulty=difficulty,
            ingredients=ingredients if ingredients else ["Pantry staples", "Seasonal vegetables", "Aromatic spices"],
            missing_staples=["Salt", "Cooking Oil / Ghee", "Turmeric"],
            steps=steps,
            safety_milestones=milestones,
            macronutrients_per_serving=macros,
            calories_per_serving=cal
        )
