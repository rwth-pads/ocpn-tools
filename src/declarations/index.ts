import type { ColorSet, Variable, Priority } from '@/components/DeclarationManager';

import { v4 as uuidv4 } from 'uuid';

export const initialColorSets: ColorSet[] = [
  { id: uuidv4(), name: "INT", type: "basic", definition: "colset INT = int;", color: "#3b82f6" },
  { id: uuidv4(), name: "BOOL", type: "basic", definition: "colset BOOL = bool;", color: "#10b981" },
  { id: uuidv4(), name: "STRING", type: "basic", definition: "colset STRING = string;", color: "#f59e0b" },
];

export const initialVariables: Variable[] = [
  { id: uuidv4(), name: "n", colorSet: "INT" },
  { id: uuidv4(), name: "b", colorSet: "BOOL" },
];

export const initialPriorities: Priority[] = [
  { id: uuidv4(), name: "P_HIGH", level: 100 },
  { id: uuidv4(), name: "P_NORMAL", level: 50 },
  { id: uuidv4(), name: "P_LOW", level: 10 },
];
