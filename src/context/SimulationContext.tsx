import { ReactNode } from 'react';
import { useSimulationController } from '@/hooks/useSimulationController';
import { SimulationContext } from './useSimulationContextHook'; // Import context from the new file

// Create the provider component
type SimulationProviderProps = {
  children: ReactNode;
};

export function SimulationProvider({ children }: SimulationProviderProps) {
  const simulationController = useSimulationController(); // Call the hook once here

  return (
    <SimulationContext.Provider value={simulationController}>
      {children}
    </SimulationContext.Provider>
  );
}
