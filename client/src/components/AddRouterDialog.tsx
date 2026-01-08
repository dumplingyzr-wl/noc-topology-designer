/*
 * Add Router Dialog - Configure new router before adding
 * Design: Dark Professional
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { PortConfig, DEFAULT_PORT_CONFIG, HIGH_RADIX_PORT_CONFIG, PORT_DIRECTION_COLORS } from '@/types/noc';
import { Plus, Cpu } from 'lucide-react';

interface AddRouterDialogProps {
  open: boolean;
  position: { x: number; y: number };
  onOpenChange: (open: boolean) => void;
  onAdd: (label: string, portConfig: PortConfig) => void;
  existingLabels: string[];
}

export function AddRouterDialog({ 
  open, 
  position, 
  onOpenChange, 
  onAdd, 
  existingLabels 
}: AddRouterDialogProps) {
  const [label, setLabel] = useState('');
  const [portConfig, setPortConfig] = useState<PortConfig>(DEFAULT_PORT_CONFIG);
  const [preset, setPreset] = useState<'standard' | 'high-radix' | 'custom'>('standard');

  // Generate unique label
  const generateLabel = () => {
    let index = existingLabels.length;
    let newLabel = `R${index}`;
    while (existingLabels.includes(newLabel)) {
      index++;
      newLabel = `R${index}`;
    }
    return newLabel;
  };

  const handlePresetChange = (newPreset: 'standard' | 'high-radix' | 'custom') => {
    setPreset(newPreset);
    if (newPreset === 'standard') {
      setPortConfig(DEFAULT_PORT_CONFIG);
    } else if (newPreset === 'high-radix') {
      setPortConfig(HIGH_RADIX_PORT_CONFIG);
    }
  };

  const handlePortConfigChange = (direction: keyof PortConfig, value: number) => {
    setPreset('custom');
    setPortConfig(prev => ({ ...prev, [direction]: Math.max(0, Math.min(8, value)) }));
  };

  const handleAdd = () => {
    const finalLabel = label.trim() || generateLabel();
    onAdd(finalLabel, portConfig);
    // Reset for next use
    setLabel('');
    setPortConfig(DEFAULT_PORT_CONFIG);
    setPreset('standard');
    onOpenChange(false);
  };

  const totalPorts = portConfig.north + portConfig.south + portConfig.east + portConfig.west + portConfig.local;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Router
          </DialogTitle>
          <DialogDescription>
            Configure the new router's label and port configuration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Label */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Label</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={generateLabel()}
              className="h-9 font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for auto-generated label
            </p>
          </div>

          {/* Position (read-only) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">X Position</Label>
              <div className="h-9 px-3 flex items-center text-sm font-mono bg-secondary/50 rounded-md">
                {Math.round(position.x)}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Y Position</Label>
              <div className="h-9 px-3 flex items-center text-sm font-mono bg-secondary/50 rounded-md">
                {Math.round(position.y)}
              </div>
            </div>
          </div>

          <Separator />

          {/* Router preset */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Port Configuration</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={preset === 'standard' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePresetChange('standard')}
                className="h-auto py-2 flex-col"
              >
                <Cpu className="h-4 w-4 mb-1" />
                <span className="text-xs">Standard</span>
                <span className="text-[10px] text-muted-foreground">5 ports</span>
              </Button>
              <Button
                variant={preset === 'high-radix' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePresetChange('high-radix')}
                className="h-auto py-2 flex-col"
              >
                <Cpu className="h-4 w-4 mb-1" />
                <span className="text-xs">High Radix</span>
                <span className="text-[10px] text-muted-foreground">18 ports</span>
              </Button>
              <Button
                variant={preset === 'custom' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePresetChange('custom')}
                className="h-auto py-2 flex-col"
              >
                <Cpu className="h-4 w-4 mb-1" />
                <span className="text-xs">Custom</span>
                <span className="text-[10px] text-muted-foreground">{totalPorts} ports</span>
              </Button>
            </div>
          </div>

          {/* Port configuration */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Ports per Direction</Label>
            <div className="grid grid-cols-5 gap-2">
              {(['north', 'south', 'east', 'west', 'local'] as const).map(direction => (
                <div key={direction} className="space-y-1">
                  <div className="flex items-center gap-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: PORT_DIRECTION_COLORS[direction] }}
                    />
                    <Label className="text-[10px] text-muted-foreground capitalize">
                      {direction.charAt(0).toUpperCase()}
                    </Label>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    max={8}
                    value={portConfig[direction]}
                    onChange={(e) => handlePortConfigChange(direction, parseInt(e.target.value) || 0)}
                    className="h-8 text-center text-sm px-1"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-secondary/30 rounded-lg p-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Ports:</span>
              <span className="font-mono">{totalPorts}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Router
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
