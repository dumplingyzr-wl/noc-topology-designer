/*
 * NoC Canvas Component - Main drawing area
 * Design: Dark Professional
 * - Infinite canvas with pan and zoom
 * - Grid background
 * - SVG-based rendering for connections
 * - Optimized port layout for high-radix routers
 * - Smart connection routing
 */

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { RouterNode, Connection, ViewportState, ToolMode, CanvasSettings, PortDirection, PORT_IO_COLORS, PORT_IO_TYPE_BY_DIRECTION, CONNECTION_COLORS } from '@/types/noc';
import { generateBezierPath, generateOrthogonalPath, generateStraightPath, bundleConnections } from '@/lib/routing';
import { cn } from '@/lib/utils';

interface NocCanvasProps {
  nodes: RouterNode[];
  connections: Connection[];
  viewport: ViewportState;
  selectedNodes: string[];
  selectedConnections: string[];
  toolMode: ToolMode;
  settings: CanvasSettings;
  onViewportChange: (viewport: Partial<ViewportState>) => void;
  onNodeMove: (nodeId: string, x: number, y: number) => void;
  onNodeMoveEnd: () => void;
  onNodeResize: (nodeId: string, width: number, height: number) => void;
  onNodeResizeEnd: () => void;
  onNodeSelect: (nodeId: string, addToSelection: boolean) => void;
  onConnectionSelect: (connectionId: string, addToSelection: boolean) => void;
  onPortClick: (nodeId: string, portId: string) => void;
  onCanvasClick: () => void;
  onAddNode: (x: number, y: number) => void;
  connectingPort: { nodeId: string; portId: string } | null;
}

interface PortPosition {
  x: number;
  y: number;
  direction: PortDirection;
  nodeId: string;
  portId: string;
}

// Calculate optimized port positions around the node
// Uses circular distribution for high-radix routers
function getPortPosition(
  node: RouterNode,
  port: { direction: PortDirection; index: number; id: string },
  totalPortsInDirection: number
): PortPosition {
  const portRadius = 5;
  const portSpacing = 18; // Spacing between ports
  const minSpacing = 14; // Minimum spacing for dense ports
  
  // Calculate actual spacing based on available space
  const getActualSpacing = (total: number, availableSpace: number) => {
    const neededSpace = (total - 1) * portSpacing;
    if (neededSpace > availableSpace) {
      return Math.max(minSpacing, availableSpace / (total - 1 || 1));
    }
    return portSpacing;
  };
  
  let x: number, y: number;
  
  switch (port.direction) {
    case 'north': {
      const spacing = getActualSpacing(totalPortsInDirection, node.width - 20);
      const totalWidth = (totalPortsInDirection - 1) * spacing;
      const startX = node.x + (node.width - totalWidth) / 2;
      x = startX + port.index * spacing;
      y = node.y - portRadius;
      break;
    }
    case 'south': {
      const spacing = getActualSpacing(totalPortsInDirection, node.width - 20);
      const totalWidth = (totalPortsInDirection - 1) * spacing;
      const startX = node.x + (node.width - totalWidth) / 2;
      x = startX + port.index * spacing;
      y = node.y + node.height + portRadius;
      break;
    }
    case 'east': {
      const spacing = getActualSpacing(totalPortsInDirection, node.height - 20);
      const totalHeight = (totalPortsInDirection - 1) * spacing;
      const startY = node.y + (node.height - totalHeight) / 2;
      x = node.x + node.width + portRadius;
      y = startY + port.index * spacing;
      break;
    }
    case 'west': {
      const spacing = getActualSpacing(totalPortsInDirection, node.height - 20);
      const totalHeight = (totalPortsInDirection - 1) * spacing;
      const startY = node.y + (node.height - totalHeight) / 2;
      x = node.x - portRadius;
      y = startY + port.index * spacing;
      break;
    }
    case 'local': {
      // Local ports at the bottom inside the node
      const spacing = getActualSpacing(totalPortsInDirection, node.width - 30);
      const totalWidth = (totalPortsInDirection - 1) * spacing;
      const startX = node.x + (node.width - totalWidth) / 2;
      x = startX + port.index * spacing;
      y = node.y + node.height - 15;
      break;
    }
    default:
      x = node.x;
      y = node.y;
  }
  
  return { x, y, direction: port.direction, nodeId: node.id, portId: port.id };
}

