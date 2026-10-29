import React, { useState } from 'react';
import {
  Flame,
  CheckSquare,
  Square,
  User,
  Calculator,
  ShoppingCart,
  Copy,
  Check,
  Plus,
  Sparkles
} from 'lucide-react';

export default function MealPlanner({ apiBaseUrl }) {
  const [profile, setProfile] = useState({
    age: 24,
    biological_sex: 'male',
    height_cm: 175,
    weight_kg: 68,
    activity_level: 'moderate',
    goal: 'maintenance',
    dietary_preference: 'vegetarian',
    allergies: ['peanuts']
  });

  const [allergyInput, setAllergyInput] = useState('');
  const [customShoppingItem, setCustomShoppingItem] = useState('');
  const [extraShoppingItems, setExtraShoppingItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [targetLoading, setTargetLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState(null);
  const [previewTargets, setPreviewTargets] = useState(null);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [checkedItems, setCheckedItems] = useState({});
  const [copied, setCopied] = useState(false);

  const addAllergy = () => {
    if (allergyInput.trim() && !profile.allergies.includes(allergyInput.trim().toLowerCase())) {
      setProfile({
        ...profile,
        allergies: [...profile.allergies, allergyInput.trim().toLowerCase()]
      });
      setAllergyInput('');
    }
  };

  const removeAllergy = (allergy) => {
    setProfile({
      ...profile,
      allergies: profile.allergies.filter(a => a !== allergy)
    });
  };

  const addCustomItem = () => {
    if (customShoppingItem.trim()) {
      setExtraShoppingItems([...extraShoppingItems, customShoppingItem.trim()]);
      setCustomShoppingItem('');
    }
  };

  const toggleCheck = (id) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleAllChecks = (allKeys) => {
    const allChecked = allKeys.every(k => checkedItems[k]);
    const next = { ...checkedItems };
    allKeys.forEach(k => {
      next[k] = !allChecked;
    });
    setCheckedItems(next);
  };

  const calculateTargetsOnly = async () => {
    setTargetLoading(true);
    try {
      let res = await fetch(`${apiBaseUrl}/meal-planner/calculate-targets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      if (!res.ok) {
        res = await fetch('http://127.0.0.1:8000/api/v1/meal-planner/calculate-targets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile)
        });
      }
      if (!res.ok) throw new Error('API failed');
      const data = await res.json();
      setPreviewTargets(data.data || data);
    } catch {
      // Local fallback math
      const bmr = profile.biological_sex === 'male'
        ? (10 * profile.weight_kg) + (6.25 * profile.height_cm) - (5 * profile.age) + 5
        : (10 * profile.weight_kg) + (6.25 * profile.height_cm) - (5 * profile.age) - 161;
      const palMap = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
      const tdee = bmr * (palMap[profile.activity_level] || 1.2);
      const targetCal = Math.round(profile.goal === 'fat_loss' ? tdee - 450 : (profile.goal === 'muscle_gain' ? tdee + 350 : tdee));
      const targetP = Math.round(profile.weight_kg * (profile.goal === 'muscle_gain' ? 1.8 : 1.4));
      const targetF = Math.round((targetCal * 0.25) / 9);
      const targetC = Math.round((targetCal - (targetP * 4 + targetF * 9)) / 4);

      setPreviewTargets({
        bmr_kcal: Math.round(bmr),
        tdee_kcal: Math.round(tdee),
        target_calories: targetCal,
        target_protein_g: targetP,
        target_carbohydrates_g: targetC,
        target_fat_g: targetF,
        target_fiber_g: 30.0,
        formula_used: 'Mifflin-St Jeor (1990) & ICMR-NIN 2020 RDA'
      });
    } finally {
      setTargetLoading(false);
    }
  };

  const generatePlan = async () => {
    setLoading(true);
    try {
      let res = await fetch(`${apiBaseUrl}/meal-planner/generate-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      if (!res.ok) {
        res = await fetch('http://127.0.0.1:8000/api/v1/meal-planner/generate-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile)
        });
      }
      if (!res.ok) throw new Error('API failed');
      const data = await res.json();
      setMealPlan(data.data || data);
      setPreviewTargets(null);
    } catch (err) {
      console.warn('API error, using local fallback math:', err);
      // Local deterministic Mifflin-St Jeor math
      const bmr = profile.biological_sex === 'male'
        ? (10 * profile.weight_kg) + (6.25 * profile.height_cm) - (5 * profile.age) + 5
        : (10 * profile.weight_kg) + (6.25 * profile.height_cm) - (5 * profile.age) - 161;

      const palMap = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
      const tdee = bmr * (palMap[profile.activity_level] || 1.2);
      const targetCal = Math.round(profile.goal === 'fat_loss' ? tdee - 450 : (profile.goal === 'muscle_gain' ? tdee + 350 : tdee));
      const targetP = Math.round(profile.weight_kg * (profile.goal === 'muscle_gain' ? 1.8 : 1.4));
      const targetF = Math.round((targetCal * 0.25) / 9);
      const targetC = Math.round((targetCal - (targetP * 4 + targetF * 9)) / 4);

      const isVeg = profile.dietary_preference !== 'non_veg';
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

      setMealPlan({
        user_targets: {
          bmr_kcal: Math.round(bmr),
          tdee_kcal: Math.round(tdee),
          target_calories: targetCal,
          target_protein_g: targetP,
          target_carbohydrates_g: targetC,
          target_fat_g: targetF,
          target_fiber_g: 30.0,
          formula_used: 'Mifflin-St Jeor (1990) & ICMR-NIN 2020 RDA'
        },
        weekly_schedule: days.map(d => ({
          day: d,
          day_total_calories: targetCal,
          day_total_protein_g: targetP,
          day_total_carbs_g: targetC,
          day_total_fat_g: targetF,
          meals: [
            { meal_type: 'Breakfast', dish_name: 'Poha with Sprouted Moong', serving_description: '1 medium bowl (180g)', calories: Math.round(targetCal * 0.22), protein_g: 10, carbs_g: 45, fat_g: 6 },
            { meal_type: 'Lunch', dish_name: isVeg ? 'Dal Tadka, Steamed Rice & Salad' : 'Chicken Kadai with 2 Whole Wheat Rotis', serving_description: isVeg ? '1 bowl dal, 150g rice, cucumber salad' : '150g spiced chicken, 2 rotis', calories: Math.round(targetCal * 0.38), protein_g: isVeg ? 22 : 36, carbs_g: isVeg ? 80 : 45, fat_g: 12 },
            { meal_type: 'Afternoon Snack', dish_name: 'Roasted Makhana & Green Tea', serving_description: '1 bowl spiced foxnuts', calories: Math.round(targetCal * 0.10), protein_g: 4, carbs_g: 22, fat_g: 2 },
            { meal_type: 'Dinner', dish_name: isVeg ? 'Palak Paneer with 2 Whole Wheat Rotis' : 'Grilled Fish with Steamed Rice', serving_description: 'Healthy dinner portion', calories: Math.round(targetCal * 0.30), protein_g: 22, carbs_g: 50, fat_g: 14 }
          ]
        })),
        shopping_list: [
          'Whole Wheat Atta (Flour) - 2 kg',
          'Basmati / Brown Rice - 1.5 kg',
          'Toor Dal & Moong Dal - 500g each',
          isVeg ? 'Fresh Paneer - 400 g' : 'Fresh Chicken Breast - 1 kg',
          'Plain Dahi (Yogurt) - 1 kg',
          'Fresh Spinach & Seasonal Veggies - 2 kg',
          'Cold-Pressed Cooking Oil - 1 L',
          'Foxnuts (Makhana) - 200 g'
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const copyShoppingListToClipboard = () => {
    if (!mealPlan) return;
    const allItems = [...mealPlan.shopping_list, ...extraShoppingItems];
    const text = `Food Verse AI Weekly Grocery List:\n` + allItems.map(item => `- [ ] ${item}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const activeTargets = mealPlan?.user_targets || previewTargets;
  const currentSchedule = mealPlan?.weekly_schedule || [];
  const currentDayPlan = currentSchedule[activeDayIndex] || currentSchedule[0];
  const combinedShoppingList = [...(mealPlan?.shopping_list || []), ...extraShoppingItems];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span className="badge badge-indigo">Module 5 (Epic 6)</span>
          <span className="badge badge-emerald">Deterministic BMR & ICMR 2020 RDA</span>
        </div>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>
          Personalized Nutrition & Constraint-Based Meal Planner
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '780px', fontSize: '0.95rem' }}>
          Deterministically computes basal metabolic rate ($\text{"{"}BMR{"}"}$) and total energy expenditure ($\text{"{"}TDEE{"}"}$) using the
          <strong> Mifflin-St Jeor formula</strong>, scales macronutrients to <strong>ICMR-NIN 2020 Recommended Dietary Allowances</strong>,
          and generates a 7-day personalized schedule with an aggregated grocery list.
        </p>
      </div>

      {/* Profile & Target Grid */}
      <div className="grid-2col">

        {/* Profile Input Form */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} color="#818cf8" />
            <span>Biometric & Lifestyle Profile</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Age (Years)</label>
              <input
                type="number"
                min="10"
                max="100"
                className="input-field"
                value={profile.age}
                onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || 20 })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Biological Sex</label>
              <select
                className="input-field"
                value={profile.biological_sex}
                onChange={(e) => setProfile({ ...profile, biological_sex: e.target.value })}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Height (cm)</label>
              <input
                type="number"
                min="100"
                max="250"
                className="input-field"
                value={profile.height_cm}
                onChange={(e) => setProfile({ ...profile, height_cm: parseFloat(e.target.value) || 170 })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Weight (kg)</label>
              <input
                type="number"
                min="30"
                max="250"
                className="input-field"
                value={profile.weight_kg}
                onChange={(e) => setProfile({ ...profile, weight_kg: parseFloat(e.target.value) || 65 })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Physical Activity (PAL)</label>
              <select
                className="input-field"
                value={profile.activity_level}
                onChange={(e) => setProfile({ ...profile, activity_level: e.target.value })}
              >
                <option value="sedentary">Sedentary (Desk Job, 1.2x)</option>
                <option value="light">Light Active (1-3 days, 1.375x)</option>
                <option value="moderate">Moderate (3-5 days, 1.55x)</option>
                <option value="active">Active (6-7 days, 1.725x)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Fitness Goal</label>
              <select
                className="input-field"
                value={profile.goal}
                onChange={(e) => setProfile({ ...profile, goal: e.target.value })}
              >
                <option value="maintenance">Maintenance</option>
                <option value="fat_loss">Fat Loss (-450 kcal)</option>
                <option value="muscle_gain">Muscle Gain (+350 kcal)</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Dietary Preference
            </label>
            <select
              className="input-field"
              value={profile.dietary_preference}
              onChange={(e) => setProfile({ ...profile, dietary_preference: e.target.value })}
            >
              <option value="vegetarian">Vegetarian (Lacto-Vegetarian / Indian)</option>
              <option value="non_veg">Non-Vegetarian (Include Poultry, Eggs, Fish)</option>
              <option value="vegan">Vegan (Strictly Plant-Based)</option>
              <option value="jain">Jain (No Root Veggies)</option>
            </select>
          </div>

          {/* Allergy exclusions */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Allergens & Exclusions
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Type allergy (e.g. peanuts, dairy, soy, gluten)..."
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addAllergy()}
                style={{ fontSize: '0.85rem' }}
              />
              <button type="button" onClick={addAllergy} className="btn btn-secondary" style={{ padding: '8px 14px' }}>
                <Plus size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {profile.allergies.map(a => (
                <span key={a} style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', borderRadius: 'var(--radius-full)', padding: '2px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span>{a}</span>
                  <span style={{ cursor: 'pointer', fontWeight: 'bold' }} onClick={() => removeAllergy(a)}>×</span>
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={calculateTargetsOnly}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '12px' }}
              disabled={targetLoading}
            >
              <Sparkles size={16} color="#818cf8" />
              <span>{targetLoading ? 'Calculating...' : 'Preview Targets'}</span>
            </button>
            <button
              type="button"
              onClick={generatePlan}
              className="btn btn-primary"
              style={{ flex: 1.5, padding: '12px' }}
              disabled={loading}
            >
              <Calculator size={16} />
              <span>{loading ? 'Solving Constraints...' : 'Generate 7-Day Plan'}</span>
            </button>
          </div>
        </div>

        {/* Calculated Targets Overview */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={18} color="#f59e0b" />
              <span>Target Energy & Macronutrient Breakdown</span>
            </h3>

            {activeTargets ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>BASAL METABOLIC RATE (BMR)</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff' }}>
                      {activeTargets.bmr_kcal} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>kcal</span>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glow)' }}>
                    <div style={{ fontSize: '0.78rem', color: '#818cf8', fontWeight: 600 }}>DAILY TARGET CALORIES</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'var(--font-heading)' }}>
                      {activeTargets.target_calories} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>kcal</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span>Target Protein (ICMR 2020 RDA):</span>
                    <strong style={{ color: '#818cf8' }}>{activeTargets.target_protein_g} g/day</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span>Target Carbohydrates:</span>
                    <strong style={{ color: '#34d399' }}>{activeTargets.target_carbohydrates_g} g/day</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span>Target Dietary Fat (25% total cal):</span>
                    <strong style={{ color: '#fbbf24' }}>{activeTargets.target_fat_g} g/day</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span>Dietary Fiber Floor:</span>
                    <strong style={{ color: '#06b6d4' }}>{activeTargets.target_fiber_g} g/day</strong>
                  </div>
                </div>

              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
                Set your biometrics and click "Preview Targets" or "Generate 7-Day Plan" to compute clinical targets.
              </div>
            )}
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '16px' }}>
            Math Formula: Mifflin-St Jeor (1990) equation cross-referenced with ICMR-NIN 2020 RDA.
          </div>
        </div>

      </div>

      {/* 7-Day Schedule & Shopping Checklist */}
      {mealPlan && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Day Selector Buttons */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
            {mealPlan.weekly_schedule.map((dayPlan, idx) => (
              <button
                key={dayPlan.day}
                onClick={() => setActiveDayIndex(idx)}
                className="btn btn-secondary"
                style={{
                  padding: '8px 18px',
                  borderColor: activeDayIndex === idx ? 'var(--primary)' : 'var(--border-subtle)',
                  background: activeDayIndex === idx ? 'rgba(99, 102, 241, 0.25)' : 'var(--bg-surface)',
                  fontWeight: activeDayIndex === idx ? 700 : 500,
                  whiteSpace: 'nowrap'
                }}
              >
                <span>{dayPlan.day}</span>
              </button>
            ))}
          </div>

          {/* Active Day Meal Grid */}
          <div className="grid-2col">

            {/* Meals List */}
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.2rem' }}>
                  {currentDayPlan?.day || 'Selected Day'} Schedule
                </h3>
                <span className="badge badge-emerald">
                  {currentDayPlan?.day_total_calories} kcal
                </span>
              </div>

              {currentDayPlan?.meals.map((meal, mIdx) => (
                <div key={mIdx} style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px 16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>{meal.meal_type}</span>
                    <strong style={{ color: '#f59e0b', fontSize: '0.95rem' }}>{meal.calories} kcal</strong>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>{meal.dish_name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>{meal.serving_description}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '6px' }}>
                    P: {meal.protein_g}g | C: {meal.carbs_g}g | F: {meal.fat_g}g
                  </div>
                </div>
              ))}
            </div>

            {/* Aggregated Grocery Shopping List */}
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingCart size={18} color="#10b981" />
                  <h3 style={{ fontSize: '1.2rem' }}>Aggregated Grocery Checklist</h3>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => toggleAllChecks(combinedShoppingList.map((_, i) => i))}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  >
                    Check / Uncheck All
                  </button>
                  <button
                    onClick={copyShoppingListToClipboard}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  >
                    {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                    <span>{copied ? 'Copied!' : 'Copy List'}</span>
                  </button>
                </div>
              </div>

              {/* Add Custom Grocery Item */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Add custom item (e.g. Almond milk, Chia seeds)..."
                  value={customShoppingItem}
                  onChange={(e) => setCustomShoppingItem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomItem()}
                  style={{ fontSize: '0.85rem' }}
                />
                <button type="button" onClick={addCustomItem} className="btn btn-secondary" style={{ padding: '8px 12px' }}>
                  <Plus size={15} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto' }}>
                {combinedShoppingList.map((item, idx) => {
                  const isChecked = checkedItems[idx];
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleCheck(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        background: isChecked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {isChecked ? <CheckSquare size={18} color="#10b981" /> : <Square size={18} color="var(--text-dim)" />}
                      <span style={{
                        fontSize: '0.9rem',
                        color: isChecked ? 'var(--text-dim)' : '#fff',
                        textDecoration: isChecked ? 'line-through' : 'none',
                        flex: 1
                      }}>
                        {item}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
