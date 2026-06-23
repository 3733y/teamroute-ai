import React, { useState } from 'react';
import { useTeam } from '../context/TeamContext';
import { CAMPUS_LOCATIONS } from '../utils/scheduler';

interface RegisterSchedulePageProps {
  onNavigate: (page: string) => void;
  selectedMember: string;
}

export const RegisterSchedulePage: React.FC<RegisterSchedulePageProps> = ({
  onNavigate,
  selectedMember,
}) => {
  const { addScheduleEvent, activeTeam, schedules } = useTeam();
  
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('2026-06-12'); // default to mock date
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('13:30');
  const [location, setLocation] = useState('K Hall'); // default to K Hall (new location list)
  const [customLocation, setCustomLocation] = useState('');
  const [bufferTime, setBufferTime] = useState(10);
  const [memberName, setMemberName] = useState(selectedMember || (activeTeam ? activeTeam.members[0] : ''));

  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setErrorMessage('Event title is required.');
      return;
    }
    
    if (!date) {
      setErrorMessage('Date is required.');
      return;
    }

    if (!startTime || !endTime) {
      setErrorMessage('Start and end times are required.');
      return;
    }

    const startMins = startTime.split(':').map(Number);
    const endMins = endTime.split(':').map(Number);
    
    if (endMins[0] * 60 + endMins[1] <= startMins[0] * 60 + startMins[1]) {
      setErrorMessage('End time must be after start time.');
      return;
    }

    const finalLocation = location === 'Custom' ? customLocation.trim() || 'Off-Campus Location' : location;

    addScheduleEvent({
      memberName,
      title: title.trim(),
      date,
      startTime,
      endTime,
      location: finalLocation,
      bufferTime,
    });

    setErrorMessage('');
    onNavigate('dashboard');
  };

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

  const membersWithoutSchedules = activeTeam.members.filter(
    (m) => !schedules[m] || schedules[m].length === 0
  );

  return (
    <div className="animate-fade-in" style={{ maxWidth: '650px', margin: '0 auto' }}>
      <div className="glass-card" style={{ padding: '2.5rem' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>Register Busy Event</h2>
        <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Add commitments to block time slots and define buffer transition times.
        </p>

        {membersWithoutSchedules.length > 0 && (
          <div style={{ 
            padding: '0.75rem 1rem', 
            background: 'hsl(var(--warning) / 0.1)', 
            border: '1px solid hsl(var(--warning) / 0.3)', 
            borderRadius: '6px', 
            color: 'hsl(var(--warning))', 
            fontSize: '0.85rem', 
            fontWeight: 500,
            marginBottom: '1.25rem' 
          }}>
            ⚠️ {membersWithoutSchedules.length} member{membersWithoutSchedules.length > 1 ? 's' : ''} still need{membersWithoutSchedules.length === 1 ? 's' : ''} schedule registration: {membersWithoutSchedules.join(', ')}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Team Member</label>
            <select 
              className="form-select"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
            >
              {activeTeam.members.map((member) => (
                <option key={member} value={member}>
                  {member}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Event / Activity Title</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. AI Systems Lecture, Part-time Job"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input 
                type="time" 
                className="form-input" 
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Time</label>
              <input 
                type="time" 
                className="form-input" 
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Location</label>
            <select 
              className="form-select"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              {CAMPUS_LOCATIONS.map((loc) => (
                <option key={loc.name} value={loc.name}>
                  {loc.name}
                </option>
              ))}
              <option value="Custom">Custom / Off-Campus</option>
            </select>
          </div>

          {location === 'Custom' && (
            <div className="form-group animate-fade-in">
              <label className="form-label">Custom Location Name</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Central Plaza Study Lounge"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label className="form-label">Preferred Transition Buffer Time</label>
              <span style={{ fontSize: '0.9rem', color: 'hsl(var(--primary))', fontWeight: 600 }}>
                {bufferTime} minutes
              </span>
            </div>
            <div className="range-slider">
              <input 
                type="range" 
                min="0" 
                max="60" 
                step="5"
                className="range-input" 
                value={bufferTime}
                onChange={(e) => setBufferTime(Number(e.target.value))}
              />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
              Transition buffer time window to rest or prepare before/after this event (applied separately from travel time).
            </span>
          </div>

          {errorMessage && (
            <div style={{ color: 'hsl(var(--error))', fontSize: '0.85rem', fontWeight: 500 }}>
              {errorMessage}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => onNavigate('dashboard')}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
