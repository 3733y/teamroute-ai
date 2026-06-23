import React, { useState } from 'react';
import { useTeam } from '../context/TeamContext';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { 
    teams, 
    schedules, 
    activeTeamId, 
    activeTeam, 
    createTeam, 
    joinTeam, 
    deleteTeam, 
    setActiveTeamId 
  } = useTeam();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<{ id: string; name: string } | null>(null);
  
  const [teamName, setTeamName] = useState('');
  const [membersInput, setMembersInput] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joiningMemberName, setJoiningMemberName] = useState('');
  const [filterReadyOnly, setFilterReadyOnly] = useState(false);
  
  const [errorMessage, setErrorMessage] = useState('');

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setErrorMessage('Team name is required.');
      return;
    }
    const memberArray = membersInput
      .split(',')
      .map((name) => name.trim())
      .filter((name) => name.length > 0);
      
    if (memberArray.length === 0) {
      setErrorMessage('Please add at least one member.');
      return;
    }

    const newTeamId = createTeam(teamName.trim(), memberArray);
    setActiveTeamId(newTeamId);
    setTeamName('');
    setMembersInput('');
    setErrorMessage('');
    setShowCreateModal(false);
    onNavigate('dashboard');
  };

  const handleJoinTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      setErrorMessage('Join code is required.');
      return;
    }
    if (!joiningMemberName.trim()) {
      setErrorMessage('Your name is required.');
      return;
    }
    const res = joinTeam(joinCode.trim(), joiningMemberName.trim());
    if (res.success) {
      setJoinCode('');
      setJoiningMemberName('');
      setErrorMessage('');
      setShowJoinModal(false);
      onNavigate('dashboard');
    } else {
      setErrorMessage(res.error || 'Invalid team code.');
    }
  };

  const handleSelectTeam = (teamId: string) => {
    setActiveTeamId(teamId);
    onNavigate('dashboard');
  };

  // Helper calculations for summary cards
  const readyTeamsCount = teams.filter(t => {
    if (t.members.length === 0) return false;
    return t.members.every(m => schedules[m] && schedules[m].length > 0);
  }).length;
  
  const totalMeetingsCount = teams.reduce((acc, t) => acc + (t.meetings || []).length, 0);

  // Helper calculations for team list table rows
  const getScheduleCompletionStatus = (teamMembers: string[]) => {
    const registeredCount = teamMembers.filter(m => schedules[m] && schedules[m].length > 0).length;
    return `${registeredCount}/${teamMembers.length} Registered`;
  };

  const getTeamStatus = (teamMembers: string[]) => {
    if (teamMembers.length === 0) return 'No schedules yet';
    const registeredCount = teamMembers.filter(m => schedules[m] && schedules[m].length > 0).length;
    if (registeredCount === teamMembers.length) return 'Ready for recommendation';
    if (registeredCount === 0) return 'No schedules yet';
    return 'Schedule incomplete';
  };

  const renderTeamStatusBadge = (status: string) => {
    let className = 'status-badge empty';
    if (status === 'Ready for recommendation') className = 'status-badge ready';
    if (status === 'Schedule incomplete') className = 'status-badge incomplete';
    return <span className={className}>{status}</span>;
  };

  // Action card handlers
  const handleQuickRegister = () => {
    if (activeTeam) {
      onNavigate('register-schedule');
    } else {
      setErrorMessage('Please select or create an active team at the top first.');
    }
  };

  const handleQuickRecommend = () => {
    if (activeTeam) {
      onNavigate('recommendations');
    } else {
      setErrorMessage('Please select or create an active team at the top first.');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Greeting Banner */}
      <div 
        className="glass-card" 
        style={{ 
          padding: '2rem', 
          background: '#f1f5f9',
          borderColor: '#e2e8f0',
          borderRadius: '8px'
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'hsl(var(--text-primary))', marginBottom: '0.25rem' }}>
            Good afternoon, Scholar!
          </h1>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem', maxWidth: '600px' }}>
            Manage schedules by calculating transit commute times and custom preparation buffers between campus classes.
          </p>
        </div>
      </div>

      {/* Error Message banner if any */}
      {errorMessage && !showCreateModal && !showJoinModal && (
        <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '6px', color: 'hsl(var(--error))', fontSize: '0.9rem', fontWeight: 500 }}>
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Summary Cards */}
      <div className="summary-grid">
        <div 
          className="summary-card" 
          style={{ 
            cursor: 'pointer',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
          }}
          onClick={() => {
            const el = document.getElementById('teams-list');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <div className="summary-label">Total Teams</div>
          <div className="summary-val">{teams.length}</div>
        </div>
        <div 
          className="summary-card"
          style={{ 
            cursor: 'pointer',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            borderColor: filterReadyOnly ? 'hsl(var(--primary))' : undefined,
            background: filterReadyOnly ? 'hsl(var(--primary-glow))' : undefined
          }}
          onClick={() => setFilterReadyOnly(prev => !prev)}
        >
          <div className="summary-label" style={{ color: filterReadyOnly ? 'hsl(var(--primary))' : undefined }}>
            Ready for Recommendations {filterReadyOnly ? '🔍' : ''}
          </div>
          <div className="summary-val" style={{ color: readyTeamsCount > 0 ? 'hsl(var(--success))' : 'inherit' }}>
            {readyTeamsCount}
          </div>
        </div>
        <div 
          className="summary-card" 
          style={{ 
            cursor: 'pointer',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
          }}
          onClick={() => onNavigate('saved-meetings')}
        >
          <div className="summary-label">Upcoming Meetings</div>
          <div className="summary-val">{totalMeetingsCount}</div>
        </div>
      </div>

      {/* Quick Start Actions Section */}
      <div>
        {/* Header Row */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'hsl(var(--text-primary))', margin: 0 }}>
            Quick Start Actions
          </h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>
              Active Team:
            </span>
            <select 
              className="form-select"
              value={activeTeamId || ''} 
              onChange={(e) => {
                setActiveTeamId(e.target.value || null);
                setErrorMessage('');
              }}
              style={{ padding: '0.35rem 2rem 0.35rem 0.75rem', fontSize: '0.85rem', minWidth: '180px', height: '32px' }}
            >
              <option value="">-- No Active Team --</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <button 
              className="btn btn-primary btn-sm"
              style={{ height: '32px', display: 'inline-flex', alignItems: 'center' }}
              onClick={() => {
                if (activeTeam) {
                  onNavigate('dashboard');
                } else {
                  setErrorMessage('Please select an active team first.');
                }
              }}
              disabled={!activeTeam}
            >
              Open Dashboard
            </button>
          </div>
        </div>

        {/* Quick Start Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          <div className="quick-start-card" style={{ padding: '1.25rem' }} onClick={() => { setErrorMessage(''); setShowCreateModal(true); }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>➕</div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Create Team</h3>
            <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginTop: '0.25rem' }}>
              Set up a new university project group and roster.
            </p>
          </div>
          <div className="quick-start-card" style={{ padding: '1.25rem' }} onClick={handleQuickRegister}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📅</div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Register Schedule</h3>
            <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginTop: '0.25rem' }}>
              Add mock classes or busy events to block sync times.
            </p>
          </div>
          <div className="quick-start-card" style={{ padding: '1.25rem' }} onClick={handleQuickRecommend}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💡</div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Get Recommendation</h3>
            <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginTop: '0.25rem' }}>
              Scan schedules to find travel-separated sync slots.
            </p>
          </div>
        </div>
      </div>

      {/* Team Directory Table */}
      <div id="teams-list">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'hsl(var(--text-primary))' }}>Team Listings</h2>
          <button className="btn btn-secondary btn-sm" onClick={() => { setErrorMessage(''); setJoiningMemberName(''); setShowJoinModal(true); }}>
            🚀 Join Team by Code
          </button>
        </div>

        {filterReadyOnly && (
          <div style={{ 
            padding: '0.75rem 1rem', 
            background: 'hsl(var(--primary-glow))', 
            border: '1px solid hsl(var(--primary))', 
            borderRadius: '6px', 
            color: 'hsl(var(--primary))', 
            fontSize: '0.85rem', 
            fontWeight: 500,
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Filter active: Showing only teams ready for recommendations.</span>
            <button 
              className="btn btn-secondary btn-sm" 
              style={{ padding: '0.15rem 0.5rem', fontSize: '0.75rem' }} 
              onClick={() => setFilterReadyOnly(false)}
            >
              Clear Filter
            </button>
          </div>
        )}

        {(() => {
          const displayedTeams = filterReadyOnly 
            ? teams.filter(t => getTeamStatus(t.members) === 'Ready for recommendation') 
            : teams;

          if (displayedTeams.length === 0) {
            return (
              <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>
                {filterReadyOnly 
                  ? 'No teams are ready for recommendations currently.' 
                  : 'No active teams. Create or join a team to get started!'}
              </div>
            );
          }

          return (
            <div className="table-container">
              <table className="clean-table">
                <thead>
                  <tr>
                    <th>Team Name</th>
                    <th>Team Code</th>
                    <th>Roster Size</th>
                    <th>Schedules Status</th>
                    <th>Recommendation Status</th>
                    <th>Saved Meetings</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedTeams.map((team) => {
                    const status = getTeamStatus(team.members);
                  return (
                    <tr key={team.id}>
                      <td>
                        <strong>{team.name}</strong>
                      </td>
                      <td>
                        <code style={{ fontSize: '0.8rem', color: 'hsl(var(--primary))', fontWeight: 600 }}>
                          {team.code}
                        </code>
                      </td>
                      <td>{team.members.length} Members</td>
                      <td>{getScheduleCompletionStatus(team.members)}</td>
                      <td>{renderTeamStatusBadge(status)}</td>
                      <td>{team.meetings.length} meetings</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleSelectTeam(team.id)}
                          >
                            Open Dashboard
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            style={{ padding: '0.25rem 0.5rem' }}
                            onClick={() => setTeamToDelete({ id: team.id, name: team.name })}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })()}
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Create a New Team</h2>
            
            <form onSubmit={handleCreateTeam} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Team Project Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Capstone Group 4"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Member Names (comma separated)</label>
                <textarea 
                  className="form-input" 
                  placeholder="Alice Park, Bob Kim, Charlie Lee"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  value={membersInput}
                  onChange={(e) => setMembersInput(e.target.value)}
                />
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                  Add members of your university project team.
                </span>
              </div>

              {errorMessage && (
                <div style={{ color: 'hsl(var(--error))', fontSize: '0.85rem', fontWeight: 500 }}>
                  {errorMessage}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Team Modal */}
      {showJoinModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Join an Existing Team</h2>
            
            <form onSubmit={handleJoinTeam} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Team Code</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. CS401-GRP"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  style={{ textTransform: 'uppercase' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                  Ask your teammates for their team code (e.g. CS401-GRP or MKT-TEAM).
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Your Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Emma Watson"
                  value={joiningMemberName}
                  onChange={(e) => setJoiningMemberName(e.target.value)}
                />
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                  Enter your name to register as a member of this team.
                </span>
              </div>

              {errorMessage && (
                <div style={{ color: 'hsl(var(--error))', fontSize: '0.85rem', fontWeight: 500 }}>
                  {errorMessage}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowJoinModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Join Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {teamToDelete && (
        <div className="modal-overlay" onClick={() => setTeamToDelete(null)}>
          <div className="glass-card modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'hsl(var(--error))' }}>Delete Team?</h2>
            <p style={{ marginBottom: '1.5rem', color: 'hsl(var(--text-secondary))' }}>
              Are you sure you want to delete <strong>{teamToDelete.name}</strong>? All registered meetings and team information will be permanently removed.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setTeamToDelete(null)}>
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-danger" 
                onClick={() => {
                  deleteTeam(teamToDelete.id);
                  setTeamToDelete(null);
                }}
              >
                Delete Team
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
