import React, { useState } from 'react';
import { useTeam } from '../context/TeamContext';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
  setSelectedMemberForEvent: (name: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ 
  onNavigate, 
  setSelectedMemberForEvent 
}) => {
  const { activeTeam, schedules, deleteScheduleEvent, deleteTeam, addMember, editMember, deleteMember, deleteMeeting } = useTeam();
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<{ id: string; title: string } | null>(null);

  // Member management states
  const [newMemberName, setNewMemberName] = useState('');
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editNameInput, setEditNameInput] = useState('');
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [memberErrorMessage, setMemberErrorMessage] = useState('');

  if (!activeTeam) {
    return (
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
        <h2>No team selected.</h2>
        <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => onNavigate('home')}>
          Go to Home
        </button>
      </div>
    );
  }

  // Default to first member if none selected
  const currentMember = selectedMember || activeTeam.members[0] || '';
  const memberSchedules = schedules[currentMember] || [];

  const handleAddSchedule = (member: string) => {
    setSelectedMemberForEvent(member);
    onNavigate('register-schedule');
  };

  const handleDeleteConfirm = () => {
    deleteTeam(activeTeam.id);
    setShowDeleteConfirm(false);
    onNavigate('home');
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) {
      setMemberErrorMessage('Member name is required.');
      return;
    }
    const res = addMember(activeTeam.id, newMemberName.trim());
    if (res.success) {
      setNewMemberName('');
      setMemberErrorMessage('');
    } else {
      setMemberErrorMessage(res.error || 'Failed to add member.');
    }
  };

  const handleSaveEdit = (oldName: string) => {
    if (!editNameInput.trim()) {
      setMemberErrorMessage('Member name is required.');
      return;
    }
    const res = editMember(activeTeam.id, oldName, editNameInput.trim());
    if (res.success) {
      setEditingMember(null);
      setEditNameInput('');
      setMemberErrorMessage('');
      if (selectedMember === oldName) {
        setSelectedMember(editNameInput.trim());
      }
    } else {
      setMemberErrorMessage(res.error || 'Failed to update member name.');
    }
  };

  const handleConfirmDeleteMember = () => {
    if (memberToDelete) {
      deleteMember(activeTeam.id, memberToDelete);
      if (selectedMember === memberToDelete) {
        setSelectedMember('');
      }
      setMemberToDelete(null);
      setMemberErrorMessage('');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Overview Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Team Details */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'hsl(var(--secondary))', fontWeight: 600, letterSpacing: '0.05em' }}>
              TEAM INFO
            </span>
            <h2 style={{ fontSize: '1.8rem', marginTop: '0.25rem' }}>{activeTeam.name}</h2>
            <code style={{ background: 'hsl(var(--bg-dark))', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem', color: 'hsl(var(--text-secondary))' }}>
              Code: {activeTeam.code}
            </code>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('home')}>
              &larr; Switch Team
            </button>
            <button 
              className="btn btn-danger btn-sm" 
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Team
            </button>
            <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => onNavigate('recommendations')}>
              Generate Recommendations
            </button>
          </div>
        </div>

        {/* Team Meetings List */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'hsl(var(--primary))', fontWeight: 600, letterSpacing: '0.05em' }}>
            SCHEDULED MEETINGS
          </span>
          {activeTeam.meetings.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--text-muted))', border: '1px dashed hsl(var(--border-glass))', borderRadius: '8px', padding: '1rem' }}>
              No meetings scheduled yet. Generate recommendations to add one!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto' }}>
              {activeTeam.meetings.map((meeting) => (
                <div key={meeting.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'hsl(var(--bg-dark))', borderRadius: '8px', border: '1px solid hsl(var(--border-glass))' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem' }}>{meeting.title}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
                      {meeting.date} at {meeting.startTime} - {meeting.endTime}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px',
                      fontWeight: 600,
                      background: meeting.isOnline ? 'hsl(var(--secondary-glow))' : 'hsl(var(--primary-glow))',
                      color: meeting.isOnline ? 'hsl(var(--secondary))' : 'hsl(var(--primary))',
                    }}>
                      {meeting.isOnline ? 'Online' : meeting.location}
                    </span>
                    <button 
                      className="btn btn-danger btn-sm"
                      style={{ padding: '0.25rem 0.5rem' }}
                      onClick={() => setMeetingToDelete({ id: meeting.id, title: meeting.title })}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Roster & Calendar Section */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border-glass))', paddingBottom: '0.5rem' }}>
          Member Schedules
        </h3>

        <div style={{ display: 'flex', gap: '2rem' }}>
          {/* Member Roster Tabs */}
          <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontWeight: 600, paddingLeft: '0.5rem' }}>
              SELECT MEMBER TO VIEW
            </span>
            {activeTeam.members.map((member) => (
              <button
                key={member}
                className={`btn btn-secondary`}
                style={{ 
                  justifyContent: 'space-between',
                  background: currentMember === member ? 'hsl(var(--primary-glow))' : 'transparent',
                  borderColor: currentMember === member ? 'hsl(var(--primary))' : 'hsl(var(--border-glass))',
                  color: currentMember === member ? 'hsl(var(--primary))' : 'hsl(var(--text-secondary))',
                }}
                onClick={() => setSelectedMember(member)}
              >
                <span>{member}</span>
                <span style={{ 
                  fontSize: '0.75rem', 
                  background: 'hsl(var(--bg-dark))', 
                  padding: '0.1rem 0.4rem', 
                  borderRadius: '10px',
                  color: 'hsl(var(--text-muted))'
                }}>
                  {(schedules[member] || []).length} events
                </span>
              </button>
            ))}
          </div>

          {/* Member Schedule Detail */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: '1.2rem' }}>{currentMember}'s Calendar</h4>
                <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
                  Register classes, jobs, or activities to calculate realistic availability.
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => handleAddSchedule(currentMember)}>
                + Add Busy Event
              </button>
            </div>

            {memberSchedules.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', border: '1px dashed hsl(var(--border-glass))', borderRadius: '12px', color: 'hsl(var(--text-muted))' }}>
                No events registered. This member is fully available!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {memberSchedules.map((event) => (
                  <div 
                    key={event.id}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '1.25rem', 
                      background: 'hsl(var(--bg-dark) / 0.5)', 
                      borderRadius: '12px',
                      border: '1px solid hsl(var(--border-glass))',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <h5 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{event.title}</h5>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          background: 'hsl(var(--bg-dark))', 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '4px',
                          color: 'hsl(var(--secondary))',
                          border: '1px solid hsl(var(--border-glass))'
                        }}>
                          {event.date}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.85rem', color: 'hsl(var(--text-secondary))' }}>
                        <span>
                          Time: <strong>{event.startTime} - {event.endTime}</strong>
                        </span>
                        <span>
                          Location: <strong>{event.location}</strong>
                        </span>
                        <span>
                          Buffer: <strong>{event.bufferTime} min</strong>
                        </span>
                      </div>
                    </div>

                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => deleteScheduleEvent(event.id, currentMember)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Member Management Section */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border-glass))', paddingBottom: '0.5rem' }}>
          Manage Team Members
        </h3>

        {activeTeam.members.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>
            No members in this team. Add one below!
          </div>
        ) : (
          <div className="table-container" style={{ marginBottom: '1.5rem' }}>
            <table className="clean-table">
              <thead>
                <tr>
                  <th>Member Name</th>
                  <th>Registered Events</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeTeam.members.map((member) => (
                  <tr key={member}>
                    <td>
                      {editingMember === member ? (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <input 
                            type="text" 
                            className="form-input" 
                            value={editNameInput} 
                            onChange={(e) => setEditNameInput(e.target.value)}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                          />
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => handleSaveEdit(member)}
                          >
                            Save
                          </button>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => setEditingMember(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <strong>{member}</strong>
                      )}
                    </td>
                    <td>
                      <span className="status-badge empty" style={{ border: 'none' }}>
                        {(schedules[member] || []).length} events
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setEditingMember(member);
                            setEditNameInput(member);
                          }}
                          disabled={editingMember !== null}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => setMemberToDelete(member)}
                          disabled={editingMember !== null}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add New Member Input form */}
        <form onSubmit={handleAddMember} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', maxWidth: '480px' }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Add New Team Member</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. John Doe"
              value={newMemberName} 
              onChange={(e) => setNewMemberName(e.target.value)}
              style={{ height: '38px' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ height: '38px' }}>
            Add Member
          </button>
        </form>

        {memberErrorMessage && (
          <div style={{ color: 'hsl(var(--error))', fontSize: '0.85rem', marginTop: '0.5rem', fontWeight: 500 }}>
            ⚠️ {memberErrorMessage}
          </div>
        )}
      </div>

      {/* Delete Member Confirmation Modal */}
      {memberToDelete && (
        <div className="modal-overlay" onClick={() => setMemberToDelete(null)}>
          <div className="glass-card modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'hsl(var(--error))' }}>Remove Member?</h2>
            <p style={{ marginBottom: '1.5rem', color: 'hsl(var(--text-secondary))' }}>
              Are you sure you want to remove <strong>{memberToDelete}</strong> from the team? All of their registered schedules and events will be deleted.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setMemberToDelete(null)}>
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleConfirmDeleteMember}
              >
                Remove Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="glass-card modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'hsl(var(--error))' }}>Delete Team?</h2>
            <p style={{ marginBottom: '1.5rem', color: 'hsl(var(--text-secondary))' }}>
              Are you sure you want to delete <strong>{activeTeam.name}</strong>? All registered meetings, roster lists, and schedules will be permanently removed.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleDeleteConfirm}
              >
                Delete Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Meeting Confirmation Modal */}
      {meetingToDelete && (
        <div className="modal-overlay" onClick={() => setMeetingToDelete(null)}>
          <div className="glass-card modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'hsl(var(--error))' }}>Delete Meeting?</h2>
            <p style={{ marginBottom: '1.5rem', color: 'hsl(var(--text-secondary))' }}>
              Are you sure you want to delete <strong>{meetingToDelete.title}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setMeetingToDelete(null)}>
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={() => {
                  deleteMeeting(activeTeam.id, meetingToDelete.id);
                  setMeetingToDelete(null);
                }}
              >
                Delete Meeting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
