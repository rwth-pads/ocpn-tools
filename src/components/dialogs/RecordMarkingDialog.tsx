import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Trash2, Upload, Download } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Define the type for values within a record
type RecordValue = string | number | boolean
// Define the type for a single record object
type RecordData = Record<string, RecordValue>

interface RecordAttribute {
  name: string
  type: string
}

interface RecordMarkingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  colorSetName: string
  attributes: RecordAttribute[]
  initialData: RecordData[]
  onSave: (data: RecordData[]) => void
}

export function RecordMarkingDialog({
  open,
  onOpenChange,
  colorSetName,
  attributes,
  initialData,
  onSave,
}: RecordMarkingDialogProps) {
  const [activeTab, setActiveTab] = useState("visual")
  const [records, setRecords] = useState<RecordData[]>([])
  const [jsonText, setJsonText] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Initialize records from initialData
  useEffect(() => {
    if (initialData && Array.isArray(initialData)) {
      setRecords(initialData)
      setJsonText(JSON.stringify(initialData, null, 2))
    } else {
      setRecords([])
      setJsonText("[]")
    }
  }, [initialData])

  // Update JSON text when records change
  useEffect(() => {
    if (activeTab === "visual") {
      setJsonText(JSON.stringify(records, null, 2))
    }
  }, [records, activeTab])

  // Add a new empty record
  const addRecord = () => {
    const newRecord: RecordData = {}
    attributes.forEach((attr) => {
      // Set default values based on type
      if (attr.type === "INT") {
        newRecord[attr.name] = 0
      } else if (attr.type === "REAL") {
        newRecord[attr.name] = 0.0
      } else if (attr.type === "BOOL") {
        newRecord[attr.name] = false
      } else {
        newRecord[attr.name] = ""
      }
    })
    setRecords([...records, newRecord])
  }

  // Delete a record
  const deleteRecord = (index: number) => {
    const newRecords = [...records]
    newRecords.splice(index, 1)
    setRecords(newRecords)
  }

  // Update a record field
  const updateRecord = (index: number, field: string, value: RecordValue) => {
    const newRecords = [...records]
    newRecords[index] = { ...newRecords[index], [field]: value }
    setRecords(newRecords)
  }

  // Parse value based on type
  const parseValue = (value: string, type: string): RecordValue => {
    try {
      if (type === "INT") {
        const parsed = Number.parseInt(value, 10)
        return isNaN(parsed) ? 0 : parsed
      } else if (type === "REAL") {
        const parsed = Number.parseFloat(value)
        return isNaN(parsed) ? 0.0 : parsed
      } else if (type === "BOOL") {
        return value.toLowerCase() === "true"
      }
      return value
    } catch {
      if (type === "INT") return 0
      if (type === "REAL") return 0.0
      if (type === "BOOL") return false
      return value
    }
  }

  // Handle JSON text change
  const handleJsonChange = (text: string) => {
    setJsonText(text)
    setError(null)
    try {
      const parsed = JSON.parse(text)
      if (!Array.isArray(parsed)) {
        setError("JSON must be an array of records")
      }
    } catch {
      setError("Invalid JSON format")
    }
  }

  // Handle tab change
  const handleTabChange = (value: string) => {
    if (value === "json" && activeTab === "visual") {
      setJsonText(JSON.stringify(records, null, 2))
    } else if (value === "visual" && activeTab === "json") {
      try {
        const parsed = JSON.parse(jsonText)
        if (Array.isArray(parsed)) {
          setRecords(parsed as RecordData[])
          setError(null)
        } else {
          setError("JSON must be an array of records")
        }
      } catch {
        setError("Invalid JSON format")
      }
    }
    setActiveTab(value)
  }

  // Handle save
  const handleSave = () => {
    if (activeTab === "json") {
      try {
        const parsed = JSON.parse(jsonText)
        if (Array.isArray(parsed)) {
          onSave(parsed as RecordData[])
          onOpenChange(false)
        } else {
          setError("JSON must be an array of records")
        }
      } catch {
        setError("Invalid JSON format")
      }
    } else {
      onSave(records)
      onOpenChange(false)
    }
  }

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      try {
        const parsed = JSON.parse(content)
        if (Array.isArray(parsed)) {
          setRecords(parsed as RecordData[])
          setJsonText(JSON.stringify(parsed, null, 2))
          setActiveTab("visual")
          setError(null)
        } else {
          setError("Uploaded file must contain an array of records")
        }
      } catch {
        try {
          const lines = content.split("\n")
          const headers = lines[0].split(",").map((h) => h.trim())

          const parsedRecords: RecordData[] = []
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue

            const values = lines[i].split(",").map((v) => v.trim())
            const record: RecordData = {}

            headers.forEach((header, index) => {
              const attr = attributes.find((a) => a.name === header)
              if (attr && index < values.length) {
                record[header] = parseValue(values[index], attr.type)
              }
            })

            parsedRecords.push(record)
          }

          setRecords(parsedRecords)
          setJsonText(JSON.stringify(parsedRecords, null, 2))
          setActiveTab("visual")
          setError(null)
        } catch {
          setError("Failed to parse file as JSON or CSV")
        }
      }
    }
    reader.readAsText(file)
  }

  // Generate CSV template
  const generateCsvTemplate = () => {
    const headers = attributes.map((attr) => attr.name).join(",")
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n`
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `${colorSetName}_template.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Initial Marking for {colorSetName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-x-2">
              <Button variant="outline" size="sm" onClick={addRecord}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Record
              </Button>
              <Button variant="outline" size="sm" onClick={generateCsvTemplate}>
                <Download className="h-4 w-4 mr-2" />
                CSV Template
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Input type="file" id="file-upload" className="hidden" accept=".json,.csv" onChange={handleFileUpload} />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </span>
                </Button>
              </Label>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="visual">Visual Editor</TabsTrigger>
              <TabsTrigger value="json">JSON Editor</TabsTrigger>
            </TabsList>
            <TabsContent value="visual" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    {attributes.map((attr) => (
                      <TableHead key={attr.name}>{attr.name}</TableHead>
                    ))}
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={attributes.length + 1} className="text-center">
                        No records. Click "Add Record" to create one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((record, index) => (
                      <TableRow key={index}>
                        {attributes.map((attr) => (
                          <TableCell key={`${index}-${attr.name}`}>
                            <Input
                              value={record[attr.name]?.toString() ?? ""}
                              onChange={(e) => updateRecord(index, attr.name, parseValue(e.target.value, attr.type))}
                            />
                          </TableCell>
                        ))}
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => deleteRecord(index)} className="h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="json">
              <div className="space-y-2">
                <Label htmlFor="json-editor">JSON Editor</Label>
                <textarea
                  id="json-editor"
                  className="w-full h-[300px] font-mono text-sm p-2 border rounded-md"
                  value={jsonText}
                  onChange={(e) => handleJsonChange(e.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
