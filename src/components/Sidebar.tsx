import useStore from '@/stores/store';
import { ResizablePanel } from '@/components/ui/resizable';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import PlaceProperties from './PlaceProperties';
import TransitionProperties from './TransitionProperties';
import AuxTextProperties from './AuxTextProperties';
import ArcProperties from './ArcProperties';
import { SimulationPanel } from '@/components/SimulationPanel';

import { DeclarationManager } from '@/components/DeclarationManager';
import { TabsContent } from '@radix-ui/react-tabs';

const Sidebar = () => {
  // Access selectedElement from the store
  const selectedElement = useStore((state) => {
    const activePetriNet = state.activePetriNetId ? state.petriNetsById[state.activePetriNetId] : null;
    return activePetriNet?.selectedElement;
  });

  const colorSets = useStore((state) => state.colorSets);
  const priorities = useStore((state) => state.priorities);

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
    <ResizablePanel defaultSize={20} className="min-w-[400px]">
      <ScrollArea className="h-full">
        <div className="px-4 py-2">
          <h3 className="text-lg font-medium">OCPN Tools</h3>
        </div>
        <div className="px-4 py-2">
          <Tabs defaultValue="model">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="model">Model</TabsTrigger>
              <TabsTrigger value="simulation">Simulation</TabsTrigger>
              {/* <TabsTrigger value="analysis">Analysis</TabsTrigger> */}
            </TabsList>
            <TabsContent value="model" className="space-y-4 mt-2">

              <div className="space-y-4">
                <div className="space-y-2">
                  <Card>
                    <CardHeader className="px-4 pb-2">
                      <CardTitle className="text-md">
                        {selectedElement
                          ? selectedElement.type === 'node'
                            ? selectedElement.element.type === 'place'
                              ? 'Place Properties'
                              : 'Transition Properties'
                            : 'Arc Properties'
                          : 'Element Properties'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      {renderElementProperties()}

                      {/* {selectedElement && (
                    <div className="flex justify-between mt-4">
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                      <Button size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        Apply
                      </Button>
                    </div>
                  )} */}
                    </CardContent>
                  </Card>
                </div>

                <Separator orientation="horizontal" className="mt-2" />

                <div className="p-4">
                  <DeclarationManager />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="simulation" className="space-y-4 mt-2">
              <SimulationPanel />
            </TabsContent>
          </Tabs>


        </div>
      </ScrollArea>
    </ResizablePanel>
  );
};

export default Sidebar;
