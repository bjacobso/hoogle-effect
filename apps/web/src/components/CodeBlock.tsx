import { useCodeHighlight } from "../hooks/useCodeHighlight"

interface CodeBlockProps {
  code: string
  language?: string
}

export function CodeBlock({ code, language = "typescript" }: CodeBlockProps) {
  const highlighted = useCodeHighlight(code, language)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code)
  }

  return (
    <div className="relative group">
      <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
        {highlighted ? (
          <code className="text-sm font-mono">{highlighted}</code>
        ) : (
          <code className="text-sm text-gray-100 font-mono whitespace-pre">
            {code}
          </code>
        )}
      </pre>
      <button
        onClick={copyToClipboard}
        className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-600"
      >
        Copy
      </button>
    </div>
  )
}
