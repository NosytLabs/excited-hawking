import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { LogItem } from '../context/agent-types';

interface LogsState {
  logs: LogItem[];
  addLog: (log: LogItem) => void;
}

export const useLogsStore = create<LogsState>((set) => ({
  logs: [],
  addLog: (log) => set((state) => ({ logs: [...state.logs.slice(-99), log] })),
}));

export const useLogs = () => useLogsStore(useShallow(state => ({ logs: state.logs })));
