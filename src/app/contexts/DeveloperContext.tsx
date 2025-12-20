'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

// Developer team definitions with port ranges
export interface DeveloperTeam {
  id: 'dev1' | 'dev2' | 'dev3';
  label: string;
  basePort: number;  // Base port for Claude terminal (5410, 5420, 5430)
  portRange: string; // Display range (5410-5416, 5420-5426, 5430-5436)
}

export const DEVELOPER_TEAMS: DeveloperTeam[] = [
  { id: 'dev1', label: 'Dev 1', basePort: 5410, portRange: '5410-5416' },
  { id: 'dev2', label: 'Dev 2', basePort: 5420, portRange: '5420-5426' },
  { id: 'dev3', label: 'Dev 3', basePort: 5430, portRange: '5430-5436' },
];

interface DeveloperContextValue {
  selectedTeam: DeveloperTeam;
  setSelectedTeam: (team: DeveloperTeam) => void;
  selectTeamById: (id: string) => void;
}

const DeveloperContext = createContext<DeveloperContextValue>({
  selectedTeam: DEVELOPER_TEAMS[0],
  setSelectedTeam: () => {},
  selectTeamById: () => {},
});

export function DeveloperProvider({ children }: { children: ReactNode }) {
  const [selectedTeam, setSelectedTeam] = useState<DeveloperTeam>(DEVELOPER_TEAMS[0]);

  const selectTeamById = (id: string) => {
    const team = DEVELOPER_TEAMS.find(t => t.id === id);
    if (team) {
      setSelectedTeam(team);
    }
  };

  return (
    <DeveloperContext.Provider value={{ selectedTeam, setSelectedTeam, selectTeamById }}>
      {children}
    </DeveloperContext.Provider>
  );
}

export function useDeveloper() {
  const context = useContext(DeveloperContext);
  if (!context) {
    throw new Error('useDeveloper must be used within a DeveloperProvider');
  }
  return context;
}
