import React from 'react';
import { 
  UtensilsCrossed, 
  ScanLine, 
  ShieldAlert, 
  ChefHat, 
  CalendarDays, 
  Layers, 
  Cpu
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, apiOnline }) {
  const navItems = [
    { id: 'nutrition', label: 'Food Scanner', icon: ScanLine },
    { id: 'freshness', label: 'Freshness & Spoilage', icon: ShieldAlert },
    { id: 'hygiene', label: 'Smart Kitchen (PPE)', icon: UtensilsCrossed },
    { id: 'cooking', label: 'Cooking Assistant', icon: ChefHat },
    { id: 'planner', label: 'Meal Planner', icon: CalendarDays },
    { id: 'architecture', label: 'Architecture & Audit', icon: Layers },
  ];

  return (
    <header className="glass-panel" style={{ 
      position: 'sticky', 
      top: 0, 
      zIndex: 100, 
      borderRadius: 0, 
      borderTop: 'none', 
      borderLeft: 'none', 
      borderRight: 'none',
      padding: '12px 24px',
      marginBottom: '24px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '42px', 
            height: '42px', 
            borderRadius: '12px', 
            background: 'linear-gradient(135deg, #6366f1 0%, #10b981 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)'
          }}>
            <Cpu size={22} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                FOOD VERSE <span style={{ color: '#10b981' }}>AI</span>
              </span>
              <span className="badge badge-emerald" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                v1.0 Hybrid
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Multimodal Food Intelligence & Kitchen Safety Agent
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: isActive ? '1px solid var(--border-glow)' : '1px solid transparent',
                  background: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '0.88rem',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon size={16} color={isActive ? '#818cf8' : 'currentColor'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* API Health Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            padding: '5px 12px', 
            borderRadius: 'var(--radius-full)',
            background: apiOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${apiOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            fontSize: '0.8rem',
            fontWeight: 600,
            color: apiOnline ? '#34d399' : '#f87171'
          }}>
            <span style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: apiOnline ? '#10b981' : '#ef4444',
              boxShadow: apiOnline ? '0 0 8px #10b981' : 'none'
            }} />
            <span>{apiOnline ? 'Backend API Active (Port 8000)' : 'Connecting to API...'}</span>
          </div>
        </div>

      </div>
    </header>
  );
}
