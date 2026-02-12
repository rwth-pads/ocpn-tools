/**
 * Adapter to convert React Flow nodes/edges into the ocpn-viz ObjectCentricPetriNet
 * format, run the OC-Sugiyama layout algorithm, and map positions back.
 */
import type { Node, Edge } from '@xyflow/react';

// We use the layout-only entry point that avoids Node.js-specific imports (fs, svg2png, d3-node)
// @ts-expect-error — ocpn-viz is a plain JS package without type declarations
import { ObjectCentricPetriNet, OCPNConfig, sugiyama } from 'ocpn-viz/layout';

export interface SugiyamaOptions {
  direction: 'TB' | 'LR';
  nodeSeparation: number;
  rankSeparation: number;
  objectAttraction: number;
}

/**
 * Applies the OC-Sugiyama layout algorithm to React Flow nodes and edges.
 *
 * This adapter:
 * 1. Converts React Flow nodes/edges into the ObjectCentricPetriNet format
 * 2. Determines max node dimensions (the algorithm uses uniform sizes)
 * 3. Runs the Sugiyama pipeline (cycle breaking → ILP layer assignment →
 *    dummy insertion → barycenter ordering → Brandes-Köpf positioning → arc routing)
 * 4. Maps the computed coordinates back to React Flow node positions
 */
