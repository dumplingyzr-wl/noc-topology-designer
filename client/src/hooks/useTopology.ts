/*
 * NoC Topology State Management Hook
 * Design: Dark Professional
 */

import { useCallback, useState } from 'react';
import { nanoid } from 'nanoid';
import {
  RouterNode,
  Connection,
  ViewportState,
  SelectionState,
  ToolMode,
  TopologyState,
  Port,
  PortConfig,
  DEFAULT_PORT_CONFIG,
  CanvasSettings,
  DEFAULT_CANVAS_SETTINGS,
} from '@/types/noc';
import { buildDrawioXml } from '@/lib/drawio';

// Generate ports for a router based on configuration
function generatePorts(config: PortConfig): Port[] {
  const ports: Port[] = [];
  const directions: (keyof PortConfig)[] = ['north', 'south', 'east', 'west', 'local'];
  
  directions.forEach(direction => {
    const count = config[direction];
    for (let i = 0; i < count; i++) {
      ports.push({
        id: nanoid(8),
        direction,
        index: i,
        label: `${direction.charAt(0).toUpperCase()}${i}`,
      });
    }
  });
  
  return ports;
}

// Create a new router node
function createRouterNode(
  x: number,
  y: number,
  label: string,
  portConfig: PortConfig = DEFAULT_PORT_CONFIG
): RouterNode {
  const ports = generatePorts(portConfig);
  // Calculate size based on port count
  const maxHorizontalPorts = Math.max(portConfig.north, portConfig.south);
  const maxVerticalPorts = Math.max(portConfig.east, portConfig.west);
  const localPorts = portConfig.local;
  
  const width = Math.max(100, maxHorizontalPorts * 24 + 40);
  const height = Math.max(80, maxVerticalPorts * 24 + 40, localPorts * 20 + 40);
  
  return {
    id: nanoid(8),
    x,
    y,
    width,
    height,
    label,
    ports,
  };
}

// Initial state
const initialState: TopologyState = {
  nodes: [],
  connections: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  selection: { selectedNodes: [], selectedConnections: [], selectedPorts: [] },
  toolMode: 'select',
};

