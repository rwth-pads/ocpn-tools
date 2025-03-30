import React from 'react';
import { ResizablePanel } from '@/components/ui/resizable';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

import { Save, Trash2, CircleIcon, SquareIcon, ArrowRightIcon, Settings } from 'lucide-react';
import PlaceProperties from './PlaceProperties';

import { DeclarationManager, type ColorSet, type Variable, type Priority } from '@/components/DeclarationManager';

const Sidebar = ({
  selectedElement,
  colorSets,
  variables,
  priorities,
  onAddColorSet,
  onAddVariable,
  onAddPriority,
  onDeleteColorSet,
  onDeleteVariable,
  onDeletePriority,
  onReorderColorSets,
  onReorderVariables,
  onReorderPriorities,
}) => {

  const updateNodeData = (id: string, newData: any) => {
    // setNodes((nds) =>
    //   nds.map((node) => {
    //     if (node.id === id) {
    //       // Create a completely new node object with the updated data
    //       return {
    //         ...node,
    //         data: newData,
    //       }
    //     }
    //     return node
    //   }),
    // )

    // // Update place colors if color set changed
    // if (newData.colorSet) {
    //   updatePlaceColors()
    // }
  }

  const updateNodeStyle = (id: string, style: { width: number; height: number }) => {
    // setNodes((nds) =>
    //   nds.map((node) => {
    //     if (node.id === id) {
    //       return {
    //         ...node,
    //         style: style,
    //       }
    //     }
    //     return node
    //   }),
    // )
  }

  const renderElementProperties = () => {
    if (!selectedElement) {
      return <div className="p-4 text-center text-muted-foreground">Select an element to view its properties</div>
    }

    if (selectedElement.type === "node") {
      const nodeType = selectedElement.data.type

      if (nodeType === "place") {
        return (
          <PlaceProperties
            selectedElement={selectedElement}
            updateNodeData={updateNodeData}
            colorSets={colorSets} />
        );
      } else if (nodeType === "transition") {
        //return renderTransitionProperties()
      }
    } else if (selectedElement.type === "edge") {
      //return renderArcProperties()
    }

    return null
  }

  return (
    <ResizablePanel defaultSize={20} className="min-w-[400px]">
      <ScrollArea className="h-full">

        <div className="px-4 py-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">OCPN Tools</h3>
              <Card>
                <CardHeader className="px-4 pb-2">
                  <CardTitle className="text-md">
                    {selectedElement
                      ? selectedElement.type === "node"
                        ? selectedElement.data.type === "place"
                          ? "Place Properties"
                          : "Transition Properties"
                        : "Arc Properties"
                      : "Element Properties"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  {renderElementProperties()}

                  {selectedElement && (
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
                  )}
                </CardContent>
              </Card>
            </div>

            <Separator orientation="horizontal" className="mt-2" />

            <div className="p-4">
              {/* Variables Section */}
              <h2 className="font-bold">Variables</h2>

              <DeclarationManager
                colorSets={colorSets}
                variables={variables}
                priorities={priorities}
                onAddColorSet={onAddColorSet}
                onAddVariable={onAddVariable}
                onAddPriority={onAddPriority}
                onDeleteColorSet={onDeleteColorSet}
                onDeleteVariable={onDeleteVariable}
                onDeletePriority={onDeletePriority}
                onReorderColorSets={onReorderColorSets}
                onReorderVariables={onReorderVariables}
                onReorderPriorities={onReorderPriorities}
              />
            </div>
          </div>
        </div>
      </ScrollArea>
    </ResizablePanel>
  );
};

export default Sidebar;
