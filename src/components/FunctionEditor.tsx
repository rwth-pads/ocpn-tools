import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import type { Function, FunctionPattern } from "@/declarations";

interface FunctionEditorProps {
  existingFunction?: Function
  onSave: (colorSet: Omit<Function, "id">) => void
}

export function FunctionEditor({ existingFunction, onSave }: FunctionEditorProps) {
  const [func, setFunc] = useState<Function>(
    existingFunction || {
      id: uuidv4(),
      name: "",
      patterns: [
        {
          id: uuidv4(),
          pattern: "",
          expression: "",
        },
      ],
    },
  )

  const [rawCode, setRawCode] = useState<string>(
    existingFunction ? generateFunctionCode(existingFunction) : "fun functionName (param1, param2) = expression;",
  )

  const handleAddPattern = () => {
    setFunc({
      ...func,
      patterns: [
        ...func.patterns,
        {
          id: uuidv4(),
          pattern: "",
          expression: "",
        },
      ],
    })
  }

  const handleRemovePattern = (id: string) => {
    if (func.patterns.length <= 1) return // Keep at least one pattern

    setFunc({
      ...func,
      patterns: func.patterns.filter((p) => p.id !== id),
    })
  }

  const handlePatternChange = (id: string, field: "pattern" | "expression", value: string) => {
    setFunc({
      ...func,
      patterns: func.patterns.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    })
  }

  const handleNameChange = (name: string) => {
    setFunc({
      ...func,
      name,
    })
  }

  const handleRawCodeChange = (code: string) => {
    setRawCode(code)
  }

  const handleSave = () => {
    // If in raw code mode, try to parse the function
    if (activeTab === "text") {
      // In a real implementation, you would parse the raw code here
      // For now, we'll just use a simple approach
      const parsedFunc = parseRawFunctionCode(rawCode)
      if (parsedFunc) {
        onSave({
          ...parsedFunc
        })
      } else {
        // Fallback to the structured editor data
        onSave(func)
      }
    } else {
      onSave(func)
    }
  }

  // Generate function code from the structured editor
  function generateFunctionCode(func: Function): string {
    if (!func.name || func.patterns.length === 0) {
      return "fun functionName (param1, param2) = expression;"
    }

    return (
      func.patterns
        .map((pattern, index) => {
          const prefix = index === 0 ? "fun " : "| "
          return `${prefix}${func.name} ${pattern.pattern} = ${pattern.expression}`
        })
        .join("\n") + ";"
    )
  }

  // Simple parser for raw function code (in a real implementation, this would be more robust)
  function parseRawFunctionCode(code: string): Function | null {
    try {
      // Remove trailing semicolon if present
      code = code.trim().replace(/;$/, "")

      // Split by lines and filter out empty lines
      const lines = code
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line)

      if (lines.length === 0) return null

      const patterns: FunctionPattern[] = []
      let functionName = ""

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const isFirstLine = i === 0

        // Parse first line: "fun name pattern = expression"
        // or subsequent lines: "| name pattern = expression"
        const regex = isFirstLine
          ? /^fun\s+([a-zA-Z0-9_]+)\s*(.+?)\s*=\s*(.+)$/
          : /^\|\s*([a-zA-Z0-9_]+)\s*(.+?)\s*=\s*(.+)$/

        const match = line.match(regex)
        if (!match) continue

        const [, name, pattern, expression] = match

        if (isFirstLine) {
          functionName = name
        } else if (name !== functionName) {
          // All patterns must use the same function name
          continue
        }

        patterns.push({
          id: uuidv4(),
          pattern,
          expression,
        })
      }

      if (!functionName || patterns.length === 0) return null

      return {
        id: uuidv4(),
        name: functionName,
        patterns,
      }
    } catch (error) {
      console.error("Error parsing function code:", error)
      return null
    }
  }

  const [activeTab, setActiveTab] = useState<string>("structured")

  return (
    <div className="space-y-4">
      <Tabs defaultValue="structured" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="structured">Structured Editor</TabsTrigger>
          <TabsTrigger value="text">Text Editor</TabsTrigger>
        </TabsList>

        <TabsContent value="structured" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="function-name">Function Name</Label>
            <Input
              id="function-name"
              placeholder="e.g., listMult"
              value={func.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNameChange(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <Label>Function Patterns</Label>

            {func.patterns.map((pattern, index) => (
              <div key={pattern.id} className="space-y-2 border p-3 rounded-md">
                <div className="flex justify-between items-center">
                  <Label>Pattern {index + 1}</Label>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemovePattern(pattern.id)}
                    disabled={func.patterns.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`pattern-${pattern.id}`}>Pattern</Label>
                  <Input
                    id={`pattern-${pattern.id}`}
                    placeholder="e.g., (c, x::xs)"
                    value={pattern.pattern}
                    onChange={(e) => handlePatternChange(pattern.id, "pattern", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`expression-${pattern.id}`}>Expression</Label>
                  <Textarea
                    id={`expression-${pattern.id}`}
                    placeholder="e.g., (c * x)::listMult(c, xs)"
                    className="font-mono h-[80px]"
                    value={pattern.expression}
                    onChange={(e) => handlePatternChange(pattern.id, "expression", e.target.value)}
                  />
                </div>
              </div>
            ))}

            <Button variant="outline" size="sm" onClick={handleAddPattern} className="w-full">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Pattern
            </Button>
          </div>

          <div className="pt-4">
            <Label>Preview</Label>
            <div className="font-mono text-sm mt-2 p-3 bg-muted rounded-md whitespace-pre-wrap">
              {generateFunctionCode(func)}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="text" className="pt-4">
          <div className="space-y-2">
            <Label htmlFor="raw-code">Function Definition</Label>
            <Textarea
              id="raw-code"
              placeholder="fun listMult (c, x::xs) = (c * x)::listMult(c, xs)
| listMult (_, nil) = nil;"
              className="font-mono h-[240px]"
              value={rawCode}
              onChange={(e) => handleRawCodeChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Define your function using ML-style syntax. Use multiple lines with | for pattern matching.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="pt-4">
        <Button onClick={handleSave} className="w-full">
          Save Function
        </Button>
      </div>
    </div>
  )
};
