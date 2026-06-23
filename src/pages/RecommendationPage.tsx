import React, { useState, useEffect } from 'react';
import { useTeam } from '../context/TeamContext';
import { generateRecommendations, CAMPUS_LOCATIONS } from '../utils/scheduler';
import type { RecommendationSlot, TransportationMethod } from '../utils/scheduler';

interface RecommendationPageProps {
  onNavigate: (page: string) => void;
}

export const RecommendationPage: React.FC<RecommendationPageProps> = ({ onNavigate }) => {
  const { activeTeam, schedules, addMeeting } = useTeam();

  // Settings state
  const [date, setDate] = useState('2026-06-12'); // Mock date
  const [duration, setDuration] = useState(60); // minutes
  const [isOnline, setIsOnline] = useState(false);
  const [locationMode, setLocationMode] = useState<'Fixed' | 'Suggested'>('Fixed');
  const [meetingLocation, setMeetingLocation] = useState('K Hall');
  const [customLocation, setCustomLocation] = useState('');
  const [transportMethod, setTransportMethod] = useState<TransportationMethod>('Walking');
  
  const [results, setResults] = useState<RecommendationSlot[]>([]);

  const finalLocation = isOnline 
    ? 'Online' 
    : meetingLocation === 'Custom' 
      ? customLocation.trim() || 'Off-Campus Location' 
      : meetingLocation;

  // Run the recommender
  useEffect(() => {
    if (activeTeam) {
      const slots = generateRecommendations(
        activeTeam.members,
        schedules,
        date,
        duration,
        isOnline,
        locationMode,
        finalLocation,
        transportMethod
      );
      
      setResults(slots.slice(0, 10));
    }
  }, [activeTeam, date, duration, isOnline, locationMode, meetingLocation, customLocation, transportMethod]);

  const handleOverrideChange = (slotIndex: number, member: string, newTime: number) => {
    // Recalculate score for just this slot based on the override
    setResults(currentResults => {
      return currentResults.map((slot, idx) => {
        if (idx !== slotIndex) return slot;
        
        // Update memberStatuses
        const updatedStatuses = { ...slot.memberStatuses };
        const currentMemberStatus = { ...updatedStatuses[member] };
        
        const oldTravel = currentMemberStatus.travelTime;
        currentMemberStatus.travelTime = newTime;
        
        // Recalculate overlap for this member based on new travel time
        const originalOverlapNoTravel = currentMemberStatus.status === 'Tight transition' 
          ? Math.max(0, currentMemberStatus.overlapMins - oldTravel)
          : 0;
        
        const newOverlap = originalOverlapNoTravel + newTime;
        currentMemberStatus.overlapMins = newOverlap;
        
        if (currentMemberStatus.status !== 'Busy') {
          if (newOverlap > 0) {
            currentMemberStatus.status = 'Tight transition';
          } else {
            currentMemberStatus.status = 'Available';
          }
        }
        
        updatedStatuses[member] = currentMemberStatus;

        // Recompute the slot score based on all members' updated statuses
        let hasHardConflict = false;
        let hasTightTransition = false;
        let deductions = 0;

        activeTeam!.members.forEach(m => {
          const statusDetail = updatedStatuses[m];
          if (statusDetail.status === 'Busy') {
            hasHardConflict = true;
          } else if (statusDetail.status === 'Tight transition') {
            hasTightTransition = true;
            deductions += Math.min(25, Math.round(statusDetail.overlapMins * 1.5));
          }
        });

        let finalScore = 100;
        if (hasHardConflict) {
          finalScore = 0;
        } else if (hasTightTransition) {
          finalScore = Math.max(30, Math.min(70, 100 - deductions));
        } else {
          finalScore = 100;
        }
        
        // Regenerate explanations for this slot
        const newExplanations: string[] = [];
        if (slot.isOnline) {
          newExplanations.push('Online meeting, travel times are fully ignored.');
        } else {
          if (slot.locationMode === 'Suggested') {
            newExplanations.push(`Suggested location: ${slot.meetingLocation} (with custom travel overrides).`);
          } else {
            newExplanations.push(`Meeting location: ${slot.meetingLocation} (with custom travel overrides).`);
          }
        }
        
        activeTeam!.members.forEach(m => {
          const stat = updatedStatuses[m];
          if (stat.status === 'Busy') {
            newExplanations.push(`${m} is Busy: schedule conflict.`);
          } else if (stat.status === 'Tight transition') {
            newExplanations.push(`${m} has a Tight transition: needs ${stat.travelTime}m travel & ${stat.bufferTime}m buffer.`);
          }
        });
        
        if (finalScore === 0) {
          newExplanations.unshift('Conflict detected! One or more members have overlapping commitments.');
        } else if (finalScore >= 90) {
          newExplanations.unshift('Highly recommended! Adjusted travel times fit well.');
        } else if (finalScore >= 70) {
          newExplanations.unshift('Good option with minor travel adjustments.');
        } else {
          newExplanations.unshift('Tight transition window with these travel adjustments.');
        }

        return {
          ...slot,
          score: finalScore,
          memberStatuses: updatedStatuses,
          explanations: newExplanations
        };
      });
    });
  };

  const handleSaveMeeting = (slot: RecommendationSlot) => {
    if (!activeTeam) return;
    
    addMeeting(activeTeam.id, {
      title: `${activeTeam.name} Meeting`,
      date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isOnline: slot.isOnline,
      location: slot.meetingLocation,
    });
    
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

  const renderStatusBadge = (score: number) => {
    let text = 'Conflict';
    let color = '#dc2626'; // error
    let bg = '#fef2f2';
    
    if (score >= 90) {
      text = 'Best Match';
      color = '#16a34a'; // success
      bg = '#f0fdf4';
    } else if (score >= 70) {
      text = 'Good Option';
      color = '#0284c7'; // info/secondary
      bg = '#f0f9ff';
    } else if (score > 0) {
      text = 'Tight Transition';
      color = '#ea580c'; // warning
      bg = '#fff7ed';
    }
    
    return (
      <span style={{
        padding: '0.2rem 0.6rem',
        borderRadius: '4px',
        fontWeight: 600,
        fontSize: '0.75rem',
        color,
        backgroundColor: bg,
        border: `1px solid ${color}22`,
        display: 'inline-flex',
        alignItems: 'center'
      }}>
        {text}
      </span>
    );
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Settings Header Card */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.8rem' }}>Generate Meeting Recommendations</h2>
            <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>
              Define meeting parameters. TeamRoute AI scans availability, travel coordinate metrics, and buffers.
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('dashboard')}>
            &larr; Back to Dashboard
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', alignItems: 'end' }}>
          <div className="form-group">
            <label className="form-label">Target Date</label>
            <input 
              type="date" 
              className="form-input" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Meeting Duration</label>
            <select 
              className="form-select"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            >
              <option value={30}>30 Minutes</option>
              <option value={60}>1 Hour</option>
              <option value={90}>1.5 Hours</option>
              <option value={120}>2 Hours</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Format</label>
            <select 
              className="form-select"
              value={isOnline ? 'Online' : 'Offline'}
              onChange={(e) => setIsOnline(e.target.value === 'Online')}
            >
              <option value="Offline">Offline (Physical)</option>
              <option value="Online">Online (Zoom/Teams)</option>
            </select>
          </div>

          {!isOnline && (
            <div className="form-group">
              <label className="form-label">Location Mode</label>
              <select 
                className="form-select"
                value={locationMode}
                onChange={(e) => setLocationMode(e.target.value as 'Fixed' | 'Suggested')}
              >
                <option value="Fixed">Fixed Location</option>
                <option value="Suggested">Suggested Location (AI)</option>
              </select>
            </div>
          )}
        </div>

        {!isOnline && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            {locationMode === 'Fixed' && (
              <div className="form-group">
                <label className="form-label">Meeting Location</label>
                <select 
                  className="form-select"
                  value={meetingLocation}
                  onChange={(e) => setMeetingLocation(e.target.value)}
                >
                  {CAMPUS_LOCATIONS.map((loc) => (
                    <option key={loc.name} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                  <option value="Custom">Custom / Off-Campus</option>
                </select>
              </div>
            )}
            
            <div className="form-group">
              <label className="form-label">Scan Transportation Method</label>
              <select 
                className="form-select"
                value={transportMethod}
                onChange={(e) => setTransportMethod(e.target.value as TransportationMethod)}
              >
                <option value="Walking">Walking</option>
                <option value="Biking">Biking</option>
                <option value="Transit">Campus Shuttle / Transit</option>
                <option value="Driving">Driving / Taxi</option>
              </select>
            </div>
          </div>
        )}

        {!isOnline && locationMode === 'Fixed' && meetingLocation === 'Custom' && (
          <div className="form-group animate-fade-in" style={{ marginTop: '1rem', maxWidth: '400px' }}>
            <label className="form-label">Custom Meeting Location</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Science Library Room 4"
              value={customLocation}
              onChange={(e) => setCustomLocation(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Recommendations List */}
      <div>
        <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Recommended Slots ({results.length})</h3>
        
        {results.length === 0 ? (
          <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
            No slots found. Try changing the date or shortening the duration.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {results.map((slot, index) => {
              const hasConflict = Object.values(slot.memberStatuses).some(s => s.status === 'Busy') || slot.score === 0;

              return (
                <div 
                  key={index} 
                  className="glass-card animate-fade-in" 
                  style={{ 
                    padding: '1.5rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '1.25rem',
                    borderLeft: `4px solid ${
                      slot.score >= 90 
                        ? 'hsl(var(--success))' 
                        : slot.score >= 70 
                          ? '#0284c7' 
                          : slot.score > 0 
                            ? 'hsl(var(--warning))' 
                            : 'hsl(var(--error))'
                    }`
                  }}
                >
                  {/* Slot Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {renderStatusBadge(slot.score)}
                      <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', fontWeight: 600 }}>
                        Score: {slot.score}
                      </span>
                      <div style={{ marginLeft: '0.5rem' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{slot.startTime} - {slot.endTime}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginTop: '0.1rem' }}>
                          Proposed Meeting Slot • {date} • {duration} mins • Format: {slot.isOnline ? 'Online' : 'Offline'} • Location: {slot.meetingLocation}
                        </p>
                      </div>
                    </div>
                    
                    <button 
                      className="btn btn-primary btn-sm" 
                      onClick={() => handleSaveMeeting(slot)}
                      disabled={hasConflict}
                      style={hasConflict ? { opacity: 0.5, cursor: 'not-allowed', background: '#cbd5e1', color: '#64748b' } : {}}
                    >
                      {hasConflict ? 'Invalid Slot' : 'Schedule Meeting'}
                    </button>
                  </div>

                  {hasConflict && (
                    <div style={{
                      background: 'hsl(var(--error) / 0.15)',
                      border: '1px solid hsl(var(--error) / 0.3)',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      color: 'hsl(var(--error))',
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                        ⚠️ Invalid Slot - Conflict Detected
                      </div>
                      <div style={{ fontSize: '0.85rem' }}>
                        {activeTeam.members.filter(m => slot.memberStatuses[m]?.status === 'Busy').map(m => (
                          <div key={m}>
                            • <strong>{m}</strong> has a schedule conflict (Overlap: {slot.memberStatuses[m]?.overlapMins} mins)
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Slot Details Body Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
                  {/* Left Column: Explanations & Statuses */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <h5 style={{ fontSize: '0.95rem', color: 'hsl(var(--text-primary))', fontWeight: 600, marginBottom: '0.5rem' }}>
                        Roster Status Details:
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {activeTeam.members.map((member) => {
                          const mStatus = slot.memberStatuses[member] || { status: 'Available', travelTime: 0, bufferTime: 0, overlapMins: 0 };
                          let statusColor = 'hsl(var(--success))';
                          let statusLabel = 'Available';
                          if (mStatus.status === 'Busy') {
                            statusColor = 'hsl(var(--error))';
                            statusLabel = 'Busy';
                          } else if (mStatus.status === 'Tight transition') {
                            statusColor = 'hsl(var(--warning))';
                            statusLabel = 'Tight transition';
                          }

                          return (
                            <div 
                              key={member}
                              style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                padding: '0.5rem 0.75rem', 
                                background: 'hsl(var(--bg-dark) / 0.4)', 
                                border: '1px solid hsl(var(--border-glass))',
                                borderRadius: '8px'
                              }}
                            >
                              <div>
                                <span style={{ fontWeight: 500 }}>{member}</span>
                                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '0.1rem' }}>
                                  {!slot.isOnline && `Travel: ${mStatus.travelTime}m • `}Buffer: {mStatus.bufferTime}m
                                  {mStatus.overlapMins > 0 && ` (Overlap: ${mStatus.overlapMins}m)`}
                                </div>
                              </div>
                              <span style={{ 
                                fontSize: '0.75rem', 
                                padding: '0.2rem 0.5rem', 
                                borderRadius: '4px', 
                                fontWeight: 600, 
                                background: statusColor + '0.15', 
                                color: statusColor,
                                border: `1px solid ${statusColor}`
                              }}>
                                {statusLabel}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <h5 style={{ fontSize: '0.95rem', color: 'hsl(var(--text-primary))', fontWeight: 600, marginBottom: '0.25rem' }}>
                        Recommendation Log:
                      </h5>
                      <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingLeft: '1.25rem', fontSize: '0.85rem' }}>
                        {slot.explanations.map((exp, eIdx) => (
                          <li key={eIdx} style={{ color: exp.includes('conflict') || exp.includes('Tight') || exp.includes('overlap') ? 'hsl(var(--error))' : 'hsl(var(--text-secondary))' }}>
                            {exp}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Right Column: Travel overrides slider widget */}
                  {!slot.isOnline && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderLeft: '1px solid hsl(var(--border-glass))', paddingLeft: '2rem' }}>
                      <h5 style={{ fontSize: '0.95rem', color: 'hsl(var(--text-primary))', fontWeight: 600 }}>
                        Manual Travel Adjustment:
                      </h5>
                      <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginBottom: '0.25rem' }}>
                        Override estimated coordinate travel values to recalculate score.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {activeTeam.members.map((member) => {
                          const mStatus = slot.memberStatuses[member] || { travelTime: 0 };
                          return (
                            <div key={member} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>{member}</span>
                                <span style={{ fontWeight: 600, color: 'hsl(var(--primary))' }}>{mStatus.travelTime}m</span>
                              </div>
                              <input 
                                type="range" 
                                min="0" 
                                max="90" 
                                step="5"
                                className="range-input" 
                                value={mStatus.travelTime}
                                onChange={(e) => handleOverrideChange(index, member, Number(e.target.value))}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
};
