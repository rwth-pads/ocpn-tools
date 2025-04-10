import type { Node, Edge } from '@xyflow/react';
import type { ColorSet, Variable, Priority, Function, FunctionPattern } from '@/declarations';

import { v4 as uuidv4 } from 'uuid';

export type PetriNetData = {
  id: string
  name: string
  nodes: Node[]
  edges: Edge[]
  colorSets: ColorSet[]
  variables: Variable[]
  priorities: Priority[]
  functions: Function[]
}

// Convert Petri Net data to CPN Tools XML format
export function convertToCPNToolsXML(data: PetriNetData): string {
  const xml = `<?xml version="1.0" encoding="iso-8859-1"?>
<!DOCTYPE workspaceElements PUBLIC "-//CPN//DTD CPNXML 1.0//EN" "http://cpntools.org/DTD/6/cpn.dtd">
<workspaceElements>
  <generator tool="CPN Tools" version="4.0.1" format="6"/>
  <cpnet>
    <globbox>
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
            // Define the list of basic types
            const basicTypes = ["int", "unit", "bool", "intinf", "time", "real", "string"];
            
            // Check if the definition ends with a basic type
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
      </block>
    </globbox>
    <page id="ID6">
      <pageattr name="${data.name}"/>
      ${data.nodes
        .map((node) => {
          if (node.type === "place") {
            return `<place id="${node.id}">
          <posattr x="${node.position.x}" y="${node.position.y}"/>
          <fillattr colour="White" pattern="" filled="false"/>
          <lineattr colour="Black" thick="1" type="Solid"/>
          <textattr colour="Black" bold="false"/>
          <text>${node.data.label}</text>
          <ellipse w="60.000000" h="40.000000"/>
          <type id="${node.data.colorSet}">
            <text>${node.data.colorSet}</text>
          </type>
          <initmark id="${node.id}_initmark">
            <text>${node.data.initialMarking || ""}</text>
          </initmark>
        </place>`;
          } else {
            return `<trans id="${node.id}">
          <posattr x="${node.position.x}" y="${node.position.y}"/>
          <fillattr colour="White" pattern="" filled="false"/>
          <lineattr colour="Black" thick="1" type="solid"/>
          <textattr colour="Black" bold="false"/>
          <text>${node.data.label}</text>
          <box w="60.000000" h="40.000000"/>
          ${
            node.data.guard
              ? `<cond id="${node.id}_guard">
            <text>${node.data.guard}</text>
          </cond>`
              : ""
          }
          ${
            node.data.time
              ? `<time id="${node.id}_time">
            <text>${node.data.time}</text>
          </time>`
              : ""
          }
          ${
            node.data.priority
              ? `<priority id="${node.id}_priority">
            <text>${node.data.priority}</text>
          </priority>`
              : ""
          }
        </trans>`;
          }
        })
        .join("\n      ")}
      ${data.edges
        .map(
          (edge) => `<arc id="${edge.id}" orientation="PtoT">
          <posattr x="0.000000" y="0.000000"/>
          <fillattr colour="White" pattern="" filled="false"/>
          <lineattr colour="Black" thick="1" type="Solid"/>
          <textattr colour="Black" bold="false"/>
          <arrowattr headsize="1.200000" currentcyckle="2"/>
          <transend idref="${edge.target}"/>
          <placeend idref="${edge.source}"/>
          <annot id="${edge.id}_inscription">
            <text>${edge.data?.inscription || ""}</text>
          </annot>
        </arc>`
        )
        .join("\n      ")}
      <constraints/>
    </page>
    <instances>
      <instance id="ID2149"
                page="ID6"/>
    </instances>
    <options>
      <option name="realtimestamp">
        <value>
          <boolean>false</boolean>
        </value>
      </option>
      <option name="fair_be">
        <value>
          <boolean>false</boolean>
        </value>
      </option>
      <option name="global_fairness">
        <value>
          <boolean>false</boolean>
        </value>
      </option>
      <option name="outputdirectory">
        <value>
          <text>&lt;same as model&gt;</text>
        </value>
      </option>
      <option name="extensions.10005.enable">
        <value>
          <boolean>true</boolean>
        </value>
      </option>
      <option name="extensions.10002.enable">
        <value>
          <boolean>true</boolean>
        </value>
      </option>
      <option name="extensions.10003.enable">
        <value>
          <boolean>true</boolean>
        </value>
      </option>
      <option name="extensions.10006.enable">
        <value>
          <boolean>true</boolean>
        </value>
      </option>
      <option name="extensions.10001.enable">
        <value>
          <boolean>true</boolean>
        </value>
      </option>
      <option name="repavg">
        <value>
          <boolean>true</boolean>
        </value>
      </option>
      <option name="repciavg">
        <value>
          <boolean>true</boolean>
        </value>
      </option>
      <option name="repcount">
        <value>
          <boolean>false</boolean>
        </value>
      </option>
      <option name="repfirstval">
        <value>
          <boolean>false</boolean>
        </value>
      </option>
      <option name="replastval">
        <value>
          <boolean>false</boolean>
        </value>
      </option>
      <option name="repmax">
        <value>
          <boolean>true</boolean>
        </value>
      </option>
      <option name="repmin">
        <value>
          <boolean>true</boolean>
        </value>
      </option>
      <option name="repssquare">
        <value>
          <boolean>false</boolean>
        </value>
      </option>
      <option name="repssqdev">
        <value>
          <boolean>false</boolean>
        </value>
      </option>
      <option name="repstddev">
        <value>
          <boolean>true</boolean>
        </value>
      </option>
      <option name="repsum">
        <value>
          <boolean>false</boolean>
        </value>
      </option>
      <option name="repvariance">
        <value>
          <boolean>false</boolean>
        </value>
      </option>
      <option name="avg">
        <value>
          <boolean>true</boolean>
        </value>
      </option>
      <option name="ciavg">
        <value>
          <boolean>false</boolean>
        </value>
      </option>
      <option name="count">
        <value>
          <boolean>true</boolean>
        </value>
      </option>
      <option name="firstval">
        <value>
          <boolean>false</boolean>
        </value>
      </option>
      <option name="lastval">
        <value>
          <boolean>false</boolean>
        </value>
      </option>
      <option name="max">
        <value>
          <boolean>true</boolean>
        </value>
      </option>
      <option name="min">
        <value>
          <boolean>true</boolean>
        </value>
      </option>
      <option name="ssquare">
        <value>
          <boolean>false</boolean>
        </value>
      </option>
      <option name="ssqdev">
        <value>
          <boolean>false</boolean>
        </value>
      </option>
      <option name="stddev">
        <value>
          <boolean>false</boolean>
        </value>
      </option>
      <option name="sum">
        <value>
          <boolean>false</boolean>
        </value>
      </option>
      <option name="variance">
        <value>
          <boolean>false</boolean>
        </value>
      </option>
      <option name="firstupdate">
        <value>
          <boolean>false</boolean>
        </value>
      </option>
      <option name="interval">
        <value>
          <boolean>false</boolean>
        </value>
      </option>
      <option name="lastupdate">
        <value>
          <boolean>false</boolean>
        </value>
      </option>
      <option name="untimedavg">
        <value>
          <boolean>true</boolean>
        </value>
      </option>
      <option name="untimedciavg">
        <value>
          <boolean>false</boolean>
        </value>
      </option>
      <option name="untimedcount">
        <value>
          <boolean>true</boolean>
        </value>
      </option>
      <option name="untimedfirstval">
        <value>
          <boolean>false</boolean>
        </value>
      </option>
      <option name="untimedlastval">
        <value>
          <boolean>false</boolean>
        </value>
      </option>
      <option name="untimedmax">
        <value>
          <boolean>true</boolean>
        </value>
      </option>
      <option name="untimedmin">
        <value>
          <boolean>true</boolean>
        </value>
      </option>
      <option name="untimedssquare">
        <value>
          <boolean>false</boolean>
        </value>
      </option>
      <option name="untimedssqdev">
        <value>
          <boolean>false</boolean>
        </value>
      </option>
      <option name="untimedstddev">
        <value>
          <boolean>false</boolean>
        </value>
      </option>
      <option name="untimedsum">
        <value>
          <boolean>true</boolean>
        </value>
      </option>
      <option name="untimedvariance">
        <value>
          <boolean>false</boolean>
        </value>
      </option>
    </options>
    <binders>
      <cpnbinder id="ID2222"
                 x="257"
                 y="122"
                 width="600"
                 height="400">
        <sheets>
          <cpnsheet id="ID2215"
                    panx="-6.000000"
                    pany="-5.000000"
                    zoom="1.000000"
                    instance="ID2149">
            <zorder>
              <position value="0"/>
            </zorder>
          </cpnsheet>
        </sheets>
        <zorder>
          <position value="0"/>
        </zorder>
      </cpnbinder>
    </binders>
    <monitorblock name="Monitors"/>
    <IndexNode expanded="true">
      <IndexNode expanded="false"/>
      <IndexNode expanded="false"/>
      <IndexNode expanded="false">
        <IndexNode expanded="false"/>
        <IndexNode expanded="false"/>
        <IndexNode expanded="false"/>
        <IndexNode expanded="false"/>
        <IndexNode expanded="false">
          <IndexNode expanded="false">
            <IndexNode expanded="false">
              <IndexNode expanded="false"/>
              <IndexNode expanded="false"/>
              <IndexNode expanded="false"/>
              <IndexNode expanded="false"/>
              <IndexNode expanded="false"/>
              <IndexNode expanded="false"/>
              <IndexNode expanded="false"/>
              <IndexNode expanded="false"/>
              <IndexNode expanded="false"/>
              <IndexNode expanded="false"/>
              <IndexNode expanded="false"/>
              <IndexNode expanded="false"/>
              <IndexNode expanded="false"/>
              <IndexNode expanded="false"/>
              <IndexNode expanded="false"/>
            </IndexNode>
            <IndexNode expanded="false">
              <IndexNode expanded="false"/>
              <IndexNode expanded="false"/>
              <IndexNode expanded="false"/>
              <IndexNode expanded="false"/>
              <IndexNode expanded="false"/>
              <IndexNode expanded="false"/>
              <IndexNode expanded="false"/>
              <IndexNode expanded="false"/>
              <IndexNode expanded="false"/>
              <IndexNode expanded="false"/>
              <IndexNode expanded="false"/>
              <IndexNode expanded="false"/>
            </IndexNode>
          </IndexNode>
          <IndexNode expanded="false">
            <IndexNode expanded="false"/>
            <IndexNode expanded="false"/>
            <IndexNode expanded="false"/>
            <IndexNode expanded="false"/>
            <IndexNode expanded="false"/>
            <IndexNode expanded="false"/>
            <IndexNode expanded="false"/>
            <IndexNode expanded="false"/>
            <IndexNode expanded="false"/>
            <IndexNode expanded="false"/>
            <IndexNode expanded="false"/>
            <IndexNode expanded="false"/>
          </IndexNode>
        </IndexNode>
        <IndexNode expanded="false">
          <IndexNode expanded="false"/>
          <IndexNode expanded="false"/>
          <IndexNode expanded="false"/>
          <IndexNode expanded="false"/>
          <IndexNode expanded="false"/>
        </IndexNode>
      </IndexNode>
      <IndexNode expanded="false"/>
      <IndexNode expanded="false">
        <IndexNode expanded="false">
          <IndexNode expanded="true"/>
          <IndexNode expanded="true"/>
          <IndexNode expanded="true"/>
        </IndexNode>
        <IndexNode expanded="true">
          <IndexNode expanded="false"/>
          <IndexNode expanded="false"/>
          <IndexNode expanded="false"/>
          <IndexNode expanded="false"/>
          <IndexNode expanded="false"/>
          <IndexNode expanded="false"/>
          <IndexNode expanded="false"/>
        </IndexNode>
      </IndexNode>
      <IndexNode expanded="false"/>
      <IndexNode expanded="true"/>
    </IndexNode>
  </cpnet>
</workspaceElements>`;

  return xml;
}