// Generate connection path based on routing mode
function generateConnectionPath(
  source: PortPosition,
  target: PortPosition,
  routingMode: 'bezier' | 'orthogonal' | 'straight',
  bundleOffset: number = 0
): string {
  switch (routingMode) {
    case 'bezier':
      return generateBezierPath(source, target, bundleOffset);
    case 'orthogonal':
      return generateOrthogonalPath(source, target, [], [], bundleOffset);
    case 'straight':
      return generateStraightPath(source, target, bundleOffset);
    default:
      return generateBezierPath(source, target, bundleOffset);
  }
}

export function NocCanvas({
  nodes,
  connections,
  viewport,
  selectedNodes,
  selectedConnections,
  toolMode,
  settings,
  onViewportChange,
  onNodeMove,
  onNodeMoveEnd,
  onNodeResize,
  onNodeResizeEnd,
  onNodeSelect,
  onConnectionSelect,
  onPortClick,
  onCanvasClick,
  onAddNode,
  connectingPort,
}: NocCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeNodeId, setResizeNodeId] = useState<string | null>(null);
  const [resizeOrigin, setResizeOrigin] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredPort, setHoveredPort] = useState<{ nodeId: string; portId: string } | null>(null);
  const connectingPortType = useMemo(() => {
    if (!connectingPort) return null;
    const node = nodes.find(item => item.id === connectingPort.nodeId);
    const port = node?.ports.find(item => item.id === connectingPort.portId);
    if (!port) return null;
    return port.ioType ?? PORT_IO_TYPE_BY_DIRECTION[port.direction];
  }, [connectingPort, nodes]);

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    
    return {
      x: (screenX - rect.left - viewport.x) / viewport.zoom,
      y: (screenY - rect.top - viewport.y) / viewport.zoom,
    };
  }, [viewport]);

  // Handle mouse wheel for zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(3, viewport.zoom * zoomFactor));
    
    // Zoom towards mouse position
    const newX = mouseX - (mouseX - viewport.x) * (newZoom / viewport.zoom);
    const newY = mouseY - (mouseY - viewport.y) * (newZoom / viewport.zoom);
    
    onViewportChange({ x: newX, y: newY, zoom: newZoom });
  }, [viewport, onViewportChange]);

  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && toolMode === 'pan')) {
      // Middle mouse button or pan tool - start panning
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
      e.preventDefault();
    } else if (e.button === 0 && toolMode === 'add-router') {
      // Add router at click position
      const pos = screenToCanvas(e.clientX, e.clientY);
      if (settings.snapToGrid) {
        pos.x = Math.round(pos.x / settings.gridSize) * settings.gridSize;
        pos.y = Math.round(pos.y / settings.gridSize) * settings.gridSize;
      }
      onAddNode(pos.x, pos.y);
    } else if (e.button === 0 && (toolMode === 'select' || toolMode === 'connect')) {
      // Click on empty canvas - clear selection (but not when clicking on ports)
      const target = e.target as HTMLElement;
      if (target.classList.contains('noc-canvas-bg') || target.tagName === 'rect') {
        onCanvasClick();
      }
    }
  }, [toolMode, viewport, screenToCanvas, settings, onAddNode, onCanvasClick]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    setMousePos(canvasPos);
    
    if (isPanning) {
      onViewportChange({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else if (isDragging && dragNodeId) {
      let newX = canvasPos.x - dragOffset.x;
      let newY = canvasPos.y - dragOffset.y;
      
      if (settings.snapToGrid) {
        newX = Math.round(newX / settings.gridSize) * settings.gridSize;
        newY = Math.round(newY / settings.gridSize) * settings.gridSize;
      }
      
      onNodeMove(dragNodeId, newX, newY);
    } else if (resizeNodeId) {
      const deltaX = canvasPos.x - resizeOrigin.x;
      const deltaY = canvasPos.y - resizeOrigin.y;
      let nextWidth = resizeOrigin.width + deltaX;
      let nextHeight = resizeOrigin.height + deltaY;
      if (settings.snapToGrid) {
        nextWidth = Math.round(nextWidth / settings.gridSize) * settings.gridSize;
        nextHeight = Math.round(nextHeight / settings.gridSize) * settings.gridSize;
      }
      nextWidth = Math.max(40, nextWidth);
      nextHeight = Math.max(40, nextHeight);
      onNodeResize(resizeNodeId, nextWidth, nextHeight);
    }
  }, [isPanning, isDragging, dragNodeId, dragOffset, panStart, screenToCanvas, settings, onViewportChange, onNodeMove, resizeNodeId, resizeOrigin, onNodeResize]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
    }
    if (isDragging) {
      setIsDragging(false);
      setDragNodeId(null);
      onNodeMoveEnd();
    }
    if (resizeNodeId) {
      setResizeNodeId(null);
      onNodeResizeEnd();
    }
  }, [isPanning, isDragging, resizeNodeId, onNodeMoveEnd, onNodeResizeEnd]);

  // Handle node mouse down
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (toolMode !== 'select') return;
    e.stopPropagation();
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    setDragOffset({ x: canvasPos.x - node.x, y: canvasPos.y - node.y });
    setIsDragging(true);
    setDragNodeId(nodeId);
    
    onNodeSelect(nodeId, e.shiftKey || e.ctrlKey);
  }, [toolMode, nodes, screenToCanvas, onNodeSelect]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (toolMode !== 'select') return;
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    setResizeOrigin({ x: canvasPos.x, y: canvasPos.y, width: node.width, height: node.height });
    setResizeNodeId(nodeId);
    onNodeSelect(nodeId, false);
  }, [toolMode, nodes, screenToCanvas, onNodeSelect]);

  // Handle port click
  const handlePortClick = useCallback((e: React.MouseEvent, nodeId: string, portId: string) => {
    e.stopPropagation();
    if (toolMode === 'connect' || toolMode === 'select') {
      onPortClick(nodeId, portId);
    }
  }, [toolMode, onPortClick]);

  // Handle connection click
  const handleConnectionClick = useCallback((e: React.MouseEvent, connectionId: string) => {
    e.stopPropagation();
    if (toolMode === 'select') {
      onConnectionSelect(connectionId, e.shiftKey || e.ctrlKey);
    }
  }, [toolMode, onConnectionSelect]);

  // Build port count map for each node
  const portCountMap = useMemo(() => {
    const map = new Map<string, Map<PortDirection, number>>();
    nodes.forEach(node => {
      const dirCounts = new Map<PortDirection, number>();
      node.ports.forEach(port => {
        dirCounts.set(port.direction, (dirCounts.get(port.direction) || 0) + 1);
      });
      map.set(node.id, dirCounts);
    });
    return map;
  }, [nodes]);

  // Get port position helper
  const getPortPos = useCallback((nodeId: string, portId: string): PortPosition | null => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;
    
    const port = node.ports.find(p => p.id === portId);
    if (!port) return null;
    
    const dirCounts = portCountMap.get(nodeId);
    const totalInDir = dirCounts?.get(port.direction) || 1;
    
    return getPortPosition(node, port, totalInDir);
  }, [nodes, portCountMap]);

  // Calculate connection bundles for parallel connections
  const connectionBundles = useMemo(() => {
    return bundleConnections(connections, nodes);
  }, [connections, nodes]);

  // Render grid pattern
  const gridPattern = useMemo(() => {
    if (!settings.showGrid) return null;
    const gridSize = settings.gridSize * viewport.zoom;
    const offsetX = viewport.x % gridSize;
    const offsetY = viewport.y % gridSize;
    
    return (
      <pattern
        id="grid"
        width={gridSize}
        height={gridSize}
        patternUnits="userSpaceOnUse"
        x={offsetX}
        y={offsetY}
      >
        <path
          d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="1"
        />
      </pattern>
    );
  }, [settings.showGrid, settings.gridSize, viewport]);

  // Major grid pattern (every 5 cells)
  const majorGridPattern = useMemo(() => {
    if (!settings.showGrid) return null;
    const gridSize = settings.gridSize * viewport.zoom * 5;
    const offsetX = viewport.x % gridSize;
    const offsetY = viewport.y % gridSize;
    
    return (
      <pattern
        id="majorGrid"
        width={gridSize}
        height={gridSize}
        patternUnits="userSpaceOnUse"
        x={offsetX}
        y={offsetY}
      >
        <path
          d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
      </pattern>
    );
  }, [settings.showGrid, settings.gridSize, viewport]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full h-full overflow-hidden relative",
        isPanning && "cursor-grabbing",
        toolMode === 'pan' && !isPanning && "cursor-grab",
        toolMode === 'add-router' && "cursor-crosshair",
        toolMode === 'connect' && "cursor-crosshair"
      )}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg
        className="w-full h-full noc-canvas-bg"
        style={{ background: 'var(--background)' }}
      >
        {/* Grid */}
        <defs>
          {gridPattern}
          {majorGridPattern}
          {/* Glow filter for selected elements */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Node gradient */}
          <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity={0.08} />
            <stop offset="100%" stopColor="black" stopOpacity={0.15} />
          </linearGradient>
          {/* Port glow gradient */}
          <radialGradient id="portGlow">
            <stop offset="0%" stopColor="currentColor" stopOpacity={0.6} />
            <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
          </radialGradient>
        </defs>
        
        {settings.showGrid && (
          <>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <rect width="100%" height="100%" fill="url(#majorGrid)" />
          </>
        )}
        
        {/* Transform group for zoom and pan */}
        <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}>
          {/* Connections */}
          {connections.map(conn => {
            const sourcePos = getPortPos(conn.sourceNodeId, conn.sourcePortId);
            const targetPos = getPortPos(conn.targetNodeId, conn.targetPortId);
            
            if (!sourcePos || !targetPos) return null;
            
            const bundleOffset = connectionBundles.get(conn.id) || 0;
            const path = generateConnectionPath(
              sourcePos,
              targetPos,
              settings.routingMode,
              bundleOffset
            );
            
            const isSelected = selectedConnections.includes(conn.id);
            const color = conn.color || CONNECTION_COLORS[conn.type || 'data'];
            
            return (
              <g key={conn.id} className="noc-connection">
                {/* Hit area for easier selection */}
                <path
                  d={path}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={14}
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => handleConnectionClick(e, conn.id)}
                />
                {/* Glow effect for selected */}
                {isSelected && (
                  <path
                    d={path}
                    fill="none"
                    stroke={color}
                    strokeWidth={8}
                    opacity={0.25}
                    filter="url(#glow)"
                  />
                )}
                {/* Main connection line */}
                <path
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  opacity={isSelected ? 1 : 0.75}
                  strokeLinecap="round"
                  onClick={(e) => handleConnectionClick(e, conn.id)}
                  style={{ cursor: 'pointer' }}
                />
                {/* Direction indicator (small arrow) */}
                {settings.routingMode !== 'orthogonal' && (
                  <circle
                    cx={targetPos.x}
                    cy={targetPos.y}
                    r={3}
                    fill={color}
                    opacity={0.8}
                  />
                )}
              </g>
            );
          })}
          
          {/* Connecting line preview */}
          {connectingPort && (
            <g>
              <path
                d={(() => {
                  const sourcePos = getPortPos(connectingPort.nodeId, connectingPort.portId);
                  if (!sourcePos) return '';
                  return `M ${sourcePos.x} ${sourcePos.y} L ${mousePos.x} ${mousePos.y}`;
                })()}
                fill="none"
                stroke="#22d3ee"
                strokeWidth={2}
                strokeDasharray="6,4"
                opacity={0.7}
              />
              {/* Target indicator */}
              <circle
                cx={mousePos.x}
                cy={mousePos.y}
                r={6}
                fill="none"
                stroke="#22d3ee"
                strokeWidth={2}
                opacity={0.5}
              />
            </g>
          )}
          
          {/* Nodes */}
          {nodes.map(node => {
            const isSelected = selectedNodes.includes(node.id);
            const dirCounts = portCountMap.get(node.id);
            
            return (
              <g
                key={node.id}
                className="noc-node"
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              >
                {/* Selection glow */}
                {isSelected && (
                  <rect
                    x={node.x - 6}
                    y={node.y - 6}
                    width={node.width + 12}
                    height={node.height + 12}
                    rx={10}
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth={2}
                    opacity={0.4}
                    filter="url(#glow)"
                  />
                )}
                
                {/* Node shadow */}
                <rect
                  x={node.x + 2}
                  y={node.y + 3}
                  width={node.width}
                  height={node.height}
                  rx={6}
                  fill="black"
                  opacity={0.3}
                />
                
                {/* Node body */}
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.width}
                  height={node.height}
                  rx={6}
                  fill={node.color || '#252525'}
                  stroke={isSelected ? '#22d3ee' : '#3d3d3d'}
                  strokeWidth={isSelected ? 2 : 1}
                  style={{ cursor: toolMode === 'select' ? 'move' : 'default' }}
                />
                
                {/* Node gradient overlay */}
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.width}
                  height={node.height}
                  rx={6}
                  fill="url(#nodeGradient)"
                  pointerEvents="none"
                />
                
                {/* Node label */}
                <text
                  x={node.x + node.width / 2}
                  y={node.y + node.height / 2 - 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={node.textColor || '#e5e5e5'}
                  fontSize={13}
                  fontFamily="'JetBrains Mono', monospace"
                  fontWeight={600}
                  pointerEvents="none"
                >
                  {node.label}
                </text>
                
                {/* Ports */}
                {node.ports.map(port => {
                  const totalInDir = dirCounts?.get(port.direction) || 1;
                  const pos = getPortPosition(node, port, totalInDir);
                  const portIoType = port.ioType ?? PORT_IO_TYPE_BY_DIRECTION[port.direction];
                  const color = PORT_IO_COLORS[portIoType];
                  const isConnecting = connectingPort?.nodeId === node.id && connectingPort?.portId === port.id;
                  const isHovered = hoveredPort?.nodeId === node.id && hoveredPort?.portId === port.id;
                  const canConnect = Boolean(
                    connectingPort &&
                    connectingPort.nodeId !== node.id &&
                    connectingPortType &&
                    connectingPortType !== portIoType
                  );
                  
                  return (
                    <g 
                      key={port.id} 
                      className="noc-port"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredPort({ nodeId: node.id, portId: port.id })}
                      onMouseLeave={() => setHoveredPort(null)}
                      onClick={(e) => handlePortClick(e, node.id, port.id)}
                    >
                      {/* Port hit area - larger invisible circle for easier clicking */}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={14}
                        fill="rgba(0,0,0,0.01)"
                        style={{ cursor: 'pointer' }}
                      />
                      
                      {/* Port glow when hovering or can connect */}
                      {(isHovered || isConnecting || canConnect) && (
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={10}
                          fill={color}
                          opacity={isConnecting ? 0.4 : 0.2}
                          pointerEvents="none"
                        />
                      )}
                      
                      {/* Port outer ring */}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={isConnecting || isHovered ? 6 : 5}
                        fill="#1a1a1a"
                        stroke={color}
                        strokeWidth={isConnecting ? 2.5 : 2}
                        pointerEvents="none"
                      />
                      
                      {/* Port inner dot */}
                      {(isConnecting || isHovered) && (
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={2}
                          fill={color}
                          pointerEvents="none"
                        />
                      )}
                      
                      {/* Port label */}
                      {settings.showPortLabels && (
                        <text
                          x={pos.x + (port.direction === 'east' ? 14 : port.direction === 'west' ? -14 : 0)}
                          y={pos.y + (port.direction === 'south' ? 16 : port.direction === 'north' ? -12 : 0)}
                          textAnchor={port.direction === 'east' ? 'start' : port.direction === 'west' ? 'end' : 'middle'}
                          dominantBaseline="middle"
                          fill="#666"
                          fontSize={8}
                          fontFamily="'JetBrains Mono', monospace"
                          pointerEvents="none"
                        >
                          {port.label}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Resize handle */}
                {toolMode === 'select' && (
                  <g
                    onMouseDown={(e) => handleResizeMouseDown(e, node.id)}
                    style={{ cursor: 'nwse-resize' }}
                  >
                    <rect
                      x={node.x + node.width - 10}
                      y={node.y + node.height - 10}
                      width={10}
                      height={10}
                      fill="rgba(34,211,238,0.9)"
                      stroke="#0ea5e9"
                      strokeWidth={1}
                      rx={2}
                    />
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>
      
      {/* Status bar */}
      <div className="absolute bottom-2 left-2 flex items-center gap-3 text-xs text-muted-foreground font-mono bg-card/90 backdrop-blur-sm px-3 py-1.5 rounded-md border border-border/50">
        <span>X: {Math.round(mousePos.x)}</span>
        <span>Y: {Math.round(mousePos.y)}</span>
        <span className="text-border">|</span>
        <span>Zoom: {Math.round(viewport.zoom * 100)}%</span>
        {nodes.length > 0 && (
          <>
            <span className="text-border">|</span>
            <span>{nodes.length} nodes</span>
            <span>{connections.length} connections</span>
          </>
        )}
      </div>
      
      {/* Tool indicator */}
      <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-card/90 backdrop-blur-sm px-3 py-1.5 rounded-md border border-border/50 capitalize">
        {toolMode === 'add-router' ? 'Add Router' : toolMode}
      </div>
    </div>
  );
}
