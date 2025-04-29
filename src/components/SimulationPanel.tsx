import { useState, useContext } from 'react'; // Import useContext
import { Button } from '@/components/ui/button';
import { Database } from 'lucide-react';
import { EventLog } from '@/components/EventLog';
import { OCELExportDialog } from '@/components/dialogs/OCELExportDialog';
// Correct the import path for SimulationContext
import { SimulationContext } from '@/context/useSimulationContextHook';

export function SimulationPanel() {
  // Consume context instead of calling the hook
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('SimulationPanel must be used within a SimulationProvider');
  }
  const { events, clearEvents, isInitialized, stepCounter } = context;

  const [ocelDialogOpen, setOcelDialogOpen] = useState(false);

  const handleExportOcel = (format: 'json' | 'xml' | 'sqlite') => {
    let content = "";
    let filename = `petri_net_simulation_ocel_step_${stepCounter}`;
    let mimeType = "application/octet-stream";
    const ocelVersion = "2.0";

    switch (format) {
      case "json":
        content = JSON.stringify(
          {
            "ocel:version": ocelVersion,
            "ocel:global-log": {
              "ocel:attribute-names": [],
              "ocel:object-types": []
            },
            "ocel:events": {},
            "ocel:objects": {}
          },
          null,
          2,
        );
        filename += ".json";
        mimeType = "application/json";
        break;
      case "xml":
        content = `<?xml version="1.0" encoding="UTF-8"?>
<ocel:log xmlns:ocel="http://www.ocel-standard.org/">
  <ocel:global-log>
    <ocel:attribute-names/>
    <ocel:object-types/>
  </ocel:global-log>
  <ocel:events>
    <!-- Add formatted events here -->
  </ocel:events>
  <ocel:objects>
    <!-- Add formatted objects here -->
  </ocel:objects>
</ocel:log>`;
        filename += ".xml";
        mimeType = "application/xml";
        break;
      case "sqlite":
        content = "SQLite format mock file - needs implementation using a library like sql.js";
        filename += ".sqlite";
        mimeType = "application/vnd.sqlite3";
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setOcelDialogOpen(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <EventLog
          events={events}
          onClearLog={clearEvents}
        />
      </div>
      <div className="flex justify-end mt-2">
        <Button
          variant="outline"
          onClick={() => setOcelDialogOpen(true)}
          className="flex items-center gap-2"
          // disabled={!isInitialized || events.length === 0}
          title={!isInitialized ? "Simulation not initialized" : events.length === 0 ? "No simulation events to export" : "Export simulation log as OCEL 2.0"}
          disabled
        >
          <Database className="h-4 w-4" />
          Export as OCEL 2.0
        </Button>
      </div>
      <OCELExportDialog open={ocelDialogOpen} onOpenChange={setOcelDialogOpen} onExport={handleExportOcel} />
    </div>
  );
}
