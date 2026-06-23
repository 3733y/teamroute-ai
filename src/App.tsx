import { useState } from 'react';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { RegisterSchedulePage } from './pages/RegisterSchedulePage';
import { RecommendationPage } from './pages/RecommendationPage';
import { SavedMeetingsPage } from './pages/SavedMeetingsPage';
import { useTeam } from './context/TeamContext';

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [selectedMember, setSelectedMember] = useState<string>('');
  const { activeTeam, teams, setActiveTeamId } = useTeam();

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const handleSidebarNav = (page: string) => {
    if (page === 'my-teams') {
      setCurrentPage('home');
      setTimeout(() => {
        const el = document.getElementById('teams-list');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      return;
    }
    
    if (page === 'register-schedule') {
      if (!activeTeam && teams.length > 0) {
        setActiveTeamId(teams[0].id);
      }
      setSelectedMember(activeTeam?.members[0] || teams[0]?.members[0] || '');
      setCurrentPage('register-schedule');
      return;
    }

    if (page === 'recommendations') {
      if (!activeTeam && teams.length > 0) {
        setActiveTeamId(teams[0].id);
      }
      setCurrentPage('recommendations');
      return;
    }

    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'dashboard':
        return (
          <DashboardPage 
            onNavigate={handleNavigate} 
            setSelectedMemberForEvent={setSelectedMember} 
          />
        );
      case 'register-schedule':
        return (
          <RegisterSchedulePage 
            onNavigate={handleNavigate} 
            selectedMember={selectedMember} 
          />
        );
      case 'recommendations':
        return <RecommendationPage onNavigate={handleNavigate} />;
      case 'saved-meetings':
        return <SavedMeetingsPage onNavigate={handleNavigate} />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar animate-fade-in">
        <div className="sidebar-brand">
          <div className="logo-container" onClick={() => handleSidebarNav('home')}>
            <div className="logo-icon">T</div>
            <div>
              <h1 className="logo-text" style={{ fontSize: '1.15rem' }}>
                TeamRoute <span className="logo-sub">AI</span>
              </h1>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`sidebar-nav-item ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => handleSidebarNav('home')}
          >
            🏠 Home
          </button>
          <button 
            className="sidebar-nav-item"
            onClick={() => handleSidebarNav('my-teams')}
          >
            👥 My Teams
          </button>
          <button 
            className={`sidebar-nav-item ${currentPage === 'register-schedule' ? 'active' : ''}`}
            onClick={() => handleSidebarNav('register-schedule')}
          >
            📅 Register Schedule
          </button>
          <button 
            className={`sidebar-nav-item ${currentPage === 'recommendations' ? 'active' : ''}`}
            onClick={() => handleSidebarNav('recommendations')}
          >
            💡 Recommendations
          </button>
          <button 
            className={`sidebar-nav-item ${currentPage === 'saved-meetings' ? 'active' : ''}`}
            onClick={() => handleSidebarNav('saved-meetings')}
          >
            💾 Saved Meetings
          </button>
        </nav>

        {activeTeam && (
          <div style={{ marginTop: 'auto', padding: '0.75rem', background: '#ffffff', borderRadius: '6px', border: '1px solid hsl(var(--border-glass))' }}>
            <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Team
            </span>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-primary))', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeTeam.name}
            </div>
            <button 
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              onClick={() => handleNavigate('dashboard')}
            >
              Dashboard
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Wrapper */}
      <div className="main-content-wrapper">
        {/* Header */}
        <header className="app-header animate-fade-in" style={{ margin: 0, padding: '1rem 1.5rem', borderBottom: '1px solid hsl(var(--border-glass))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ background: 'hsl(var(--primary-glow))', color: 'hsl(var(--primary))', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
              University Scheduler
            </span>
            {activeTeam && (
              <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))' }}>
                • Active: <strong>{activeTeam.name}</strong>
              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {activeTeam && (
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => handleNavigate('dashboard')}
              >
                Dashboard: {activeTeam.name}
              </button>
            )}
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => handleNavigate('home')}
            >
              Home
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          {renderPage()}
        </main>

        {/* Footer */}
        <footer 
          style={{ 
            padding: '1.5rem', 
            borderTop: '1px solid hsl(var(--border-glass))', 
            textAlign: 'center', 
            fontSize: '0.8rem', 
            color: 'hsl(var(--text-muted))',
            backgroundColor: '#ffffff'
          }}
        >
          TeamRoute AI • Realistic University Project Meeting Scheduler • Built with React & TypeScript
        </footer>
      </div>
    </div>
  );
}
