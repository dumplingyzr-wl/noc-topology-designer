import { nanoid } from 'nanoid';
import { Connection, RouterNode } from '@/types/noc';

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildNodeStyle(node: RouterNode) {
  const styles = ['rounded=0', 'whiteSpace=wrap', 'html=1'];
  if (node.color) {
    styles.push(`fillColor=${node.color}`);
  }
  return styles.join(';');
}

function buildEdgeStyle(connection: Connection) {
  const styles = [
    'edgeStyle=orthogonalEdgeStyle',
    'rounded=0',
    'orthogonalLoop=1',
    'jettySize=auto',
    'html=1',
  ];
  if (connection.color) {
    styles.push(`strokeColor=${connection.color}`);
  }
  if (connection.strokeWidth) {
    styles.push(`strokeWidth=${connection.strokeWidth}`);
  }
  return styles.join(';');
}

export function buildDrawioXml(nodes: RouterNode[], connections: Connection[]) {
  const diagramId = nanoid(8);
  const timestamp = new Date().toISOString();
  const nodeCells = nodes.map((node) => {
    const label = escapeXml(node.label ?? '');
    const style = buildNodeStyle(node);
    return `
      <mxCell id="${node.id}" value="${label}" style="${style}" vertex="1" parent="1">
        <mxGeometry x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" as="geometry" />
      </mxCell>`;
  }).join('');

  const edgeCells = connections.map((connection) => {
    const label = connection.label ? escapeXml(connection.label) : '';
    const style = buildEdgeStyle(connection);
    return `
      <mxCell id="edge-${connection.id}" value="${label}" style="${style}" edge="1" parent="1" source="${connection.sourceNodeId}" target="${connection.targetNodeId}">
        <mxGeometry relative="1" as="geometry" />
      </mxCell>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="${timestamp}" agent="noc-topology-designer" version="20.8.3" type="device">
  <diagram id="${diagramId}" name="Page-1">
    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1920" pageHeight="1080" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        ${nodeCells}
        ${edgeCells}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
}
