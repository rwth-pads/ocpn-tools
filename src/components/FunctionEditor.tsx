import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { v4 as uuidv4 } from "uuid";
import type { Function } from "@/declarations";

interface FunctionEditorProps {
  existingFunction?: Function
  onSave: (colorSet: Omit<Function, "id">) => void
}

export function FunctionEditor({ existingFunction, onSave }: FunctionEditorProps) {
  const [func, setFunc] = useState<Function>(
    existingFunction || {
      id: uuidv4(),
      name: "",
      code: "",
    },
  )
  
  const [rawCode, setRawCode] = useState<string>(
    existingFunction ? existingFunction.code : 'fn add(x,y) {x+y}',
  )

  const handleRawCodeChange = (code: string) => {
    setRawCode(code)
  }

  const handleSave = () => {
    const name = rawCode.split(" ")[1].split("(")[0].trim();
    const code = rawCode;
    const newFunc = {
      ...func,
      name,
      code,
    };
    setFunc(newFunc);
    onSave(newFunc);
  }

  return (
    <div className="space-y-4">
      {/* <Tabs defaultValue="structured" className="w-full" onValueChange={setActiveTab}>
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

            <div className="space-y-4 max-h-[400px] overflow-y-auto">
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

        <TabsContent value="text" className="pt-4"> */}
          <div className="space-y-2">
            <Label htmlFor="raw-code">Function Definition</Label>
            <Textarea
              id="raw-code"
              ref={(textareaRef) => {
                if (textareaRef) {
                  textareaRef.focus();
                }
              }}
              onFocus={(e) =>
                e.currentTarget.setSelectionRange(
                  e.currentTarget.value.length,
                  e.currentTarget.value.length
                )
              }
              placeholder="fn add(x,y) {x+y}"
              className="font-mono h-[240px]"
              value={rawCode}
              onChange={(e) => handleRawCodeChange(e.target.value)}
            />
            {/* <p className="text-xs text-muted-foreground">
              Define your function using ML-style syntax. Use multiple lines with | for pattern matching.
            </p> */}
          </div>
        {/* </TabsContent>
      </Tabs> */}

      <div className="pt-4">
        <Button onClick={handleSave} className="w-full">
          Save Function
        </Button>
      </div>
    </div>
  )
};
