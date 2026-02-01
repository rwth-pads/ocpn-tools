import type { PetriNet } from '@/types';
import type { ColorSet, Variable, Priority, Function, Use } from '@/declarations';

import { v4 as uuidv4 } from 'uuid';
import { PlaceNodeProps } from '@/nodes/PlaceNode';
import { TransitionNodeProps } from '@/nodes/TransitionNode';

export type PetriNetData = {
  petriNetsById: Record<string, PetriNet>;
  petriNetOrder: string[];
  colorSets: ColorSet[]
  variables: Variable[]
  priorities: Priority[]
  functions: Function[]
  uses: Use[] // Added uses
  // Simulation settings (optional for backward compatibility)
  simulationSettings?: {
    stepsPerRun?: number;
    animationDelayMs?: number;
    simulationEpoch?: string | null;
  }
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
          })),
        transitions: petriNet.nodes
          .filter((node) => node.type === "transition")
          .map((transition) => ({
            id: transition.id,
            name: transition.data.label, // Use "name" instead of "label"
            guard: transition.data.guard || "",
            time: transition.data.time || "",
            priority: transition.data.priority || "",
            position: transition.position,
            size: transition.measured || { width: 50, height: 30 }, // Replace "measured" with "size"
          })),
        arcs: petriNet.edges.map((arc) => ({
          id: arc.id,
          source: arc.source,
          target: arc.target,
          inscription: arc.label || "", // Use "inscription" instead of "label"
          isBidirectional: arc.data?.isBidirectional || false, // Include bidirectional flag
          labelOffset: arc.data?.labelOffset || undefined, // Include label offset if set
        })),
      };
    }),
    colorSets: data.colorSets,
    variables: data.variables,
    priorities: data.priorities,
    functions: data.functions,
    uses: data.uses, // Include uses in JSON
    simulationSettings: data.simulationSettings || undefined, // Include simulation settings if present
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
    }[];
    transitions: {
      id: string;
      name: string;
      guard?: string;
      time?: string;
      priority?: string;
      position?: { x: number; y: number };
      size?: { width: number; height: number };
    }[];
    arcs: {
      id: string;
      source: string;
      target: string;
      inscription?: string;
      isBidirectional?: boolean;
      labelOffset?: { x: number; y: number };
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
        labelOffset: arc.labelOffset || undefined,
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
  
  // Parse simulation settings if present
  const simulationSettings = parsedData.simulationSettings ? {
    stepsPerRun: parsedData.simulationSettings.stepsPerRun,
    animationDelayMs: parsedData.simulationSettings.animationDelayMs,
    simulationEpoch: parsedData.simulationSettings.simulationEpoch,
  } : undefined;

  return {
    petriNetsById,
    petriNetOrder,
    colorSets,
    variables,
    priorities,
    functions,
    uses, // Include uses in the returned data
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

// Parse CPN Tools XML
function parseCPNToolsXML(content: string): PetriNetData {
  const parser = new DOMParser();
  const cpnXML = parser.parseFromString(content, 'text/xml');

  const petriNetsById: Record<string, PetriNet> = {};
  const petriNetOrder: string[] = [];

  // Parse color sets
  const colorSets = Array.from(cpnXML.querySelectorAll('globbox color')).map((color) => {
    const id = color.querySelector('id')?.textContent || '';
    
    // Check for product type
    const productElement = color.querySelector('product');
    if (productElement) {
      const productIds = Array.from(productElement.querySelectorAll(':scope > id')).map(el => el.textContent || '');
      const definition = `colset ${id} = product ${productIds.join(' * ')};`;
      return {
        id,
        name: id,
        type: 'product',
        definition,
        color: generateRandomColor(),
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
          const definition = `colset ${id} = int with ${rangeStart}..${rangeEnd};`;
          return {
            id,
            name: id,
            type: 'basic',
            definition,
            color: generateRandomColor(),
          };
        }
      }
      // Plain int without range
      return {
        id,
        name: id,
        type: 'basic',
        definition: `colset ${id} = int;`,
        color: generateRandomColor(),
      };
    }
    
    // Check for other basic types without children
    const basicTypeElement = Array.from(color.children).find((child) => {
      const tagName = child.tagName.toLowerCase();
      return ['bool', 'string', 'real', 'unit', 'time', 'intinf'].includes(tagName);
    });
    const basicType = basicTypeElement ? basicTypeElement.tagName.toLowerCase() : null;
    const layout = color.querySelector('layout')?.textContent || '';
    const definition = basicType ? `colset ${id} = ${basicType};` : (layout || `colset ${id} = complex;`);

    return {
      id,
      name: id,
      type: basicType ? 'basic' : 'complex',
      definition,
      color: generateRandomColor(),
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

  // Parse priorities
  const priorities = Array.from(cpnXML.querySelectorAll('globbox ml')).reduce((acc, ml) => {
    const layout = ml.querySelector('layout')?.textContent || '';
    const match = layout.match(/val\s+(\w+)\s*=\s*(\d+);/); // Extract name and value
    if (match) {
      acc.push({
        id: uuidv4(),
        name: match[1],
        level: parseInt(match[2], 10),
      });
    }
    return acc;
  }, [] as { id: string; name: string; level: number }[]);

  // Parse functions - from both block ml elements and top-level ml elements
  const functions: Function[] = [];
  
  // Parse from block ml elements
  Array.from(cpnXML.querySelectorAll('globbox block ml')).forEach((ml) => {
    const layout = ml.querySelector('layout')?.textContent || '';
    const id = ml.getAttribute('id') || uuidv4();

    // Check if it looks like a function definition (starts with 'fun')
    if (layout.trim().startsWith('fun ')) {
      const nameMatch = layout.match(/^fun\s+([a-zA-Z0-9_]+)/);
      const functionName = nameMatch ? nameMatch[1] : `func_${id}`;

      functions.push({
        id: id,
        name: functionName,
        code: layout,
      });
    }
  });
  
  // Also parse top-level ml elements in globbox (not inside blocks)
  Array.from(cpnXML.querySelectorAll('globbox > ml')).forEach((ml) => {
    const mlContent = ml.textContent?.trim() || '';
    const id = ml.getAttribute('id') || uuidv4();

    // Check if it looks like a function definition (starts with 'fun')
    if (mlContent.startsWith('fun ')) {
      const nameMatch = mlContent.match(/^fun\s+([a-zA-Z0-9_]+)/);
      const functionName = nameMatch ? nameMatch[1] : `func_${id}`;

      functions.push({
        id: id,
        name: functionName,
        code: mlContent,
      });
    }
  });

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
          label: place.querySelector('text')?.textContent || '',
          colorSet: place.querySelector('type text')?.textContent || '',
          initialMarking: rawInitialMarking,
        },
      };
      
      // Create inscription child nodes
      const inscriptions = [
        createInscriptionNode(placeId, centerX, centerY, width, height, place.querySelector('type'), 'colorSet'),
        createInscriptionNode(placeId, centerX, centerY, width, height, place.querySelector('initmark'), 'initialMarking'),
      ].filter((n): n is NonNullable<typeof n> => n !== null);
      
      return [placeNode, ...inscriptions];
    });

    // Parse transitions with their inscriptions
    const transitionsWithInscriptions = Array.from(page.querySelectorAll('trans')).flatMap((transition) => {
      const box = transition.querySelector('box');
      const width = box ? parseFloat(box.getAttribute('w') || '60') : 60;
      const height = box ? parseFloat(box.getAttribute('h') || '40') : 40;
      
      const centerX = parseFloat(transition.querySelector('posattr')?.getAttribute('x') || '0');
      const centerY = -parseFloat(transition.querySelector('posattr')?.getAttribute('y') || '0');
      
      const transId = transition.getAttribute('id') || uuidv4();
      
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
          label: transition.querySelector('text')?.textContent || '',
          guard: transition.querySelector('cond text')?.textContent || '',
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
      const label = arc.querySelector('annot text')?.textContent || '';
      
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
          data: { bendpoints, isBidirectional: true, order },
        }];
      }

      let source = '';
      let target = '';

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
        data: { bendpoints, order },
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

  return {
    petriNetsById,
    petriNetOrder,
    colorSets,
    variables,
    priorities,
    functions,
    uses, // Add uses to the returned data
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
  };
}

