import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Database } from 'lucide-react';
import { EventLog, type SimulationEvent } from '@/components/EventLog';
import { OCELExportDialog } from '@/components/dialogs/OCELExportDialog';

// Create demo events for the event log
const createDemoEvents = (): SimulationEvent[] => {
  const baseTime = new Date()
  baseTime.setMinutes(baseTime.getMinutes() - 10) // Start 10 minutes ago

  return [
    {
      id: "demo-1",
      step: 1,
      time: 0.0,
      transitionId: "transition-net1-1",
      transitionName: "Transition 1",
      tokens: {
        consumed: [{ placeId: "place-net1-1", placeName: "Place 1", tokens: "1" }],
        produced: [{ placeId: "place-net1-2", placeName: "Place 2", tokens: "0" }],
      },
      timestamp: new Date(baseTime.getTime()),
    },
    {
      id: "demo-2",
      step: 2,
      time: 2.5,
      transitionId: "transition-net1-1",
      transitionName: "Transition 1",
      tokens: {
        consumed: [{ placeId: "place-net1-2", placeName: "Place 2", tokens: "0" }],
        produced: [{ placeId: "place-net1-1", placeName: "Place 1", tokens: "2" }],
      },
      timestamp: new Date(baseTime.getTime() + 2500),
    },
    {
      id: "demo-3",
      step: 3,
      time: 5.2,
      transitionId: "transition-net1-1",
      transitionName: "Transition 1",
      tokens: {
        consumed: [{ placeId: "place-net1-1", placeName: "Place 1", tokens: "2" }],
        produced: [{ placeId: "place-net1-2", placeName: "Place 2", tokens: "1" }],
      },
      timestamp: new Date(baseTime.getTime() + 5200),
    },
    {
      id: "demo-4",
      step: 4,
      time: 8.7,
      transitionId: "transition-net1-1",
      transitionName: "Transition 1",
      tokens: {
        consumed: [{ placeId: "place-net1-2", placeName: "Place 2", tokens: "1" }],
        produced: [{ placeId: "place-net1-1", placeName: "Place 1", tokens: "3" }],
      },
      timestamp: new Date(baseTime.getTime() + 8700),
    },
    {
      id: "demo-5",
      step: 5,
      time: 10.3,
      transitionId: "transition-net1-1",
      transitionName: "Transition 1",
      tokens: {
        consumed: [{ placeId: "place-net1-1", placeName: "Place 1", tokens: "3" }],
        produced: [{ placeId: "place-net1-2", placeName: "Place 2", tokens: "2" }],
      },
      timestamp: new Date(baseTime.getTime() + 10300),
    },
  ]
}

export function SimulationPanel() {
  const [events, setEvents] = useState<SimulationEvent[]>(createDemoEvents())
  const [ocelDialogOpen, setOcelDialogOpen] = useState(false);

  const handleExportOcel = (format: 'json' | 'xml' | 'sqlite') => {
    // Mock export functionality
    let content = ""
    let filename = `petri_net_simulation_ocel`
    let mimeType = "application/octet-stream"
    const ocelVersion = "2.0"

    switch (format) {
      case "json":
        content = JSON.stringify(
          {
            "ocel:version": ocelVersion,
            events: {},
            objects: {},
            objectTypes: {},
            eventTypes: {},
          },
          null,
          2,
        )
        filename += ".json"
        mimeType = "application/json"
        break
      case "xml":
        content = `<?xml version="1.0" encoding="UTF-8"?>
<ocel:log xmlns:ocel="http://www.ocel-standard.org/">
  <ocel:events>
  </ocel:events>
  <ocel:objects>
  </ocel:objects>
  <ocel:objectTypes>
  </ocel:objectTypes>
  <ocel:eventTypes>
  </ocel:eventTypes>
</ocel:log>`
        filename += ".xml"
        mimeType = "application/xml"
        break
      case "sqlite":
        // For SQLite, we'd normally create a binary file
        // Since we're just mocking, we'll create an empty text file
        content = "SQLite format mock file"
        filename += ".sqlite"
        mimeType = "application/vnd.sqlite3"
        break
    }

    // Create and download the file
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const clearEventLog = () => {
    setEvents([]);
  }

  return (
    <>
      <EventLog
        events={events}
        onClearLog={clearEventLog}
      />
      {/* OCEL Export Button */}
      <div className="flex justify-end mt-2">
        <Button variant="outline" onClick={() => setOcelDialogOpen(true)} className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          Export as OCEL 2.0
        </Button>
      </div>

      {/* OCEL Export Dialog */}
      <OCELExportDialog open={ocelDialogOpen} onOpenChange={setOcelDialogOpen} onExport={handleExportOcel} />
    </>
  )
}
