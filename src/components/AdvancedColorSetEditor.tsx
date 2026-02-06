import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import type { ColorSet } from "@/declarations";
import { HexColorPicker } from "react-colorful";

interface AdvancedColorSetEditorProps {
  colorSet?: ColorSet
  existingColorSets: ColorSet[]
  onSave: (colorSet: Omit<ColorSet, "id">) => void
}

interface ColorSetValue {
  id: string
  name: string
  value: string
}

interface ColorSetField {
  id: string
  name: string
  type: string
}

export function AdvancedColorSetEditor({ colorSet, existingColorSets, onSave }: AdvancedColorSetEditorProps) {
  const [name, setName] = useState(colorSet?.name || "")
  const [type, setType] = useState(colorSet?.type || "basic")
  const [definition, setDefinition] = useState(colorSet?.definition || "")
  const [color, setColor] = useState(colorSet?.color || "#3b82f6") // Default to blue
  const [timed, setTimed] = useState(colorSet?.timed || false) // Whether this is a timed color set
  const [activeTab, setActiveTab] = useState("visual")

  // For basic color sets
  const [basicType, setBasicType] = useState("int")
  const [withRange, setWithRange] = useState(false)
  const [rangeStart, setRangeStart] = useState("1")
  const [rangeEnd, setRangeEnd] = useState("100")

  // For enumerated color sets
  const [enumValues, setEnumValues] = useState<ColorSetValue[]>([{ id: uuidv4(), name: "value1", value: "1" }])

  // For list color sets
  const [baseColorSet, setBaseColorSet] = useState("INT")

  // For product color sets
  const [productColorSets, setProductColorSets] = useState<string[]>([])

  // For record color sets
  const [recordFields, setRecordFields] = useState<ColorSetField[]>([{ id: uuidv4(), name: "field1", type: "INT" }])

  // For subset color sets
  const [subsetOf, setSubsetOf] = useState("INT")
  const [predicate, setPredicate] = useState("")

  useEffect(() => {
    // When editing an existing color set, try to parse its definition
    if (colorSet) {
      setName(colorSet.name);
      setType(colorSet.type);
      setDefinition(colorSet.definition);
      setTimed(colorSet.timed || false); // Set timed from existing color set

      // Try to parse the definition based on type
      if (colorSet.type === "basic") {
        const withMatch = colorSet.definition.match(/colset\s+\w+\s*=\s*(\w+)(?:\s+with\s+(\d+)\.\.(\d+))?/);
        if (withMatch) {
          setBasicType(withMatch[1]);
          if (withMatch[2] && withMatch[3]) {
            setWithRange(true);
            setRangeStart(withMatch[2]);
            setRangeEnd(withMatch[3]);
          }
        }
      } else if (colorSet.type === "list") {
        const listMatch = colorSet.definition.match(/list\s+(\w+)/);
        if (listMatch) {
          const baseSetName = listMatch[1];
          const baseSet = existingColorSets.find((cs) => cs.name === baseSetName);
          if (baseSet) {
            setBaseColorSet(baseSet.name);
          }
        }
      } else if (colorSet.type === "product") {
        const productMatch = colorSet.definition.match(/product\s+([\w\s\*]+)/);
        if (productMatch) {
          const productSets = productMatch[1].split("*").map((cs) => cs.trim());
          setProductColorSets(productSets);
        }
      } else if (colorSet.type === "record") {
        const recordMatch = colorSet.definition.match(/record\s+([\w\s\:\*]+)/);
        if (recordMatch) {
          const fields = recordMatch[1]
            .split("*")
            .map((field) => {
              const [name, type] = field.split(":").map((s) => s.trim());
              return { id: uuidv4(), name, type };
            });
          setRecordFields(fields);
        }
      } else if (colorSet.type === "subset") {
        const subsetMatch = colorSet.definition.match(/subset\s+(\w+)\s+by\s+(.+)/);
        if (subsetMatch) {
          setSubsetOf(subsetMatch[1]);
          setPredicate(subsetMatch[2]);
        }
      }
    }
  }, [colorSet, existingColorSets]);

  const handleAddEnumValue = () => {
    setEnumValues([
      ...enumValues,
      { id: uuidv4(), name: `value${enumValues.length + 1}`, value: `${enumValues.length + 1}` },
    ])
  }

  const handleRemoveEnumValue = (id: string) => {
    setEnumValues(enumValues.filter((v) => v.id !== id))
  }

  const handleUpdateEnumValue = (id: string, field: "name" | "value", value: string) => {
    setEnumValues(enumValues.map((v) => (v.id === id ? { ...v, [field]: value } : v)))
  }

  const handleAddProductColorSet = (colorSetName: string) => {
    if (colorSetName && !productColorSets.includes(colorSetName)) {
      setProductColorSets([...productColorSets, colorSetName])
    }
  }

  const handleRemoveProductColorSet = (index: number) => {
    setProductColorSets(productColorSets.filter((_, i) => i !== index))
  }

  const handleAddRecordField = () => {
    setRecordFields([...recordFields, { id: uuidv4(), name: `field${recordFields.length + 1}`, type: "INT" }])
  }

  const handleRemoveRecordField = (id: string) => {
    setRecordFields(recordFields.filter((f) => f.id !== id))
  }

  const handleUpdateRecordField = (id: string, field: "name" | "type", value: string) => {
    setRecordFields(recordFields.map((f) => (f.id === id ? { ...f, [field]: value } : f)))
  }

  const generateDefinition = (): string => {
    let def = `colset ${name} = `

    switch (type) {
      case "basic":
        def += basicType
        if (withRange) {
          def += ` with ${rangeStart}..${rangeEnd}`
        }
        break

      case "enum":
        def += `with ${enumValues.map((v) => v.name).join(" | ")}`
        break

      case "list":
        def += `list ${baseColorSet}`
        break

      case "product":
        def += `product ${productColorSets.join(" * ")}`
        break

      case "record":
        def += `record ${recordFields.map((f) => `${f.name}: ${f.type}`).join(" * ")}`
        break

      case "subset":
        def += `subset ${subsetOf} by ${predicate}`
        break

      default:
        def += type
    }

    // Append "timed" suffix if this is a timed color set
    if (timed) {
      def += " timed"
    }

    def += ";"
    return def
  }

  const handleSave = () => {
    // In visual mode, always regenerate definition to reflect current field values (name, type, etc.)
    // In text mode, use the raw definition text the user typed
    const finalDefinition = activeTab === "text" ? definition : generateDefinition()

    onSave({
      name,
      type,
      definition: finalDefinition,
      color, // Include the color
      timed, // Include the timed flag
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="e.g., DATA" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="enum">Enumerated</SelectItem>
              <SelectItem value="list">List</SelectItem>
              <SelectItem value="product">Product</SelectItem>
              <SelectItem value="record">Record</SelectItem>
              <SelectItem value="subset">Subset</SelectItem>
              <SelectItem value="union">Union</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="color">Color</Label>
        <div className="flex flex-col items-center space-y-2">
          <HexColorPicker color={color} onChange={setColor} />
          <Input
            id="color"
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full mt-2"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="timed"
          checked={timed}
          onCheckedChange={(checked) => setTimed(checked === true)}
        />
        <Label htmlFor="timed" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Timed color set
        </Label>
        <span className="text-xs text-muted-foreground">
          (tokens carry timestamps for timed simulations)
        </span>
      </div>

      <Tabs defaultValue="visual" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="visual">Visual Editor</TabsTrigger>
          <TabsTrigger value="text">Text Editor</TabsTrigger>
        </TabsList>

        <TabsContent value="visual" className="space-y-4 pt-4">
          {type === "basic" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Basic Type</Label>
                <Select value={basicType} onValueChange={setBasicType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="int">Integer</SelectItem>
                    <SelectItem value="bool">Boolean</SelectItem>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="unit">Unit</SelectItem>
                    <SelectItem value="real">Real</SelectItem>
                    <SelectItem value="time">Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="withRange"
                  checked={withRange}
                  onChange={(e) => setWithRange(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="withRange">With Range</Label>
              </div>

              {withRange && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rangeStart">Range Start</Label>
                    <Input
                      id="rangeStart"
                      type="number"
                      value={rangeStart}
                      onChange={(e) => setRangeStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rangeEnd">Range End</Label>
                    <Input id="rangeEnd" type="number" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          )}

          {type === "enum" && (
            <div className="space-y-4">
              <Label>Enumerated Values</Label>

              {enumValues.map((value) => (
                <div key={value.id} className="flex items-center space-x-2">
                  <Input
                    placeholder="Name"
                    value={value.name}
                    onChange={(e) => handleUpdateEnumValue(value.id, "name", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Value"
                    value={value.value}
                    onChange={(e) => handleUpdateEnumValue(value.id, "value", e.target.value)}
                    className="w-24"
                  />
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveEnumValue(value.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button variant="outline" size="sm" onClick={handleAddEnumValue} className="mt-2">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Value
              </Button>
            </div>
          )}

          {type === "list" && (
            <div className="space-y-2">
              <Label>Base Color Set</Label>
              <Select value={baseColorSet || "INT"} onValueChange={setBaseColorSet}>
                <SelectTrigger>
                  <SelectValue placeholder="Select base color set" />
                </SelectTrigger>
                <SelectContent>
                  {existingColorSets.map((cs) => (
                    <SelectItem key={cs.id} value={cs.name}>
                      {cs.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === "product" && (
            <div className="space-y-4">
              <Label>Product Color Sets</Label>

              {productColorSets.map((cs, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="flex-1 border rounded-md px-3 py-2">{cs}</div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveProductColorSet(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <div className="flex items-center space-x-2">
                <Select defaultValue="INT" onValueChange={handleAddProductColorSet}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add color set" />
                  </SelectTrigger>
                  <SelectContent>
                    {existingColorSets.map((cs) => (
                      <SelectItem key={cs.id} value={cs.name}>
                        {cs.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {type === "record" && (
            <div className="space-y-4">
              <Label>Record Fields</Label>

              {recordFields.map((field) => (
                <div key={field.id} className="flex items-center space-x-2">
                  <Input
                    placeholder="Field name"
                    value={field.name}
                    onChange={(e) => handleUpdateRecordField(field.id, "name", e.target.value)}
                    className="flex-1"
                  />
                  <Select
                    value={field.type}
                    onValueChange={(value) => handleUpdateRecordField(field.id, "type", value)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {existingColorSets.map((cs) => (
                        <SelectItem key={cs.id} value={cs.name}>
                          {cs.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveRecordField(field.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button variant="outline" size="sm" onClick={handleAddRecordField} className="mt-2">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </div>
          )}

          {type === "subset" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Subset of</Label>
                <Select value={subsetOf || "INT"} onValueChange={setSubsetOf}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent color set" />
                  </SelectTrigger>
                  <SelectContent>
                    {existingColorSets.map((cs) => (
                      <SelectItem key={cs.id} value={cs.name}>
                        {cs.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="predicate">Predicate</Label>
                <Input
                  id="predicate"
                  placeholder="e.g., x => x > 0"
                  value={predicate}
                  onChange={(e) => setPredicate(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="pt-4">
            <Label>Preview</Label>
            <div className="font-mono text-sm mt-2 p-3 bg-muted rounded-md">{generateDefinition()}</div>
          </div>
        </TabsContent>

        <TabsContent value="text" className="pt-4">
          <div className="space-y-2">
            <Label htmlFor="definition">Color Set Definition</Label>
            <Textarea
              id="definition"
              placeholder="colset DATA = int with 1..100;"
              className="font-mono h-[200px]"
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="pt-4">
        <Button onClick={handleSave} className="w-full">
          Save Color Set
        </Button>
      </div>
    </div>
  )
}

