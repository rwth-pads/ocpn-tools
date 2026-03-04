import type { PetriNet, FusionSet, Monitor } from '@/types';
import type { ColorSet, Variable, Priority, Function, Use, Value } from '@/declarations';

import { v4 as uuidv4 } from 'uuid';
import { PlaceNodeProps } from '@/nodes/PlaceNode';
import { TransitionNodeProps } from '@/nodes/TransitionNode';

export type PetriNetData = {
  ocpnName?: string; // Top-level OCPN project name
  petriNetsById: Record<string, PetriNet>;
  petriNetOrder: string[];
  colorSets: ColorSet[]
  variables: Variable[]
  priorities: Priority[]
  functions: Function[]
  uses: Use[] // Added uses
  values: Value[] // Named constants (val declarations)
  fusionSets?: FusionSet[] // Fusion sets for fusion places
  monitors?: Monitor[] // Analysis monitors
  // Simulation settings (optional for backward compatibility)
  simulationSettings?: {
    stepsPerRun?: number;
    animationDelayMs?: number;
    simulationEpoch?: string | null;
  }
  /** Warnings generated during CPN Tools XML import (SML expressions that could not be translated, etc.) */
  importWarnings?: string[];
}

// Convert Petri Net data to CPN Tools XML format
export function convertToCPNToolsXML(data: PetriNetData): string {
  const pagesXML = Object.values(data.petriNetsById)
    .map((petriNet) => {
      const placesXML = petriNet.nodes
        .filter((node) => node.type === "place")
        .map((place) => {
          return `<place id="${place.id}">
            <posattr x="${place.position.x}" y="${place.position.y}"/>
            <fillattr colour="White" pattern="" filled="false"/>
            <lineattr colour="Black" thick="1" type="Solid"/>
            <textattr colour="Black" bold="false"/>
            <text>${place.data.label}</text>
            <ellipse w="60.000000" h="40.000000"/>
            <type id="${place.data.colorSet}">
              <text>${place.data.colorSet}</text>
            </type>
            <initmark id="${place.id}_initmark">
              <text>${place.data.initialMarking || ""}</text>
            </initmark>
          </place>`;
        })
        .join("\n");

      const transitionsXML = petriNet.nodes
        .filter((node) => node.type === "transition")
        .map((transition) => {
          return `<trans id="${transition.id}">
            <posattr x="${transition.position.x}" y="${transition.position.y}"/>
            <fillattr colour="White" pattern="" filled="false"/>
            <lineattr colour="Black" thick="1" type="solid"/>
            <textattr colour="Black" bold="false"/>
            <text>${transition.data.label}</text>
            <box w="60.000000" h="40.000000"/>
            ${
              transition.data.guard
                ? `<cond id="${transition.id}_guard">
                  <text>${transition.data.guard}</text>
                </cond>`
                : ""
            }
            ${
              transition.data.time
                ? `<time id="${transition.id}_time">
                  <text>${transition.data.time}</text>
                </time>`
                : ""
            }
            ${
              transition.data.priority
                ? `<priority id="${transition.id}_priority">
                  <text>${transition.data.priority}</text>
                </priority>`
                : ""
            }
          </trans>`;
        })
        .join("\n");

      const arcsXML = petriNet.edges
        .map((edge) => {
          return `<arc id="${edge.id}" orientation="PtoT">
            <posattr x="0.000000" y="0.000000"/>
            <fillattr colour="White" pattern="" filled="false"/>
            <lineattr colour="Black" thick="1" type="Solid"/>
            <textattr colour="Black" bold="false"/>
            <arrowattr headsize="1.200000" currentcyckle="2"/>
            <transend idref="${edge.target}"/>
            <placeend idref="${edge.source}"/>
            <annot id="${edge.id}_inscription">
              <text>${edge.label || ""}</text>
            </annot>
          </arc>`;
        })
        .join("\n");

      return `<page id="${petriNet.id}">
        <pageattr name="${petriNet.name}"/>
        ${placesXML}
        ${transitionsXML}
        ${arcsXML}
        <constraints/>
      </page>`;
    })
    .join("\n");

  const usesXML = data.uses
    .map((use) => `<use file=\"${use.name}\"/>`)
    .join('\n');

  const functionsXML = data.functions
    .map(
      (f) => `<ml id="${f.id}">
        ${f.code}
        <layout>${f.code}</layout>
      </ml>`
    )
    .join("\n        ");

  const xml = `<?xml version="1.0" encoding="iso-8859-1"?>
<!DOCTYPE workspaceElements PUBLIC "-//CPN//DTD CPNXML 1.0//EN" "http://cpntools.org/DTD/6/cpn.dtd">
<workspaceElements>
  <generator tool="CPN Tools" version="4.0.1" format="6"/>
  <cpnet>
    <globbox>
      ${usesXML}
      <block id="ID2">
        <id>Standard priorities</id>
        ${data.priorities
          .map(
            (p) => `<ml id="${p.id}">
          val ${p.name} = ${p.level};
          <layout>val ${p.name} = ${p.level};</layout>
        </ml>`
          )
          .join("\n        ")}
      </block>
      <block id="ID1">
        <id>Standard declarations</id>
        ${data.colorSets
          .map((cs) => {
            const basicTypes = ["int", "unit", "bool", "intinf", "time", "real", "string"];
            const basicTypeMatch = cs.definition.match(/colset\s+\w+\s*=\s*(\w+);$/);
            const basicType = basicTypeMatch ? basicTypeMatch[1].toLowerCase() : null;
            return `<color id="${cs.id}">
              <id>${cs.name}</id>
              ${basicType && basicTypes.includes(basicType) ? `<${basicType}/>` : ""}
              <layout>${cs.definition}</layout>
            </color>`;
          })
          .join("\n        ")}
        ${data.variables
          .map(
            (v) => `<var id="${v.id}">
          <type>
            <id>${v.colorSet}</id>
          </type>
          <id>${v.name}</id>
          <layout>var ${v.name}:${v.colorSet};</layout>
        </var>`
          )
          .join("\n        ")}
        ${functionsXML}
      </block>
    </globbox>
    ${pagesXML}
    <monitorblock name="Monitors"/>
  </cpnet>
</workspaceElements>`;

  return xml;
}

