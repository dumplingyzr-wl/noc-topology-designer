/*
 * Connection Routing Algorithms for NoC Topology Designer
 * Design: Dark Professional
 * 
 * Optimized routing algorithms to minimize crossings and improve readability
 */

import { RouterNode, Connection, PortDirection } from '@/types/noc';

interface Point {
  x: number;
  y: number;
}

interface PortPosition extends Point {
  direction: PortDirection;
  nodeId: string;
  portId: string;
}

// Calculate control point offset based on direction
function getControlPointOffset(direction: PortDirection, distance: number): Point {
  const offset = Math.min(distance * 0.4, 80);
  switch (direction) {
    case 'north': return { x: 0, y: -offset };
    case 'south': return { x: 0, y: offset };
    case 'east': return { x: offset, y: 0 };
    case 'west': return { x: -offset, y: 0 };
    case 'local': return { x: 0, y: offset * 0.5 };
    default: return { x: 0, y: 0 };
  }
}

// Generate smooth bezier curve path
export function generateBezierPath(
  source: PortPosition,
  target: PortPosition,
  bundleOffset: number = 0
): string {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const len = Math.sqrt(dx * dx + dy * dy);
  const px = len === 0 ? 0 : -dy / len;
  const py = len === 0 ? 0 : dx / len;
  
  const sourceOffset = getControlPointOffset(source.direction, distance);
  const targetOffset = getControlPointOffset(target.direction, distance);
  
  const cx1 = source.x + sourceOffset.x + px * bundleOffset;
  const cy1 = source.y + sourceOffset.y + py * bundleOffset;
  const cx2 = target.x + targetOffset.x + px * bundleOffset;
  const cy2 = target.y + targetOffset.y + py * bundleOffset;
  
  return `M ${source.x} ${source.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${target.x} ${target.y}`;
}

// Generate orthogonal (right-angle) path with optimized routing
export function generateOrthogonalPath(
  source: PortPosition,
  target: PortPosition,
  nodes: RouterNode[],
  existingPaths: string[],
  bundleOffset: number = 0
): string {
  const margin = 20;
  const cornerRadius = 8;
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const px = len === 0 ? 0 : -dy / len;
  const py = len === 0 ? 0 : dx / len;
  
  // Simple orthogonal routing based on port directions
  const points: Point[] = [{ x: source.x, y: source.y }];
  
  // Extend from source based on direction
  const sourceExtend = getExtensionPoint(source, margin);
  points.push(sourceExtend);
  
  // Extend from target based on direction
  const targetExtend = getExtensionPoint(target, margin);
  
  // Calculate intermediate points
  const midPoints = calculateMidPoints(sourceExtend, targetExtend, source.direction, target.direction);
  points.push(...midPoints);
  
  points.push(targetExtend);
  points.push({ x: target.x, y: target.y });

  if (bundleOffset !== 0) {
    for (let i = 1; i < points.length - 1; i++) {
      points[i] = {
        x: points[i].x + px * bundleOffset,
        y: points[i].y + py * bundleOffset,
      };
    }
  }
  
  // Generate path with rounded corners
  return generateRoundedPath(points, cornerRadius);
}

// Get extension point from a port
function getExtensionPoint(port: PortPosition, distance: number): Point {
  switch (port.direction) {
    case 'north': return { x: port.x, y: port.y - distance };
    case 'south': return { x: port.x, y: port.y + distance };
    case 'east': return { x: port.x + distance, y: port.y };
    case 'west': return { x: port.x - distance, y: port.y };
    case 'local': return { x: port.x, y: port.y + distance };
    default: return port;
  }
}

// Calculate mid points for orthogonal routing
function calculateMidPoints(
  source: Point,
  target: Point,
  sourceDir: PortDirection,
  targetDir: PortDirection
): Point[] {
  const points: Point[] = [];
  
  // Determine routing strategy based on directions
  const isSourceHorizontal = sourceDir === 'east' || sourceDir === 'west';
  const isTargetHorizontal = targetDir === 'east' || targetDir === 'west';
  
  if (isSourceHorizontal && isTargetHorizontal) {
    // Both horizontal - use vertical mid-line
    const midX = (source.x + target.x) / 2;
    points.push({ x: midX, y: source.y });
    points.push({ x: midX, y: target.y });
  } else if (!isSourceHorizontal && !isTargetHorizontal) {
    // Both vertical - use horizontal mid-line
    const midY = (source.y + target.y) / 2;
    points.push({ x: source.x, y: midY });
    points.push({ x: target.x, y: midY });
  } else if (isSourceHorizontal) {
    // Source horizontal, target vertical
    points.push({ x: target.x, y: source.y });
  } else {
    // Source vertical, target horizontal
    points.push({ x: source.x, y: target.y });
  }
  
  return points;
}

// Generate SVG path with rounded corners
function generateRoundedPath(points: Point[], radius: number): string {
  if (points.length < 2) return '';
  
  let path = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    
    // Calculate vectors
    const v1 = { x: curr.x - prev.x, y: curr.y - prev.y };
    const v2 = { x: next.x - curr.x, y: next.y - curr.y };
    
    // Normalize vectors
    const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    
    if (len1 === 0 || len2 === 0) {
      path += ` L ${curr.x} ${curr.y}`;
      continue;
    }
    
    // Calculate actual radius (limited by segment lengths)
    const actualRadius = Math.min(radius, len1 / 2, len2 / 2);
    
    // Calculate corner points
    const startX = curr.x - (v1.x / len1) * actualRadius;
    const startY = curr.y - (v1.y / len1) * actualRadius;
    const endX = curr.x + (v2.x / len2) * actualRadius;
    const endY = curr.y + (v2.y / len2) * actualRadius;
    
    path += ` L ${startX} ${startY}`;
    path += ` Q ${curr.x} ${curr.y}, ${endX} ${endY}`;
  }
  
  path += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
  
  return path;
}