export function useTopology() {
  const [state, setState] = useState<TopologyState>(initialState);
  const [settings, setSettings] = useState<CanvasSettings>(DEFAULT_CANVAS_SETTINGS);
  const [history, setHistory] = useState<TopologyState[]>([initialState]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Save state to history
  const saveToHistory = useCallback((newState: TopologyState) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newState);
      // Limit history size
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setState(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setState(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // Add a new router node
  const addNode = useCallback((x: number, y: number, label?: string, portConfig?: PortConfig) => {
    setState(prev => {
      const nodeLabel = label || `R${prev.nodes.length}`;
      const node = createRouterNode(x, y, nodeLabel, portConfig);
      const newState = {
        ...prev,
        nodes: [...prev.nodes, node],
      };
      saveToHistory(newState);
      return newState;
    });
  }, [saveToHistory]);

  // Update node position
  const updateNodePosition = useCallback((nodeId: string, x: number, y: number) => {
    setState(prev => {
      const newState = {
        ...prev,
        nodes: prev.nodes.map(node =>
          node.id === nodeId ? { ...node, x, y } : node
        ),
      };
      return newState;
    });
  }, []);

  // Finalize node position (save to history)
  const finalizeNodePosition = useCallback(() => {
    saveToHistory(state);
  }, [saveToHistory, state]);

  // Update node properties
  const updateNode = useCallback((nodeId: string, updates: Partial<RouterNode>) => {
    setState(prev => {
      const newState = {
        ...prev,
        nodes: prev.nodes.map(node =>
          node.id === nodeId ? { ...node, ...updates } : node
        ),
      };
      saveToHistory(newState);
      return newState;
    });
  }, [saveToHistory]);

  // Delete node and its connections
  const deleteNode = useCallback((nodeId: string) => {
    setState(prev => {
      const newState = {
        ...prev,
        nodes: prev.nodes.filter(node => node.id !== nodeId),
        connections: prev.connections.filter(
          conn => conn.sourceNodeId !== nodeId && conn.targetNodeId !== nodeId
        ),
        selection: {
          ...prev.selection,
          selectedNodes: prev.selection.selectedNodes.filter(id => id !== nodeId),
        },
      };
      saveToHistory(newState);
      return newState;
    });
  }, [saveToHistory]);

  // Add a connection between two ports
  const addConnection = useCallback((
    sourceNodeId: string,
    sourcePortId: string,
    targetNodeId: string,
    targetPortId: string,
    type?: Connection['type']
  ) => {
    setState(prev => {
      // Check if connection already exists
      const exists = prev.connections.some(
        conn =>
          (conn.sourceNodeId === sourceNodeId && conn.sourcePortId === sourcePortId &&
           conn.targetNodeId === targetNodeId && conn.targetPortId === targetPortId) ||
          (conn.sourceNodeId === targetNodeId && conn.sourcePortId === targetPortId &&
           conn.targetNodeId === sourceNodeId && conn.targetPortId === sourcePortId)
      );
      
      if (exists) return prev;
      
      const connection: Connection = {
        id: nanoid(8),
        sourceNodeId,
        sourcePortId,
        targetNodeId,
        targetPortId,
        type: type || 'data',
      };
      
      const newState = {
        ...prev,
        connections: [...prev.connections, connection],
      };
      saveToHistory(newState);
      return newState;
    });
  }, [saveToHistory]);

  // Delete connection
  const deleteConnection = useCallback((connectionId: string) => {
    setState(prev => {
      const newState = {
        ...prev,
        connections: prev.connections.filter(conn => conn.id !== connectionId),
        selection: {
          ...prev.selection,
          selectedConnections: prev.selection.selectedConnections.filter(id => id !== connectionId),
        },
      };
      saveToHistory(newState);
      return newState;
    });
  }, [saveToHistory]);

  // Update viewport
  const updateViewport = useCallback((viewport: Partial<ViewportState>) => {
    setState(prev => ({
      ...prev,
      viewport: { ...prev.viewport, ...viewport },
    }));
  }, []);

  // Set selection
  const setSelection = useCallback((selection: Partial<SelectionState>) => {
    setState(prev => ({
      ...prev,
      selection: { ...prev.selection, ...selection },
    }));
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selection: { selectedNodes: [], selectedConnections: [], selectedPorts: [] },
    }));
  }, []);

  // Set tool mode
  const setToolMode = useCallback((mode: ToolMode) => {
    setState(prev => ({
      ...prev,
      toolMode: mode,
    }));
  }, []);

  // Update canvas settings
  const updateSettings = useCallback((newSettings: Partial<CanvasSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Delete selected items
  const deleteSelected = useCallback(() => {
    setState(prev => {
      let newNodes = prev.nodes;
      let newConnections = prev.connections;
      
      // Delete selected nodes and their connections
      if (prev.selection.selectedNodes.length > 0) {
        newNodes = prev.nodes.filter(node => !prev.selection.selectedNodes.includes(node.id));
        newConnections = prev.connections.filter(
          conn => !prev.selection.selectedNodes.includes(conn.sourceNodeId) &&
                  !prev.selection.selectedNodes.includes(conn.targetNodeId)
        );
      }
      
      // Delete selected connections
      if (prev.selection.selectedConnections.length > 0) {
        newConnections = newConnections.filter(
          conn => !prev.selection.selectedConnections.includes(conn.id)
        );
      }
      
      const newState = {
        ...prev,
        nodes: newNodes,
        connections: newConnections,
        selection: { selectedNodes: [], selectedConnections: [], selectedPorts: [] },
      };
      saveToHistory(newState);
      return newState;
    });
  }, [saveToHistory]);

  // Clear all
  const clearAll = useCallback(() => {
    const newState = {
      ...initialState,
      viewport: state.viewport,
    };
    setState(newState);
    saveToHistory(newState);
  }, [saveToHistory, state.viewport]);

  // Export topology as JSON
  const exportTopology = useCallback(() => {
    return JSON.stringify({
      nodes: state.nodes,
      connections: state.connections,
    }, null, 2);
  }, [state.nodes, state.connections]);

  const exportDrawio = useCallback(() => {
    return buildDrawioXml(state.nodes, state.connections);
  }, [state.nodes, state.connections]);

  // Import topology from JSON
  const importTopology = useCallback((json: string) => {
    try {
      const data = JSON.parse(json);
      if (data.nodes && data.connections) {
        const newState = {
          ...state,
          nodes: data.nodes,
          connections: data.connections,
          selection: { selectedNodes: [], selectedConnections: [], selectedPorts: [] },
        };
        setState(newState);
        saveToHistory(newState);
        return true;
      }
    } catch (e) {
      console.error('Failed to import topology:', e);
    }
    return false;
  }, [saveToHistory, state]);

  // Generate mesh topology
  const generateMeshTopology = useCallback((rows: number, cols: number, portConfig: PortConfig = DEFAULT_PORT_CONFIG) => {
    const nodes: RouterNode[] = [];
    const connections: Connection[] = [];
    const spacing = 200;
    const startX = 100;
    const startY = 100;
    
    // Create nodes
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const node = createRouterNode(
          startX + col * spacing,
          startY + row * spacing,
          `R${row}_${col}`,
          portConfig
        );
        node.meshX = col;
        node.meshY = row;
        nodes.push(node);
      }
    }
    
    // Create connections (mesh topology)
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const currentIndex = row * cols + col;
        const currentNode = nodes[currentIndex];
        
        // Connect to east neighbor
        if (col < cols - 1) {
          const eastIndex = row * cols + (col + 1);
          const eastNode = nodes[eastIndex];
          const sourcePort = currentNode.ports.find(p => p.direction === 'east');
          const targetPort = eastNode.ports.find(p => p.direction === 'west');
          if (sourcePort && targetPort) {
            connections.push({
              id: nanoid(8),
              sourceNodeId: currentNode.id,
              sourcePortId: sourcePort.id,
              targetNodeId: eastNode.id,
              targetPortId: targetPort.id,
              type: 'data',
            });
          }
        }
        
        // Connect to south neighbor
        if (row < rows - 1) {
          const southIndex = (row + 1) * cols + col;
          const southNode = nodes[southIndex];
          const sourcePort = currentNode.ports.find(p => p.direction === 'south');
          const targetPort = southNode.ports.find(p => p.direction === 'north');
          if (sourcePort && targetPort) {
            connections.push({
              id: nanoid(8),
              sourceNodeId: currentNode.id,
              sourcePortId: sourcePort.id,
              targetNodeId: southNode.id,
              targetPortId: targetPort.id,
              type: 'data',
            });
          }
        }
      }
    }
    
    const newState = {
      ...state,
      nodes,
      connections,
      selection: { selectedNodes: [], selectedConnections: [], selectedPorts: [] },
    };
    setState(newState);
    saveToHistory(newState);
  }, [saveToHistory, state]);

  // Generate Butterfly topology (k-ary n-fly)
  const generateButterflyTopology = useCallback((radix: number, stages: number) => {
    const nodes: RouterNode[] = [];
    const connections: Connection[] = [];
    const switchesPerStage = Math.pow(radix, stages - 1);
    const horizontalSpacing = 250;
    const verticalSpacing = 100;
    const startX = 100;
    const startY = 100;

    // Create port config for butterfly switches
    const portConfig: PortConfig = {
      north: 0,
      south: 0,
      east: radix,
      west: radix,
      local: 0,
    };

    // Create nodes for each stage
    for (let stage = 0; stage < stages; stage++) {
      for (let sw = 0; sw < switchesPerStage; sw++) {
        const node = createRouterNode(
          startX + stage * horizontalSpacing,
          startY + sw * verticalSpacing,
          `S${stage}_${sw}`,
          portConfig
        );
        node.meshX = stage;
        node.meshY = sw;
        nodes.push(node);
      }
    }

    // Create butterfly connections
    // In a k-ary n-fly, switch (stage, sw) connects to:
    // - Stage stage+1, switch with different digit in position (stages-1-stage)
    for (let stage = 0; stage < stages - 1; stage++) {
      for (let sw = 0; sw < switchesPerStage; sw++) {
        const currentNodeIndex = stage * switchesPerStage + sw;
        const currentNode = nodes[currentNodeIndex];

        // Calculate connections based on butterfly pattern
        const digitPosition = stages - 1 - stage;
        const stride = Math.pow(radix, digitPosition);
        const groupStart = Math.floor(sw / (stride * radix)) * (stride * radix);
        const posInGroup = sw % stride;

        for (let k = 0; k < radix; k++) {
          const targetSw = groupStart + k * stride + posInGroup;
          const targetNodeIndex = (stage + 1) * switchesPerStage + targetSw;
          const targetNode = nodes[targetNodeIndex];

          if (targetNode) {
            const sourcePort = currentNode.ports.filter(p => p.direction === 'east')[k];
            const targetPort = targetNode.ports.filter(p => p.direction === 'west')[k];

            if (sourcePort && targetPort) {
              connections.push({
                id: nanoid(8),
                sourceNodeId: currentNode.id,
                sourcePortId: sourcePort.id,
                targetNodeId: targetNode.id,
                targetPortId: targetPort.id,
                type: 'data',
              });
            }
          }
        }
      }
    }

    const newState = {
      ...state,
      nodes,
      connections,
      selection: { selectedNodes: [], selectedConnections: [], selectedPorts: [] },
    };
    setState(newState);
    saveToHistory(newState);
  }, [saveToHistory, state]);

  // Generate Clos topology (n, m, r)
  // n = ports per edge switch, m = middle switches, r = edge switches per stage
  const generateClosTopology = useCallback((n: number, m: number, r: number) => {
    const nodes: RouterNode[] = [];
    const connections: Connection[] = [];
    const stageSpacing = 300;
    const switchSpacing = 120;
    const startX = 100;
    const startY = 100;

    // Input stage port config: n west ports (inputs), m east ports (to middle)
    const inputPortConfig: PortConfig = {
      north: 0,
      south: 0,
      east: m,
      west: n,
      local: 0,
    };

    // Middle stage port config: r west ports (from input), r east ports (to output)
    const middlePortConfig: PortConfig = {
      north: 0,
      south: 0,
      east: r,
      west: r,
      local: 0,
    };

    // Output stage port config: m west ports (from middle), n east ports (outputs)
    const outputPortConfig: PortConfig = {
      north: 0,
      south: 0,
      east: n,
      west: m,
      local: 0,
    };

    // Calculate vertical centering
    const inputHeight = r * switchSpacing;
    const middleHeight = m * switchSpacing;
    const maxHeight = Math.max(inputHeight, middleHeight);
    const inputOffset = (maxHeight - inputHeight) / 2;
    const middleOffset = (maxHeight - middleHeight) / 2;

    // Create input stage switches
    for (let i = 0; i < r; i++) {
      const node = createRouterNode(
        startX,
        startY + inputOffset + i * switchSpacing,
        `I${i}`,
        inputPortConfig
      );
      node.meshX = 0;
      node.meshY = i;
      nodes.push(node);
    }

    // Create middle stage switches
    for (let i = 0; i < m; i++) {
      const node = createRouterNode(
        startX + stageSpacing,
        startY + middleOffset + i * switchSpacing,
        `M${i}`,
        middlePortConfig
      );
      node.meshX = 1;
      node.meshY = i;
      nodes.push(node);
    }

    // Create output stage switches
    for (let i = 0; i < r; i++) {
      const node = createRouterNode(
        startX + stageSpacing * 2,
        startY + inputOffset + i * switchSpacing,
        `O${i}`,
        outputPortConfig
      );
      node.meshX = 2;
      node.meshY = i;
      nodes.push(node);
    }

    // Connect input stage to middle stage
    // Each input switch connects to all middle switches
    for (let i = 0; i < r; i++) {
      const inputNode = nodes[i];
      for (let j = 0; j < m; j++) {
        const middleNode = nodes[r + j];
        const sourcePort = inputNode.ports.filter(p => p.direction === 'east')[j];
        const targetPort = middleNode.ports.filter(p => p.direction === 'west')[i];

        if (sourcePort && targetPort) {
          connections.push({
            id: nanoid(8),
            sourceNodeId: inputNode.id,
            sourcePortId: sourcePort.id,
            targetNodeId: middleNode.id,
            targetPortId: targetPort.id,
            type: 'data',
          });
        }
      }
    }

    // Connect middle stage to output stage
    // Each middle switch connects to all output switches
    for (let j = 0; j < m; j++) {
      const middleNode = nodes[r + j];
      for (let k = 0; k < r; k++) {
        const outputNode = nodes[r + m + k];
        const sourcePort = middleNode.ports.filter(p => p.direction === 'east')[k];
        const targetPort = outputNode.ports.filter(p => p.direction === 'west')[j];

        if (sourcePort && targetPort) {
          connections.push({
            id: nanoid(8),
            sourceNodeId: middleNode.id,
            sourcePortId: sourcePort.id,
            targetNodeId: outputNode.id,
            targetPortId: targetPort.id,
            type: 'data',
          });
        }
      }
    }

    const newState = {
      ...state,
      nodes,
      connections,
      selection: { selectedNodes: [], selectedConnections: [], selectedPorts: [] },
    };
    setState(newState);
    saveToHistory(newState);
  }, [saveToHistory, state]);

  return {
    // State
    nodes: state.nodes,
    connections: state.connections,
    viewport: state.viewport,
    selection: state.selection,
    toolMode: state.toolMode,
    settings,
    
    // History
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    undo,
    redo,
    
    // Node operations
    addNode,
    updateNodePosition,
    finalizeNodePosition,
    updateNode,
    deleteNode,
    
    // Connection operations
    addConnection,
    deleteConnection,
    
    // Viewport operations
    updateViewport,
    
    // Selection operations
    setSelection,
    clearSelection,
    
    // Tool operations
    setToolMode,
    
    // Settings
    updateSettings,
    
    // Bulk operations
    deleteSelected,
    clearAll,
    
    // Import/Export
    exportTopology,
    exportDrawio,
    importTopology,
    
    // Generators
    generateMeshTopology,
    generateButterflyTopology,
    generateClosTopology,
  };
}
