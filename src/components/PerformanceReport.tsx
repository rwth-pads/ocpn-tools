import type { MonitorResult } from '@/types';
import useStore from '@/stores/store';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface PerformanceReportProps {
  results: MonitorResult[];
}

/** Format a number for display (up to 2 decimal places) */
function fmt(value: number): string {
  if (Number.isInteger(value)) return value.toString();
  return value.toFixed(2);
}

export function PerformanceReport({ results }: PerformanceReportProps) {
  const monitors = useStore((state) => state.monitors);

  if (results.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        No monitor data yet. Run a simulation with monitors enabled.
      </p>
    );
  }

  // Build lookup for monitor names
  const monitorMap = new Map(monitors.map((m) => [m.id, m]));

  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Monitor</TableHead>
            <TableHead className="text-xs text-right">Count</TableHead>
            <TableHead className="text-xs text-right">Avg</TableHead>
            <TableHead className="text-xs text-right">Min</TableHead>
            <TableHead className="text-xs text-right">Max</TableHead>
            <TableHead className="text-xs text-right">Std Dev</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result) => {
            const monitor = monitorMap.get(result.monitorId);
            const name = monitor?.name ?? result.monitorId;
            const { statistics: s } = result;
            return (
              <TableRow key={result.monitorId}>
                <TableCell className="text-xs font-medium">{name}</TableCell>
                <TableCell className="text-xs text-right tabular-nums">{s.count}</TableCell>
                <TableCell className="text-xs text-right tabular-nums">{fmt(s.avg)}</TableCell>
                <TableCell className="text-xs text-right tabular-nums">{fmt(s.min)}</TableCell>
                <TableCell className="text-xs text-right tabular-nums">{fmt(s.max)}</TableCell>
                <TableCell className="text-xs text-right tabular-nums">{fmt(s.stdDev)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
