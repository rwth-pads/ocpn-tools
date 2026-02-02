import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2 } from 'lucide-react';
import useStore from '@/stores/store';

export interface TimedToken {
  value: unknown;
  timestamp: number; // in milliseconds from epoch (simulation time 0)
}

interface TimedMarkingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colorSetName: string;
  colorSetType: 'int' | 'bool' | 'string' | 'unit' | 'other';
  initialData: TimedToken[];
  onSave: (tokens: TimedToken[]) => void;
}

interface TokenEditorRowProps {
  token: TimedToken;
  index: number;
  colorSetType: 'int' | 'bool' | 'string' | 'unit' | 'other';
  epoch: Date | null;
  onChange: (index: number, token: TimedToken) => void;
  onRemove: (index: number) => void;
}

// Parse relative time input (ms, s, m, h, d) to milliseconds
function parseRelativeTime(ms: number, s: number, m: number, h: number, d: number): number {
  return ms + (s * 1000) + (m * 60 * 1000) + (h * 60 * 60 * 1000) + (d * 24 * 60 * 60 * 1000);
}

// Convert milliseconds to relative time parts
function msToRelativeTime(totalMs: number): { ms: number; s: number; m: number; h: number; d: number } {
  let remaining = totalMs;
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

// Convert epoch + ms to ISO datetime string for input
function msToDatetime(ms: number, epoch: Date): string {
  const date = new Date(epoch.getTime() + ms);
  return date.toISOString().slice(0, 16);
}

// Convert datetime string to ms from epoch
function datetimeToMs(datetime: string, epoch: Date): number {
  const date = new Date(datetime);
  return date.getTime() - epoch.getTime();
}

function TokenEditorRow({ token, index, colorSetType, epoch, onChange, onRemove }: TokenEditorRowProps) {
  const [timeMode, setTimeMode] = useState<'relative' | 'absolute'>('relative');
  const relTime = msToRelativeTime(token.timestamp);
  const [relativeTime, setRelativeTime] = useState(relTime);
  const [absoluteTime, setAbsoluteTime] = useState(epoch ? msToDatetime(token.timestamp, epoch) : '');

  // Update local state when token changes externally
  useEffect(() => {
    const newRelTime = msToRelativeTime(token.timestamp);
    setRelativeTime(newRelTime);
    if (epoch) {
      setAbsoluteTime(msToDatetime(token.timestamp, epoch));
    }
  }, [token.timestamp, epoch]);

  const handleValueChange = (newValue: unknown) => {
    onChange(index, { ...token, value: newValue });
  };

  const handleRelativeTimeChange = (field: keyof typeof relativeTime, value: number) => {
    const newRelTime = { ...relativeTime, [field]: value };
    setRelativeTime(newRelTime);
    const newMs = parseRelativeTime(newRelTime.ms, newRelTime.s, newRelTime.m, newRelTime.h, newRelTime.d);
    onChange(index, { ...token, timestamp: newMs });
  };

  const handleAbsoluteTimeChange = (datetime: string) => {
    setAbsoluteTime(datetime);
    if (epoch) {
      const newMs = datetimeToMs(datetime, epoch);
      onChange(index, { ...token, timestamp: newMs });
    }
  };

  const renderValueInput = () => {
    switch (colorSetType) {
      case 'int':
        return (
          <Input
            type="number"
            value={token.value as number}
            onChange={(e) => handleValueChange(parseInt(e.target.value, 10) || 0)}
            className="w-24"
          />
        );
      case 'bool':
        return (
          <select
            value={String(token.value)}
            onChange={(e) => handleValueChange(e.target.value === 'true')}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        );
      case 'string':
        return (
          <Input
            type="text"
            value={token.value as string}
            onChange={(e) => handleValueChange(e.target.value)}
            className="w-32"
          />
        );
      case 'unit':
        return <span className="px-2 py-1 text-muted-foreground">()</span>;
      default:
        return (
          <Input
            type="text"
            value={JSON.stringify(token.value)}
            onChange={(e) => {
              try {
                handleValueChange(JSON.parse(e.target.value));
              } catch {
                handleValueChange(e.target.value);
              }
            }}
            className="w-32"
          />
        );
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
      <span className="text-sm text-muted-foreground w-6">#{index + 1}</span>
      
      <div className="flex items-center gap-1">
        <Label className="text-xs">Value:</Label>
        {renderValueInput()}
      </div>

      <div className="flex items-center gap-2 flex-1">
        <Label className="text-xs">Time:</Label>
        <Tabs value={timeMode} onValueChange={(v) => setTimeMode(v as 'relative' | 'absolute')} className="flex-1">
          <TabsList className="h-7">
            <TabsTrigger value="relative" className="text-xs px-2 py-1">Relative</TabsTrigger>
            <TabsTrigger value="absolute" className="text-xs px-2 py-1" disabled={!epoch}>Absolute</TabsTrigger>
          </TabsList>
          <TabsContent value="relative" className="mt-1">
            <div className="flex items-center gap-1 flex-wrap">
              <div className="flex items-center gap-0.5">
                <Input
                  type="number"
                  min="0"
                  value={relativeTime.d}
                  onChange={(e) => handleRelativeTimeChange('d', parseInt(e.target.value, 10) || 0)}
                  className="w-12 h-7 text-xs"
                />
                <span className="text-xs text-muted-foreground">d</span>
              </div>
              <div className="flex items-center gap-0.5">
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={relativeTime.h}
                  onChange={(e) => handleRelativeTimeChange('h', parseInt(e.target.value, 10) || 0)}
                  className="w-12 h-7 text-xs"
                />
                <span className="text-xs text-muted-foreground">h</span>
              </div>
              <div className="flex items-center gap-0.5">
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={relativeTime.m}
                  onChange={(e) => handleRelativeTimeChange('m', parseInt(e.target.value, 10) || 0)}
                  className="w-12 h-7 text-xs"
                />
                <span className="text-xs text-muted-foreground">m</span>
              </div>
              <div className="flex items-center gap-0.5">
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={relativeTime.s}
                  onChange={(e) => handleRelativeTimeChange('s', parseInt(e.target.value, 10) || 0)}
                  className="w-12 h-7 text-xs"
                />
                <span className="text-xs text-muted-foreground">s</span>
              </div>
              <div className="flex items-center gap-0.5">
                <Input
                  type="number"
                  min="0"
                  max="999"
                  value={relativeTime.ms}
                  onChange={(e) => handleRelativeTimeChange('ms', parseInt(e.target.value, 10) || 0)}
                  className="w-14 h-7 text-xs"
                />
                <span className="text-xs text-muted-foreground">ms</span>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="absolute" className="mt-1">
            {epoch ? (
              <Input
                type="datetime-local"
                value={absoluteTime}
                onChange={(e) => handleAbsoluteTimeChange(e.target.value)}
                className="h-7 text-xs"
              />
            ) : (
              <p className="text-xs text-muted-foreground">Set simulation epoch in Settings to use absolute time</p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRemove(index)}>
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

export function TimedMarkingDialog({
  open,
  onOpenChange,
  colorSetName,
  colorSetType,
  initialData,
  onSave,
}: TimedMarkingDialogProps) {
  const [tokens, setTokens] = useState<TimedToken[]>(initialData);
  const simulationEpoch = useStore((state) => state.simulationEpoch);
  const epoch = simulationEpoch ? new Date(simulationEpoch) : null;

  useEffect(() => {
    setTokens(initialData);
  }, [initialData, open]);

  const handleAddToken = () => {
    const defaultValue = colorSetType === 'int' ? 0 :
      colorSetType === 'bool' ? true :
      colorSetType === 'string' ? '' :
      colorSetType === 'unit' ? null : '';
    setTokens([...tokens, { value: defaultValue, timestamp: 0 }]);
  };

  const handleTokenChange = (index: number, token: TimedToken) => {
    const newTokens = [...tokens];
    newTokens[index] = token;
    setTokens(newTokens);
  };

  const handleRemoveToken = (index: number) => {
    setTokens(tokens.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave(tokens);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Timed Marking for {colorSetName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-2 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              {tokens.length} token{tokens.length !== 1 ? 's' : ''}
              {epoch && (
                <span className="ml-2">
                  (Epoch: {epoch.toLocaleString()})
                </span>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleAddToken}>
              <Plus className="h-4 w-4 mr-1" />
              Add Token
            </Button>
          </div>

          {tokens.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tokens. Click "Add Token" to add a timed token.
            </div>
          ) : (
            <div className="space-y-2">
              {tokens.map((token, index) => (
                <TokenEditorRow
                  key={index}
                  token={token}
                  index={index}
                  colorSetType={colorSetType}
                  epoch={epoch}
                  onChange={handleTokenChange}
                  onRemove={handleRemoveToken}
                />
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
