# NoC Topology Designer

A specialized GUI tool for designing Network-on-Chip (NoC) topologies, with optimized support for high-radix routers and intelligent connection routing.

![NoC Topology Designer](https://img.shields.io/badge/NoC-Topology%20Designer-22d3ee?style=for-the-badge)

## Features

### Core Capabilities

- **High-Radix Router Support**: Dynamic anchor point system that automatically adjusts port spacing based on the number of ports per direction (up to 8 ports per direction)
- **Smart Connection Routing**: Bezier curve connections with bundle optimization for parallel connections, minimizing visual clutter
- **Physical Position Representation**: Accurate representation of router positions with mesh coordinate support

### User Interface

- **Dark Professional Theme**: Eye-friendly dark interface designed for extended work sessions
- **Infinite Canvas**: Pan and zoom with mouse wheel and middle-click drag
- **Minimap Navigation**: Overview panel for quick navigation in large topologies
- **Properties Panel**: Edit node labels, positions, and view port configurations

### Topology Generation

- **Mesh Generator**: Quickly create NxM mesh topologies with configurable port counts
- **Router Presets**: Standard (5 ports) and High-Radix (18 ports) configurations
- **Custom Configuration**: Define custom port counts per direction (N/S/E/W/Local)

### Import/Export

- **JSON Export**: Save topologies as JSON for sharing or version control
- **JSON Import**: Load previously saved topologies

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `V` | Select tool |
| `H` | Pan tool |
| `R` | Add router tool |
| `C` | Connect tool |
| `Delete` | Delete selected |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `F` | Fit to view |
| `M` | Toggle minimap |
| `?` | Show help |
| `Escape` | Clear selection |

## Mouse Controls

- **Scroll**: Zoom in/out
- **Middle-click drag**: Pan canvas
- **Shift+Click**: Add to selection

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/noc-topology-designer.git
cd noc-topology-designer

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Building for Production

```bash
pnpm build
pnpm start
```

## Usage

1. **Generate a Mesh**: Click "Generate" → "Mesh Topology" to quickly create a regular mesh network
2. **Add Routers Manually**: Press `R` and click on the canvas to add individual routers
3. **Create Connections**: Press `C`, click a source port, then click a target port
4. **Edit Properties**: Select a node to view and edit its properties in the right panel
5. **Export**: Use "File" → "Export JSON" to save your topology

## Technology Stack

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui + Radix UI
- **Build Tool**: Vite

## Port Color Coding

| Direction | Color |
|-----------|-------|
| North | Blue |
| South | Green |
| East | Orange |
| West | Light Orange |
| Local | Purple |

## Connection Types

| Type | Color |
|------|-------|
| Data | Cyan |
| Control | Purple |
| Clock | Amber |
| Custom | Emerald |

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

This tool was designed to address the limitations of general-purpose diagram tools (like draw.io) when working with NoC topologies, specifically:

- Limited anchor points for high-radix routers
- Poor connection routing optimization for dense interconnects
- Lack of NoC-specific features like mesh generation
