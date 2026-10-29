import uuid
from backend.app.models.schemas import (
    UserProfileRequest,
    NutritionTargets,
    PlannedMeal,
    DailyMealPlan,
    WeeklyMealPlanResponse
)

class PlannerService:
    @staticmethod
    def calculate_targets(profile: UserProfileRequest) -> NutritionTargets:
        """
        Calculates BMR deterministically using the Mifflin-St Jeor (1990) equation
        and derives TDEE and macro distribution in compliance with ICMR-NIN 2020 RDA.
        """
        # 1. Base Metabolic Rate (BMR)
        if profile.biological_sex.lower() == "male":
            bmr = (10.0 * profile.weight_kg) + (6.25 * profile.height_cm) - (5.0 * profile.age) + 5.0
        else:
            bmr = (10.0 * profile.weight_kg) + (6.25 * profile.height_cm) - (5.0 * profile.age) - 161.0
            
        # 2. Activity Multiplier (PAL)
        pal_multipliers = {
            "sedentary": 1.20,
            "light": 1.375,
            "moderate": 1.55,
            "active": 1.725,
            "very_active": 1.90
        }
        pal = pal_multipliers.get(profile.activity_level.lower(), 1.20)
        tdee = bmr * pal

        # 3. Goal Adjustment & Safety Floors
        if profile.goal.lower() == "fat_loss":
            target_cal = tdee - 450.0
        elif profile.goal.lower() == "muscle_gain":
            target_cal = tdee + 350.0
        else:
            target_cal = tdee  # maintenance

        # Enforce clinical safety minimums
        floor = 1500.0 if profile.biological_sex.lower() == "male" else 1200.0
        target_cal = max(floor, target_cal)

        # 4. Macronutrient Allocation (ICMR-NIN 2020 RDA)
        # Protein: 1.0 - 1.6 g/kg body weight based on activity
        protein_factor = 1.0 if profile.activity_level.lower() == "sedentary" else 1.4
        if profile.goal.lower() == "muscle_gain":
            protein_factor = 1.8
        target_protein = round(profile.weight_kg * protein_factor, 1)

        # Fat: ~25% of total caloric intake (9 kcal per gram)
        target_fat = round((target_cal * 0.25) / 9.0, 1)

        # Carbohydrates: remaining calories (4 kcal per gram)
        cals_from_p_and_f = (target_protein * 4.0) + (target_fat * 9.0)
        remaining_cals = max(400.0, target_cal - cals_from_p_and_f)
        target_carbs = round(remaining_cals / 4.0, 1)

        # Fiber target: 30g minimum per ICMR
        target_fiber = 30.0

        return NutritionTargets(
            bmr_kcal=round(bmr, 1),
            tdee_kcal=round(tdee, 1),
            target_calories=round(target_cal, 1),
            target_protein_g=target_protein,
            target_carbohydrates_g=target_carbs,
            target_fat_g=target_fat,
            target_fiber_g=target_fiber
        )

    @classmethod
    def generate_weekly_plan(cls, profile: UserProfileRequest) -> WeeklyMealPlanResponse:
        targets = cls.calculate_targets(profile)
        is_veg = profile.dietary_preference.lower() in ("vegetarian", "vegan", "jain")
        has_nut_allergy = any("nut" in a.lower() or "peanut" in a.lower() for a in profile.allergies)

        days_of_week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        weekly_schedule: list[DailyMealPlan] = []

        # Meal catalog tailored to dietary preferences
        breakfast_options = [
            ("Poha with Steamed Sprouts", "1 medium bowl (180g)", 290.0, 8.5, 48.0, 7.2),
            ("Idli (3 pcs) with Sambhar", "3 steamed cakes + 1 bowl stew", 320.0, 11.2, 58.0, 3.8),
            ("Besan Cheela with Mint Chutney", "2 spiced gram flour pancakes", 310.0, 14.0, 36.0, 10.5),
            ("Oatmeal Porridge with Fresh Apple", "1 bowl rolled oats cooked in milk", 285.0, 10.5, 46.0, 5.8)
        ]

        lunch_options = [
            ("Dal Tadka, Steamed Rice & Cucumber Salad", "1 bowl dal, 150g rice, salad", 480.0, 16.5, 78.0, 8.5),
            ("Rajma Masala with Jeera Rice", "1 bowl red beans + 150g spiced rice", 520.0, 18.2, 84.0, 9.4),
            ("Palak Paneer with 2 Whole Wheat Rotis", "1 bowl spinach curry + 2 rotis", 510.0, 22.0, 52.0, 21.0),
            ("Chole Masala with 2 Phulkas & Dahi", "1 bowl chickpeas, 2 rotis, 1 cup curd", 530.0, 20.5, 72.0, 14.5)
        ]

        snack_options = [
            ("Roasted Makhana (Foxnuts)", "1 cup roasted with turmeric", 140.0, 4.2, 24.0, 2.5),
            ("Boiled Chana Chaat", "1/2 cup black chickpeas with lemon", 160.0, 7.5, 26.0, 2.2),
            ("Fresh Papaya / Orange Bowl", "1 medium bowl diced seasonal fruit", 95.0, 1.5, 22.0, 0.4)
        ]

        dinner_options = [
            ("Moong Dal Khichdi with Dahi", "1 large bowl comfort khichdi + yogurt", 440.0, 16.0, 68.0, 9.2),
            ("Aloo Gobi Matar with 2 Multigrain Rotis", "1 bowl sabzi + 2 rotis", 420.0, 11.5, 62.0, 12.0),
            ("Mixed Vegetable Stew with 2 Chapatis", "1 bowl light curry + 2 chapatis", 390.0, 10.2, 58.0, 10.5)
        ]

        if not is_veg:
            lunch_options.append(("Homestyle Chicken Curry with 2 Rotis", "1 bowl chicken gravy + 2 rotis", 540.0, 34.0, 45.0, 19.5))
            dinner_options.append(("Grilled Fish with Steamed Veggies & Rice", "150g fish, sautéed vegetables", 460.0, 32.5, 42.0, 14.0))

        # Generate schedule for all 7 days
        for i, day in enumerate(days_of_week):
            b_dish, b_desc, b_cal, b_p, b_c, b_f = breakfast_options[i % len(breakfast_options)]
            l_dish, l_desc, l_cal, l_p, l_c, l_f = lunch_options[i % len(lunch_options)]
            s_dish, s_desc, s_cal, s_p, s_c, s_f = snack_options[i % len(snack_options)]
            d_dish, d_desc, d_cal, d_p, d_c, d_f = dinner_options[i % len(dinner_options)]

            day_cal = b_cal + l_cal + s_cal + d_cal
            day_p = b_p + l_p + s_p + d_p
            day_c = b_c + l_c + s_c + d_c
            day_f = b_f + l_f + s_f + d_f

            meals = [
                PlannedMeal(meal_type="Breakfast", dish_name=b_dish, serving_description=b_desc, calories=b_cal, protein_g=b_p, carbs_g=b_c, fat_g=b_f),
                PlannedMeal(meal_type="Lunch", dish_name=l_dish, serving_description=l_desc, calories=l_cal, protein_g=l_p, carbs_g=l_c, fat_g=l_f),
                PlannedMeal(meal_type="Afternoon Snack", dish_name=s_dish, serving_description=s_desc, calories=s_cal, protein_g=s_p, carbs_g=s_c, fat_g=s_f),
                PlannedMeal(meal_type="Dinner", dish_name=d_dish, serving_description=d_desc, calories=d_cal, protein_g=d_p, carbs_g=d_c, fat_g=d_f)
            ]

            weekly_schedule.append(
                DailyMealPlan(
                    day=day,
                    meals=meals,
                    day_total_calories=round(day_cal, 1),
                    day_total_protein_g=round(day_p, 1),
                    day_total_carbs_g=round(day_c, 1),
                    day_total_fat_g=round(day_f, 1)
                )
            )

        # Synthesize aggregated shopping list
        shopping_list = [
            "Whole Wheat Atta (Flour) - 2 kg",
            "Basmati Rice - 1.5 kg",
            "Toor Dal (Pigeon Pea) - 500 g",
            "Moong Dal (Yellow Split) - 500 g",
            "Rajma (Kidney Beans) - 500 g",
            "Fresh Paneer - 400 g",
            "Plain Dahi (Curd / Yogurt) - 1 kg",
            "Fresh Spinach (Palak) - 2 bunches",
            "Onions (2 kg) & Tomatoes (2 kg)",
            "Ginger & Garlic - 250 g",
            "Fresh Seasonal Fruits (Apples / Bananas) - 1 dozen",
            "Cold-Pressed Mustard / Sunflower Oil - 1 L"
        ]

        if not is_veg:
            shopping_list.append("Fresh Skinless Chicken Breast - 1 kg")
            shopping_list.append("Fresh Fish Fillets (Rohu / Salmon) - 500 g")

        return WeeklyMealPlanResponse(
            plan_id=f"plan_{uuid.uuid4().hex[:8]}",
            user_targets=targets,
            weekly_schedule=weekly_schedule,
            shopping_list=shopping_list
        )
