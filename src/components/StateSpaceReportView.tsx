import type { StateSpaceReport } from '@/types';
import useStore from '@/stores/store';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface StateSpaceReportViewProps {
  report: StateSpaceReport;
}

export function StateSpaceReportView({ report }: StateSpaceReportViewProps) {
  const petriNetsById = useStore((state) => state.petriNetsById);

  // Build lookups for place/transition names
  const placeNames = new Map<string, string>();
  const transitionNames = new Map<string, string>();
  for (const net of Object.values(petriNetsById)) {
    for (const node of net.nodes) {
      if (node.type === 'place') {
        placeNames.set(node.id, (node.data?.label as string) || node.id);
      } else if (node.type === 'transition') {
        transitionNames.set(node.id, (node.data?.label as string) || node.id);
      }
    }
  }

  return (
    <div className="space-y-4 text-xs">
      {/* Summary */}
      <div className="space-y-1">
        <h4 className="font-semibold text-sm">Statistics</h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
          <span className="text-muted-foreground">States:</span>
          <span className="font-medium tabular-nums">{report.numStates}</span>
          <span className="text-muted-foreground">Arcs:</span>
          <span className="font-medium tabular-nums">{report.numArcs}</span>
          <span className="text-muted-foreground">SCCs:</span>
          <span className="font-medium tabular-nums">{report.numScc}</span>
          <span className="text-muted-foreground">Time:</span>
          <span className="font-medium tabular-nums">{report.calcTimeMs} ms</span>
          <span className="text-muted-foreground">Status:</span>
          <span>
            {report.isFull ? (
              <Badge variant="default" className="text-[10px] px-1 py-0 h-4">Full</Badge>
            ) : (
              <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">Partial</Badge>
            )}
          </span>
        </div>
      </div>

      {/* Boundedness */}
      <div className="space-y-1">
        <h4 className="font-semibold text-sm">Boundedness Properties</h4>
        {report.placeBounds.length === 0 ? (
          <p className="text-muted-foreground">No places found.</p>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Place</TableHead>
                  <TableHead className="text-xs text-right">Lower</TableHead>
                  <TableHead className="text-xs text-right">Upper</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.placeBounds.map((b) => (
                  <TableRow key={b.placeId}>
                    <TableCell className="text-xs font-medium">
                      {placeNames.get(b.placeId) || b.placeName || b.placeId}
                    </TableCell>
                    <TableCell className="text-xs text-right tabular-nums">{b.lowerBound}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">{b.upperBound}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Home Properties */}
      <div className="space-y-1">
        <h4 className="font-semibold text-sm">Home Properties</h4>
        {report.homeMarkings.length > 0 ? (
          <p>
            Home markings:{' '}
            <span className="font-medium tabular-nums">
              {report.homeMarkings.length}
              {' '}[{report.homeMarkings.map((id) => `S${id}`).join(', ')}]
            </span>
          </p>
        ) : (
          <p className="text-muted-foreground">No home markings (multiple terminal SCCs).</p>
        )}
      </div>

      {/* Liveness */}
      <div className="space-y-1">
        <h4 className="font-semibold text-sm">Liveness Properties</h4>
        <div className="space-y-0.5">
          <p>
            Dead markings:{' '}
            {report.deadMarkings.length > 0 ? (
              <span className="font-medium tabular-nums">
                {report.deadMarkings.length}
                {' '}[{report.deadMarkings.map((id) => `S${id}`).join(', ')}]
              </span>
            ) : (
              <span className="text-muted-foreground">None</span>
            )}
          </p>
          <p>
            Dead transitions:{' '}
            {report.deadTransitions.length > 0 ? (
              <span className="font-medium">
                {report.deadTransitions
                  .map((tid) => transitionNames.get(tid) || tid)
                  .join(', ')}
              </span>
            ) : (
              <span className="text-muted-foreground">None</span>
            )}
          </p>
          <p>
            Live transitions:{' '}
            <span className="font-medium">
              {report.liveTransitions
                .map((tid) => transitionNames.get(tid) || tid)
                .join(', ')}
            </span>
          </p>
        </div>
      </div>

      {/* Fairness */}
      <div className="space-y-1">
        <h4 className="font-semibold text-sm">Fairness</h4>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Transition</TableHead>
                <TableHead className="text-xs text-right">Arcs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.transitionFireCounts.map((fc) => (
                <TableRow key={fc.transitionId}>
                  <TableCell className="text-xs font-medium">
                    {transitionNames.get(fc.transitionId) || fc.transitionName}
                  </TableCell>
                  <TableCell className="text-xs text-right tabular-nums">{fc.fireCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* SCC Summary */}
      <div className="space-y-1">
        <h4 className="font-semibold text-sm">SCC Graph</h4>
        <div className="space-y-0.5">
          <p>
            Components: <span className="font-medium tabular-nums">{report.numScc}</span>
          </p>
          <p>
            Terminal SCCs:{' '}
            <span className="font-medium tabular-nums">
              {report.terminalScc.length}
              {report.terminalScc.length > 0 && ` [${report.terminalScc.map((id) => `SCC${id}`).join(', ')}]`}
            </span>
          </p>
          {report.sccGraph.length <= 20 && report.sccGraph.map((scc) => (
            <p key={scc.id} className="text-muted-foreground">
              SCC {scc.id}: {scc.states.length} state{scc.states.length !== 1 ? 's' : ''}
              {report.terminalScc.includes(scc.id) ? ' (terminal)' : ''}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
