import { useState, useEffect } from 'react';
import useStore from '@/stores/store';

import { Label } from "@/components/ui/label";
import { UndoableInput as Input, UndoableTextarea as Textarea } from "@/components/ui/undoable-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeSegmentEditor } from "@/components/CodeSegmentEditor";

import type { Priority } from "@/declarations";

// Parse relative time from milliseconds
function msToRelativeTime(totalMs: number): { ms: number; s: number; m: number; h: number; d: number } {
  let remaining = Math.abs(totalMs);
  const d = Math.floor(remaining / (24 * 60 * 60 * 1000));
  remaining %= 24 * 60 * 60 * 1000;
  const h = Math.floor(remaining / (60 * 60 * 1000));
  remaining %= 60 * 60 * 1000;
  const m = Math.floor(remaining / (60 * 1000));
  remaining %= 60 * 1000;
  const s = Math.floor(remaining / 1000);
  const ms = remaining % 1000;
  return { ms, s, m, h, d };
}

// Convert relative time to Rhai delay expression
function relativeTimeToExpression(rel: { ms: number; s: number; m: number; h: number; d: number }): string {
  const parts: string[] = [];
  if (rel.d > 0) parts.push(`delay_days(${rel.d})`);
  if (rel.h > 0) parts.push(`delay_hours(${rel.h})`);
  if (rel.m > 0) parts.push(`delay_min(${rel.m})`);
  if (rel.s > 0) parts.push(`delay_sec(${rel.s})`);
  if (rel.ms > 0) parts.push(`delay_ms(${rel.ms})`);
  return parts.length > 0 ? parts.join(' + ') : '';
}

// Try to parse a time expression back to relative time (for display purposes)
// Returns null if it can't be parsed as a simple relative time
function parseTimeExpression(expr: string): { ms: number; s: number; m: number; h: number; d: number } | null {
  if (!expr || expr.trim() === '') {
    return { ms: 0, s: 0, m: 0, h: 0, d: 0 };
  }
  
  // Try to match delay function calls and sum them up
  const delayPattern = /delay_(days|hours|min|sec|ms)\s*\(\s*(\d+)\s*\)/g;
  let totalMs = 0;
  let hasMatch = false;
  let match;
  
  // Check if the expression only contains delay calls and + operators
  const cleaned = expr.replace(delayPattern, '').replace(/\+/g, '').trim();
  if (cleaned !== '') {
    // Has other content, not a simple relative expression
    return null;
  }
  
  // Reset regex and extract values
  delayPattern.lastIndex = 0;
  while ((match = delayPattern.exec(expr)) !== null) {
    hasMatch = true;
    const unit = match[1];
    const value = parseInt(match[2], 10);
    switch (unit) {
      case 'days': totalMs += value * 24 * 60 * 60 * 1000; break;
      case 'hours': totalMs += value * 60 * 60 * 1000; break;
      case 'min': totalMs += value * 60 * 1000; break;
      case 'sec': totalMs += value * 1000; break;
      case 'ms': totalMs += value; break;
    }
  }
  
  if (!hasMatch && expr.trim() !== '') {
    return null;
  }
  
  return msToRelativeTime(totalMs);
}

