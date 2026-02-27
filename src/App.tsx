import { useState } from 'react';
import { ResizablePanelGroup, ResizableHandle, ResizablePanel } from '@/components/ui/resizable';
import Sidebar from './components/Sidebar';
import CPNCanvas from './components/CPNCanvas';
import { ReactFlowProvider } from '@xyflow/react';
import { DnDProvider } from './utils/DnDContext';
import { AISidebar } from './components/AISidebar';
import { SimulationProvider } from '@/context/SimulationContext';
import { ObjectEvolutionPanel } from './components/ObjectEvolutionPanel';

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const simulationTimeRange: [number, number] = [0, 100];

  const onToggleAIAssistant = () => {
    // toggle the sidebar open state
    setIsSidebarOpen((prev) => !prev);
  }

  return (
    <SimulationProvider>
      <div className="h-screen">
        <ResizablePanelGroup orientation="horizontal">
          {/* Left Panel */}
          <Sidebar />
          <ResizableHandle />

          {/* Center Panel */}
          <ResizablePanel>
            <ResizablePanelGroup orientation="vertical">
              <ResizablePanel className="flex flex-col">
                <ReactFlowProvider>
                  <DnDProvider>
                    <CPNCanvas onToggleAIAssistant={onToggleAIAssistant} />
                  </DnDProvider>
                </ReactFlowProvider>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize="0%" collapsedSize="0%" collapsible minSize="10%">
                <ObjectEvolutionPanel simulationTimeRange={simulationTimeRange}/>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          {isSidebarOpen && (
            <>
              {/* <ResizableHandle /> */}
              <AISidebar />
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </SimulationProvider>
  );
}
