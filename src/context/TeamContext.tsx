import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ScheduleEvent, Meeting } from '../utils/scheduler';

export interface Team {
  id: string;
  name: string;
  code: string;
  members: string[];
  meetings: Meeting[];
}

interface TeamContextType {
  teams: Team[];
  schedules: Record<string, ScheduleEvent[]>; // key: memberName
  activeTeamId: string | null;
  activeTeam: Team | null;
  createTeam: (name: string, members: string[]) => string;
  joinTeam: (code: string, memberName: string) => { success: boolean; error?: string };
  deleteTeam: (id: string) => void;
  addScheduleEvent: (event: Omit<ScheduleEvent, 'id'>) => void;
  deleteScheduleEvent: (id: string, memberName: string) => void;
  addMeeting: (teamId: string, meeting: Omit<Meeting, 'id'>) => void;
  deleteMeeting: (teamId: string, meetingId: string) => void;
  setActiveTeamId: (id: string | null) => void;
  addMember: (teamId: string, memberName: string) => { success: boolean; error?: string };
  editMember: (teamId: string, oldName: string, newName: string) => { success: boolean; error?: string };
  deleteMember: (teamId: string, memberName: string) => void;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

// Initial Mock Data
const INITIAL_TEAMS: Team[] = [
  {
    id: 'team-1',
    name: 'CS 401 Capstone Group',
    code: 'CS401-GRP',
    members: ['Alice Park', 'Bob Kim', 'Charlie Lee', 'David Cho'],
    meetings: [
      {
        id: 'meet-1',
        title: 'Project Kickoff',
        date: '2026-06-12',
        startTime: '09:00',
        endTime: '10:00',
        isOnline: true,
      },
    ],
  },
  {
    id: 'team-2',
    name: 'Marketing Project Team',
    code: 'MKT-TEAM',
    members: ['Sophia Smith', 'Emma Johnson', 'Lucas Brown'],
    meetings: [],
  },
];

// Mock schedules for a specific date: '2026-06-12' (June 12th, 2026)
const INITIAL_SCHEDULES: Record<string, ScheduleEvent[]> = {
  'Alice Park': [
    {
      id: 'event-1',
      memberName: 'Alice Park',
      title: 'Database Systems Class',
      date: '2026-06-12',
      startTime: '10:00',
      endTime: '11:30',
      location: 'K Hall',
      bufferTime: 10,
    },
    {
      id: 'event-2',
      memberName: 'Alice Park',
      title: 'Software Engineering Class',
      date: '2026-06-12',
      startTime: '13:00',
      endTime: '14:30',
      location: 'X Hall',
      bufferTime: 10,
    },
  ],
  'Bob Kim': [
    {
      id: 'event-3',
      memberName: 'Bob Kim',
      title: 'Machine Learning Lab',
      date: '2026-06-12',
      startTime: '11:00',
      endTime: '12:30',
      location: 'GA Hall',
      bufferTime: 15,
    },
    {
      id: 'event-4',
      memberName: 'Bob Kim',
      title: 'Part-time Café Job',
      date: '2026-06-12',
      startTime: '16:00',
      endTime: '19:00',
      location: 'Sinchon Station',
      bufferTime: 10,
    },
  ],
  'Charlie Lee': [
    {
      id: 'event-5',
      memberName: 'Charlie Lee',
      title: 'Student Club Meeting',
      date: '2026-06-12',
      startTime: '12:00',
      endTime: '13:30',
      location: 'J Hall',
      bufferTime: 5,
    },
  ],
  'David Cho': [
    {
      id: 'event-6',
      memberName: 'David Cho',
      title: 'Computer Networks Class',
      date: '2026-06-12',
      startTime: '14:00',
      endTime: '15:30',
      location: 'DASAN Hall',
      bufferTime: 10,
    },
  ],
  'Sophia Smith': [
    {
      id: 'event-7',
      memberName: 'Sophia Smith',
      title: 'Intro to Economics',
      date: '2026-06-12',
      startTime: '09:30',
      endTime: '11:00',
      location: 'X Hall',
      bufferTime: 10,
    },
  ],
  'Emma Johnson': [],
  'Lucas Brown': [
    {
      id: 'event-8',
      memberName: 'Lucas Brown',
      title: 'Math Seminar',
      date: '2026-06-12',
      startTime: '11:30',
      endTime: '13:00',
      location: 'GA Hall',
      bufferTime: 10,
    },
  ],
};

export const TeamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [teams, setTeams] = useState<Team[]>(() => {
    const saved = localStorage.getItem('teamroute_teams');
    return saved ? JSON.parse(saved) : INITIAL_TEAMS;
  });

  const [schedules, setSchedules] = useState<Record<string, ScheduleEvent[]>>(() => {
    const saved = localStorage.getItem('teamroute_schedules');
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULES;
  });

  const [activeTeamId, setActiveTeamId] = useState<string | null>(() => {
    return localStorage.getItem('teamroute_active_team_id');
  });

