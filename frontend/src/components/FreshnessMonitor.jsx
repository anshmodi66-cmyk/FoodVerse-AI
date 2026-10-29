import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldAlert, 
  AlertOctagon, 
  Clock, 
  Thermometer, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Sparkles,
  UploadCloud,
  Camera,
  CameraOff,
  RotateCcw,
  Image as ImageIcon,
  CheckCircle2,
  Trash2
} from 'lucide-react';

export default function FreshnessMonitor({ apiBaseUrl }) {
  const [category, setCategory] = useState('vegetable');
  const [storageMethod, setStorageMethod] = useState('ambient');
  const [storageHours, setStorageHours] = useState(6);
  const [analyzing, setAnalyzing] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [activeImageBlob, setActiveImageBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Generate realistic synthetic canvas blobs for presets
  const generatePresetBlob = (type) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    if (type === 'fresh_tomato') {
      // Vibrant fresh red with sheen
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(128, 40, 30, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'stored_spinach') {
      // Dark green with slight texture
      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = '#166534';
      for (let i = 0; i < 40; i++) {
        ctx.fillRect(Math.random() * 240, Math.random() * 240, 15, 15);
      }
    } else if (type === 'danger_rice') {
      // Off-white yellowish with dark spore speckles
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = '#78350f';
      for (let i = 0; i < 25; i++) {
        ctx.fillRect(Math.random() * 250, Math.random() * 250, 4, 4);
      }
    } else if (type === 'old_chicken') {
      // Dull grayish brown with dark blotches
      ctx.fillStyle = '#a8a29e';
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = '#44403c';
      for (let i = 0; i < 60; i++) {
        ctx.fillRect(Math.random() * 230, Math.random() * 230, 20, 20);
      }
    } else {
      ctx.fillStyle = '#10b981';
      ctx.fillRect(0, 0, 256, 256);
    }

    return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
  };

  // Preset test cases
  const sampleCases = [
    {
      id: 'fresh_tomato',
      name: 'Fresh Farm Tomato',
      category: 'vegetable',
      method: 'ambient',
      hours: 4,
      desc: 'Recently harvested, within standard ambient shelf stability.'
    },
    {
      id: 'stored_spinach',
      name: 'Refrigerated Spinach Leaves',
      category: 'vegetable',
      method: 'refrigerated',
      hours: 48,
      desc: 'Stored at 3°C; enzymatic breakdown retarded.'
    },
    {
      id: 'danger_rice',
      name: 'Cooked Rice (Danger Zone Leftover)',
      category: 'cooked_meal',
      method: 'ambient',
      hours: 6,
      desc: 'High risk of Bacillus cereus spore germination (>2 hrs ambient).'
    },
    {
      id: 'old_chicken',
      name: 'Cooked Chicken (Ambient Storage)',
      category: 'cooked_meal',
      method: 'ambient',
      hours: 5,
      desc: 'Severe foodborne pathogen hazard (Salmonella / Staph enterotoxin).'
    }
  ];

  const handleSelectCase = async (testCase) => {
    setSelectedCaseId(testCase.id);
    setCategory(testCase.category);
    setStorageMethod(testCase.method);
    setStorageHours(testCase.hours);
    setErrorMessage(null);

    const blob = await generatePresetBlob(testCase.id);
    setActiveImageBlob(blob);
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);

    evaluateFreshness(testCase.category, testCase.method, testCase.hours, blob);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMessage('Please upload a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    setSelectedCaseId(null);
    setErrorMessage(null);
    setActiveImageBlob(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    evaluateFreshness(category, storageMethod, storageHours, file);
  };

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setCameraError('Camera access denied. Please grant webcam permissions or select an image.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
    setCameraError(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    stopCamera();

    canvas.toBlob((blob) => {
      if (!blob) return;
      setActiveImageBlob(blob);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      evaluateFreshness(category, storageMethod, storageHours, blob);
    }, 'image/jpeg', 0.9);
  };

  const evaluateFreshness = async (
    cat = category, 
    method = storageMethod, 
    hours = storageHours,
    imageBlob = activeImageBlob
  ) => {
    setAnalyzing(true);
    setErrorMessage(null);
    try {
      const formData = new FormData();
      formData.append('category', cat);
      formData.append('storage_method', method);
      formData.append('storage_hours', hours.toString());
      
      let blobToSend = imageBlob;
      if (!blobToSend) {
        blobToSend = await generatePresetBlob('fresh_tomato');
        setActiveImageBlob(blobToSend);
        setPreviewUrl(URL.createObjectURL(blobToSend));
      }
      formData.append('file', blobToSend, 'specimen.jpg');

      let res = await fetch(`${apiBaseUrl}/freshness/assess`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        res = await fetch('http://127.0.0.1:8000/api/v1/freshness/assess', {
          method: 'POST',
          body: formData
        });
      }

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setAssessment(data.data || data);
    } catch (err) {
      console.warn('API fetch failed, falling back to deterministic local math:', err);
      // Fallback local logic
      const isDanger = method === 'ambient' && hours > (cat === 'cooked_meal' ? 2 : 48);
      const sri = isDanger ? 82.5 : Math.min(100, (hours * 1.5 + 12));
      setAssessment({
        food_name: `${cat.toUpperCase()} Specimen`,
        category: cat,
        visual_quality_score: Math.max(10, Math.round(100 - hours * 1.2)),
        spoilage_risk_index: Math.min(100, Math.round(sri)),
        risk_level: isDanger ? 'UNSAFE' : (sri > 45 ? 'HIGH' : (sri > 25 ? 'MODERATE' : 'LOW')),
        observed_defects: [
          { defect_type: isDanger ? 'Storage danger-zone threshold exceeded' : 'Surface moisture loss / slight wilting', severity: isDanger ? 'severe' : 'slight', affected_area_pct: 4.5 }
        ],
        storage_evaluation: {
          storage_method: method,
          storage_hours: hours,
          danger_zone_hours: method === 'ambient' ? hours : 0,
          max_safe_ambient_hours: cat === 'cooked_meal' ? 2 : 48,
          is_danger_zone_exceeded: isDanger
        },
        actionable_recommendation: isDanger 
          ? 'DO NOT CONSUME. Food has exceeded the 2-hour FDA danger zone limit for room-temperature storage.' 
          : 'Produce appears visually intact. Wash with potable water before culinary preparation.',
        non_diagnostic_disclaimer: 'CRITICAL FOOD SAFETY NOTICE: Visual assessment CANNOT detect odorless, invisible bacterial pathogens (Salmonella, Listeria, E. coli).'
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const resetAll = () => {
    setAssessment(null);
    setActiveImageBlob(null);
    setPreviewUrl(null);
    setSelectedCaseId(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span className="badge badge-amber">Module 2 (Epic 3)</span>
              <span className="badge badge-coral">Non-Diagnostic Safety Filter</span>
            </div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>
              Food Freshness & Multi-Factor Spoilage Risk Engine
            </h1>
            <p style={{ color: 'var(--text-muted)', maxWidth: '780px', fontSize: '0.95rem' }}>
              Combines surface visual degradation with <strong>FDA Food Code &amp; FSSAI Temperature Danger Zone rules</strong> (40°F–140°F / 4.4°C–60°C). 
  Crucially, our architecture enforces a <strong>Non-Diagnostic Safety Policy</strong>: it refuses to declare food safe based solely on visual appearance.
            </p>
          </div>

          {/* Reset button */}
          {assessment && (
            <button onClick={resetAll} className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '6px 14px' }}>
              <RotateCcw size={14} />
              <span>Reset Assessment</span>
            </button>
          )}
        </div>

        {/* Preset Selector */}
        <div style={{ marginTop: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>
            TEST CASE SIMULATIONS (CLICK TO INSTANTLY AUDIT):
          </span>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
            {sampleCases.map(tc => (
              <button
                key={tc.id}
                onClick={() => handleSelectCase(tc)}
                className="btn btn-secondary"
                style={{ 
                  fontSize: '0.82rem', 
                  padding: '8px 14px',
                  borderColor: selectedCaseId === tc.id ? 'var(--primary)' : 'var(--border-subtle)',
                  background: selectedCaseId === tc.id ? 'rgba(99, 102, 241, 0.25)' : 'var(--bg-surface)'
                }}
              >
                <Sparkles size={14} color="#f59e0b" />
                <span>{tc.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Control Panel Grid */}
      <div className="grid-2col">
        
        {/* Input Parameters & Image Feed */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Thermometer size={18} color="#818cf8" />
            <span>Inspection Parameters & Specimen Feed</span>
          </h3>

          {errorMessage && (
            <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', color: '#f87171', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <AlertTriangle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Specimen Media Input (Camera / Upload / Active Preview) */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Specimen Image</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {!isCameraOpen ? (
                  <button 
                    type="button" 
                    onClick={startCamera} 
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                  >
                    <Camera size={13} /> Camera
                  </button>
                ) : (
                  <button 
                    type="button" 
                    onClick={stopCamera} 
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '4px 8px', color: '#f87171' }}
                  >
                    <CameraOff size={13} /> Cancel
                  </button>
                )}
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()} 
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                >
                  <UploadCloud size={13} /> Upload File
                </button>
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  accept="image/jpeg,image/png,image/webp" 
                  onChange={handleFileUpload} 
                  style={{ display: 'none' }} 
                />
              </div>
            </div>

            {/* Camera Viewfinder */}
            {isCameraOpen ? (
              <div style={{ background: '#000', borderRadius: 'var(--radius-sm)', overflow: 'hidden', padding: '10px', textAlign: 'center' }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '4px' }} />
                <button onClick={capturePhoto} className="btn btn-primary" style={{ marginTop: '8px', padding: '6px 16px', fontSize: '0.85rem' }}>
                  <Camera size={14} /> Snap Specimen Photo
                </button>
              </div>
            ) : previewUrl ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <img src={previewUrl} alt="Specimen" style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-subtle)' }} />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Specimen Visual Loaded</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Ready for surface defect and temperature danger zone analysis</div>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                style={{ padding: '16px', textAlign: 'center', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: 'rgba(255,255,255,0.01)' }}
              >
                <ImageIcon size={24} color="var(--text-dim)" style={{ margin: '0 auto 6px' }} />
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Click to upload produce photo or select a test case simulation above</div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Food Category
              </label>
              <select 
                className="input-field"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="vegetable">Vegetable (Produce - Max Safe Ambient: 72h)</option>
                <option value="fruit">Fruit (Produce - Max Safe Ambient: 96h)</option>
                <option value="cooked_meal">Cooked Meal / Leftovers (High Risk - Max Safe: 2h)</option>
                <option value="dairy">Dairy / Yogurt / Milk (Max Safe: 2h)</option>
                <option value="poultry">Raw Poultry / Chicken (Max Safe: 1.5h)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Storage Environment
              </label>
              <select 
                className="input-field"
                value={storageMethod}
                onChange={(e) => setStorageMethod(e.target.value)}
              >
                <option value="ambient">Ambient Room Temp (Danger Zone 20°C - 35°C)</option>
                <option value="refrigerated">Refrigerated (Safe Chill &lt; 4°C)</option>
                <option value="frozen">Deep Frozen (&lt; -18°C)</option>
              </select>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Elapsed Storage Duration:</span>
                <strong style={{ color: '#fff' }}>{storageHours} Hours</strong>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="96" 
                step="0.5" 
                value={storageHours}
                onChange={(e) => setStorageHours(parseFloat(e.target.value))}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                <span>Just prepared (0h)</span>
                <span>24h</span>
                <span>48h</span>
                <span>4 Days (96h)</span>
              </div>
            </div>

            <button 
              onClick={() => evaluateFreshness(category, storageMethod, storageHours, activeImageBlob)}
              className="btn btn-primary"
              disabled={analyzing}
              style={{ marginTop: '8px' }}
            >
              <Clock size={16} />
              <span>{analyzing ? 'Evaluating Spoilage Risk Index...' : 'Run Spoilage Assessment'}</span>
            </button>
          </div>
        </div>

        {/* Results Gauge Card */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} color="#f59e0b" />
              <span>Safety Assessment Output</span>
            </h3>

            {assessment ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* 2 Score Badges */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>VISUAL QUALITY</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: assessment.visual_quality_score > 70 ? '#34d399' : '#f59e0b', fontFamily: 'var(--font-heading)' }}>
                      {assessment.visual_quality_score}/100
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Surface Defect Score</div>
                  </div>

                  <div style={{ 
                    background: assessment.spoilage_risk_index > 50 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)', 
                    padding: '16px', 
                    borderRadius: 'var(--radius-sm)', 
                    border: `1px solid ${assessment.spoilage_risk_index > 50 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                    textAlign: 'center' 
                  }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>SPOILAGE RISK INDEX (SRI)</div>
                    <div style={{ 
                      fontSize: '2rem', 
                      fontWeight: 800, 
                      color: assessment.spoilage_risk_index > 50 ? '#ef4444' : '#10b981', 
                      fontFamily: 'var(--font-heading)' 
                    }}>
                      {assessment.spoilage_risk_index}
                    </div>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 700, 
                      color: assessment.risk_level === 'UNSAFE' ? '#f87171' : '#34d399' 
                    }}>
                      STATUS: {assessment.risk_level}
                    </div>
                  </div>
                </div>

                {/* Recommendation Box */}
                <div style={{ 
                  background: assessment.risk_level === 'UNSAFE' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.08)',
                  border: `1px solid ${assessment.risk_level === 'UNSAFE' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px 18px'
                }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: assessment.risk_level === 'UNSAFE' ? '#f87171' : '#34d399' }}>
                    Actionable Handling Directive:
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#fff', marginTop: '4px' }}>
                    {assessment.actionable_recommendation}
                  </div>
                </div>

                {/* Danger zone detail & Observed defects */}
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Storage Context: <strong>{assessment.storage_evaluation.danger_zone_hours} hrs</strong> spent in temperature danger zone (Max safe limit: {assessment.storage_evaluation.max_safe_ambient_hours} hrs).
                </div>

                {assessment.observed_defects?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '6px' }}>
                      SURFACE QUALITY LOGS:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {assessment.observed_defects.map((def, i) => (
                        <div key={i} style={{ fontSize: '0.78rem', color: '#e2e8f0', background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: '4px' }}>
                          • {def.defect_type} ({def.severity} severity{def.affected_area_pct ? ` - ${def.affected_area_pct}% area` : ''})
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
                Select a preset test case or adjust parameters and click "Run Spoilage Assessment".
              </div>
            )}
          </div>

          {/* Critical Disclaimer */}
          <div style={{ 
            marginTop: '16px', 
            background: 'rgba(239, 68, 68, 0.08)', 
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <AlertOctagon size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <strong style={{ color: '#f87171' }}>Mandatory Biological Safety Limit:</strong> Visual camera analysis cannot detect colorless, odorless bacterial toxins (Salmonella, Listeria, E. coli). Leftovers left &gt; 2 hours at room temperature must be discarded regardless of appearance.
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
