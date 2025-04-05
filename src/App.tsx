import { ResizablePanelGroup, ResizableHandle, ResizablePanel } from '@/components/ui/resizable';
import Sidebar from './components/Sidebar';
import CPNCanvas from './components/CPNCanvas';
import { ReactFlowProvider } from '@xyflow/react';
import { DnDProvider } from './utils/DnDContext';

export default function App() {
  return (
    <div className="h-screen">
      <ResizablePanelGroup direction="horizontal">
        {/* Left Panel */}
        <Sidebar />

        <ResizableHandle />

        {/* Center Panel */}
        <ResizablePanel>
          <ReactFlowProvider>
            <DnDProvider>
              <CPNCanvas />
            </DnDProvider>
          </ReactFlowProvider>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
