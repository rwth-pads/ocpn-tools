import { Position } from '@xyflow/react';
import type { Node } from '@xyflow/react';


interface Point {
  x: number;
  y: number;
}

interface NodePosition {
  x: number;
  y: number;
}

interface NodeInternals {
  positionAbsolute: NodePosition;
}

interface NodeWithInternals extends Node {
  internals: NodeInternals;
}

// this helper function returns the intersection point
// of the line between the center of the intersectionNode and the target node
function getNodeIntersection(intersectionNode: Node, targetNode: Node): Point {
  const { width: intersectionNodeWidth = 0, height: intersectionNodeHeight = 0 } =
    intersectionNode.measured || {};
  const intersectionNodePosition = (intersectionNode as NodeWithInternals).internals.positionAbsolute;
  const targetPosition = (targetNode as NodeWithInternals).internals.positionAbsolute;

  const w = intersectionNodeWidth / 2;
  const h = intersectionNodeHeight / 2;

  const x2 = intersectionNodePosition.x + w;
  const y2 = intersectionNodePosition.y + h;
  const x1 = targetPosition.x + ((targetNode.measured?.width ?? 0) / 2);
  const y1 = targetPosition.y + ((targetNode.measured?.height ?? 0) / 2);

  if (intersectionNode.type === 'place') {
    // Adjust for elliptical nodes
    const dx = x1 - x2;
    const dy = y1 - y2;
    const angle = Math.atan2(dy, dx);
    const rx = w;
    const ry = h;
    const x = x2 + rx * Math.cos(angle);
    const y = y2 + ry * Math.sin(angle);
    return { x, y };
  }

  // Default for rectangular nodes
  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1) || 1);
  const xx3 = a * xx1;
  const yy3 = a * yy1;
  const x = w * (xx3 + yy3) + x2;
  const y = h * (-xx3 + yy3) + y2;

  return { x, y };
}

/**
 * Get the intersection point of the node boundary towards a specific point (e.g., a bendpoint)
 * This is used when we have bendpoints and need to calculate where the edge exits/enters the node
 */
export function getNodeIntersectionToPoint(node: Node, targetPoint: Point): Point {
  const { width: nodeWidth = 0, height: nodeHeight = 0 } = node.measured || {};
  const nodePosition = (node as NodeWithInternals).internals.positionAbsolute;

  const w = nodeWidth / 2;
  const h = nodeHeight / 2;

  // Node center
  const cx = nodePosition.x + w;
  const cy = nodePosition.y + h;
  
  // Target point
  const x1 = targetPoint.x;
  const y1 = targetPoint.y;

  if (node.type === 'place') {
    // Elliptical nodes - calculate intersection with ellipse
    const dx = x1 - cx;
    const dy = y1 - cy;
    const angle = Math.atan2(dy, dx);
    const rx = w;
    const ry = h;
    const x = cx + rx * Math.cos(angle);
    const y = cy + ry * Math.sin(angle);
    return { x, y };
  }

  // Rectangular nodes - find intersection with rectangle edge
  const dx = x1 - cx;
  const dy = y1 - cy;
  
  if (dx === 0 && dy === 0) {
    // Target is at center, return center
    return { x: cx, y: cy };
  }
  
  // Calculate intersection with rectangle
  // Using parametric line: P = center + t * direction
  // Find t where line intersects rectangle boundary
  let t = Infinity;
  
  if (dx !== 0) {
    // Intersection with left or right edge
    const tRight = w / Math.abs(dx);
    const tLeft = w / Math.abs(dx);
    t = Math.min(t, dx > 0 ? tRight : tLeft);
  }
  
  if (dy !== 0) {
    // Intersection with top or bottom edge
    const tBottom = h / Math.abs(dy);
    const tTop = h / Math.abs(dy);
    t = Math.min(t, dy > 0 ? tBottom : tTop);
  }
  
  const x = cx + t * dx;
  const y = cy + t * dy;
  
  return { x, y };
}

function getEdgePosition(
  node: NodeWithInternals,
  intersectionPoint: Point
): Position {
  const n = { ...node.internals.positionAbsolute, ...node };
  const nx = Math.round(n.x);
  const ny = Math.round(n.y);
  const px = Math.round(intersectionPoint.x);
  const py = Math.round(intersectionPoint.y);

  if (node.type === 'place') {
    // Adjust for elliptical nodes
    const dx = px - (nx + ((n.measured?.width ?? 0) / 2));
    const dy = py - (ny + ((n.measured?.height ?? 0) / 2));
    const angle = Math.atan2(dy, dx);
    if (Math.abs(angle) < Math.PI / 4) return Position.Right;
    if (Math.abs(angle) > (3 * Math.PI) / 4) return Position.Left;
    return angle > 0 ? Position.Bottom : Position.Top;
  }

  // Default for rectangular nodes
  if (px <= nx + 1) {
    return Position.Left;
  }
  if (px >= nx + (n.measured?.width ?? 0) - 1) {
    return Position.Right;
  }
  if (py <= ny + 1) {
    return Position.Top;
  }
  if (py >= n.y + ((n.measured?.height ?? 0) - 1)) {
    return Position.Bottom;
  }

  return Position.Top;
}

// returns the parameters (sx, sy, tx, ty, sourcePos, targetPos) you need to create an edge
interface EdgeParams {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  sourcePos: Position;
  targetPos: Position;
}

export function getEdgeParams(source: Node, target: Node): EdgeParams {
  const sourceIntersectionPoint = getNodeIntersection(source, target);
  const targetIntersectionPoint = getNodeIntersection(target, source);

  const sourcePos = getEdgePosition(source as NodeWithInternals, sourceIntersectionPoint);
  const targetPos = getEdgePosition(target as NodeWithInternals, targetIntersectionPoint);

  return {
    sx: sourceIntersectionPoint.x,
    sy: sourceIntersectionPoint.y,
    tx: targetIntersectionPoint.x,
    ty: targetIntersectionPoint.y,
    sourcePos,
    targetPos,
  };
}
