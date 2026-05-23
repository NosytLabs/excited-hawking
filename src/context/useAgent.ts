import { useContext } from 'react';
import { AgentContext } from './AgentContext';
import type { AgentState } from './AgentContext';

export const useAgent = (): AgentState => {
  const context = useContext(AgentContext);
  if (!context) throw new Error('useAgent must be used within AgentProvider');
  return context;
};