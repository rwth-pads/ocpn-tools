import { Button } from "@/components/ui/button"
import { Circle, Square, ArrowRight, Network } from "lucide-react"

import { Toggle } from '@/components/ui/toggle';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';

import { Separator } from '@/components/ui/separator';

import { useDnD } from '@/utils/DnDContext';

// import { SaveDialog } from "@/components/dialogs/save-dialog"
// import { OpenDialog } from "@/components/dialogs/open-dialog"
// import {
//   convertToCPNToolsXML,
//   convertToCPNPyXML,
//   convertToJSON,
//   saveFile,
//   parseFileContent,
// } from "@/utils/file-operations"

interface ToolbarProps {
  toggleArcMode: (pressed: boolean) => void;
  layoutGraph: () => void;
}

export function Toolbar({ toggleArcMode, layoutGraph }: ToolbarProps) {
  //const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  //const [openDialogOpen, setOpenDialogOpen] = useState(false)

  const [_, setType] = useDnD();

  const onDragStart = (event: React.DragEvent<HTMLElement>, nodeType: string) => {
      //event.dataTransfer.setData("application/reactflow", nodeType);
      if (setType) {
        setType(nodeType);
      }
      event.dataTransfer.effectAllowed = "move";
    }

  // const handleSave = (format: string) => {
  //   let content: string
  //   let filename: string

  //   switch (format) {
  //     case "cpn-tools":
  //       content = convertToCPNToolsXML(petriNetData)
  //       filename = `${petriNetData.name.replace(/\s+/g, "_")}.cpn`
  //       break
  //     case "cpn-py":
  //       content = convertToCPNPyXML(petriNetData)
  //       filename = `${petriNetData.name.replace(/\s+/g, "_")}.xml`
  //       break
  //     case "json":
  //     default:
  //       content = convertToJSON(petriNetData)
  //       filename = `${petriNetData.name.replace(/\s+/g, "_")}.json`
  //       break
  //   }

  //   saveFile(content, filename)
  //   onSavePetriNet(format)
  // }

  // const handleFileLoaded = (fileContent: string, fileName: string) => {
  //   const data = parseFileContent(fileContent, fileName)
  //   if (data) {
  //     onOpenPetriNet(data)
  //   } else {
  //     // Show error notification
  //     alert("Failed to parse the file. Please check the file format.")
  //   }
  // }

  return (
    <>
      <div className="flex items-center gap-2 bg-background border rounded-lg p-2 shadow-sm">
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="ghost"
                    size="icon"
                    draggable
                    onDragStart={(event) => onDragStart(event, "place")}
                    title="Place"
                    className="cursor-grab"
                  >
                    <Circle className="h-5 w-5" />
                    <span className="sr-only">Drag a Place from Here</span>
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Drag a Place from Here</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="ghost"
                    size="icon"
                    draggable
                    onDragStart={(event) => onDragStart(event, "transition")}
                    title="Transition"
                    className="cursor-grab"
                  >
                    <Square className="h-5 w-5" />
                    <span className="sr-only">Drag a Transition from Here</span>
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Drag a Transition from Here</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Toggle
                    aria-label="Toggle Arc"
                    onPressedChange={toggleArcMode}
                  >
                    <ArrowRight className="h-4 w-4" />
                    <span className="sr-only">Toggle Arc Mode</span>
                  </Toggle>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle Arc Mode</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-2 h-6">
          <Separator orientation="vertical" className="mx-1 h-6" />
        </div>

        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button variant="ghost" size="icon" title="Layout Petri Net" onClick={layoutGraph}>
                    <Network className="h-5 w-5" />
                    <span className="sr-only">Layout Petri Net</span>
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Layout Petri Net</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/*
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" title="Save">
            <Save className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" title="Open">
            <FolderOpen className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2 h-6">
          <Separator orientation="vertical" className="mx-1 h-6" />
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" title="Simulate">
            <Play className="h-5 w-5" />
          </Button>
        </div> */}
      </div>

      {/* <SaveDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSave}
        petriNetName={activePetriNetName}
      />

      <OpenDialog open={openDialogOpen} onOpenChange={setOpenDialogOpen} onFileLoaded={handleFileLoaded} /> */}
    </>
  )
}