const TransitionProperties = ({ priorities }: { priorities: Priority[] }) => {
  const activePetriNetId = useStore((state) => state.activePetriNetId);
  const selectedElement = useStore((state) => {
    const activePetriNet = state.activePetriNetId ? state.petriNetsById[state.activePetriNetId] : null;
    return activePetriNet?.selectedElement;
  });
  const updateNodeData = useStore((state) => state.updateNodeData);

  // State for time input mode
  const [timeMode, setTimeMode] = useState<'relative' | 'expression'>('relative');
  const [relativeTime, setRelativeTime] = useState({ ms: 0, s: 0, m: 0, h: 0, d: 0 });
  const [expressionValue, setExpressionValue] = useState('');
  const [lastNodeId, setLastNodeId] = useState<string | null>(null);

  // Extract node data safely (for use in useEffect before early returns)
  const isValidNode = selectedElement && selectedElement.type === 'node' && selectedElement.element;
  const nodeId = isValidNode ? selectedElement.element.id : null;
  const nodeData = isValidNode ? selectedElement.element.data as { label?: string; colorSet?: string; isArcMode?: boolean; type?: string; initialMarking?: string; guard?: string; time?: string; priority?: string; codeSegment?: string } : null;

  // Initialize time state when node changes - must be called before any early returns
  useEffect(() => {
    if (nodeId && nodeId !== lastNodeId && nodeData) {
      setLastNodeId(nodeId);
      const timeValue = nodeData.time || '';
      const parsed = parseTimeExpression(timeValue);
      if (parsed !== null) {
        setTimeMode('relative');
        setRelativeTime(parsed);
        setExpressionValue(timeValue);
      } else {
        setTimeMode('expression');
        setExpressionValue(timeValue);
        setRelativeTime({ ms: 0, s: 0, m: 0, h: 0, d: 0 });
      }
    }
  }, [nodeId, lastNodeId, nodeData]);

  // Ensure selectedElement is a node and has the correct data type
  if (!isValidNode || !nodeData) {
    return <div>No node selected</div>;
  }

  const id = nodeId!;
  const data = nodeData;

  // Type guard to ensure data is of type TransitionNodeData
  if (!('guard' in data)) {
    return <div>Invalid node type</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="label">Label</Label>
        <Input
          id="label"
          value={data.label ?? ""}
          onChange={(e) => {
            if (activePetriNetId) {
              updateNodeData(activePetriNetId, id, { ...data, label: e.target.value, isArcMode: data.isArcMode || false, type: data.type || 'defaultType', colorSet: data.colorSet || 'defaultColorSet', initialMarking: data.initialMarking || 'defaultMarking' })
            }
          }
          }
        />
      </div>

      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="guard">Guard</Label>
        <Input
          id="guard"
          value={data.guard || ""}
          onChange={(e) => {
            if (activePetriNetId) {
              updateNodeData(activePetriNetId, id, {
                ...data,
                label: data.label || "",
                guard: e.target.value,
                isArcMode: data.isArcMode || false,
                type: data.type || "defaultType",
                colorSet: data.colorSet || "defaultColorSet",
                initialMarking: data.initialMarking || "defaultMarking",
              })}
            }
          }
        />
      </div>

      <div className="grid w-full items-center gap-1.5">
        <Label>Time</Label>
        <Tabs value={timeMode} onValueChange={(v) => setTimeMode(v as 'relative' | 'expression')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="relative">Relative</TabsTrigger>
            <TabsTrigger value="expression">Expression</TabsTrigger>
          </TabsList>
          <TabsContent value="relative" className="mt-2">
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min="0"
                  value={relativeTime.d}
                  onChange={(e) => {
                    const newRel = { ...relativeTime, d: parseInt(e.target.value, 10) || 0 };
                    setRelativeTime(newRel);
                    const expr = relativeTimeToExpression(newRel);
                    setExpressionValue(expr);
                    if (activePetriNetId) {
                      updateNodeData(activePetriNetId, id, {
                        ...data,
                        label: data.label || "",
                        time: expr,
                        isArcMode: data.isArcMode || false,
                        type: data.type || "defaultType",
                        colorSet: data.colorSet,
                        initialMarking: data.initialMarking,
                        priority: data.priority || "NONE",
                        codeSegment: data.codeSegment || "",
                        guard: data.guard || "",
                      });
                    }
                  }}
                  className="w-14 h-8 text-sm"
                />
                <span className="text-xs text-muted-foreground">d</span>
              </div>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={relativeTime.h}
                  onChange={(e) => {
                    const newRel = { ...relativeTime, h: parseInt(e.target.value, 10) || 0 };
                    setRelativeTime(newRel);
                    const expr = relativeTimeToExpression(newRel);
                    setExpressionValue(expr);
                    if (activePetriNetId) {
                      updateNodeData(activePetriNetId, id, {
                        ...data,
                        label: data.label || "",
                        time: expr,
                        isArcMode: data.isArcMode || false,
                        type: data.type || "defaultType",
                        colorSet: data.colorSet,
                        initialMarking: data.initialMarking,
                        priority: data.priority || "NONE",
                        codeSegment: data.codeSegment || "",
                        guard: data.guard || "",
                      });
                    }
                  }}
                  className="w-14 h-8 text-sm"
                />
                <span className="text-xs text-muted-foreground">h</span>
              </div>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={relativeTime.m}
                  onChange={(e) => {
                    const newRel = { ...relativeTime, m: parseInt(e.target.value, 10) || 0 };
                    setRelativeTime(newRel);
                    const expr = relativeTimeToExpression(newRel);
                    setExpressionValue(expr);
                    if (activePetriNetId) {
                      updateNodeData(activePetriNetId, id, {
                        ...data,
                        label: data.label || "",
                        time: expr,
                        isArcMode: data.isArcMode || false,
                        type: data.type || "defaultType",
                        colorSet: data.colorSet,
                        initialMarking: data.initialMarking,
                        priority: data.priority || "NONE",
                        codeSegment: data.codeSegment || "",
                        guard: data.guard || "",
                      });
                    }
                  }}
                  className="w-14 h-8 text-sm"
                />
                <span className="text-xs text-muted-foreground">m</span>
              </div>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={relativeTime.s}
                  onChange={(e) => {
                    const newRel = { ...relativeTime, s: parseInt(e.target.value, 10) || 0 };
                    setRelativeTime(newRel);
                    const expr = relativeTimeToExpression(newRel);
                    setExpressionValue(expr);
                    if (activePetriNetId) {
                      updateNodeData(activePetriNetId, id, {
                        ...data,
                        label: data.label || "",
                        time: expr,
                        isArcMode: data.isArcMode || false,
                        type: data.type || "defaultType",
                        colorSet: data.colorSet,
                        initialMarking: data.initialMarking,
                        priority: data.priority || "NONE",
                        codeSegment: data.codeSegment || "",
                        guard: data.guard || "",
                      });
                    }
                  }}
                  className="w-14 h-8 text-sm"
                />
                <span className="text-xs text-muted-foreground">s</span>
              </div>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min="0"
                  max="999"
                  value={relativeTime.ms}
                  onChange={(e) => {
                    const newRel = { ...relativeTime, ms: parseInt(e.target.value, 10) || 0 };
                    setRelativeTime(newRel);
                    const expr = relativeTimeToExpression(newRel);
                    setExpressionValue(expr);
                    if (activePetriNetId) {
                      updateNodeData(activePetriNetId, id, {
                        ...data,
                        label: data.label || "",
                        time: expr,
                        isArcMode: data.isArcMode || false,
                        type: data.type || "defaultType",
                        colorSet: data.colorSet,
                        initialMarking: data.initialMarking,
                        priority: data.priority || "NONE",
                        codeSegment: data.codeSegment || "",
                        guard: data.guard || "",
                      });
                    }
                  }}
                  className="w-16 h-8 text-sm"
                />
                <span className="text-xs text-muted-foreground">ms</span>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="expression" className="mt-2">
            <Textarea
              placeholder="Rhai expression, e.g.: delay_hours(2) + delay_min(30)"
              value={expressionValue}
              onChange={(e) => {
                const newExpr = e.target.value;
                setExpressionValue(newExpr);
                if (activePetriNetId) {
                  updateNodeData(activePetriNetId, id, {
                    ...data,
                    label: data.label || "",
                    time: newExpr,
                    isArcMode: data.isArcMode || false,
                    type: data.type || "defaultType",
                    colorSet: data.colorSet,
                    initialMarking: data.initialMarking,
                    priority: data.priority || "NONE",
                    codeSegment: data.codeSegment || "",
                    guard: data.guard || "",
                  });
                }
              }}
              className="min-h-[80px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Available: delay_ms(), delay_sec(), delay_min(), delay_hours(), delay_days()
            </p>
          </TabsContent>
        </Tabs>
      </div>

      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="priority">Priority</Label>
        <Select
          value={data.priority || "NONE"}
          onValueChange={(value) => {
            if (activePetriNetId) {
              updateNodeData(activePetriNetId, id, {
                ...data,
                label: data.label || "",
                priority: value,
                isArcMode: data.isArcMode || false,
                type: data.type || "defaultType",
                colorSet: data.colorSet,
                initialMarking: data.initialMarking,
                guard: data.guard || "",
                time: data.time || "",
                codeSegment: data.codeSegment || "",
              })}
            }
          }
        >
          <SelectTrigger id="priority">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NONE">None</SelectItem>
            {priorities.map((p) => (
              <SelectItem key={p.id} value={p.name}>
                {p.name} ({p.level})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="codeSegment">Code Segment</Label>
        <CodeSegmentEditor
          value={data.codeSegment || ""}
          onChange={(value) => {
            if (activePetriNetId) {
              updateNodeData(activePetriNetId, id, {
                ...data,
                label: data.label || "",
                codeSegment: value,
                isArcMode: data.isArcMode || false,
                type: data.type || "defaultType",
                colorSet: data.colorSet,
                initialMarking: data.initialMarking,
                guard: data.guard || "",
                time: data.time || "",
                priority: data.priority || "NONE",
              })}
            }
          }
        />
      </div>
    </div>
  )
}

export default TransitionProperties;
