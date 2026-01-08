/*
 * Butterfly/Clos Topology Generation Dialog
 * Design: Dark Professional
 * 
 * Generates multi-stage switching networks:
 * - Butterfly: k-ary n-fly topology
 * - Clos: Three-stage or multi-stage Clos network
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Network, Layers } from 'lucide-react';

interface ButterflyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerateButterfly: (radix: number, stages: number) => void;
  onGenerateClos: (n: number, m: number, r: number) => void;
}

export function ButterflyDialog({
  open,
  onOpenChange,
  onGenerateButterfly,
  onGenerateClos,
}: ButterflyDialogProps) {
  // Butterfly parameters
  const [radix, setRadix] = useState(2);
  const [stages, setStages] = useState(3);
  
  // Clos parameters
  const [closN, setClosN] = useState(4); // Number of input/output ports per first/last stage switch
  const [closM, setClosM] = useState(4); // Number of middle stage switches
  const [closR, setClosR] = useState(4); // Number of first/last stage switches

  const handleGenerateButterfly = () => {
    onGenerateButterfly(radix, stages);
    onOpenChange(false);
  };

  const handleGenerateClos = () => {
    onGenerateClos(closN, closM, closR);
    onOpenChange(false);
  };

  // Calculate butterfly stats
  const butterflyNodes = stages * Math.pow(radix, stages - 1);
  const butterflyInputs = Math.pow(radix, stages - 1);
  
  // Calculate Clos stats
  const closInputs = closN * closR;
  const closMiddleNodes = closM;
  const closTotalNodes = closR * 2 + closM;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Multi-Stage Network Generator
          </DialogTitle>
          <DialogDescription>
            Generate Butterfly (k-ary n-fly) or Clos network topologies
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="butterfly" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="butterfly" className="flex items-center gap-2">
              <Network className="w-4 h-4" />
              Butterfly
            </TabsTrigger>
            <TabsTrigger value="clos" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Clos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="butterfly" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="radix">Radix (k)</Label>
                <Input
                  id="radix"
                  type="number"
                  min={2}
                  max={8}
                  value={radix}
                  onChange={(e) => setRadix(Math.max(2, Math.min(8, parseInt(e.target.value) || 2)))}
                />
                <p className="text-xs text-muted-foreground">
                  Number of ports per switch (2-8)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stages">Stages (n)</Label>
                <Input
                  id="stages"
                  type="number"
                  min={2}
                  max={6}
                  value={stages}
                  onChange={(e) => setStages(Math.max(2, Math.min(6, parseInt(e.target.value) || 2)))}
                />
                <p className="text-xs text-muted-foreground">
                  Number of stages (2-6)
                </p>
              </div>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg space-y-1 text-sm">
              <p className="font-medium text-foreground">Topology Preview:</p>
              <p className="text-muted-foreground">
                • {radix}-ary {stages}-fly butterfly network
              </p>
              <p className="text-muted-foreground">
                • {butterflyNodes} switches total ({stages} stages × {Math.pow(radix, stages - 1)} per stage)
              </p>
              <p className="text-muted-foreground">
                • {butterflyInputs} input/output terminals
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerateButterfly}>
                Generate Butterfly
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="clos" className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="closN">n (ports)</Label>
                <Input
                  id="closN"
                  type="number"
                  min={2}
                  max={8}
                  value={closN}
                  onChange={(e) => setClosN(Math.max(2, Math.min(8, parseInt(e.target.value) || 2)))}
                />
                <p className="text-xs text-muted-foreground">
                  Ports per edge switch
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="closM">m (middle)</Label>
                <Input
                  id="closM"
                  type="number"
                  min={2}
                  max={16}
                  value={closM}
                  onChange={(e) => setClosM(Math.max(2, Math.min(16, parseInt(e.target.value) || 2)))}
                />
                <p className="text-xs text-muted-foreground">
                  Middle stage switches
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="closR">r (edge)</Label>
                <Input
                  id="closR"
                  type="number"
                  min={2}
                  max={16}
                  value={closR}
                  onChange={(e) => setClosR(Math.max(2, Math.min(16, parseInt(e.target.value) || 2)))}
                />
                <p className="text-xs text-muted-foreground">
                  Edge stage switches
                </p>
              </div>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg space-y-1 text-sm">
              <p className="font-medium text-foreground">Clos({closN}, {closM}, {closR}) Network:</p>
              <p className="text-muted-foreground">
                • {closTotalNodes} switches total ({closR} input + {closM} middle + {closR} output)
              </p>
              <p className="text-muted-foreground">
                • {closInputs} input/output ports ({closN} × {closR})
              </p>
              <p className="text-muted-foreground">
                • {closM >= closN ? 'Non-blocking' : 'Blocking'} configuration
                {closM >= 2 * closN - 1 && ' (strictly non-blocking)'}
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerateClos}>
                Generate Clos
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
