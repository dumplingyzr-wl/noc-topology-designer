/*
 * Mesh Topology Generator Dialog
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
import { PortConfig, DEFAULT_PORT_CONFIG, HIGH_RADIX_PORT_CONFIG } from '@/types/noc';
import { LayoutGrid, Cpu } from 'lucide-react';

interface MeshDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (rows: number, cols: number, portConfig: PortConfig) => void;
}

export function MeshDialog({ open, onOpenChange, onGenerate }: MeshDialogProps) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [portConfig, setPortConfig] = useState<PortConfig>(DEFAULT_PORT_CONFIG);
  const [preset, setPreset] = useState<'standard' | 'high-radix' | 'custom'>('standard');

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

  const handleGenerate = () => {
    onGenerate(rows, cols, portConfig);
    onOpenChange(false);
  };

  const totalPorts = portConfig.north + portConfig.south + portConfig.east + portConfig.west + portConfig.local;
  const totalNodes = rows * cols;
  const totalConnections = (rows - 1) * cols + rows * (cols - 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
            Generate Mesh Topology
          </DialogTitle>
          <DialogDescription>
            Create a regular mesh network topology with configurable dimensions and port counts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Mesh dimensions */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Mesh Dimensions</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Rows</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={rows}
                  onChange={(e) => setRows(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Columns</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={cols}
                  onChange={(e) => setCols(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                  className="h-9"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Router preset */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Router Configuration</Label>
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
                  <Label className="text-[10px] text-muted-foreground capitalize">{direction.charAt(0)}</Label>
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

          <Separator />

          {/* Preview stats */}
          <div className="bg-secondary/30 rounded-lg p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Nodes:</span>
              <span className="font-mono">{totalNodes}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Connections:</span>
              <span className="font-mono">{totalConnections}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ports per Router:</span>
              <span className="font-mono">{totalPorts}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate}>
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
