import type { FunctionEntry } from '@hoogle-effect/api'
import { SignatureDisplay } from './SignatureDisplay'
import { CodeBlock } from './CodeBlock'

interface FunctionDetailProps {
  func: FunctionEntry
}

export function FunctionDetail({ func }: FunctionDetailProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg text-gray-600">{func.module}</span>
          <span className="text-gray-400">.</span>
          <span className="text-xl font-bold text-purple-600">{func.name}</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {func.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full"
            >
              {tag}
            </span>
          ))}
          {func.since && (
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
              since v{func.since}
            </span>
          )}
          {func.deprecated && (
            <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
              deprecated
            </span>
          )}
        </div>

        {/* Type signature */}
        <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
          <SignatureDisplay signature={func.signature} />
        </div>
      </div>

      {/* Description */}
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Description
        </h3>
        <p className="text-gray-700 leading-relaxed">
          {func.description || 'No description available.'}
        </p>
      </div>

      {/* Examples */}
      {func.examples.length > 0 && (
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Examples
          </h3>
          <div className="space-y-4">
            {func.examples.map((example, i) => (
              <div key={i}>
                {example.title && (
                  <p className="text-sm font-medium text-gray-700 mb-2">{example.title}</p>
                )}
                <CodeBlock code={example.code} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Import */}
      <div className="p-6 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Import
        </h3>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm bg-gray-100 px-3 py-2 rounded font-mono text-gray-700">
            import {'{ '}{func.module}{' }'} from "effect"
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`import { ${func.module} } from "effect"`)
            }}
            className="px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  )
}