  useEffect(() => {
    localStorage.setItem('teamroute_teams', JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
    localStorage.setItem('teamroute_schedules', JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    if (activeTeamId) {
      localStorage.setItem('teamroute_active_team_id', activeTeamId);
    } else {
      localStorage.removeItem('teamroute_active_team_id');
    }
  }, [activeTeamId]);

  const activeTeam = teams.find((t) => t.id === activeTeamId) || null;

  const createTeam = (name: string, members: string[]): string => {
    const newId = `team-${Date.now()}`;
    const newCode = `${name.replace(/\s+/g, '-').toUpperCase().slice(0, 8)}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;
    const newTeam: Team = {
      id: newId,
      name,
      code: newCode,
      members,
      meetings: [],
    };
    
    setTeams((prev) => [...prev, newTeam]);
    
    // Initialize schedule lists for new members
    setSchedules((prev) => {
      const updated = { ...prev };
      members.forEach((m) => {
        if (!updated[m]) {
          updated[m] = [];
        }
      });
      return updated;
    });

    return newId;
  };

  const joinTeam = (code: string, memberName: string): { success: boolean; error?: string } => {
    const teamToJoin = teams.find((t) => t.code.toUpperCase() === code.trim().toUpperCase());
    if (!teamToJoin) {
      return { success: false, error: 'Invalid team code.' };
    }
    const nameTrimmed = memberName.trim();
    if (!nameTrimmed) {
      return { success: false, error: 'Member name is required.' };
    }
    if (teamToJoin.members.some(m => m.toLowerCase() === nameTrimmed.toLowerCase())) {
      return { success: false, error: 'A member with this name is already in the team.' };
    }

    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamToJoin.id) {
          return {
            ...t,
            members: [...t.members, nameTrimmed],
          };
        }
        return t;
      })
    );

    setSchedules((prev) => {
      if (prev[nameTrimmed]) return prev;
      return {
        ...prev,
        [nameTrimmed]: [],
      };
    });

    setActiveTeamId(teamToJoin.id);
    return { success: true };
  };

  const deleteTeam = (id: string) => {
    setTeams((prev) => prev.filter((t) => t.id !== id));
    if (activeTeamId === id) {
      setActiveTeamId(null);
    }
  };

  const addMember = (teamId: string, memberName: string): { success: boolean; error?: string } => {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return { success: false, error: 'Team not found.' };

    const nameTrimmed = memberName.trim();
    if (!nameTrimmed) return { success: false, error: 'Member name is required.' };

    if (team.members.some(m => m.toLowerCase() === nameTrimmed.toLowerCase())) {
      return { success: false, error: 'A member with this name is already in the team.' };
    }

    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          return {
            ...t,
            members: [...t.members, nameTrimmed],
          };
        }
        return t;
      })
    );

    setSchedules((prev) => {
      if (prev[nameTrimmed]) return prev;
      return {
        ...prev,
        [nameTrimmed]: [],
      };
    });

    return { success: true };
  };

  const editMember = (teamId: string, oldName: string, newName: string): { success: boolean; error?: string } => {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return { success: false, error: 'Team not found.' };

    const newNameTrimmed = newName.trim();
    if (!newNameTrimmed) return { success: false, error: 'Member name is required.' };

    if (
      oldName.toLowerCase() !== newNameTrimmed.toLowerCase() &&
      team.members.some(m => m.toLowerCase() === newNameTrimmed.toLowerCase())
    ) {
      return { success: false, error: 'A member with this name already exists in the team.' };
    }

    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          return {
            ...t,
            members: t.members.map(m => m === oldName ? newNameTrimmed : m),
          };
        }
        return t;
      })
    );

    setSchedules((prev) => {
      const updated = { ...prev };
      const events = updated[oldName] || [];
      const updatedEvents = events.map(e => ({
        ...e,
        memberName: newNameTrimmed
      }));
      delete updated[oldName];
      updated[newNameTrimmed] = updatedEvents;
      return updated;
    });

    return { success: true };
  };

  const deleteMember = (teamId: string, memberName: string) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          return {
            ...t,
            members: t.members.filter(m => m !== memberName),
          };
        }
        return t;
      })
    );

    setSchedules((prev) => {
      const updated = { ...prev };
      delete updated[memberName];
      return updated;
    });
  };

  const addScheduleEvent = (event: Omit<ScheduleEvent, 'id'>) => {
    const newEvent: ScheduleEvent = {
      ...event,
      id: `event-${Date.now()}`,
    };
    
    setSchedules((prev) => {
      const memberEvents = prev[event.memberName] || [];
      const updated = {
        ...prev,
        [event.memberName]: [...memberEvents, newEvent],
      };
      return updated;
    });
  };

  const deleteScheduleEvent = (id: string, memberName: string) => {
    setSchedules((prev) => {
      const memberEvents = prev[memberName] || [];
      return {
        ...prev,
        [memberName]: memberEvents.filter((e) => e.id !== id),
      };
    });
  };

  const addMeeting = (teamId: string, meeting: Omit<Meeting, 'id'>) => {
    const newMeeting: Meeting = {
      ...meeting,
      id: `meet-${Date.now()}`,
    };

    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          return {
            ...t,
            meetings: [...t.meetings, newMeeting],
          };
        }
        return t;
      })
    );
  };

  const deleteMeeting = (teamId: string, meetingId: string) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          return {
            ...t,
            meetings: t.meetings.filter((m) => m.id !== meetingId),
          };
        }
        return t;
      })
    );
  };

  return (
    <TeamContext.Provider
      value={{
        teams,
        schedules,
        activeTeamId,
        activeTeam,
        createTeam,
        joinTeam,
        deleteTeam,
        addScheduleEvent,
        deleteScheduleEvent,
        addMeeting,
        deleteMeeting,
        setActiveTeamId,
        addMember,
        editMember,
        deleteMember,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
};

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
};
