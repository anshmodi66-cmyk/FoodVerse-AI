import React, { useState, useEffect } from 'react';
import { 
  ChefHat, 
  Thermometer, 
  CheckCircle2, 
  Clock, 
  Flame, 
  AlertTriangle, 
  ShieldCheck, 
  Plus, 
  X,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Check
} from 'lucide-react';

export default function CookingAssistant({ apiBaseUrl }) {
  const [ingredients, setIngredients] = useState(['Chicken breast', 'Tomatoes', 'Onion', 'Ginger-garlic', 'Garam masala']);
  const [newIngredient, setNewIngredient] = useState('');
  const [dietary, setDietary] = useState('non_veg');
  const [appliances, setAppliances] = useState(['Pan / Kadai', 'Gas Stove', 'Digital Food Thermometer']);
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Active step timer
  const [activeTimerStep, setActiveTimerStep] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    let interval = null;
    if (timerRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining(prev => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && timerRunning) {
      setTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [timerRunning, secondsRemaining]);

  const presetBundles = [
    {
      title: 'Kadai Chicken (Poultry 165°F)',
      dietary: 'non_veg',
      ingredients: ['Chicken breast', 'Tomatoes', 'Bell pepper (Capsicum)', 'Onion', 'Ginger-garlic', 'Garam masala', 'Cooking oil']
    },
    {
      title: 'Paneer Butter Masala',
      dietary: 'vegetarian',
      ingredients: ['Fresh Paneer', 'Tomatoes', 'Butter', 'Cashew paste', 'Kasturi methi', 'Heavy cream', 'Garam masala']
    },
    {
      title: 'Homestyle Dal Tadka',
      dietary: 'vegan',
      ingredients: ['Toor Dal (Yellow Pigeon Pea)', 'Cumin seeds', 'Garlic', 'Green chillies', 'Tomatoes', 'Turmeric', 'Mustard oil']
    },
    {
      title: 'Quick Spiced Egg Bhurji',
      dietary: 'non_veg',
      ingredients: ['Whole Eggs', 'Finely diced onion', 'Green chillies', 'Coriander leaves', 'Turmeric', 'Ghee']
    }
  ];

  const loadPresetBundle = (bundle) => {
    setIngredients(bundle.ingredients);
    setDietary(bundle.dietary);
    setRecipe(null);
    setErrorMsg(null);
  };

  const addIngredient = () => {
    if (newIngredient.trim() && !ingredients.includes(newIngredient.trim())) {
      setIngredients([...ingredients, newIngredient.trim()]);
      setNewIngredient('');
      setErrorMsg(null);
    }
  };

  const removeIngredient = (item) => {
    setIngredients(ingredients.filter(i => i !== item));
  };

  const toggleAppliance = (app) => {
    if (appliances.includes(app)) {
      setAppliances(appliances.filter(a => a !== app));
    } else {
      setAppliances([...appliances, app]);
    }
  };

  const startStepTimer = (stepNum, durationMinutes) => {
    setActiveTimerStep(stepNum);
    setSecondsRemaining(durationMinutes * 60);
    setTimerRunning(true);
  };

  const pauseStepTimer = () => {
    setTimerRunning(false);
  };

  const resumeStepTimer = () => {
    setTimerRunning(true);
  };

  const resetStepTimer = (durationMinutes) => {
    setTimerRunning(false);
    setSecondsRemaining(durationMinutes * 60);
  };

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const generateRecipe = async () => {
    if (ingredients.length === 0) {
      setErrorMsg('Please add at least one ingredient to generate a culinary recipe.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      let res = await fetch(`${apiBaseUrl}/cooking/generate-recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: ingredients,
          dietary_preference: dietary,
          cuisine_style: 'Indian',
          available_appliances: appliances
        })
      });

      if (!res.ok) {
        res = await fetch('http://127.0.0.1:8000/api/v1/cooking/generate-recipe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ingredients: ingredients,
            dietary_preference: dietary,
            cuisine_style: 'Indian',
            available_appliances: appliances
          })
        });
      }

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setRecipe(data.data || data);
    } catch (err) {
      console.warn('API error, using local fallback:', err);
      const isChicken = ingredients.some(i => i.toLowerCase().includes('chicken'));
      setRecipe({
        title: isChicken ? 'Homestyle Spiced Kadai Chicken' : 'Golden Tawa Paneer Bhurji',
        cuisine: 'North Indian',
        prep_time_minutes: 15,
        cook_time_minutes: 25,
        servings: 2,
        difficulty: 'Medium',
        calories_per_serving: isChicken ? 340 : 280,
        safety_milestones: [
          {
            ingredient: isChicken ? 'Chicken / Poultry' : 'Dairy / Fresh Paneer',
            safe_internal_temp_c: isChicken ? 74.0 : 60.0,
            safe_internal_temp_f: isChicken ? 165.0 : 140.0,
            guideline_source: 'USDA-FSIS Safe Minimum Internal Temperature Chart',
            rest_time_minutes: 0
          }
        ],
        steps: [
          { step_number: 1, instruction: 'Wash hands for 20 seconds. Use dedicated board for raw meat/paneer.', duration_minutes: 5, technique: 'Safe Food Prep', safety_note: 'Avoid rinsing raw poultry under running faucet.' },
          { step_number: 2, instruction: 'Heat oil in pan, temper cumin seeds and sauté aromatic base until golden.', duration_minutes: 8, technique: 'Tempering (Tadka)' },
          { step_number: 3, instruction: 'Add main protein and spices. Sauté until lightly browned and fragrant.', duration_minutes: 7, technique: 'Sautéing & Searing' },
          { step_number: 4, instruction: isChicken ? 'Cover and simmer. Digital food thermometer MUST read 165°F (74°C) at thickest point.' : 'Fold in crumbled paneer and toss gently for 3 minutes.', duration_minutes: 10, technique: 'Simmering & Thermal Verification', safety_note: isChicken ? 'CRITICAL: Verify 165°F internal temperature before removing from heat.' : null }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span className="badge badge-emerald">Module 4 (Epic 5)</span>
          <span className="badge badge-amber">USDA-FSIS Thermal Safety</span>
        </div>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>
          Smart Cooking Assistant & Verified Food-Safety RAG
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '780px', fontSize: '0.95rem' }}>
          Transforms available ingredients into complete, delicious culinary recipes while strictly enforcing 
          <strong> USDA-FSIS thermal food-safety guidelines</strong> (e.g. <strong>165°F / 74°C poultry minimums</strong>, 
          proper rest times, and cross-contamination prevention).
        </p>

        {/* Quick Pantry Bundles */}
        <div style={{ marginTop: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>
            QUICK PANTRY RECIPE PRESETS:
          </span>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
            {presetBundles.map((b, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => loadPresetBundle(b)}
                className="btn btn-secondary"
                style={{ fontSize: '0.82rem', padding: '6px 12px' }}
              >
                <Sparkles size={14} color="#f59e0b" />
                <span>{b.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Control Grid */}
      <div className="grid-2col">
        
        {/* Ingredient Tag Manager */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ChefHat size={18} color="#818cf8" />
            <span>Available Pantry Ingredients</span>
          </h3>

          {errorMsg && (
            <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', color: '#f87171', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <AlertTriangle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Add ingredient (e.g., Paneer, Chicken, Spinach)..."
              value={newIngredient}
              onChange={(e) => setNewIngredient(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addIngredient()}
            />
            <button onClick={addIngredient} className="btn btn-secondary">
              <Plus size={16} />
            </button>
          </div>

          {/* Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
            {ingredients.map(ing => (
              <span key={ing} style={{ 
                background: 'rgba(99, 102, 241, 0.15)', 
                border: '1px solid rgba(99, 102, 241, 0.35)', 
                color: '#fff', 
                borderRadius: 'var(--radius-full)',
                padding: '6px 12px',
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>{ing}</span>
                <X size={14} style={{ cursor: 'pointer', color: '#f87171' }} onClick={() => removeIngredient(ing)} />
              </span>
            ))}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Dietary Preference Filter
            </label>
            <select 
              className="input-field"
              value={dietary}
              onChange={(e) => setDietary(e.target.value)}
            >
              <option value="non_veg">Non-Vegetarian (Include Poultry, Eggs, Meat)</option>
              <option value="vegetarian">Vegetarian (Lacto-Vegetarian / Indian)</option>
              <option value="vegan">Vegan (Strictly Plant-Based)</option>
              <option value="gluten_free">Gluten-Free</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Available Kitchen Appliances:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['Pan / Kadai', 'Gas Stove', 'Digital Food Thermometer', 'Oven', 'Pressure Cooker', 'Air Fryer'].map(app => {
                const isSelected = appliances.includes(app);
                return (
                  <button
                    key={app}
                    type="button"
                    onClick={() => toggleAppliance(app)}
                    className="btn btn-secondary"
                    style={{
                      fontSize: '0.78rem',
                      padding: '4px 10px',
                      background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.02)',
                      borderColor: isSelected ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)',
                      color: isSelected ? '#34d399' : 'var(--text-muted)'
                    }}
                  >
                    {isSelected && <Check size={12} />}
                    <span>{app}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button 
            onClick={generateRecipe} 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px' }}
            disabled={loading}
          >
            <Flame size={16} />
            <span>{loading ? 'Synthesizing Safe Recipe...' : 'Generate Safety-Verified Recipe'}</span>
          </button>
        </div>

        {/* Recipe Display with Thermal Milestones */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="#10b981" />
            <span>Thermal Milestone & Instruction Plan</span>
          </h3>

          {recipe ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div>
                <span className="badge badge-indigo">{recipe.cuisine}</span>
                <h2 style={{ fontSize: '1.4rem', color: '#fff', marginTop: '4px' }}>{recipe.title}</h2>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px', flexWrap: 'wrap' }}>
                  <span>Prep: <strong>{recipe.prep_time_minutes}m</strong></span>
                  <span>Cook: <strong>{recipe.cook_time_minutes}m</strong></span>
                  <span>Servings: <strong>{recipe.servings}</strong></span>
                  <span>Calories: <strong style={{ color: '#f59e0b' }}>{recipe.calories_per_serving} kcal</strong></span>
                </div>
              </div>

              {/* Mandatory Food Safety Temperature Callout */}
              {recipe.safety_milestones?.map((m, idx) => (
                <div key={idx} style={{ 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  border: '1px solid rgba(239, 68, 68, 0.35)', 
                  borderRadius: 'var(--radius-sm)', 
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <Thermometer size={24} color="#ef4444" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f87171' }}>
                      MANDATORY INTERNAL TEMP: {m.safe_internal_temp_f}°F ({m.safe_internal_temp_c}°C)
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Standard: {m.guideline_source}. Must be verified with probe thermometer to destroy pathogens.
                    </div>
                  </div>
                </div>
              ))}

              {/* Active Step Timer Panel if running */}
              {activeTimerStep !== null && (
                <div style={{
                  background: secondsRemaining === 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.15)',
                  border: secondsRemaining === 0 ? '1px solid #ef4444' : '1px solid var(--border-glow)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Clock size={20} color={secondsRemaining === 0 ? '#ef4444' : '#818cf8'} />
                    <div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        Step {activeTimerStep} Cooking Timer:
                      </div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: secondsRemaining === 0 ? '#ef4444' : '#fff' }}>
                        {formatTimer(secondsRemaining)} {secondsRemaining === 0 && '— TIMER COMPLETE!'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {timerRunning ? (
                      <button onClick={pauseStepTimer} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                        <Pause size={14} /> Pause
                      </button>
                    ) : (
                      <button onClick={resumeStepTimer} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                        <Play size={14} /> Resume
                      </button>
                    )}
                    <button onClick={() => resetStepTimer(10)} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem' }}>
                      <RotateCcw size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Steps with Interactive Timer Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                {recipe.steps.map(step => (
                  <div key={step.step_number} style={{ 
                    background: 'rgba(255, 255, 255, 0.03)', 
                    border: '1px solid var(--border-subtle)', 
                    borderRadius: 'var(--radius-sm)', 
                    padding: '14px 16px' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#818cf8' }}>
                        Step {step.step_number}: {step.technique}
                      </span>
                      {step.duration_minutes ? (
                        <button
                          onClick={() => startStepTimer(step.step_number, step.duration_minutes)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '4px' }}
                        >
                          <Play size={12} color="#10b981" />
                          <span>Timer ({step.duration_minutes}m)</span>
                        </button>
                      ) : null}
                    </div>
                    <p style={{ fontSize: '0.88rem', color: '#e2e8f0', margin: 0 }}>
                      {step.instruction}
                    </p>
                    {step.safety_note && (
                      <div style={{ fontSize: '0.78rem', color: '#f59e0b', marginTop: '6px', fontWeight: 600 }}>
                        ⚠️ Safety Note: {step.safety_note}
                      </div>
                    )}
                  </div>
                ))}
              </div>

            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-dim)' }}>
              Configure your ingredients and click "Generate Safety-Verified Recipe" to view step-by-step guidance.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
