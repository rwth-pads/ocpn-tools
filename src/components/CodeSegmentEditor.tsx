"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { UndoableTextarea as Textarea } from "@/components/ui/undoable-input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CodeSegmentEditorProps {
  value: string
  onChange: (value: string) => void
}

export function CodeSegmentEditor({ value, onChange }: CodeSegmentEditorProps) {
  const [inputPattern, setInputPattern] = useState("")
  const [outputPattern, setOutputPattern] = useState("")
  const [actionCode, setActionCode] = useState("")
  const [rawCode, setRawCode] = useState(value || "")

  // Parse the code segment when the value changes
  useEffect(() => {
    if (!value) {
      // Set default template
      setInputPattern("")
      setOutputPattern("")
      setActionCode("")
      setRawCode("input ();\noutput ();\naction\n();")
      return
    }

    setRawCode(value)

    // Parse the code segment
    try {
      const inputMatch = value.match(/input\s*$$(.*?)$$;/s)
      const outputMatch = value.match(/output\s*$$(.*?)$$;/s)
      const actionMatch = value.match(/action\s*(.*?)(?:$$$$;|$$$$$)/s)

      setInputPattern(inputMatch ? inputMatch[1] : "")
      setOutputPattern(outputMatch ? outputMatch[1] : "")
      setActionCode(actionMatch ? actionMatch[1].trim() : "")
    } catch (error) {
      console.error("Error parsing code segment:", error)
    }
  }, [value])

  // Update the raw code when any part changes
  const updateRawCode = () => {
    const newCode = `input (${inputPattern});\noutput (${outputPattern});\naction\n${actionCode}();`
    setRawCode(newCode)
    onChange(newCode)
  }

  // Handle changes to the individual parts
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputPattern(e.target.value)
  }

  const handleOutputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setOutputPattern(e.target.value)
  }

  const handleActionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setActionCode(e.target.value)
  }

  const handleRawCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRawCode(e.target.value)
    onChange(e.target.value)
  }

  // Apply changes when leaving the input fields
  const handleBlur = () => {
    updateRawCode()
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="structured" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="structured">Structured Editor</TabsTrigger>
          <TabsTrigger value="raw">Raw Code</TabsTrigger>
        </TabsList>

        <TabsContent value="structured" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="input-pattern">Input Pattern</Label>
            <Textarea
              id="input-pattern"
              placeholder="n, b"
              className="font-mono h-[60px]"
              value={inputPattern}
              onChange={handleInputChange}
              onBlur={handleBlur}
            />
            <p className="text-xs text-muted-foreground">
              List the CPN variables that can be used in the code action, separated by commas.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="output-pattern">Output Pattern</Label>
            <Textarea
              id="output-pattern"
              placeholder="result"
              className="font-mono h-[60px]"
              value={outputPattern}
              onChange={handleOutputChange}
              onBlur={handleBlur}
            />
            <p className="text-xs text-muted-foreground">
              List the CPN variables to be changed as a result of the execution, separated by commas.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="action-code">Action Code</Label>
            <Textarea
              id="action-code"
              placeholder="let val result = n + 1 in result end"
              className="font-mono h-[120px]"
              value={actionCode}
              onChange={handleActionChange}
              onBlur={handleBlur}
            />
            <p className="text-xs text-muted-foreground">
              ML code to execute when the transition fires. Can use variables from input pattern and must return a value
              matching the output pattern.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="raw" className="pt-4">
          <div className="space-y-2">
            <Label htmlFor="raw-code">Code Segment</Label>
            <Textarea
              id="raw-code"
              placeholder="input (n, b);\noutput (result);\naction\nlet val result = n + 1 in result end();"
              className="font-mono h-[240px]"
              value={rawCode}
              onChange={handleRawCodeChange}
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="pt-2">
        <p className="text-xs text-muted-foreground">
          Code segments may use CPN variables and can bind variables on output arcs. The action section is mandatory,
          while input and output are optional.
        </p>
      </div>
    </div>
  )
}

