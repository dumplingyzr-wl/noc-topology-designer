/*
 * NoC Topology Designer - Main Page
 * Design: Dark Professional
 * 
 * A specialized GUI tool for drawing NoC topologies with:
 * - Dynamic anchor points for high-radix routers
 * - Optimized connection routing
 * - Physical position representation
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTopology } from '@/hooks/useTopology';
import { NocCanvas } from '@/components/NocCanvas';
import { Toolbar } from '@/components/Toolbar';
import { PropertiesPanel } from '@/components/PropertiesPanel';
import { MeshDialog } from '@/components/MeshDialog';
import { ButterflyDialog } from '@/components/ButterflyDialog';
import { AddRouterDialog } from '@/components/AddRouterDialog';
import { Minimap } from '@/components/Minimap';
import { HelpPanel } from '@/components/HelpPanel';
import { PortConfig, DEFAULT_PORT_CONFIG, PORT_IO_TYPE_BY_DIRECTION, RouterNode } from '@/types/noc';
import { toast } from 'sonner';
import { PanelRightClose, PanelRightOpen, Network, HelpCircle, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Home() {
  const {
    nodes,
    connections,
    viewport,
    selection,
    toolMode,
    settings,
    canUndo,
    canRedo,
    undo,
    redo,
    addNode,
    duplicateNode,
    updateNodePosition,
    updateNodeSize,
    finalizeNodePosition,
    finalizeNodeSize,
    updateNode,
    deleteNode,
    addPort,
    removePort,
    addConnection,
    deleteConnection,
    removeConnectionsForPort,
    updateViewport,
    setSelection,
    clearSelection,
    setToolMode,
    updateSettings,
    deleteSelected,
    clearAll,
    exportTopology,
    exportDrawio,
    importTopology,
    generateMeshTopology,
    generateButterflyTopology,
    generateClosTopology,
  } = useTopology();

  const [showProperties, setShowProperties] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showMeshDialog, setShowMeshDialog] = useState(false);
  const [showButterflyDialog, setShowButterflyDialog] = useState(false);
  const [showAddRouterDialog, setShowAddRouterDialog] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [pendingRouterPosition, setPendingRouterPosition] = useState({ x: 0, y: 0 });
  const [connectingPort, setConnectingPort] = useState<{ nodeId: string; portId: string } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });
  const [copiedNodes, setCopiedNodes] = useState<RouterNode[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Track canvas size
  useEffect(() => {
    const updateSize = () => {
      if (canvasContainerRef.current) {
        setCanvasSize({
          width: canvasContainerRef.current.clientWidth,
          height: canvasContainerRef.current.clientHeight,
        });
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [showProperties]);

  // Keyboard shortcuts
  const getPortIoType = useCallback((nodeId: string, portId: string) => {
    const node = nodes.find(item => item.id === nodeId);
    const port = node?.ports.find(item => item.id === portId);
    if (!port) return null;
    return port.ioType ?? PORT_IO_TYPE_BY_DIRECTION[port.direction];
  }, [nodes]);

  const getUniqueLabel = useCallback((baseLabel: string) => {
    const existing = new Set(nodes.map(node => node.label));
    let candidate = `${baseLabel}-copy`;
    if (!existing.has(candidate)) {
      return candidate;
    }
    let index = 2;
    while (existing.has(`${baseLabel}-copy-${index}`)) {
      index += 1;
    }
    return `${baseLabel}-copy-${index}`;
  }, [nodes]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
        if (selection.selectedNodes.length > 0) {
          const selected = nodes.filter(item => selection.selectedNodes.includes(item.id));
          if (selected.length > 0) {
            setCopiedNodes(selected);
            toast.success(
              selected.length > 1
                ? `${selected.length} routers copied`
                : 'Router copied'
            );
          }
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        if (copiedNodes.length > 0) {
          let firstLabel = '';
          copiedNodes.forEach((node, index) => {
            const label = getUniqueLabel(node.label);
            if (index === 0) {
              firstLabel = label;
            }
            duplicateNode(
              node,
              node.x + 40 + index * 10,
              node.y + 40 + index * 10,
              label
            );
          });
          toast.success(
            copiedNodes.length > 1
              ? `${copiedNodes.length} routers pasted`
              : `Router "${firstLabel}" pasted`
          );
        }
        return;
      }

      if (e.key === 'v' || e.key === 'V') {
        setToolMode('select');
      } else if (e.key === 'h' || e.key === 'H') {
        setToolMode('pan');
      } else if (e.key === 'r' || e.key === 'R') {
        setToolMode('add-router');
      } else if (e.key === 'c' || e.key === 'C') {
        setToolMode('connect');
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selection.selectedNodes.length > 0 || selection.selectedConnections.length > 0) {
          deleteSelected();
        }
      } else if (e.key === 'Escape') {
        clearSelection();
        setConnectingPort(null);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        redo();
      } else if (e.key === 'f' || e.key === 'F') {
        handleZoomFit();
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        setShowHelp(true);
      } else if (e.key === 'm' || e.key === 'M') {
        setShowMinimap(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setToolMode, selection, deleteSelected, clearSelection, undo, redo, nodes, copiedNodes, duplicateNode, getUniqueLabel]);

  // Handle node selection
  const handleNodeSelect = useCallback((nodeId: string, addToSelection: boolean) => {
    if (addToSelection) {
      const isSelected = selection.selectedNodes.includes(nodeId);
      setSelection({
        selectedNodes: isSelected
          ? selection.selectedNodes.filter(id => id !== nodeId)
          : [...selection.selectedNodes, nodeId],
      });
    } else {
      if (selection.selectedNodes.includes(nodeId)) {
        return;
      }
      setSelection({
        selectedNodes: [nodeId],
        selectedConnections: [],
        selectedPorts: [],
      });
    }
  }, [selection.selectedNodes, setSelection]);

  const handleNodesSelect = useCallback((nodeIds: string[], addToSelection: boolean) => {
    if (addToSelection) {
      const merged = Array.from(new Set([...selection.selectedNodes, ...nodeIds]));
      setSelection({
        selectedNodes: merged,
        selectedConnections: [],
        selectedPorts: [],
      });
    } else {
      setSelection({
        selectedNodes: nodeIds,
        selectedConnections: [],
        selectedPorts: [],
      });
    }
  }, [selection.selectedNodes, setSelection]);

  // Handle connection selection
  const handleConnectionSelect = useCallback((connectionId: string, addToSelection: boolean) => {
    if (addToSelection) {
      const isSelected = selection.selectedConnections.includes(connectionId);
      setSelection({
        selectedConnections: isSelected
          ? selection.selectedConnections.filter(id => id !== connectionId)
          : [...selection.selectedConnections, connectionId],
      });
    } else {
      setSelection({
        selectedNodes: [],
        selectedConnections: [connectionId],
        selectedPorts: [],
      });
    }
  }, [selection.selectedConnections, setSelection]);

  // Handle port click for connections
  const getConnectionForPort = useCallback((portId: string) => (
    connections.find(conn => conn.sourcePortId === portId || conn.targetPortId === portId) || null
  ), [connections]);

  const getOppositePort = useCallback((connectionId: string, portId: string) => {
    const connection = connections.find(conn => conn.id === connectionId);
    if (!connection) return null;
    if (connection.sourcePortId === portId) {
      return { nodeId: connection.targetNodeId, portId: connection.targetPortId };
    }
    if (connection.targetPortId === portId) {
      return { nodeId: connection.sourceNodeId, portId: connection.sourcePortId };
    }
    return null;
  }, [connections]);

  const handlePortClick = useCallback((nodeId: string, portId: string) => {
    if (toolMode === 'connect' || toolMode === 'select') {
      const existingConnection = getConnectionForPort(portId);
      const oppositePort = existingConnection ? getOppositePort(existingConnection.id, portId) : null;
      if (!connectingPort) {
        // Start connection
        if (existingConnection) {
          removeConnectionsForPort(portId);
          if (oppositePort) {
            setConnectingPort(oppositePort);
          } else {
            setConnectingPort({ nodeId, portId });
          }
          toast.info('Connection removed. Select another port to reconnect.');
        } else {
          setConnectingPort({ nodeId, portId });
          toast.info('Click another port to complete the connection');
        }
      } else {
        if (connectingPort.nodeId === nodeId && connectingPort.portId === portId) {
          setConnectingPort(null);
          return;
        }
        if (existingConnection) {
          removeConnectionsForPort(portId);
          if (oppositePort) {
            setConnectingPort(oppositePort);
          } else {
            setConnectingPort({ nodeId, portId });
          }
          toast.info('Connection removed. Select another port to reconnect.');
          return;
        }
        const sourceType = getPortIoType(connectingPort.nodeId, connectingPort.portId);
        const targetType = getPortIoType(nodeId, portId);
        if (!sourceType || !targetType) {
          setConnectingPort(null);
          return;
        }
        if (sourceType === targetType) {
          toast.error('Connections must be between input and output ports');
          return;
        }
        // Complete connection
        if (connectingPort.nodeId !== nodeId) {
          if (sourceType === 'input' && targetType === 'output') {
            addConnection(
              nodeId,
              portId,
              connectingPort.nodeId,
              connectingPort.portId
            );
          } else {
            addConnection(
              connectingPort.nodeId,
              connectingPort.portId,
              nodeId,
              portId
            );
          }
          toast.success('Connection created');
        }
        setConnectingPort(null);
      }
    }
  }, [
    toolMode,
    connectingPort,
    addConnection,
    getPortIoType,
    getConnectionForPort,
    getOppositePort,
    removeConnectionsForPort,
  ]);

  // Handle canvas click
  const handleCanvasClick = useCallback(() => {
    clearSelection();
    setConnectingPort(null);
  }, [clearSelection]);

  // Handle add node
  const handleAddNode = useCallback((x: number, y: number) => {
    setPendingRouterPosition({ x, y });
    setShowAddRouterDialog(true);
  }, []);

  // Handle add router from dialog
  const handleAddRouterConfirm = useCallback((label: string, portConfig: PortConfig) => {
    addNode(pendingRouterPosition.x, pendingRouterPosition.y, label, portConfig);
    toast.success(`Router "${label}" added`);
  }, [addNode, pendingRouterPosition]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(3, viewport.zoom * 1.2);
    updateViewport({ zoom: newZoom });
  }, [viewport.zoom, updateViewport]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(0.1, viewport.zoom / 1.2);
    updateViewport({ zoom: newZoom });
  }, [viewport.zoom, updateViewport]);

  const handleZoomFit = useCallback(() => {
    if (nodes.length === 0) {
      updateViewport({ x: 0, y: 0, zoom: 1 });
      return;
    }

    // Calculate bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(node => {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);
    });

    const padding = 100;
    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;

    const zoom = Math.min(
      canvasSize.width / contentWidth,
      canvasSize.height / contentHeight,
      2
    );

    const x = (canvasSize.width - contentWidth * zoom) / 2 - (minX - padding) * zoom;
    const y = (canvasSize.height - contentHeight * zoom) / 2 - (minY - padding) * zoom;

    updateViewport({ x, y, zoom });
  }, [nodes, canvasSize, updateViewport]);

  // Export topology
  const handleExport = useCallback(() => {
    const json = exportTopology();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'noc-topology.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Topology exported');
  }, [exportTopology]);

  const handleExportDrawio = useCallback(() => {
    const xml = exportDrawio();
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'noc-topology.drawio';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Draw.io file exported');
  }, [exportDrawio]);

  // Import topology
  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (importTopology(content)) {
        toast.success('Topology imported');
        // Fit to view after import
        setTimeout(handleZoomFit, 100);
      } else {
        toast.error('Failed to import topology');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [importTopology, handleZoomFit]);

  // Generate mesh
  const handleGenerateMesh = useCallback((rows: number, cols: number, portConfig: PortConfig) => {
    generateMeshTopology(rows, cols, portConfig);
    toast.success(`Generated ${rows}x${cols} mesh topology`);
    // Fit to view after generation
    setTimeout(handleZoomFit, 100);
  }, [generateMeshTopology, handleZoomFit]);

  // Generate butterfly
  const handleGenerateButterfly = useCallback((radix: number, stages: number) => {
    generateButterflyTopology(radix, stages);
    toast.success(`Generated ${radix}-ary ${stages}-fly butterfly topology`);
    setTimeout(handleZoomFit, 100);
  }, [generateButterflyTopology, handleZoomFit]);

  // Generate Clos
  const handleGenerateClos = useCallback((n: number, m: number, r: number) => {
    generateClosTopology(n, m, r);
    toast.success(`Generated Clos(${n}, ${m}, ${r}) topology`);
    setTimeout(handleZoomFit, 100);
  }, [generateClosTopology, handleZoomFit]);

  // Clear all confirmation
  const handleClearAll = useCallback(() => {
    setShowClearConfirm(true);
  }, []);

  const confirmClearAll = useCallback(() => {
    clearAll();
    setShowClearConfirm(false);
    toast.success('Canvas cleared');
  }, [clearAll]);

  // Get selected items for properties panel
  const selectedNodeObjects = nodes.filter(n => selection.selectedNodes.includes(n.id));
  const selectedConnectionObjects = connections.filter(c => selection.selectedConnections.includes(c.id));
  const hasSelection = selection.selectedNodes.length > 0 || selection.selectedConnections.length > 0;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="h-12 border-b border-border flex items-center px-4 gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-primary" />
          <h1 className="text-sm font-semibold">NoC Topology Designer</h1>
        </div>
        <div className="flex-1" />
        
        {/* Header actions */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowMinimap(!showMinimap)}
              >
                <Map className={`h-4 w-4 ${showMinimap ? 'text-primary' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Minimap (M)</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowHelp(true)}
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Help (?)</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowProperties(!showProperties)}
              >
                {showProperties ? (
                  <PanelRightClose className="h-4 w-4" />
                ) : (
                  <PanelRightOpen className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Properties Panel</TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* Toolbar */}
      <Toolbar
        toolMode={toolMode}
        settings={settings}
        canUndo={canUndo}
        canRedo={canRedo}
        hasSelection={hasSelection}
        onToolModeChange={setToolMode}
        onSettingsChange={updateSettings}
        onUndo={undo}
        onRedo={redo}
        onDelete={deleteSelected}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomFit={handleZoomFit}
        onExport={handleExport}
        onExportDrawio={handleExportDrawio}
        onImport={handleImport}
        onGenerateMesh={() => setShowMeshDialog(true)}
        onGenerateButterfly={() => setShowButterflyDialog(true)}
        onClearAll={handleClearAll}
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div ref={canvasContainerRef} className="flex-1 relative">
          <NocCanvas
            nodes={nodes}
            connections={connections}
            viewport={viewport}
            selectedNodes={selection.selectedNodes}
            selectedConnections={selection.selectedConnections}
            toolMode={toolMode}
            settings={settings}
            onViewportChange={updateViewport}
            onNodeMove={updateNodePosition}
            onNodeMoveEnd={finalizeNodePosition}
            onNodeResize={updateNodeSize}
            onNodeResizeEnd={finalizeNodeSize}
            onNodeSelect={handleNodeSelect}
            onNodesSelect={handleNodesSelect}
            onConnectionSelect={handleConnectionSelect}
            onPortClick={handlePortClick}
            onCanvasClick={handleCanvasClick}
            onAddNode={handleAddNode}
            connectingPort={connectingPort}
          />
          
          {/* Minimap */}
          {showMinimap && nodes.length > 0 && (
            <Minimap
              nodes={nodes}
              connections={connections}
              viewport={viewport}
              canvasWidth={canvasSize.width}
              canvasHeight={canvasSize.height}
              onViewportChange={updateViewport}
              className="top-3 right-3"
            />
          )}
          
          {/* Empty state */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center space-y-4 max-w-md">
                <Network className="h-16 w-16 mx-auto text-muted-foreground/30" />
                <div className="space-y-2">
                  <h2 className="text-lg font-medium text-muted-foreground">
                    Start designing your NoC topology
                  </h2>
                  <p className="text-sm text-muted-foreground/70">
                    Use the toolbar to add routers, or generate a mesh topology to get started.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    <kbd className="px-2 py-1 text-xs bg-secondary rounded border border-border">R</kbd>
                    <span className="text-xs text-muted-foreground/70">Add Router</span>
                    <kbd className="px-2 py-1 text-xs bg-secondary rounded border border-border">C</kbd>
                    <span className="text-xs text-muted-foreground/70">Connect</span>
                    <kbd className="px-2 py-1 text-xs bg-secondary rounded border border-border">?</kbd>
                    <span className="text-xs text-muted-foreground/70">Help</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Properties panel */}
        {showProperties && (
          <PropertiesPanel
            selectedNodes={selectedNodeObjects}
            selectedConnections={selectedConnectionObjects}
            onUpdateNode={updateNode}
            onDeleteNode={deleteNode}
            onAddPort={addPort}
            onRemovePort={removePort}
            onDeleteConnection={deleteConnection}
            onClose={() => setShowProperties(false)}
          />
        )}
      </div>

      {/* Dialogs */}
      <MeshDialog
        open={showMeshDialog}
        onOpenChange={setShowMeshDialog}
        onGenerate={handleGenerateMesh}
      />

      <ButterflyDialog
        open={showButterflyDialog}
        onOpenChange={setShowButterflyDialog}
        onGenerateButterfly={handleGenerateButterfly}
        onGenerateClos={handleGenerateClos}
      />

      <AddRouterDialog
        open={showAddRouterDialog}
        position={pendingRouterPosition}
        onOpenChange={setShowAddRouterDialog}
        onAdd={handleAddRouterConfirm}
        existingLabels={nodes.map(n => n.label)}
      />

      <HelpPanel
        open={showHelp}
        onOpenChange={setShowHelp}
      />

      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all routers and connections from the canvas. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClearAll}>Clear All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
