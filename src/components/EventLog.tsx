import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Search, Trash, Clock, Database, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import useStore from "@/stores/store"
import { formatDateTimeFull } from "@/utils/timeFormat"

export interface SimulationEvent {
  id: string
  step: number
  time: number
  transitionId: string
  transitionName: string
  tokens: {
    consumed: { placeId: string; placeName: string; tokens: string }[]
    produced: { placeId: string; placeName: string; tokens: string }[]
  }
  timestamp: Date
}

export interface TransitionFilterItem {
  id: string
  name: string
  involvesRecordType: boolean
}

interface EventLogProps {
  events: SimulationEvent[]
  onClearLog: () => void
  onExport?: () => void
  canExport?: boolean
  exportDisabledReason?: string
  transitions?: TransitionFilterItem[]
  filteredTransitionIds?: Set<string>
  onFilterChange?: (ids: Set<string>) => void
  subpageNote?: string
}

export function EventLog({ events, onClearLog, onExport, canExport, exportDisabledReason, transitions, filteredTransitionIds, onFilterChange, subpageNote }: EventLogProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)
  const [tempFilterIds, setTempFilterIds] = useState<Set<string>>(new Set())
  const simulationEpoch = useStore((state) => state.simulationEpoch)
  const epoch = simulationEpoch ? new Date(simulationEpoch) : null

  const toggleEventExpanded = (eventId: string) => {
    const newExpanded = new Set(expandedEvents)
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId)
    } else {
      newExpanded.add(eventId)
    }
    setExpandedEvents(newExpanded)
  }

  const handleOpenFilterDialog = () => {
    setTempFilterIds(new Set(filteredTransitionIds ?? []))
    setFilterDialogOpen(true)
  }

  const handleSaveFilter = () => {
    onFilterChange?.(tempFilterIds)
    setFilterDialogOpen(false)
  }

  const toggleTempFilter = (id: string, checked: boolean) => {
    const next = new Set(tempFilterIds)
    if (checked) {
      next.add(id)
    } else {
      next.delete(id)
    }
    setTempFilterIds(next)
  }

  const selectAll = () => {
    if (transitions) {
      setTempFilterIds(new Set(transitions.map(t => t.id)))
    }
  }

  const selectNone = () => {
    setTempFilterIds(new Set())
  }

  // Apply transition filter, then text search
  const visibleEvents = useMemo(() => {
    let result = events
    if (filteredTransitionIds && filteredTransitionIds.size > 0) {
      result = result.filter(e => filteredTransitionIds.has(e.transitionId))
    } else if (filteredTransitionIds && filteredTransitionIds.size === 0) {
      result = [] // explicit empty selection means show nothing
    }
    if (searchTerm) {
      result = result.filter(
        (event) =>
          event.transitionName.replace(/\n/g, ' ').toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.tokens.consumed.some((t) => t.placeName.replace(/\n/g, ' ').toLowerCase().includes(searchTerm.toLowerCase())) ||
          event.tokens.produced.some((t) => t.placeName.replace(/\n/g, ' ').toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }
    return result
  }, [events, filteredTransitionIds, searchTerm])

  const isFilterActive = transitions && filteredTransitionIds && filteredTransitionIds.size < transitions.length

  // Format simulation time - show as absolute datetime if epoch is set, otherwise relative
  const formatSimTime = (timeMs: number): { date?: string; time: string } => {
    if (epoch) {
      // Absolute time: epoch + simulation time
      const absoluteDate = new Date(epoch.getTime() + timeMs)
      return { time: formatDateTimeFull(absoluteDate) }
    }
    // Relative time display
    if (timeMs === 0) return { time: '0' }
    const seconds = timeMs / 1000
    if (seconds < 60) return { time: `${seconds.toFixed(seconds % 1 === 0 ? 0 : 1)}s` }
    const minutes = seconds / 60
    if (minutes < 60) return { time: `${minutes.toFixed(minutes % 1 === 0 ? 0 : 1)}m` }
    const hours = minutes / 60
    if (hours < 24) return { time: `${hours.toFixed(hours % 1 === 0 ? 0 : 1)}h` }
    const days = hours / 24
    return { time: `${days.toFixed(days % 1 === 0 ? 0 : 1)}d` }
  }

  return (
    <Card className="w-full h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold leading-none tracking-tight">Event Log</span>
          <div className="flex items-center space-x-1">
            {transitions && transitions.length > 0 && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleOpenFilterDialog}
                title="Filter Transitions"
                className={isFilterActive ? "border-primary text-primary" : ""}
              >
                <Filter className="h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={onClearLog} title="Clear Log">
              <Trash className="h-4 w-4" />
            </Button>
            {onExport && (
              <Button
                variant="outline"
                onClick={onExport}
                disabled={!canExport}
                title={exportDisabledReason || "Export as OCEL 2.0"}
                className="flex items-center gap-1 h-9 px-3"
              >
                <Database className="h-4 w-4" />
                Export OCEL
              </Button>
            )}
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      {subpageNote && (
        <div className="mx-4 mb-2 px-3 py-1.5 text-xs text-muted-foreground bg-muted/50 rounded-md border border-border">
          {subpageNote}
        </div>
      )}
      <CardContent className="flex-1 overflow-hidden min-h-0">
        <ScrollArea className="h-full">
          {visibleEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {events.length === 0 ? "No events recorded yet" : "No events match your filter or search"}
            </div>
          ) : (
            <div className="space-y-2">
              {visibleEvents.map((event) => (
                <div
                  key={event.id}
                  className="border rounded-md p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleEventExpanded(event.id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{event.step}</Badge>
                      <span className="font-medium">{event.transitionName.replace(/\n/g, ' ')}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-muted-foreground">
                      <Clock className="h-3 w-3 flex-shrink-0" />
                      {(() => {
                        const formatted = formatSimTime(event.time)
                        return formatted.date ? (
                          <div className="text-right text-xs leading-tight">
                            <div>{formatted.date}</div>
                            <div>{formatted.time}</div>
                          </div>
                        ) : (
                          <span className="text-sm">{formatted.time}</span>
                        )
                      })()}
                    </div>
                  </div>

                  {expandedEvents.has(event.id) && (
                    <div className="mt-2 pt-2 border-t text-sm space-y-3 overflow-hidden">
                      <div className="min-w-0">
                        <h4 className="font-medium mb-1">Consumed Tokens:</h4>
                        {event.tokens.consumed.length === 0 ? (
                          <p className="text-muted-foreground text-xs pl-2">None</p>
                        ) : (
                          <ul className="space-y-1 pl-2 text-xs">
                            {event.tokens.consumed.map((token, idx) => (
                              <li key={`consumed-${idx}`} className="min-w-0">
                                <span className="text-muted-foreground">{token.placeName.replace(/\n/g, ' ')}:</span>
                                <span className="font-mono bg-muted px-1 rounded ml-2 break-all whitespace-pre-wrap">{token.tokens}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium mb-1">Produced Tokens:</h4>
                        {event.tokens.produced.length === 0 ? (
                           <p className="text-muted-foreground text-xs pl-2">None</p>
                        ) : (
                          <ul className="space-y-1 pl-2 text-xs">
                            {event.tokens.produced.map((token, idx) => (
                              <li key={`produced-${idx}`} className="min-w-0">
                                <span className="text-muted-foreground">{token.placeName.replace(/\n/g, ' ')}:</span>
                                <span className="font-mono bg-muted px-1 rounded ml-2 break-all whitespace-pre-wrap">{token.tokens}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {/* Transition Filter Dialog */}
      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Filter Transitions</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 mb-2">
            <Button variant="outline" size="sm" onClick={selectAll}>Select All</Button>
            <Button variant="outline" size="sm" onClick={selectNone}>Select None</Button>
          </div>
          <ScrollArea className="max-h-[300px]">
            <div className="space-y-2 py-1">
              {transitions?.map(t => (
                <label key={t.id} className="flex items-center gap-2 cursor-pointer px-1 py-1 rounded hover:bg-muted/50">
                  <Checkbox
                    checked={tempFilterIds.has(t.id)}
                    onCheckedChange={(checked) => toggleTempFilter(t.id, !!checked)}
                  />
                  <span className="text-sm">{t.name}</span>
                  {t.involvesRecordType && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">OCEL</Badge>
                  )}
                </label>
              ))}
            </div>
          </ScrollArea>
          <p className="text-xs text-muted-foreground">
            Transitions marked OCEL involve record-typed color sets and are selected by default.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFilterDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveFilter}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
