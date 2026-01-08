/*
 * Properties Panel Component - Edit selected node/connection properties
 * Design: Dark Professional
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RouterNode, Connection, PortConfig, CONNECTION_COLORS, PORT_DIRECTION_COLORS, ROUTER_THEME_PRESETS } from '@/types/noc';
import { X, Router, Cable, Plus, Minus, Trash2 } from 'lucide-react';

type PortConfigKey = keyof PortConfig;

interface PropertiesPanelProps {
  selectedNodes: RouterNode[];
  selectedConnections: Connection[];
  onUpdateNode: (nodeId: string, updates: Partial<RouterNode>) => void;
  onDeleteNode: (nodeId: string) => void;
  onAddPort: (nodeId: string, direction: PortConfigKey) => void;
  onRemovePort: (nodeId: string, direction: PortConfigKey) => void;
  onUpdateConnection?: (connectionId: string, updates: Partial<Connection>) => void;
  onDeleteConnection: (connectionId: string) => void;
  onClose: () => void;
}

export function PropertiesPanel({
  selectedNodes,
  selectedConnections,
  onUpdateNode,
  onDeleteNode,
  onAddPort,
  onRemovePort,
  onDeleteConnection,
  onClose,
}: PropertiesPanelProps) {
  const [nodeLabel, setNodeLabel] = useState('');
  const [nodeX, setNodeX] = useState('');
  const [nodeY, setNodeY] = useState('');
  const [nodeWidth, setNodeWidth] = useState('');
  const [nodeHeight, setNodeHeight] = useState('');
  
  // Update form when selection changes
  useEffect(() => {
    if (selectedNodes.length === 1) {
      const node = selectedNodes[0];
      setNodeLabel(node.label);
      setNodeX(String(Math.round(node.x)));
      setNodeY(String(Math.round(node.y)));
      setNodeWidth(String(Math.round(node.width)));
      setNodeHeight(String(Math.round(node.height)));
    }
  }, [selectedNodes]);

  const handleNodeLabelChange = () => {
    if (selectedNodes.length === 1 && nodeLabel.trim()) {
      onUpdateNode(selectedNodes[0].id, { label: nodeLabel.trim() });
    }
  };

  const handleNodePositionChange = () => {
    if (selectedNodes.length === 1) {
      const x = parseInt(nodeX);
      const y = parseInt(nodeY);
      if (!isNaN(x) && !isNaN(y)) {
        onUpdateNode(selectedNodes[0].id, { x, y });
      }
    }
  };

  const handleNodeSizeChange = () => {
    if (selectedNodes.length === 1) {
      const width = parseInt(nodeWidth);
      const height = parseInt(nodeHeight);
      if (!isNaN(width) && !isNaN(height)) {
        onUpdateNode(selectedNodes[0].id, {
          width: Math.max(40, width),
          height: Math.max(40, height),
        });
      }
    }
  };

  const isEmpty = selectedNodes.length === 0 && selectedConnections.length === 0;

  if (isEmpty) {
    return (
      <div className="w-72 bg-card border-l border-border flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="text-sm font-medium">Properties</h3>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-muted-foreground text-center">
            Select a node or connection to view its properties
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 bg-card border-l border-border flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="text-sm font-medium">Properties</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Node properties */}
          {selectedNodes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Router className="h-4 w-4" />
                <span>
                  {selectedNodes.length === 1 
                    ? 'Router Node' 
                    : `${selectedNodes.length} Nodes Selected`}
                </span>
              </div>
              
              {selectedNodes.length === 1 && (
                <>
                  {/* Label */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Label</Label>
                    <Input
                      value={nodeLabel}
                      onChange={(e) => setNodeLabel(e.target.value)}
                      onBlur={handleNodeLabelChange}
                      onKeyDown={(e) => e.key === 'Enter' && handleNodeLabelChange()}
                      className="h-8 text-sm font-mono"
                    />
                  </div>
                  
                  {/* Position */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">X Position</Label>
                      <Input
                        type="number"
                        value={nodeX}
                        onChange={(e) => setNodeX(e.target.value)}
                        onBlur={handleNodePositionChange}
                        onKeyDown={(e) => e.key === 'Enter' && handleNodePositionChange()}
                        className="h-8 text-sm font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Y Position</Label>
                      <Input
                        type="number"
                        value={nodeY}
                        onChange={(e) => setNodeY(e.target.value)}
                        onBlur={handleNodePositionChange}
                        onKeyDown={(e) => e.key === 'Enter' && handleNodePositionChange()}
                        className="h-8 text-sm font-mono"
                      />
                    </div>
                  </div>
                  
                  {/* Size */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Width</Label>
                      <Input
                        type="number"
                        value={nodeWidth}
                        onChange={(e) => setNodeWidth(e.target.value)}
                        onBlur={handleNodeSizeChange}
                        onKeyDown={(e) => e.key === 'Enter' && handleNodeSizeChange()}
                        className="h-8 text-sm font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Height</Label>
                      <Input
                        type="number"
                        value={nodeHeight}
                        onChange={(e) => setNodeHeight(e.target.value)}
                        onBlur={handleNodeSizeChange}
                        onKeyDown={(e) => e.key === 'Enter' && handleNodeSizeChange()}
                        className="h-8 text-sm font-mono"
                      />
                    </div>
                  </div>

                  <Separator />
                  
                  {/* Ports */}
                  <div className="space-y-2">
                    <Label className="text-xs">Ports ({selectedNodes[0].ports.length})</Label>
                    <div className="space-y-1">
                      {(['north', 'south', 'east', 'west', 'local'] as const).map(direction => {
                        const ports = selectedNodes[0].ports.filter(p => p.direction === direction);
                        
                        return (
                          <div key={direction} className="flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: PORT_DIRECTION_COLORS[direction] }}
                              />
                              <span className="capitalize text-muted-foreground w-12">{direction}</span>
                              <span className="font-mono">{ports.length}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => onRemovePort(selectedNodes[0].id, direction)}
                                disabled={ports.length === 0}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => onAddPort(selectedNodes[0].id, direction)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Theme presets */}
              <div className="space-y-2">
                <Label className="text-xs">Theme Presets</Label>
                <div className="flex flex-wrap gap-2">
                  {ROUTER_THEME_PRESETS.map(theme => (
                    <button
                      key={theme.name}
                      type="button"
                      className="h-7 w-10 rounded-md border border-border shadow-sm text-[9px] font-semibold"
                      style={{ backgroundColor: theme.fill, color: theme.text }}
                      onClick={() => selectedNodes.forEach(node => onUpdateNode(node.id, { color: theme.fill, textColor: theme.text }))}
                      aria-label={`Set router theme to ${theme.name}`}
                    >
                      {theme.name}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="h-7 px-2 rounded-md border border-border text-[10px] text-muted-foreground"
                    onClick={() => selectedNodes.forEach(node => onUpdateNode(node.id, { color: undefined, textColor: undefined }))}
                  >
                    Reset
                  </button>
                </div>
              </div>
              
              {/* Delete button */}
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => selectedNodes.forEach(n => onDeleteNode(n.id))}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete {selectedNodes.length > 1 ? 'Nodes' : 'Node'}
              </Button>
            </div>
          )}
          
          {selectedNodes.length > 0 && selectedConnections.length > 0 && (
            <Separator />
          )}
          
          {/* Connection properties */}
          {selectedConnections.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Cable className="h-4 w-4" />
                <span>
                  {selectedConnections.length === 1 
                    ? 'Connection' 
                    : `${selectedConnections.length} Connections Selected`}
                </span>
              </div>
              
              {selectedConnections.length === 1 && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Type</Label>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-1 rounded"
                        style={{ backgroundColor: CONNECTION_COLORS[selectedConnections[0].type || 'data'] }}
                      />
                      <span className="text-sm capitalize">{selectedConnections[0].type || 'data'}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Source</Label>
                    <div className="text-sm font-mono bg-secondary/50 rounded-md px-2 py-1">
                      {selectedConnections[0].sourceNodeId.slice(0, 8)}...
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Target</Label>
                    <div className="text-sm font-mono bg-secondary/50 rounded-md px-2 py-1">
                      {selectedConnections[0].targetNodeId.slice(0, 8)}...
                    </div>
                  </div>
                </>
              )}
              
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => selectedConnections.forEach(c => onDeleteConnection(c.id))}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete {selectedConnections.length > 1 ? 'Connections' : 'Connection'}
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
