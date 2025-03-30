import React, { useState } from 'react';
import { ResizablePanelGroup, ResizableHandle, ResizablePanel } from '@/components/ui/resizable';
import Sidebar from './components/Sidebar';
import CPNCanvas from './components/CPNCanvas';
import { ReactFlowProvider } from '@xyflow/react';
import { DnDProvider } from './utils/DnDContext';

import type { ColorSet, Variable, Priority } from '@/components/DeclarationManager';

import { v4 as uuidv4 } from 'uuid';

export default function App() {
  // Declaration states
  const [colorSets, setColorSets] = useState<ColorSet[]>([
    { id: uuidv4(), name: "INT", type: "basic", definition: "colset INT = int;", color: "#3b82f6" },
    { id: uuidv4(), name: "BOOL", type: "basic", definition: "colset BOOL = bool;", color: "#10b981" },
    { id: uuidv4(), name: "STRING", type: "basic", definition: "colset STRING = string;", color: "#f59e0b" },
  ])
  const [variables, setVariables] = useState<Variable[]>([
    { id: uuidv4(), name: "n", colorSet: "INT" },
    { id: uuidv4(), name: "b", colorSet: "BOOL" },
  ])
  const [priorities, setPriorities] = useState<Priority[]>([
    { id: uuidv4(), name: "P_HIGH", level: 100 },
    { id: uuidv4(), name: "P_NORMAL", level: 50 },
    { id: uuidv4(), name: "P_LOW", level: 10 },
  ])

  return (
    <div className="h-screen">
      <ResizablePanelGroup direction="horizontal">
        {/* Left Panel */}
        <Sidebar
          colorSets={colorSets}
          variables={variables}
          priorities={priorities}
          onAddColorSet={() => {}}
          onAddVariable={() => {}}
          onAddPriority={() => {}}
          onDeleteColorSet={() => {}}
          onDeleteVariable={() => {}}
          onDeletePriority={() => {}}
          onReorderColorSets={() => {}}
          onReorderVariables={() => {}}
          onReorderPriorities={() => {}} />

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