// Convert Petri Net data to cpn-py JSON format
export function convertToCPNPyJSON(data: PetriNetData): string {
  const allNodes = Object.values(data.petriNetsById).flatMap((petriNet) => petriNet.nodes);
  const allEdges = Object.values(data.petriNetsById).flatMap((petriNet) => petriNet.edges);

  const json = {
    $schema: "http://json-schema.org/draft-07/schema#",
    colorSets: data.colorSets.map((cs) => cs.definition),
    places: allNodes
      .filter((node) => node.type === "place")
      .map((place) => ({
        name: place.data.label,
        colorSet: place.data.colorSet,
      })),
    transitions: allNodes
      .filter((node) => node.type === "transition")
      .map((transition) => ({
        name: transition.data.label,
        variables: transition.data.variables || [],
        guard: transition.data.guard || "True",
        inArcs: allEdges
          .filter((edge) => edge.target === transition.id)
          .map((edge) => ({
            place: allNodes.find((node) => node.id === edge.source)?.data.label || "",
            expression: edge.label || "",
          })),
        outArcs: allEdges
          .filter((edge) => edge.source === transition.id)
          .map((edge) => ({
            place: allNodes.find((node) => node.id === edge.target)?.data.label || "",
            expression: edge.label || "",
          })),
      })),
    initialMarking: allNodes
      .filter((node) => node.type === "place")
      .reduce((acc: Record<string, { tokens: (string | number)[][] }>, place) => {
        const marking = place.data.initialMarking || [];
        acc[String(place.data.label)] = marking && Array.isArray(marking)
          ? { tokens: marking.map((token: string | number | (string | number)[]) =>
              Array.isArray(token)
                ? token.map((t) => (typeof t === "string" ? t : Number(t)))
                : [typeof token === "string" ? token : Number(token)]
            ) }
          : { tokens: [] };
        return acc;
      }, {} as Record<string, { tokens: (string | number)[][] }>),
    evaluationContext: null,
  };

  return JSON.stringify(json, null, 2);
}

// Convert Petri Net data to JSON format
export function convertToJSON(data: PetriNetData): string {
  const transformedData = {
    ocpnName: data.ocpnName || undefined,
    petriNets: data.petriNetOrder.map((id) => {
      const petriNet = data.petriNetsById[id];
      return {
        id: petriNet.id,
        name: petriNet.name,
        places: petriNet.nodes
          .filter((node) => node.type === "place")
          .map((place) => ({
            id: place.id,
            name: place.data.label, // Use "name" instead of "label"
            colorSet: place.data.colorSet,
            initialMarking: place.data.initialMarking || "",
            marking: place.data.marking || "",
            position: place.position,
            size: place.measured || { width: 50, height: 30 }, // Replace "measured" with "size"
            colorSetOffset: place.data.colorSetOffset || undefined,
            tokenCountOffset: place.data.tokenCountOffset || undefined,
            markingOffset: place.data.markingOffset || undefined,
            portType: place.data.portType || undefined,
            fusionSetId: place.data.fusionSetId || undefined,
          })),
        transitions: petriNet.nodes
          .filter((node) => node.type === "transition")
          .map((transition) => ({
            id: transition.id,
            name: transition.data.label, // Use "name" instead of "label"
            guard: transition.data.guard || "",
            time: transition.data.time || "",
            priority: transition.data.priority || "",
            codeSegment: transition.data.codeSegment || "",
            position: transition.position,
            size: transition.measured || { width: 50, height: 30 }, // Replace "measured" with "size"
            subPageId: transition.data.subPageId || undefined,
            socketAssignments: transition.data.socketAssignments || undefined,
          })),
        arcs: petriNet.edges.map((arc) => ({
          id: arc.id,
          source: arc.source,
          target: arc.target,
          inscription: arc.label || "", // Use "inscription" instead of "label"
          delay: (arc.data as Record<string, unknown>)?.delay || "", // Per-arc time delay expression
          isBidirectional: arc.data?.isBidirectional || false, // Include bidirectional flag
          arcType: arc.data?.arcType || undefined, // Include arc type if not normal
          labelOffset: arc.data?.labelOffset || undefined, // Include label offset if set
          bendpoints: arc.data?.bendpoints || undefined, // Include bendpoints if set
        })),
      };
    }),
    colorSets: data.colorSets,
    variables: data.variables,
    priorities: data.priorities,
    functions: data.functions,
    uses: data.uses, // Include uses in JSON
    values: data.values, // Include values in JSON
    fusionSets: data.fusionSets || undefined, // Include fusion sets
    monitors: data.monitors?.length ? data.monitors : undefined, // Include monitors
    simulationSettings: data.simulationSettings || undefined, // Include simulation settings if present
    simulationEpoch: data.simulationSettings?.simulationEpoch || undefined, // Top-level for WASM simulator
  };

  return JSON.stringify(transformedData, null, 2);
}