// Convert Petri Net data to cpn-py XML format
export function convertToCPNPyXML(data: PetriNetData): string {
  // Simplified cpn-py XML format
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<pnml xmlns="http://www.pnml.org/version-2009/grammar/pnml">
  <net id="${data.id}" type="http://www.cpntools.org/2009/cpn">
    <name>
      <text>${data.name}</text>
    </name>
    <declaration>
      <structure>
        <declarations>
          ${data.colorSets.map((cs) => `<colorset name="${cs.name}">${cs.definition}</colorset>`).join("\n          ")}
          ${data.variables.map((v) => `<variable name="${v.name}">${v.colorSet}</variable>`).join("\n          ")}
        </declarations>
      </structure>
    </declaration>
    <page id="page1">
      ${data.nodes
        .map((node) => {
          if (node.type === "place") {
            return `<place id="${node.id}">
        <name>
          <text>${node.data.label}</text>
        </name>
        <type>
          <text>${node.data.colorSet}</text>
        </type>
        <initialMarking>
          <text>${node.data.initialMarking || ""}</text>
        </initialMarking>
        <graphics>
          <position x="${node.position.x}" y="${node.position.y}"/>
        </graphics>
      </place>`
          } else {
            return `<transition id="${node.id}">
        <name>
          <text>${node.data.label}</text>
        </name>
        ${node.data.guard ? `<condition><text>${node.data.guard}</text></condition>` : ""}
        ${node.data.time ? `<time><text>${node.data.time}</text></time>` : ""}
        ${node.data.priority ? `<priority><text>${node.data.priority}</text></priority>` : ""}
        <graphics>
          <position x="${node.position.x}" y="${node.position.y}"/>
        </graphics>
      </transition>`
          }
        })
        .join("\n      ")}
      ${data.edges
        .map(
          (edge) => `<arc id="${edge.id}" source="${edge.source}" target="${edge.target}">
        <inscription>
          <text>${edge.data?.inscription || ""}</text>
        </inscription>
      </arc>`,
        )
        .join("\n      ")}
    </page>
  </net>
</pnml>`

  return xml
}

// Convert Petri Net data to JSON format
export function convertToJSON(data: PetriNetData): string {
  return JSON.stringify(data, null, 2)
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

    if (extension === "json") {
      return JSON.parse(content)
    } else if (extension === "xml" || extension === "cpn") {
      // This is a simplified parser - in a real implementation,
      // you would use a proper XML parser to extract the data

      // For now, we'll just check if it's CPN Tools or cpn-py format
      if (content.includes("<workspaceElements>") || content.includes("<cpnet>")) {
        // Parse CPN Tools XML
        return parseCPNToolsXML(content)
      } else if (content.includes("<pnml") || content.includes("http://www.pnml.org")) {
        // Parse cpn-py XML
        return parseCPNPyXML();
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

// Parse CPN Tools XML (simplified)
function parseCPNToolsXML(content: string): PetriNetData {
  const cpnet = {
    arcs: Array<{ id: string | null; orientation: string | null; transEnd: string; placeEnd: string; label: string }>(),
    places: Array<{ id: string | null; x: number; y: number; width: number; height: number; text: string; type: string; initialMarking: string }>(),
    transitions: Array<{ id: string | null; x: number; y: number; width: number; height: number; text: string; guard: string; time: string; priority: string }>(),
    auxs: Array<{ id: string | null; x: number; y: number; text: string }>(),
    colorSets: Array<{ id: string; name: string; type: string; range: string | null; definition: string; layout: string }>(),
    variables: Array<{ id: string; type: string; layout: string }>(),
    priorities: Array<{ name: string; value: number }>(),
    functions: Array<{ id: string; name: string; patterns: FunctionPattern[] }>(),
  };

  const parser = new DOMParser();
  const cpnXML = parser.parseFromString(content, 'text/xml');

  // Parse color sets
  const colorSetBlocks = Array.from(cpnXML.querySelectorAll('globbox block'));
  colorSetBlocks.forEach((block) => {
    const colors = Array.from(block.querySelectorAll('color'));
    colors.forEach((color) => {
      const id = color.querySelector('id')?.textContent || '';
      const layout = color.querySelector('layout')?.textContent || '';
      let type = "basic"; // Default to "basic" type
      const definition = layout;

      // Determine type based on the structure
      if (layout.includes("list")) {
        type = "list";
      } else if (layout.includes("product")) {
        type = "product";
      } else if (layout.includes("record")) {
        type = "record";
      } else if (layout.includes("subset")) {
        type = "subset";
      } else if (layout.includes("union")) {
        type = "union";
      }

      // Extract range if present
      const rangeElements = Array.from(color.querySelectorAll('with ml'));
      const range = rangeElements.map((ml) => ml.textContent?.trim() || '').join('..');

      cpnet.colorSets.push({
        id,
        name: id,
        type,
        range: range || null, // Include range if available, otherwise null
        definition,
        layout,
      });
    });
  });

  // Parse variables
  const variables = Array.from(cpnXML.querySelectorAll('globbox block var'));
  variables.forEach((variable) => {
    const layout = variable.querySelector('layout')?.textContent || '';
    const match = layout.match(/var\s+(\w+):(\w+);/); // Extract variable name and type from layout
    if (match) {
      const name = match[1];
      const type = match[2];
      cpnet.variables.push({ id: name, type, layout });
    }
  });

  // Parse priorities
  const priorityBlocks = Array.from(cpnXML.querySelectorAll('globbox block'));
  priorityBlocks.forEach((block) => {
    const priorities = Array.from(block.querySelectorAll('ml'));
    priorities.forEach((priority) => {
      const layout = priority.querySelector('layout')?.textContent || '';
      const match = layout.match(/val\s+(\w+)\s*=\s*(\d+);/); // Extract name and value from layout
      if (match) {
        const name = match[1];
        const value = parseInt(match[2], 10);
        cpnet.priorities.push({ name, value });
      }
    });
  });

  // Parse functions
  const functions = Array.from(cpnXML.querySelectorAll('globbox block ml'));
  functions.forEach((ml) => {
    const layout = ml.querySelector('layout')?.textContent || '';
    const match = layout.match(/^fun\s+([a-zA-Z0-9_]+)\s*(.+?)\s*=\s*(.+)$/); // Match function name, patterns, and expressions
    if (match) {
      const functionName = match[1];
      const rest = layout.split('\n').map((line) => line.trim()).filter((line) => line);
      const patterns: FunctionPattern[] = [];

      rest.forEach((line, index) => {
        const isFirstLine = index === 0;
        const regex = isFirstLine
          ? /^fun\s+([a-zA-Z0-9_]+)\s*(.+?)\s*=\s*(.+)$/
          : /^\|\s*(.+?)\s*=\s*(.+)$/;

        const lineMatch = line.match(regex);
        if (lineMatch) {
          const pattern = isFirstLine ? lineMatch[2] : lineMatch[1];
          const expression = isFirstLine ? lineMatch[3] : lineMatch[2];
          patterns.push({
            id: uuidv4(),
            pattern,
            expression,
          });
        }
      });

      if (functionName && patterns.length > 0) {
        cpnet.functions.push({
          id: uuidv4(),
          name: functionName,
          patterns,
        });
      }
    }
  });

  // Parse places, transitions, and arcs (existing logic)
  const invertY = (y: number) => -y; // Function to invert the Y-axis

  cpnet.places = Array.from(cpnXML.querySelectorAll('page place')).map((place) => {
    const width = Math.round(Number(place.querySelector('ellipse')?.getAttribute('w')) || 0);
    const height = Math.round(Number(place.querySelector('ellipse')?.getAttribute('h')) || 0);
    return {
      id: place.getAttribute('id'),
      x: Math.round(Number(place.querySelector('posattr')?.getAttribute('x')) || 0),
      y: invertY(Math.round(Number(place.querySelector('posattr')?.getAttribute('y')) || 0)),
      width,
      height,
      text: place.querySelector('text')?.textContent || '',
      type: place.querySelector('type text')?.textContent || '',
      initialMarking: place.querySelector('initmark text')?.textContent || '',
    };
  });

  cpnet.transitions = Array.from(cpnXML.querySelectorAll('page trans')).map((transition) => {
    const width = Math.round(Number(transition.querySelector('box')?.getAttribute('w')) || 0);
    const height = Math.round(Number(transition.querySelector('box')?.getAttribute('h')) || 0);
    return {
      id: transition.getAttribute('id'),
      x: Math.round(Number(transition.querySelector('posattr')?.getAttribute('x')) || 0),
      y: invertY(Math.round(Number(transition.querySelector('posattr')?.getAttribute('y')) || 0)),
      width,
      height,
      text: transition.querySelector('text')?.textContent || '',
      guard: transition.querySelector('cond text')?.textContent || '',
      time: transition.querySelector('time text')?.textContent || '',
      priority: transition.querySelector('priority text')?.textContent || '',
    };
  });

  cpnet.arcs = Array.from(cpnXML.querySelectorAll('page arc')).map((arc) => ({
    id: arc.getAttribute('id'),
    orientation: arc.getAttribute('orientation'),
    transEnd: arc.querySelector('transend')?.getAttribute('idref') || '',
    placeEnd: arc.querySelector('placeend')?.getAttribute('idref') || '',
    label: arc.querySelector('annot text')?.textContent || '',
  }));

  cpnet.auxs = Array.from(cpnXML.querySelectorAll('page Aux')).map((aux) => {
    const id = aux.getAttribute('id');
    const x = Math.round(Number(aux.querySelector('posattr')?.getAttribute('x')) || 0);
    const y = Math.round(Number(aux.querySelector('posattr')?.getAttribute('y')) || 0);
    const text = aux.querySelector('text')?.textContent || '';
    return { id, x, y, text };
  });

  return {
    id: "imported-net",
    name: cpnXML.querySelector('pageattr')?.getAttribute('name') || "Imported Petri Net",
    nodes: [
      ...cpnet.places.map((place) => ({
        id: place.id || uuidv4(), // Ensure id is a string
        type: "place",
        position: { x: place.x, y: place.y },
        width: place.width,
        height: place.height,
        data: {
          label: place.text.replace(/\n/g, ' '),
          colorSet: place.type,
          initialMarking: place.initialMarking,
        },
      })),
      ...cpnet.transitions.map((transition) => ({
        id: transition.id || uuidv4(), // Ensure id is a string
        type: "transition",
        position: { x: transition.x, y: transition.y },
        width: transition.width,
        height: transition.height,
        data: {
          label: transition.text.replace(/\n/g, ' '),
          guard: transition.guard,
          time: transition.time,
          priority: transition.priority,
        },
      })),
      ...cpnet.auxs.map((aux) => ({
        id: aux.id || uuidv4(),
        type: "auxText",
        position: { x: aux.x, y: aux.y },
        data: {
          label: aux.text.replace(/\n/g, ' '),
        },
      })),
    ],
    edges: cpnet.arcs.map((arc) => ({
      id: arc.id || uuidv4(), // Ensure id is a string by providing a fallback
      source: arc.orientation === "PtoT" ? arc.placeEnd : arc.transEnd,
      target: arc.orientation === "PtoT" ? arc.transEnd : arc.placeEnd,
      label: arc.label,
    })),
    colorSets: cpnet.colorSets.map((cs) => ({
      id: cs.id,
      name: cs.id,
      type: cs.type || "basic",
      definition: cs.layout || `colset ${cs.id} = ${cs.type};`,
      color: generateRandomColor(), // Assign random color
    })),
    variables: cpnet.variables.map((v) => ({
      id: v.id,
      name: v.id,
      colorSet: v.type,
    })),
    priorities: cpnet.priorities.map((p) => ({
      id: uuidv4(), // Generate a unique ID for each priority
      name: p.name,
      level: p.value,
    })),
    functions: cpnet.functions.map((f) => ({
      id: f.id,
      name: f.name,
      patterns: f.patterns,
    })),
  };
}

// Parse cpn-py XML (simplified)
function parseCPNPyXML(): PetriNetData {
  // This is a placeholder - in a real implementation, you would use a proper XML parser
  // and extract the data according to the cpn-py XML structure

  // For now, we'll return a dummy Petri Net
  return {
    id: "imported-net",
    name: "Imported Petri Net",
    nodes: [],
    edges: [],
    colorSets: [],
    variables: [],
    priorities: [],
    functions: [],
  }
}

