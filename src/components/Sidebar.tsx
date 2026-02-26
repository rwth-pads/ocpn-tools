import useStore from '@/stores/store';
import { ResizablePanel } from '@/components/ui/resizable';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import PlaceProperties from './PlaceProperties';
import TransitionProperties from './TransitionProperties';
import AuxTextProperties from './AuxTextProperties';
import ArcProperties from './ArcProperties';
import { DeleteElementButton } from '@/components/DeleteElementButton';
import { SimulationPanel } from '@/components/SimulationPanel';

import { DeclarationManager } from '@/components/DeclarationManager';
import { TabsContent } from '@radix-ui/react-tabs';

import type { ActiveMode } from '@/types';

const Sidebar = () => {
  // Access selectedElement from the store
  const selectedElement = useStore((state) => {
    const activePetriNet = state.activePetriNetId ? state.petriNetsById[state.activePetriNetId] : null;
    return activePetriNet?.selectedElement;
  });

  const colorSets = useStore((state) => state.colorSets);
  const priorities = useStore((state) => state.priorities);
  const activeMode = useStore((state) => state.activeMode);
  const setActiveMode = useStore((state) => state.setActiveMode);

  const renderElementProperties = () => {
    if (!selectedElement) {
      return <div className="p-4 text-center text-muted-foreground">Select an element to edit its properties</div>;
    }

    if (selectedElement.type === 'node') {
      const nodeType = selectedElement.element.type;

      if (nodeType === 'place') {
        return (
          <PlaceProperties
            colorSets={colorSets}
          />
        );
      } else if (nodeType === 'transition') {
        return (
          <TransitionProperties
            priorities={priorities}
          />
        );
      } else if (nodeType === 'auxText') {
        return (
          <AuxTextProperties />
        );
      }
    } else if (selectedElement.type === 'edge') {
      return (
        <ArcProperties />
      );
    }

    return null;
  };

  return (
    <ResizablePanel defaultSize={20} className="min-w-[400px] flex flex-col h-full overflow-hidden">
      <div className="px-4 py-2 flex-shrink-0">
        <h3 className="text-lg font-medium">OCPN Tools</h3>
      </div>
      <div className="px-4 py-2 flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeMode} onValueChange={(v) => setActiveMode(v as ActiveMode)} className="flex flex-col flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
            <TabsTrigger value="model">Model</TabsTrigger>
            <TabsTrigger value="simulation">Simulation</TabsTrigger>
            {/* <TabsTrigger value="analysis">Analysis</TabsTrigger> */}
          </TabsList>
          <TabsContent value="model" className="space-y-4 mt-2 flex-1 overflow-auto">

            <div className="space-y-4">
                <div className="space-y-2">
                  <div className="border border-border rounded-lg p-4 bg-card">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-semibold leading-none tracking-tight">
                        {selectedElement
                          ? selectedElement.type === 'node'
                            ? selectedElement.element.type === 'place'
                              ? 'Place Properties'
                              : selectedElement.element.type === 'auxText'
                                ? 'Text Properties'
                                : 'Transition Properties'
                            : 'Arc Properties'
                          : 'Element Properties'}
                      </span>
                      {selectedElement && (
                        <DeleteElementButton
                          elementType={selectedElement.type === 'node' ? 'node' : 'edge'}
                          elementId={selectedElement.element.id}
                          elementLabel={(selectedElement.element.data as { label?: string })?.label}
                        />
                      )}
                    </div>
                    <div>
                      {renderElementProperties()}
                    </div>
                  </div>
                </div>

                <Separator orientation="horizontal" className="mt-2" />

                <div className="p-4">
                  <DeclarationManager />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="simulation" className="mt-2 flex-1 overflow-hidden">
              <SimulationPanel />
            </TabsContent>
          </Tabs>


        </div>
    </ResizablePanel>
  );
};

export default Sidebar;
