'use client'

import { Editor } from '@monaco-editor/react'
import { Card } from '@/components/ui/card'
import { useTheme } from 'next-themes'

interface CodeEditorProps {
  initialCode: string
  onChange: (value: string) => void
  height?: string
}

export function CodeEditor({ initialCode, onChange, height = '400px' }: CodeEditorProps) {
  const { theme } = useTheme()

  return (
    <Card className="overflow-hidden">
      <Editor
        height={height}
        defaultLanguage="python"
        defaultValue={initialCode}
        onChange={(value) => onChange(value || '')}
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: true,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 4,
          wordWrap: 'on',
        }}
      />
    </Card>
  )
}