// Parse JSON data back into PetriNetData format
export function parseJSON(content: string): PetriNetData {
  const parsedData = JSON.parse(content);

  // Basic validation (can be expanded)
  if (!parsedData || !Array.isArray(parsedData.petriNets)) {
    throw new Error("Invalid JSON format: Missing 'petriNets' array.");
  }

  const petriNetsById: Record<string, PetriNet> = {};
  const petriNetOrder: string[] = [];

  parsedData.petriNets.forEach((petriNet: {
    id: string;
    name: string;
    places: {
      id: string;
      name: string;
      colorSet: string;
      initialMarking?: string;
      marking?: string;
      position?: { x: number; y: number };
      size?: { width: number; height: number };
      colorSetOffset?: { x: number; y: number };
      tokenCountOffset?: { x: number; y: number };
      markingOffset?: { x: number; y: number };
      portType?: 'in' | 'out' | 'io';
      fusionSetId?: string;
    }[];
    transitions: {
      id: string;
      name: string;
      guard?: string;
      time?: string;
      priority?: string;
      codeSegment?: string;
      position?: { x: number; y: number };
      size?: { width: number; height: number };
      subPageId?: string;
      socketAssignments?: { portPlaceId: string; socketPlaceId: string }[];
    }[];
    arcs: {
      id: string;
      source: string;
      target: string;
      inscription?: string;
      delay?: string;
      isBidirectional?: boolean;
      arcType?: string;
      labelOffset?: { x: number; y: number };
      bendpoints?: { x: number; y: number }[];
    }[];
  }) => {
    const places = petriNet.places.map((place) => ({
      id: place.id,
      type: 'place',
      position: place.position || { x: 0, y: 0 }, // Provide default position if missing
      data: {
        label: place.name, // Map 'name' back to 'label'
        colorSet: place.colorSet,
        initialMarking: place.initialMarking || "",
        marking: place.marking || "",
        colorSetOffset: place.colorSetOffset || undefined,
        tokenCountOffset: place.tokenCountOffset || undefined,
        markingOffset: place.markingOffset || undefined,
        portType: place.portType || undefined,
        fusionSetId: place.fusionSetId || undefined,
      },
      width: place.size?.width || 50,
      height: place.size?.height || 30,
    }));

    const transitions = petriNet.transitions.map((transition) => ({
      id: transition.id,
      type: 'transition',
      position: transition.position || { x: 0, y: 0 }, // Provide default position if missing
      data: {
        label: transition.name, // Map 'name' back to 'label'
        guard: transition.guard || "",
        time: transition.time || "",
        priority: transition.priority || "",
        codeSegment: transition.codeSegment || "",
        subPageId: transition.subPageId || undefined,
        socketAssignments: transition.socketAssignments || undefined,
      },
      width: transition.size?.width || 50,
      height: transition.size?.height || 30,
    }));

    const arcs = petriNet.arcs.map((arc) => ({
      id: arc.id,
      source: arc.source,
      target: arc.target,
      label: arc.inscription || "", // Map 'inscription' back to 'label'
      data: {
        isBidirectional: arc.isBidirectional || false,
        arcType: arc.arcType || undefined,
        delay: arc.delay || "",
        labelOffset: arc.labelOffset || undefined,
        bendpoints: arc.bendpoints || undefined,
      },
    }));

    const net: PetriNet = {
      id: petriNet.id,
      name: petriNet.name,
      nodes: [...places, ...transitions],
      edges: arcs,
      selectedElement: null, // Default selectedElement
    };

    petriNetsById[petriNet.id] = net;
    petriNetOrder.push(petriNet.id);
  });

  const colorSets: ColorSet[] = parsedData.colorSets || [];
  const variables: Variable[] = parsedData.variables || [];
  const priorities: Priority[] = parsedData.priorities || [];
  const functions: Function[] = parsedData.functions || [];
  const uses: Use[] = parsedData.uses || []; // Parse uses
  const values: Value[] = parsedData.values || []; // Parse values
  const fusionSets: FusionSet[] = parsedData.fusionSets || []; // Parse fusion sets
  const monitors: Monitor[] = parsedData.monitors || []; // Parse monitors
  
  // Parse simulation settings if present
  const simulationSettings = parsedData.simulationSettings ? {
    stepsPerRun: parsedData.simulationSettings.stepsPerRun,
    animationDelayMs: parsedData.simulationSettings.animationDelayMs,
    simulationEpoch: parsedData.simulationSettings.simulationEpoch,
  } : undefined;

  return {
    ocpnName: parsedData.ocpnName || undefined,
    petriNetsById,
    petriNetOrder,
    colorSets,
    variables,
    priorities,
    functions,
    uses, // Include uses in the returned data
    values, // Include values in the returned data
    fusionSets, // Include fusion sets
    monitors, // Include monitors
    simulationSettings, // Include simulation settings in the returned data
  };
}

// Save file to disk
export function saveFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Parse file content based on file extension
export function parseFileContent(content: string, fileName: string): PetriNetData | null {
  try {
    const extension = fileName.split(".").pop()?.toLowerCase()

    if (extension === 'ocpn') {
      // Handle OCPN Tools JSON format
      return parseJSON(content);
    } else if (extension === "json") {
      const json = parseCPNPyJSON(content);
      return json;
    } else if (extension === "xml" || extension === "cpn") {
      // This is a simplified parser - in a real implementation,
      // you would use a proper XML parser to extract the data

      // For now, we'll just check if it's CPN Tools or cpn-py format
      if (content.includes("<workspaceElements>") || content.includes("<cpnet>")) {
        // Parse CPN Tools XML
        return parseCPNToolsXML(content)
      }
    }

    throw new Error("Unsupported file format")
  } catch (error) {
    console.error("Error parsing file:", error)
    return null
  }
}

