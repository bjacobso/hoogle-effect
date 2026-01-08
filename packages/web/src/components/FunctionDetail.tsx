import type { FunctionEntry } from '@hoogle-effect/api'
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
        <CodeBlock code={func.signature} language="typescript" />
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
      <div className="p-6 bg-gray-50 border-b border-gray-100">
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

      {/* Source */}
      {func.githubUrl && (
        <div className="p-6 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Source
          </h3>
          <a
            href={func.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            View on GitHub
          </a>
        </div>
      )}
    </div>
  )
}