export async function applySugiyamaLayout(
  nodes: Node[],
  edges: Edge[],
  options: SugiyamaOptions,
): Promise<Node[]> {
  // Separate places and transitions
  const placeNodes = nodes.filter((n) => n.type === 'place');
  const transitionNodes = nodes.filter((n) => n.type === 'transition');

  // Skip nodes that aren't part of the Petri net (e.g., auxText)
  const petriNetNodeIds = new Set([
    ...placeNodes.map((n) => n.id),
    ...transitionNodes.map((n) => n.id),
  ]);

  // Build a mapping from node ID to color set name (acts as "objectType" for OC-Sugiyama)
  // In OCPN, the color set of a place corresponds to its object type
  // Determine max place dimensions (for uniform placeRadius)
  const maxPlaceWidth = Math.max(
    ...placeNodes.map((n) => n.measured?.width ?? 60),
    60,
  );
  const maxPlaceHeight = Math.max(
    ...placeNodes.map((n) => n.measured?.height ?? 60),
    60,
  );
  const placeRadius = Math.max(maxPlaceWidth, maxPlaceHeight) / 2;

  // Determine max transition dimensions
  const transitionWidth = Math.max(
    ...transitionNodes.map((n) => n.measured?.width ?? 80),
    80,
  );
  const transitionHeight = Math.max(
    ...transitionNodes.map((n) => n.measured?.height ?? 40),
    40,
  );

  // Reset static counters to avoid ID collisions across multiple calls
  ObjectCentricPetriNet.placeCounter = 0;
  ObjectCentricPetriNet.transitionCounter = 0;
  ObjectCentricPetriNet.dummyCounter = 0;
  ObjectCentricPetriNet.arcCounter = 0;

  // Build Place and Transition instances
  // We need to map from React Flow IDs to ocpn-viz IDs and back
  const rfIdToPlace: Map<string, InstanceType<typeof ObjectCentricPetriNet.Place>> = new Map();
  const rfIdToTransition: Map<string, InstanceType<typeof ObjectCentricPetriNet.Transition>> = new Map();

  for (const node of placeNodes) {
    const colorSetName = (node.data as { colorSet?: string }).colorSet || '';
    const place = new ObjectCentricPetriNet.Place(
      node.id, // use RF node ID as name (fromJSON matches arcs by name)
      colorSetName, // objectType = colorSet name
      [], // outArcs
      [], // inArcs
      false, // initial
      false, // final
    );
    rfIdToPlace.set(node.id, place);
  }

  for (const node of transitionNodes) {
    const label = (node.data as { label?: string }).label || node.id;
    const transition = new ObjectCentricPetriNet.Transition(
      node.id, // name
      label,
      [], // inArcs
      [], // outArcs
      {}, // properties
      false, // silent
      new Set(), // adjacentObjectTypes
    );
    rfIdToTransition.set(node.id, transition);
  }

  // Build arcs and wire them to places/transitions
  const arcs: InstanceType<typeof ObjectCentricPetriNet.Arc>[] = [];
  for (const edge of edges) {
    if (!petriNetNodeIds.has(edge.source) || !petriNetNodeIds.has(edge.target)) {
      continue; // Skip edges not connected to petri net nodes
    }

    const source = rfIdToPlace.get(edge.source) || rfIdToTransition.get(edge.source);
    const target = rfIdToPlace.get(edge.target) || rfIdToTransition.get(edge.target);

    if (!source || !target) continue;

    // Skip same-type connections (place→place or transition→transition)
    const sourceIsPlace = rfIdToPlace.has(edge.source);
    const targetIsPlace = rfIdToPlace.has(edge.target);
    if (sourceIsPlace === targetIsPlace) continue;

    const arc = new ObjectCentricPetriNet.Arc(
      source,
      target,
      false, // reversed
      false, // variable
      1, // weight
      {}, // properties
    );
    arcs.push(arc);

    source.outArcs.push(arc);
    target.inArcs.push(arc);

    // Track adjacent object types on transitions
    if (sourceIsPlace && !targetIsPlace) {
      // place → transition
      const place = rfIdToPlace.get(edge.source)!;
      const transition = rfIdToTransition.get(edge.target)!;
      transition.adjacentObjectTypes.add(place.objectType);
    } else if (!sourceIsPlace && targetIsPlace) {
      // transition → place
      const transition = rfIdToTransition.get(edge.source)!;
      const place = rfIdToPlace.get(edge.target)!;
      transition.adjacentObjectTypes.add(place.objectType);
    }
  }

  const places = Array.from(rfIdToPlace.values());
  const transitions = Array.from(rfIdToTransition.values());

  // Collect object types from places
  const objectTypes = Array.from(new Set(places.map((p) => p.objectType))).filter(
    (ot: string) => ot !== '',
  );

  // Create the OCPN instance
  const ocpn = new ObjectCentricPetriNet(
    'layout', // name
    places,
    transitions,
    [], // dummyNodes
    arcs,
    objectTypes,
    {}, // properties
  );

  // Build the config
  const config = new OCPNConfig({
    includedObjectTypes: objectTypes,
    direction: options.direction,
    layerSep: options.rankSeparation,
    vertexSep: options.nodeSeparation,
    placeRadius,
    transitionWidth,
    transitionHeight,
    objectAttraction: options.objectAttraction,
    alignmentType: 'center',
  });

  // Run the Sugiyama algorithm
  const layout = await sugiyama(ocpn, config);

  if (!layout) {
    console.error('OC-Sugiyama layout failed');
    return nodes;
  }

  // Build a mapping from ocpn-viz internal IDs back to React Flow node IDs
  const ocpnIdToRfId: Map<string, string> = new Map();
  for (const [rfId, place] of rfIdToPlace) {
    ocpnIdToRfId.set(place.id, rfId);
  }
  for (const [rfId, transition] of rfIdToTransition) {
    ocpnIdToRfId.set(transition.id, rfId);
  }

  // Map positions back to React Flow nodes
  return nodes.map((node) => {
    // Find the ocpn-viz ID for this React Flow node
    const place = rfIdToPlace.get(node.id);
    const transition = rfIdToTransition.get(node.id);
    const ocpnId = place?.id || transition?.id;

    if (!ocpnId || !layout.vertices[ocpnId]) {
      return node; // Non-petri-net node (e.g., auxText) — leave in place
    }

    const vertex = layout.vertices[ocpnId];
    if (vertex.x === undefined || vertex.y === undefined) {
      return node;
    }

    // The sugiyama algorithm returns center coordinates; React Flow positions are top-left
    const nodeWidth = node.measured?.width ?? 0;
    const nodeHeight = node.measured?.height ?? 0;

    return {
      ...node,
      position: {
        x: vertex.x - nodeWidth / 2,
        y: vertex.y - nodeHeight / 2,
      },
    };
  });
}
