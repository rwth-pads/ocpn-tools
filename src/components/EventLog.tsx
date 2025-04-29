import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Search, Trash, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"

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

interface EventLogProps {
  events: SimulationEvent[]
  onClearLog: () => void
}

export function EventLog({ events, onClearLog }: EventLogProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())

  const toggleEventExpanded = (eventId: string) => {
    const newExpanded = new Set(expandedEvents)
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId)
    } else {
      newExpanded.add(eventId)
    }
    setExpandedEvents(newExpanded)
  }

  const filteredEvents = events.filter(
    (event) =>
      event.transitionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.tokens.consumed.some((t) => t.placeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      event.tokens.produced.some((t) => t.placeName.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const formatTime = (time: number) => {
    return time.toFixed(2)
  }

  const formatDate = (date: Date) => {
    // Format time as HH:MM:SS.mmm
    const base = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${base}.${ms}`;
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Event Log</CardTitle>
          <div className="flex items-center space-x-1">
            <Button variant="outline" size="icon" onClick={onClearLog} title="Clear Log">
              <Trash className="h-4 w-4" />
            </Button>
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
      <CardContent>
        <ScrollArea className="h-[400px]">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {events.length === 0 ? "No events recorded yet" : "No events match your search"}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="border rounded-md p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleEventExpanded(event.id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{event.step}</Badge>
                      <span className="font-medium">{event.transitionName}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(event.time)}</span>
                      <span>{formatDate(event.timestamp)}</span>
                    </div>
                  </div>

                  {expandedEvents.has(event.id) && (
                    <div className="mt-2 pt-2 border-t text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-1">Consumed Tokens:</h4>
                          <ul className="space-y-1">
                            {event.tokens.consumed.map((token, idx) => (
                              <li key={`consumed-${idx}`} className="flex justify-between">
                                <span>{token.placeName}:</span>
                                <span className="font-mono">{token.tokens}</span>
                              </li>
                            ))}
                            {event.tokens.consumed.length === 0 && <li className="text-muted-foreground">None</li>}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Produced Tokens:</h4>
                          <ul className="space-y-1">
                            {event.tokens.produced.map((token, idx) => (
                              <li key={`produced-${idx}`} className="flex justify-between">
                                <span>{token.placeName}:</span>
                                <span className="font-mono">{token.tokens}</span>
                              </li>
                            ))}
                            {event.tokens.produced.length === 0 && <li className="text-muted-foreground">None</li>}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