// Generate straight line path
export function generateStraightPath(
  source: PortPosition,
  target: PortPosition,
  bundleOffset: number = 0
): string {
  if (bundleOffset === 0) {
    return `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
  }

  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return '';

  const px = -dy / len;
  const py = dx / len;
  const midX = (source.x + target.x) / 2 + px * bundleOffset;
  const midY = (source.y + target.y) / 2 + py * bundleOffset;

  return `M ${source.x} ${source.y} Q ${midX} ${midY}, ${target.x} ${target.y}`;
}

// Calculate optimal port positions to minimize crossings
export function optimizePortAssignment(
  connections: Connection[],
  nodes: RouterNode[],
  getPortPosition: (nodeId: string, portId: string) => PortPosition | null
): Map<string, { sourcePortId: string; targetPortId: string }> {
  const optimized = new Map<string, { sourcePortId: string; targetPortId: string }>();
  
  // Group connections by node pairs
  const nodePairs = new Map<string, Connection[]>();
  connections.forEach(conn => {
    const key = [conn.sourceNodeId, conn.targetNodeId].sort().join('-');
    if (!nodePairs.has(key)) {
      nodePairs.set(key, []);
    }
    nodePairs.get(key)!.push(conn);
  });
  
  // For each pair, optimize port assignments
  nodePairs.forEach((conns, key) => {
    if (conns.length <= 1) {
      // Single connection, keep as is
      conns.forEach(conn => {
        optimized.set(conn.id, {
          sourcePortId: conn.sourcePortId,
          targetPortId: conn.targetPortId,
        });
      });
      return;
    }
    
    // Multiple connections between same nodes
    // Sort by port direction to minimize crossings
    const sourceNode = nodes.find(n => n.id === conns[0].sourceNodeId);
    const targetNode = nodes.find(n => n.id === conns[0].targetNodeId);
    
    if (!sourceNode || !targetNode) return;
    
    // Determine optimal direction based on relative positions
    const dx = targetNode.x - sourceNode.x;
    const dy = targetNode.y - sourceNode.y;
    
    let preferredSourceDir: PortDirection;
    let preferredTargetDir: PortDirection;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal connection
      preferredSourceDir = dx > 0 ? 'east' : 'west';
      preferredTargetDir = dx > 0 ? 'west' : 'east';
    } else {
      // Vertical connection
      preferredSourceDir = dy > 0 ? 'south' : 'north';
      preferredTargetDir = dy > 0 ? 'north' : 'south';
    }
    
    // Get available ports in preferred directions
    const sourcePorts = sourceNode.ports.filter(p => p.direction === preferredSourceDir);
    const targetPorts = targetNode.ports.filter(p => p.direction === preferredTargetDir);
    
    // Assign ports
    conns.forEach((conn, i) => {
      const sourcePort = sourcePorts[i % sourcePorts.length] || sourceNode.ports[0];
      const targetPort = targetPorts[i % targetPorts.length] || targetNode.ports[0];
      
      optimized.set(conn.id, {
        sourcePortId: sourcePort?.id || conn.sourcePortId,
        targetPortId: targetPort?.id || conn.targetPortId,
      });
    });
  });
  
  return optimized;
}

// Detect and count connection crossings
export function detectCrossings(
  connections: Connection[],
  getPortPosition: (nodeId: string, portId: string) => PortPosition | null
): number {
  let crossings = 0;
  
  for (let i = 0; i < connections.length; i++) {
    for (let j = i + 1; j < connections.length; j++) {
      const conn1 = connections[i];
      const conn2 = connections[j];
      
      const p1 = getPortPosition(conn1.sourceNodeId, conn1.sourcePortId);
      const p2 = getPortPosition(conn1.targetNodeId, conn1.targetPortId);
      const p3 = getPortPosition(conn2.sourceNodeId, conn2.sourcePortId);
      const p4 = getPortPosition(conn2.targetNodeId, conn2.targetPortId);
      
      if (!p1 || !p2 || !p3 || !p4) continue;
      
      if (linesIntersect(p1, p2, p3, p4)) {
        crossings++;
      }
    }
  }
  
  return crossings;
}

// Check if two line segments intersect
function linesIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const d1 = direction(p3, p4, p1);
  const d2 = direction(p3, p4, p2);
  const d3 = direction(p1, p2, p3);
  const d4 = direction(p1, p2, p4);
  
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }
  
  return false;
}

function direction(p1: Point, p2: Point, p3: Point): number {
  return (p3.x - p1.x) * (p2.y - p1.y) - (p2.x - p1.x) * (p3.y - p1.y);
}

// Bundle parallel connections for cleaner visualization
export function bundleConnections(
  connections: Connection[],
  nodes: RouterNode[]
): Map<string, number> {
  const bundles = new Map<string, number>();
  const pairCounts = new Map<string, number>();
  
  // Count connections between each node pair
  connections.forEach(conn => {
    const key = [conn.sourceNodeId, conn.targetNodeId].sort().join('-');
    pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
  });
  
  // Assign bundle offsets
  const pairIndices = new Map<string, number>();
  connections.forEach(conn => {
    const key = [conn.sourceNodeId, conn.targetNodeId].sort().join('-');
    const count = pairCounts.get(key) || 1;
    const index = pairIndices.get(key) || 0;
    
    // Calculate offset from center
    const offset = count > 1 ? (index - (count - 1) / 2) * 8 : 0;
    bundles.set(conn.id, offset);
    
    pairIndices.set(key, index + 1);
  });
  
  return bundles;
}
