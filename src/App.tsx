import { useState } from 'react';
import { ResizablePanelGroup, ResizableHandle, ResizablePanel } from '@/components/ui/resizable';
import Sidebar from './components/Sidebar';
import CPNCanvas from './components/CPNCanvas';
import { ReactFlowProvider } from '@xyflow/react';
import { DnDProvider } from './utils/DnDContext';
import { AISidebar } from './components/AISidebar';
import { SimulationProvider } from '@/context/SimulationContext';

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const onToggleAIAssistant = () => {
    // toggle the sidebar open state
    setIsSidebarOpen((prev) => !prev);
  }

  return (
    <SimulationProvider>
      <div className="h-screen">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel */}
          <Sidebar />
          <ResizableHandle />

          {/* Center Panel */}
          <ResizablePanel>
            <ReactFlowProvider>
              <DnDProvider>
                <CPNCanvas onToggleAIAssistant={onToggleAIAssistant}/>
              </DnDProvider>
            </ReactFlowProvider>
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
