/*
 * Minimap Component - Overview navigation for large topologies
 * Design: Dark Professional
 */

import { useMemo, useCallback, useRef, useState } from 'react';
import { RouterNode, Connection, ViewportState } from '@/types/noc';
import { cn } from '@/lib/utils';

interface MinimapProps {
  nodes: RouterNode[];
  connections: Connection[];
  viewport: ViewportState;
  canvasWidth: number;
  canvasHeight: number;
  onViewportChange: (viewport: Partial<ViewportState>) => void;
  className?: string;
}

export function Minimap({
  nodes,
  connections,
  viewport,
  canvasWidth,
  canvasHeight,
  onViewportChange,
  className,
}: MinimapProps) {
  const minimapRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const minimapWidth = 180;
  const minimapHeight = 120;
  const padding = 20;
  
  // Calculate bounds of all nodes
  const bounds = useMemo(() => {
    if (nodes.length === 0) {
      return { minX: 0, minY: 0, maxX: 1000, maxY: 800, width: 1000, height: 800 };
    }
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(node => {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);
    });
    
    // Add padding
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }, [nodes]);
  
  // Calculate scale to fit content in minimap
  const scale = useMemo(() => {
    const scaleX = (minimapWidth - 20) / bounds.width;
    const scaleY = (minimapHeight - 20) / bounds.height;
    return Math.min(scaleX, scaleY, 0.1);
  }, [bounds]);
  
  // Calculate viewport rectangle in minimap coordinates
  const viewportRect = useMemo(() => {
    const x = (-viewport.x / viewport.zoom - bounds.minX) * scale + 10;
    const y = (-viewport.y / viewport.zoom - bounds.minY) * scale + 10;
    const width = (canvasWidth / viewport.zoom) * scale;
    const height = (canvasHeight / viewport.zoom) * scale;
    
    return { x, y, width, height };
  }, [viewport, bounds, scale, canvasWidth, canvasHeight]);
  
  // Handle minimap click/drag
  const handleMinimapInteraction = useCallback((clientX: number, clientY: number) => {
    const rect = minimapRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const minimapX = clientX - rect.left;
    const minimapY = clientY - rect.top;
    
    // Convert minimap coordinates to canvas coordinates
    const canvasX = (minimapX - 10) / scale + bounds.minX;
    const canvasY = (minimapY - 10) / scale + bounds.minY;
    
    // Center viewport on clicked position
    const newX = -canvasX * viewport.zoom + canvasWidth / 2;
    const newY = -canvasY * viewport.zoom + canvasHeight / 2;
    
    onViewportChange({ x: newX, y: newY });
  }, [bounds, scale, viewport.zoom, canvasWidth, canvasHeight, onViewportChange]);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    handleMinimapInteraction(e.clientX, e.clientY);
  }, [handleMinimapInteraction]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      handleMinimapInteraction(e.clientX, e.clientY);
    }
  }, [isDragging, handleMinimapInteraction]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  if (nodes.length === 0) return null;
  
  return (
    <div
      ref={minimapRef}
      className={cn(
        "absolute bg-card/95 backdrop-blur-sm border border-border rounded-lg overflow-hidden cursor-crosshair",
        className
      )}
      style={{ width: minimapWidth, height: minimapHeight }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg width={minimapWidth} height={minimapHeight}>
        {/* Background */}
        <rect width="100%" height="100%" fill="transparent" />
        
        {/* Connections */}
        {connections.map(conn => {
          const sourceNode = nodes.find(n => n.id === conn.sourceNodeId);
          const targetNode = nodes.find(n => n.id === conn.targetNodeId);
          if (!sourceNode || !targetNode) return null;
          
          const x1 = (sourceNode.x + sourceNode.width / 2 - bounds.minX) * scale + 10;
          const y1 = (sourceNode.y + sourceNode.height / 2 - bounds.minY) * scale + 10;
          const x2 = (targetNode.x + targetNode.width / 2 - bounds.minX) * scale + 10;
          const y2 = (targetNode.y + targetNode.height / 2 - bounds.minY) * scale + 10;
          
          return (
            <line
              key={conn.id}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#22d3ee"
              strokeWidth={0.5}
              opacity={0.4}
            />
          );
        })}
        
        {/* Nodes */}
        {nodes.map(node => {
          const x = (node.x - bounds.minX) * scale + 10;
          const y = (node.y - bounds.minY) * scale + 10;
          const width = Math.max(node.width * scale, 3);
          const height = Math.max(node.height * scale, 3);
          
          return (
            <rect
              key={node.id}
              x={x}
              y={y}
              width={width}
              height={height}
              fill="#3d3d3d"
              stroke="#555"
              strokeWidth={0.5}
              rx={1}
            />
          );
        })}
        
        {/* Viewport indicator */}
        <rect
          x={Math.max(0, viewportRect.x)}
          y={Math.max(0, viewportRect.y)}
          width={Math.min(viewportRect.width, minimapWidth - viewportRect.x)}
          height={Math.min(viewportRect.height, minimapHeight - viewportRect.y)}
          fill="rgba(34, 211, 238, 0.1)"
          stroke="#22d3ee"
          strokeWidth={1.5}
          rx={2}
        />
      </svg>
      
      {/* Label */}
      <div className="absolute bottom-1 right-2 text-[9px] text-muted-foreground/60">
        Overview
      </div>
    </div>
  );
}
