import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import FoodScanner from './components/FoodScanner';
import FreshnessMonitor from './components/FreshnessMonitor';
import HygieneDashboard from './components/HygieneDashboard';
import CookingAssistant from './components/CookingAssistant';
import MealPlanner from './components/MealPlanner';
import ArchitectureView from './components/ArchitectureView';

export default function App() {
  const [activeTab, setActiveTab] = useState('nutrition');
  const [apiOnline, setApiOnline] = useState(false);
  const apiBaseUrl = '/api/v1';

  // Check backend health on load and interval with fallback
  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/health`, { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setApiOnline(data.status === 'healthy');
          return;
        }
      } catch {
        // Fallback to direct backend port if needed
      }

      try {
        const resDirect = await fetch('http://127.0.0.1:8000/api/v1/health', { method: 'GET' });
        if (isMounted) setApiOnline(resDirect.ok);
      } catch {
        if (isMounted) setApiOnline(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 6000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Navigation Header */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} apiOnline={apiOnline} />

      {/* Main Content Area — Preserves Tab State */}
      <main style={{ flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '0 24px 60px' }}>
        <div style={{ display: activeTab === 'nutrition' ? 'block' : 'none' }}>
          <FoodScanner apiBaseUrl={apiBaseUrl} />
        </div>
        <div style={{ display: activeTab === 'freshness' ? 'block' : 'none' }}>
          <FreshnessMonitor apiBaseUrl={apiBaseUrl} />
        </div>
        <div style={{ display: activeTab === 'hygiene' ? 'block' : 'none' }}>
          <HygieneDashboard apiBaseUrl={apiBaseUrl} />
        </div>
        <div style={{ display: activeTab === 'cooking' ? 'block' : 'none' }}>
          <CookingAssistant apiBaseUrl={apiBaseUrl} />
        </div>
        <div style={{ display: activeTab === 'planner' ? 'block' : 'none' }}>
          <MealPlanner apiBaseUrl={apiBaseUrl} />
        </div>
        <div style={{ display: activeTab === 'architecture' ? 'block' : 'none' }}>
          <ArchitectureView apiBaseUrl={apiBaseUrl} />
        </div>
      </main>

      {/* Global Footer */}
      <footer style={{ 
        borderTop: '1px solid var(--border-subtle)', 
        background: 'rgba(11, 15, 23, 0.9)', 
        padding: '24px', 
        textAlign: 'center',
        fontSize: '0.82rem',
        color: 'var(--text-dim)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <strong>Food Verse AI</strong> — Multimodal Food Intelligence, Freshness & Kitchen Safety Agent
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span>Backend: FastAPI (Python 3.11)</span>
            <span>Frontend: React 19 + Vite</span>
            <span>Nutrition: ICMR-NIN IFCT 2017 & USDA FDC</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
