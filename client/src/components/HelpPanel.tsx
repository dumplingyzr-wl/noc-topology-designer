/*
 * Help Panel Component - Keyboard shortcuts and tips
 * Design: Dark Professional
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Keyboard, Mouse, Info } from 'lucide-react';

interface HelpPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
}

const toolShortcuts: ShortcutItem[] = [
  { keys: ['V'], description: 'Select tool' },
  { keys: ['H'], description: 'Pan tool' },
  { keys: ['R'], description: 'Add router tool' },
  { keys: ['C'], description: 'Connect tool' },
];

const actionShortcuts: ShortcutItem[] = [
  { keys: ['Ctrl', 'Z'], description: 'Undo' },
  { keys: ['Ctrl', 'Y'], description: 'Redo' },
  { keys: ['Delete'], description: 'Delete selected' },
  { keys: ['Escape'], description: 'Clear selection / Cancel' },
  { keys: ['F'], description: 'Fit to view' },
];

const mouseShortcuts: ShortcutItem[] = [
  { keys: ['Scroll'], description: 'Zoom in/out' },
  { keys: ['Middle drag'], description: 'Pan canvas' },
  { keys: ['Shift + Click'], description: 'Add to selection' },
];

function ShortcutList({ items }: { items: ShortcutItem[] }) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{item.description}</span>
          <div className="flex items-center gap-1">
            {item.keys.map((key, keyIndex) => (
              <span key={keyIndex}>
                <kbd className="px-2 py-1 text-xs bg-secondary rounded border border-border font-mono">
                  {key}
                </kbd>
                {keyIndex < item.keys.length - 1 && (
                  <span className="text-muted-foreground mx-1">+</span>
                )}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function HelpPanel({ open, onOpenChange }: HelpPanelProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Tools */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              Tools
            </h4>
            <ShortcutList items={toolShortcuts} />
          </div>
          
          <Separator />
          
          {/* Actions */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              Actions
            </h4>
            <ShortcutList items={actionShortcuts} />
          </div>
          
          <Separator />
          
          {/* Mouse */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Mouse className="h-4 w-4" />
              Mouse
            </h4>
            <ShortcutList items={mouseShortcuts} />
          </div>
          
          <Separator />
          
          {/* Tips */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Info className="h-4 w-4" />
              Tips
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Click a port, then click another port to create a connection</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Use the Generate menu to quickly create mesh topologies</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>High-radix routers automatically adjust port spacing</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Export your topology as JSON to save or share</span>
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
