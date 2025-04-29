import { createContext, useContext } from 'react';
import type { SimulationEvent } from '@/components/EventLog';

// Define the type for the context value based on the hook's return type
// Ensure this matches exactly what useSimulationController returns
export type SimulationContextType = {
  runStep: () => Promise<void>;
  reset: () => Promise<void>;
  events: SimulationEvent[];
  clearEvents: () => void;
  isInitialized: boolean;
  simulationTime: number;
  stepCounter: number;
  ensureInitialized: () => Promise<void>;
  _executeWasmStep: () => void;
};

// Create the context with an initial value of null or a default object
export const SimulationContext = createContext<SimulationContextType | null>(null);

// Custom hook for consuming the context easily
export function useSimulationContext() {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulationContext must be used within a SimulationProvider');
  }
  return context;
}
