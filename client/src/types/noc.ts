/*
 * NoC Topology Designer - Type Definitions
 * Design: Dark Professional
 */

// Port direction for NoC router
export type PortDirection = 'north' | 'south' | 'east' | 'west' | 'local';

export type PortIOType = 'input' | 'output';

// Port definition
export interface Port {
  id: string;
  direction: PortDirection;
  index: number; // Index within the direction (for multiple ports per direction)
  label?: string;
  ioType?: PortIOType;
}

// Router node in the topology
export interface RouterNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  ports: Port[];
  // Physical position in the mesh (optional)
  meshX?: number;
  meshY?: number;
  // Custom styling
  color?: string;
}

// Connection between two ports
export interface Connection {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
  // Visual properties
  color?: string;
  strokeWidth?: number;
  label?: string;
  // Connection type for styling
  type?: 'data' | 'control' | 'clock' | 'custom';
}

// Canvas viewport state
export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

// Selection state
export interface SelectionState {
  selectedNodes: string[];
  selectedConnections: string[];
  selectedPorts: { nodeId: string; portId: string }[];
}

// Tool mode
export type ToolMode = 'select' | 'pan' | 'connect' | 'add-router';

// Topology state
export interface TopologyState {
  nodes: RouterNode[];
  connections: Connection[];
  viewport: ViewportState;
  selection: SelectionState;
  toolMode: ToolMode;
}

// Port configuration for creating routers
export interface PortConfig {
  north: number;
  south: number;
  east: number;
  west: number;
  local: number;
}

// Default port configuration for common NoC routers
export const DEFAULT_PORT_CONFIG: PortConfig = {
  north: 1,
  south: 1,
  east: 1,
  west: 1,
  local: 1,
};

// High radix router configuration
export const HIGH_RADIX_PORT_CONFIG: PortConfig = {
  north: 4,
  south: 4,
  east: 4,
  west: 4,
  local: 2,
};

// Connection routing mode
export type RoutingMode = 'bezier' | 'orthogonal' | 'straight';

// Canvas settings
export interface CanvasSettings {
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
  routingMode: RoutingMode;
  showPortLabels: boolean;
  showConnectionLabels: boolean;
}

export const DEFAULT_CANVAS_SETTINGS: CanvasSettings = {
  gridSize: 20,
  snapToGrid: true,
  showGrid: true,
  routingMode: 'bezier',
  showPortLabels: true,
  showConnectionLabels: false,
};

// Color palette for connections
export const CONNECTION_COLORS = {
  data: '#22d3ee',      // Cyan
  control: '#a78bfa',   // Purple
  clock: '#f59e0b',     // Amber
  custom: '#10b981',    // Emerald
};

export const PORT_IO_TYPE_BY_DIRECTION: Record<PortDirection, PortIOType> = {
  north: 'input',
  west: 'input',
  local: 'input',
  south: 'output',
  east: 'output',
};

export const PORT_IO_COLORS: Record<PortIOType, string> = {
  input: '#38bdf8',   // Bright blue
  output: '#f97316',  // Strong orange
};

// Port direction colors
export const PORT_DIRECTION_COLORS: Record<PortDirection, string> = {
  north: '#60a5fa',     // Blue (cool - vertical)
  south: '#34d399',     // Green (cool - vertical)
  east: '#f97316',      // Orange (warm - horizontal)
  west: '#fb923c',      // Light orange (warm - horizontal)
  local: '#a78bfa',     // Purple (special)
};

export const ROUTER_COLOR_PRESETS = [
  '#252525', // Default dark
  '#dae8fc', // Draw.io light blue
  '#d5e8d4', // Draw.io light green
  '#fff2cc', // Draw.io light yellow
  '#f8cecc', // Draw.io light red
  '#e1d5e7', // Draw.io light purple
  '#ffe6cc', // Draw.io light orange
  '#cfe2f3', // Draw.io soft blue
];