// Helper function to generate a random color
function generateRandomColor(): string {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// ─── SML-to-Rhai best-effort translation ──────────────────────────────────

/** Warnings collected during SML→Rhai translation of a CPN import. */
const importWarnings: string[] = [];

/**
 * Best-effort translation of Standard ML (CPN ML) expressions to Rhai syntax.
 * Returns the translated string, or the original if no translation rules apply.
 * Adds a warning to importWarnings if untranslatable SML syntax is detected.
 */
function translateSMLExpr(expr: string, context: string): string {
  let result = expr;

  // Track whether we made any changes
  const original = expr;

  // ── List operations ──
  // SML list cons: x::xs  →  Rhai: [x] + xs  (prepend element to list)
  // Must handle nested cons like a::b::l  →  [a, b] + l
  // Process right-to-left for proper nesting
  if (result.includes('::')) {
    const parts = result.split('::').map(s => s.trim());
    if (parts.length >= 2) {
      // Last part is the list tail, everything before is cons'ed elements
      const tail = parts[parts.length - 1];
      const heads = parts.slice(0, -1);
      result = `[${heads.join(', ')}] + ${tail}`;
    }
  }

  // SML list concatenation: l1^^l2  →  Rhai: l1 + l2
  result = result.replace(/\^\^/g, ' + ');

  // SML function definition: fun name(args) = body;  →  Rhai: fn name(args) { body }
  // This is for function code, not arc inscriptions
  result = result.replace(
    /^\s*fun\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*?)\)\s*=\s*(.+?)\s*;?\s*$/,
    (_match, name: string, args: string, body: string) => {
      const translatedBody = translateSMLExpr(body.trim(), context);
      return `fn ${name}(${args}) { ${translatedBody} }`;
    }
  );

  // SML if-then-else: if cond then e1 else e2  →  Rhai: if cond { e1 } else { e2 }
  result = result.replace(
    /\bif\s+(.+?)\s+then\s+(.+?)\s+else\s+(.+)/g,
    (_match, cond: string, thenExpr: string, elseExpr: string) => {
      return `if ${cond.trim()} { ${thenExpr.trim()} } else { ${elseExpr.trim()} }`;
    }
  );

  // SML boolean operators: andalso → &&, orelse → ||
  result = result.replace(/\bandalso\b/g, '&&');
  result = result.replace(/\borelse\b/g, '||');

  // SML not  →  Rhai: !
  result = result.replace(/\bnot\s*\(/g, '!(');
  result = result.replace(/\bnot\s+([a-zA-Z_])/g, '!$1');

  // SML integer division: div  →  Rhai: /
  result = result.replace(/\bdiv\b/g, '/');

  // SML modulo: mod  →  Rhai: %
  result = result.replace(/\bmod\b/g, '%');

  // SML string concatenation: ^  →  Rhai: +  (only when not part of ^^)
  // This is tricky since ^ alone is string concat in SML
  // We skip this to avoid conflicts with ^^ list concat already handled

  // SML list functions: hd(l)  →  l[0], tl(l)  →  l.split(1)[1]
  // These are complex — mark as warning
  if (/\bhd\s*\(/.test(result) || /\btl\s*\(/.test(result)) {
    importWarnings.push(`${context}: SML list function (hd/tl) may need manual translation: "${expr}"`);
  }

  // SML let-in-end  →  mark as needing manual translation
  if (/\blet\b/.test(result) && /\bin\b/.test(result)) {
    importWarnings.push(`${context}: SML let-in expression may need manual translation: "${expr}"`);
  }

  // SML case-of  →  mark as needing manual translation
  if (/\bcase\b/.test(result) && /\bof\b/.test(result)) {
    importWarnings.push(`${context}: SML case-of expression needs manual translation: "${expr}"`);
  }

  // Detect remaining untranslatable SML syntax
  // Check for SML-style pattern matching, type annotations, etc.
  if (/\bfn\s+[a-zA-Z]/.test(result) && !result.startsWith('fn ')) {
    importWarnings.push(`${context}: SML anonymous function may need manual translation: "${expr}"`);
  }

  // If nothing changed and there's complex SML syntax remaining, warn
  if (result === original) {
    // Detect potential untranslated SML
    if (/\b(val|fun)\s/.test(result) && !result.startsWith('fn ')) {
      importWarnings.push(`${context}: SML syntax may need manual translation: "${expr}"`);
    }
  }

  return result;
}

/**
 * Translates an SML function definition to Rhai.
 * Handles the common pattern: fun name(args) = body;
 */
function translateSMLFunction(code: string, funcName: string): string {
  // Handle multiple function definitions in same code block (duplicates from CPN Tools)
  // Take only the first definition
  const lines = code.split(/\n/).map(s => s.trim()).filter(s => s.length > 0);
  const firstDef = lines[0] || code;
  
  return translateSMLExpr(firstDef, `Function "${funcName}"`);
}

/**
 * Translates an SML guard expression for Rhai.
 */
function translateSMLGuard(guard: string, transitionName: string): string {
  if (!guard.trim()) return guard;
  
  // Guards in CPN Tools are enclosed in [...] brackets — strip them
  let result = guard.trim();
  if (result.startsWith('[') && result.endsWith(']')) {
    result = result.slice(1, -1).trim();
  }
  
  return translateSMLExpr(result, `Guard of transition "${transitionName}"`);
}

/**
 * Translates an SML arc inscription to Rhai.
 */
function translateSMLInscription(inscription: string, context: string): string {
  if (!inscription.trim()) return inscription;
  return translateSMLExpr(inscription, context);
}

/**
 * Translates an SML initial marking expression.
 * Handles UNIT markings and common SML patterns.
 */
function translateSMLInitialMarking(
  marking: string,
  placeName: string,
  colorSetName: string,
  colorSets: Array<{ id: string; name: string; type: string; definition: string; color: string }>,
): string {
  const trimmed = marking.trim();
  if (!trimmed) return '';

  // Handle UNIT place markings
  // The UI stores UNIT markings in array format: "[(), (), ...]" parsed by parseUnitMarkingCount
  if (colorSetName === 'UNIT' || colorSetName === 'unit') {
    // "()" means one unit token
    if (trimmed === '()') return '[()]';
    // N`() or N'() means N unit tokens → convert to array format
    const multiUnitMatch = trimmed.match(/^(\d+)[`']\(\)$/);
    if (multiUnitMatch) {
      const n = parseInt(multiUnitMatch[1], 10);
      if (n <= 0) return '';
      const units = Array(n).fill('()').join(', ');
      return `[${units}]`;
    }
    // If it's just a number like "1" for a UNIT place, it means that many unit tokens
    if (/^\d+$/.test(trimmed)) {
      const n = parseInt(trimmed, 10);
      if (n <= 0) return ''; // No tokens
      const units = Array(n).fill('()').join(', ');
      return `[${units}]`;
    }
  }

  // Handle list type markings — check if color set is a list type
  const cs = colorSets.find(c => c.name === colorSetName);
  if (cs && cs.definition.includes('= list ')) {
    // Empty list markings: [] means ONE token whose value is the empty list
    // We store this as [[]] to distinguish from "no tokens" which would be ""
    if (trimmed === '[]' || trimmed === 'nil' || trimmed === 'empty') return '[[]]';
    // N`[] or N'[] means N empty-list tokens
    const multiListMatch = trimmed.match(/^(\d+)[`']\[\]$/);
    if (multiListMatch) {
      const n = parseInt(multiListMatch[1], 10);
      if (n <= 0) return '';
      const lists = Array(n).fill('[]').join(', ');
      return `[${lists}]`;
    }
  }

  // Apply general SML→Rhai translation
  return translateSMLExpr(trimmed, `Initial marking of place "${placeName}"`);
}

// Parse CPN Tools XML
function parseCPNToolsXML(content: string): PetriNetData {
  // Clear any previous import warnings
  importWarnings.length = 0;

  const parser = new DOMParser();
  const cpnXML = parser.parseFromString(content, 'text/xml');

  const petriNetsById: Record<string, PetriNet> = {};
  const petriNetOrder: string[] = [];

  // Parse color sets
  const colorSets = Array.from(cpnXML.querySelectorAll('globbox color')).map((color) => {
    const id = color.querySelector('id')?.textContent || '';
    
    // Detect timed suffix (applies to all color set types)
    const isTimed = !!color.querySelector('timed');
    const timedSuffix = isTimed ? ' timed' : '';

    // Check for product type
    const productElement = color.querySelector('product');
    if (productElement) {
      const productIds = Array.from(productElement.querySelectorAll(':scope > id')).map(el => el.textContent || '');
      const definition = `colset ${id} = product ${productIds.join(' * ')}${timedSuffix};`;
      return {
        id,
        name: id,
        type: 'product',
        definition,
        color: generateRandomColor(),
        ...(isTimed ? { timed: true } : {}),
      };
    }
    
    // Check for int with range (e.g., <int><with><ml>0</ml><ml>10</ml></with></int>)
    const intElement = color.querySelector('int');
    if (intElement) {
      const withElement = intElement.querySelector('with');
      if (withElement) {
        const mlElements = withElement.querySelectorAll('ml');
        if (mlElements.length >= 2) {
          const rangeStart = mlElements[0].textContent || '0';
          const rangeEnd = mlElements[1].textContent || '0';
          const definition = `colset ${id} = int with ${rangeStart}..${rangeEnd}${timedSuffix};`;
          return {
            id,
            name: id,
            type: 'basic',
            definition,
            color: generateRandomColor(),
            ...(isTimed ? { timed: true } : {}),
          };
        }
      }
      // Plain int without range
      return {
        id,
        name: id,
        type: 'basic',
        definition: `colset ${id} = int${timedSuffix};`,
        color: generateRandomColor(),
        ...(isTimed ? { timed: true } : {}),
      };
    }
    
    // Check for list type (e.g., <list><id>CityCat</id></list>)
    const listElement = color.querySelector('list');
    if (listElement) {
      const elementType = listElement.querySelector('id')?.textContent || '';
      const definition = `colset ${id} = list ${elementType}${timedSuffix};`;
      return {
        id,
        name: id,
        type: 'list',
        definition,
        color: generateRandomColor(),
        ...(isTimed ? { timed: true } : {}),
      };
    }
    
    // Check for other basic types without children
    const basicTypeElement = Array.from(color.children).find((child) => {
      const tagName = child.tagName.toLowerCase();
      return ['bool', 'string', 'real', 'unit', 'time', 'intinf'].includes(tagName);
    });
    const basicType = basicTypeElement ? basicTypeElement.tagName.toLowerCase() : null;
    const layout = color.querySelector('layout')?.textContent || '';
    const definition = basicType ? `colset ${id} = ${basicType}${timedSuffix};` : (layout || `colset ${id} = complex;`);

    return {
      id,
      name: id,
      type: basicType ? 'basic' : 'complex',
      definition,
      color: generateRandomColor(),
      ...(isTimed ? { timed: true } : {}),
    };
  });

  // Parse variables
  const variables = Array.from(cpnXML.querySelectorAll('globbox var')).flatMap((variable) => {
    const idBase = variable.getAttribute('id') || uuidv4(); // Use base ID for potential multiple vars
    const colorSet = variable.querySelector('type > id')?.textContent || '';
    const layout = variable.querySelector('layout')?.textContent || '';

    // First try to get variable names from <id> elements (CPN Tools format can have multiple <id> after <type>)
    // The structure is: <var><type><id>ColorSet</id></type><id>var1</id><id>var2</id>...</var>
    const idElements = Array.from(variable.querySelectorAll(':scope > id'));
    if (idElements.length > 0) {
      return idElements.map((idEl, index) => ({
        id: `${idBase}_${index}`,
        name: idEl.textContent || '',
        colorSet,
      }));
    }

    // Fallback: Match 'var' followed by names (comma-separated) and then ':' and the type from layout
    const namesMatch = layout.match(/var\s+([^:]+):/);
    if (!namesMatch || !namesMatch[1]) {
      console.warn(`Could not parse variable names from layout: ${layout}`);
      return []; // Skip if layout doesn't match expected format
    }

    const names = namesMatch[1].split(',').map(name => name.trim()).filter(name => name);

    // Create a variable object for each name found
    return names.map((name, index) => ({
      id: `${idBase}_${index}`, // Generate unique ID for each variable derived from the same tag
      name,
      colorSet,
    }));
  });

  // Parse all <ml> elements (functions, val constants)
  // Collect from both top-level and block-nested ml elements, deduplicating by id
  const valDeclarations: { id: string; name: string; value: string }[] = [];
  const functions: Function[] = [];
  const seenMlIds = new Set<string>();

  const processMlElement = (ml: Element) => {
    const id = ml.getAttribute('id') || uuidv4();
    if (seenMlIds.has(id)) return;
    seenMlIds.add(id);

    // Get content from layout or text content
    const layout = ml.querySelector('layout')?.textContent?.trim() || '';
    const textContent = ml.textContent?.trim() || '';
    const content = layout || textContent;
    if (!content) return;

    // Check if it's a function definition (starts with 'fun')
    if (content.startsWith('fun ')) {
      const nameMatch = content.match(/^fun\s+([a-zA-Z0-9_]+)/);
      const functionName = nameMatch ? nameMatch[1] : `func_${id}`;
      functions.push({
        id,
        name: functionName,
        code: translateSMLFunction(content, functionName),
      });
      return;
    }

    // Check if it's a val declaration — store for later processing
    const valMatch = content.match(/^val\s+(\w+)\s*=\s*(.+?)\s*;?\s*$/);
    if (valMatch) {
      valDeclarations.push({
        id,
        name: valMatch[1],
        value: valMatch[2].trim(),
      });
      return;
    }

    // Other ml content (e.g., globref, arbitrary SML) — store as function
    const nameMatch = content.match(/^(?:fun|val)?\s*([a-zA-Z0-9_]+)/);
    const name = nameMatch ? nameMatch[1] : `ml_${id}`;
    functions.push({
      id,
      name,
      code: translateSMLExpr(content, `ML declaration "${name}"`),
    });
  };

  // Process ml elements that are direct children of globbox or block (not nested in color/int/with)
  const mlElements = [
    ...Array.from(cpnXML.querySelectorAll('globbox > ml')),
    ...Array.from(cpnXML.querySelectorAll('globbox > block > ml')),
  ];
  mlElements.forEach(processMlElement);

  // Parse <use> declarations
  const uses = Array.from(cpnXML.querySelectorAll('globbox use')).map((use) => {
    const mlContent = use.querySelector('ml')?.textContent || '';
    const layoutContent = use.querySelector('layout')?.textContent || '';
    const nameMatch = mlContent.match(/"([^"]+)"/) || layoutContent.match(/"([^"]+)"/);
    const name = nameMatch ? nameMatch[1] : '';
    return {
      id: uuidv4(),
      name,
      content: '', // Content is not parsed but can be edited later
    };
  });

  // Add val declarations as values (named constants)
  const values: Value[] = [];
  for (const valDecl of valDeclarations) {
    const translatedValue = translateSMLExpr(valDecl.value, `val ${valDecl.name}`);
    values.push({
      id: valDecl.id,
      name: valDecl.name,
      expression: translatedValue,
    });
  }

  // Parse pages
  const pages = Array.from(cpnXML.querySelectorAll('page'));
  pages.forEach((page) => {
    const pageId = page.getAttribute('id') || uuidv4();
    const pageName = page.querySelector('pageattr')?.getAttribute('name') || `Page ${pageId}`;

    // Helper to create inscription nodes as children
    // Note: React Flow child node positions are relative to parent's TOP-LEFT corner
    const createInscriptionNode = (
      parentId: string,
      parentCenterX: number,
      parentCenterY: number,
      parentWidth: number,
      parentHeight: number,
      element: Element | null,
      inscriptionType: string,
      textSelector: string = 'text'
    ) => {
      if (!element) return null;
      const text = element.querySelector(textSelector)?.textContent || '';
      if (!text.trim()) return null;
      
      const posattr = element.querySelector('posattr');
      if (!posattr) return null;
      
      const absX = parseFloat(posattr.getAttribute('x') || '0');
      const absY = -parseFloat(posattr.getAttribute('y') || '0'); // Invert y
      
      // Parent's top-left corner in absolute coordinates
      const parentTopLeftX = parentCenterX - parentWidth / 2;
      const parentTopLeftY = parentCenterY - parentHeight / 2;
      
      // Convert absolute position to relative offset from parent's top-left
      const relX = absX - parentTopLeftX;
      const relY = absY - parentTopLeftY;
      
      // Get color from textattr if available
      const textattr = element.querySelector('textattr');
      const color = textattr?.getAttribute('colour') || undefined;
      
      return {
        id: element.getAttribute('id') || uuidv4(),
        type: 'inscription',
        position: { x: relX, y: relY },
        parentId: parentId,
        draggable: true,
        data: {
          label: text,
          inscriptionType,
          color,
        },
      };
    };

    // Parse places with their inscriptions
    const placesWithInscriptions = Array.from(page.querySelectorAll('place')).flatMap((place) => {
      const ellipse = place.querySelector('ellipse');
      const width = ellipse ? parseFloat(ellipse.getAttribute('w') || '60') : 60;
      const height = ellipse ? parseFloat(ellipse.getAttribute('h') || '40') : 40;
      
      const rawInitialMarking = place.querySelector('initmark text')?.textContent || '';
      
      const centerX = parseFloat(place.querySelector('posattr')?.getAttribute('x') || '0');
      const centerY = -parseFloat(place.querySelector('posattr')?.getAttribute('y') || '0');
      
      const placeId = place.getAttribute('id') || uuidv4();
      
      // Calculate colorSet label offset from place center (for PlaceNode's DraggableInscription)
      const typeElement = place.querySelector('type');
      let colorSetOffset: { x: number; y: number } | undefined;
      if (typeElement) {
        const typePosattr = typeElement.querySelector('posattr');
        if (typePosattr) {
          const typeX = parseFloat(typePosattr.getAttribute('x') || '0');
          const typeY = -parseFloat(typePosattr.getAttribute('y') || '0');
          colorSetOffset = {
            x: typeX - centerX,
            y: typeY - centerY,
          };
        }
      }
      
      // Calculate initialMarking label offset from place center
      const initmarkElement = place.querySelector('initmark');
      let markingOffset: { x: number; y: number } | undefined;
      if (initmarkElement) {
        const initmarkPosattr = initmarkElement.querySelector('posattr');
        if (initmarkPosattr) {
          const initmarkX = parseFloat(initmarkPosattr.getAttribute('x') || '0');
          const initmarkY = -parseFloat(initmarkPosattr.getAttribute('y') || '0');
          markingOffset = {
            x: initmarkX - centerX,
            y: initmarkY - centerY,
          };
        }
      }
      
      const placeName = place.querySelector('text')?.textContent || '';
      const placeColorSet = place.querySelector('type text')?.textContent || '';
      
      const placeNode = {
        id: placeId,
        type: 'place',
        position: {
          x: centerX - width / 2,
          y: centerY - height / 2,
        },
        width,
        height,
        data: {
          label: placeName,
          colorSet: placeColorSet,
          initialMarking: translateSMLInitialMarking(rawInitialMarking, placeName, placeColorSet, colorSets),
          colorSetOffset,
          markingOffset,
        },
      };
      
      // Don't create separate inscription nodes for colorSet and initialMarking
      // as PlaceNode handles these internally with DraggableInscription
      return [placeNode];
    });

    // Parse transitions with their inscriptions
    const transitionsWithInscriptions = Array.from(page.querySelectorAll('trans')).flatMap((transition) => {
      const box = transition.querySelector('box');
      const width = box ? parseFloat(box.getAttribute('w') || '60') : 60;
      const height = box ? parseFloat(box.getAttribute('h') || '40') : 40;
      
      const centerX = parseFloat(transition.querySelector('posattr')?.getAttribute('x') || '0');
      const centerY = -parseFloat(transition.querySelector('posattr')?.getAttribute('y') || '0');
      
      const transId = transition.getAttribute('id') || uuidv4();
      
      const transName = transition.querySelector('text')?.textContent || '';
      const rawGuard = transition.querySelector('cond text')?.textContent || '';
      
      const transNode = {
        id: transId,
        type: 'transition',
        position: {
          x: centerX - width / 2,
          y: centerY - height / 2,
        },
        width,
        height,
        data: {
          label: transName,
          guard: translateSMLGuard(rawGuard, transName),
          time: transition.querySelector('time text')?.textContent || '',
          priority: transition.querySelector('priority text')?.textContent || '',
        },
      };
      
      // Create inscription child nodes
      const inscriptions = [
        createInscriptionNode(transId, centerX, centerY, width, height, transition.querySelector('cond'), 'guard'),
        createInscriptionNode(transId, centerX, centerY, width, height, transition.querySelector('time'), 'time'),
        createInscriptionNode(transId, centerX, centerY, width, height, transition.querySelector('priority'), 'priority'),
        createInscriptionNode(transId, centerX, centerY, width, height, transition.querySelector('code'), 'codeSegment'),
      ].filter((n): n is NonNullable<typeof n> => n !== null);
      
      return [transNode, ...inscriptions];
    });

    // Parse arcs - handle BOTHDIR (bidirectional) by creating two separate arcs
    const arcs = Array.from(page.querySelectorAll('arc')).flatMap((arc) => {
      const id = arc.getAttribute('id') || uuidv4();
      const orientation = arc.getAttribute('orientation');
      const order = parseInt(arc.getAttribute('order') || '0', 10); // Parse order for parallel arc offset
      const placeEndRef = arc.querySelector('placeend')?.getAttribute('idref') || '';
      const transEndRef = arc.querySelector('transend')?.getAttribute('idref') || '';
      const rawLabel = arc.querySelector('annot text')?.textContent || '';
      
      // Split @+ arc delay from inscription (CPN Tools format: "expr @+ delay")
      let label = rawLabel;
      let arcDelay = '';
      const atPlusIndex = rawLabel.indexOf('@+');
      if (atPlusIndex !== -1) {
        label = rawLabel.substring(0, atPlusIndex).trim();
        arcDelay = rawLabel.substring(atPlusIndex + 2).trim();
      }
      
      // Translate SML arc inscription to Rhai
      label = translateSMLInscription(label, `Arc inscription (arc ${id})`);
      if (arcDelay) {
        arcDelay = translateSMLExpr(arcDelay, `Arc delay (arc ${id})`);
      }
      
      // Parse bendpoints for curved/bent arcs
      const bendpoints = Array.from(arc.querySelectorAll('bendpoint')).map((bp) => ({
        x: parseFloat(bp.querySelector('posattr')?.getAttribute('x') || '0'),
        y: -parseFloat(bp.querySelector('posattr')?.getAttribute('y') || '0'), // Invert y-coordinate
      }));

      if (orientation === 'BOTHDIR') {
        // Create a single double-headed arc (arrows on both ends)
        return [{
          id,
          type: 'floating',
          source: placeEndRef,
          target: transEndRef,
          label,
          data: { bendpoints, isBidirectional: true, order, ...(arcDelay ? { delay: arcDelay } : {}) },
        }];
      }

      let source: string;
      let target: string;

      if (orientation === 'PtoT') {
        source = placeEndRef;
        target = transEndRef;
      } else if (orientation === 'TtoP') {
        source = transEndRef;
        target = placeEndRef;
      } else {
        // Handle other orientations or default case if needed
        source = placeEndRef;
        target = transEndRef;
        console.warn(`Unhandled arc orientation: ${orientation} for arc ${id}. Assuming PtoT.`);
      }

      return [{
        id,
        type: 'floating',
        source,
        target,
        label,
        data: { bendpoints, order, ...(arcDelay ? { delay: arcDelay } : {}) },
      }];
    });

    // Parse Aux (auxiliary text) elements
    // CPN Tools positions are center-based, CSS transform handles centering
    const auxNodes = Array.from(page.querySelectorAll('Aux')).map((aux) => {
      const id = aux.getAttribute('id') || uuidv4();
      const text = aux.querySelector('text')?.textContent || '';
      const centerX = parseFloat(aux.querySelector('posattr')?.getAttribute('x') || '0');
      const centerY = -parseFloat(aux.querySelector('posattr')?.getAttribute('y') || '0'); // Invert y-coordinate
      
      // Get color and bold from textattr
      const textattr = aux.querySelector('textattr');
      const color = textattr?.getAttribute('colour') || undefined;
      const bold = textattr?.getAttribute('bold') === 'true';
      
      // Position at center - CSS transform: translate(-50%, -50%) handles centering
      return {
        id,
        type: 'auxText',
        position: { 
          x: centerX, 
          y: centerY,
        },
        data: {
          label: text,
          color,
          bold,
        },
      };
    });

    // Create Petri net for the page
    const petriNet: PetriNet = {
      id: pageId,
      name: pageName,
      nodes: [...placesWithInscriptions, ...transitionsWithInscriptions, ...auxNodes],
      edges: arcs,
      selectedElement: null,
    };

    petriNetsById[pageId] = petriNet;
    petriNetOrder.push(pageId);
  });

  // Build priorities from val declarations that are referenced as transition priorities
  const priorities: { id: string; name: string; level: number }[] = [];
  const referencedPriorityNames = new Set<string>();
  for (const net of Object.values(petriNetsById)) {
    for (const node of net.nodes) {
      if (node.type === 'transition' && node.data?.priority && typeof node.data.priority === 'string') {
        referencedPriorityNames.add(node.data.priority);
      }
    }
  }
  for (const valDecl of valDeclarations) {
    if (referencedPriorityNames.has(valDecl.name) && /^\d+$/.test(valDecl.value)) {
      priorities.push({
        id: uuidv4(),
        name: valDecl.name,
        level: parseInt(valDecl.value, 10),
      });
    }
  }

  return {
    petriNetsById,
    petriNetOrder,
    colorSets,
    variables,
    priorities,
    functions,
    uses, // Add uses to the returned data
    values, // Add values (named constants) to the returned data
    importWarnings: importWarnings.length > 0 ? [...importWarnings] : undefined,
  };
}

// Parse cpn-py JSON
function parseCPNPyJSON(content: string): PetriNetData {
  const json = JSON.parse(content);

  // Parse places
  const places = json.places.map((place: { name: string; colorSet: string }) => ({
    id: uuidv4(),
    type: "place",
    position: { x: 0, y: 0 }, // Default position
    data: {
      label: place.name,
      colorSet: place.colorSet,
      initialMarking: json.initialMarking[place.name]?.tokens.map((token: string | number | (string | number)[]) =>
        Array.isArray(token) ? token : [token]
      ) || [],
    },
  }));

  // Parse transitions
  const transitions = json.transitions.map((transition: { name: string; guard: string; variables: string[] }) => ({
    id: uuidv4(),
    type: "transition",
    position: { x: 0, y: 0 }, // Default position
    data: {
      label: transition.name,
      guard: transition.guard,
      variables: transition.variables,
    },
  }));

  // Parse edges
  const edges = json.transitions.flatMap((transition: { name: string; inArcs: { place: string; expression: string }[]; outArcs: { place: string; expression: string }[] }) => {
    const transitionNode = transitions.find((t: TransitionNodeProps) => t.data.label === transition.name);

    return [
      ...transition.inArcs.map((arc: { place: string; expression: string }) => ({
        id: uuidv4(),
        source: places.find((place: PlaceNodeProps) => place.data.label === arc.place)?.id || "",
        target: transitionNode?.id || "",
        label: arc.expression,
      })),
      ...transition.outArcs.map((arc: { place: string; expression: string }) => ({
        id: uuidv4(),
        source: transitionNode?.id || "",
        target: places.find((place: PlaceNodeProps) => place.data.label === arc.place)?.id || "",
        label: arc.expression,
      })),
    ];
  });

  // Create a default Petri net with all nodes and edges
  const defaultPetriNetId = uuidv4();
  const defaultPetriNet: PetriNet = {
    id: defaultPetriNetId,
    name: "Default Petri Net",
    nodes: [...places, ...transitions],
    edges,
    selectedElement: null,
  };

  return {
    petriNetsById: {
      [defaultPetriNetId]: defaultPetriNet,
    },
    petriNetOrder: [defaultPetriNetId],
    colorSets: json.colorSets.map((definition: string) => ({
      id: uuidv4(),
      name: definition.split(" ")[1], // Extract name from definition
      type: "basic", // Default type
      definition,
      color: generateRandomColor(),
    })),
    variables: [], // Variables are not defined in cpn-py JSON
    priorities: [], // Priorities are not defined in cpn-py JSON
    functions: [], // Functions are not defined in cpn-py JSON
    uses: [], // Uses are not defined in cpn-py JSON
    values: [], // Values are not defined in cpn-py JSON
  };
}

