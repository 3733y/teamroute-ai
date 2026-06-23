import React, { useState } from 'react';
import { useTeam } from '../context/TeamContext';

interface SavedMeetingsPageProps {
  onNavigate: (page: string) => void;
}

export const SavedMeetingsPage: React.FC<SavedMeetingsPageProps> = () => {
  const { teams, deleteMeeting } = useTeam();
  const [meetingToDelete, setMeetingToDelete] = useState<{ id: string; title: string; teamId: string } | null>(null);

  const allMeetings = teams.flatMap(t => 
    (t.meetings || []).map(m => ({ ...m, teamName: t.name, teamId: t.id }))
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem' }}>Saved Meetings</h2>
        <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Overview of scheduled synchronization sessions for your university teams.
        </p>
      </div>

      <div className="table-container">
        {allMeetings.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>
            No meetings saved yet. Select a team and generate recommendations to schedule one!
          </div>
        ) : (
          <table className="clean-table">
            <thead>
              <tr>
                <th>Team</th>
                <th>Meeting Title</th>
                <th>Date</th>
                <th>Time Slot</th>
                <th>Format / Location</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allMeetings.map((meet) => (
                <tr key={meet.id}>
                  <td>
                    <strong>{meet.teamName}</strong>
                  </td>
                  <td>{meet.title}</td>
                  <td>
                    <span style={{ 
                      fontSize: '0.8rem', 
                      background: '#f1f5f9', 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px',
                      color: 'hsl(var(--secondary))',
                      border: '1px solid #cbd5e1',
                      fontWeight: 600
                    }}>
                      {meet.date}
                    </span>
                  </td>
                  <td>
                    <strong>{meet.startTime} - {meet.endTime}</strong>
                  </td>
                  <td>
                    <span className={`status-badge ${meet.isOnline ? 'ready' : 'incomplete'}`} style={{ border: 'none' }}>
                      {meet.isOnline ? 'Online' : meet.location}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn btn-danger btn-sm"
                      style={{ padding: '0.25rem 0.5rem' }}
                      onClick={() => setMeetingToDelete({ id: meet.id, title: meet.title, teamId: meet.teamId })}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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
                  deleteMeeting(meetingToDelete.teamId, meetingToDelete.id);
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
