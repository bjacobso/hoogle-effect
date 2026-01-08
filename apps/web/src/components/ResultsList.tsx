import type { FunctionEntry } from '@hoogle-effect/api'
import { SignatureDisplay } from './SignatureDisplay'

interface ResultsListProps {
  results: FunctionEntry[]
  query: string
  selectedId?: string
  onSelect: (func: FunctionEntry) => void
  onModuleClick?: (moduleName: string) => void
}

export function ResultsList({ results, query, selectedId, onSelect, onModuleClick }: ResultsListProps) {
  if (!query) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-4">Start typing to search Effect functions</p>
        <div className="text-sm text-gray-400 dark:text-gray-500 space-y-2">
          <p>Try searching for:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {['map', 'flatMap', 'retry', 'Effect<A, E, R>', 'forEach'].map((term) => (
              <code
                key={term}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300 cursor-default"
              >
                {term}
              </code>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
        <p>No results found for "{query}"</p>
        <p className="text-sm mt-2">Try a different search term</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        {results.length} result{results.length !== 1 ? 's' : ''}
      </div>

      {results.map((func) => (
        <button
          key={func.id}
          onClick={() => onSelect(func)}
          className={`w-full text-left p-4 rounded-lg border transition-all ${
            selectedId === func.id
              ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 ring-2 ring-purple-200 dark:ring-purple-800'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-700 hover:bg-purple-50/50 dark:hover:bg-purple-900/20'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {onModuleClick ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onModuleClick(func.module)
                    }}
                    className="font-semibold text-gray-900 dark:text-gray-100 hover:text-purple-600 dark:hover:text-purple-400 hover:underline transition-colors"
                  >
                    {func.module}
                  </button>
                ) : (
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{func.module}</span>
                )}
                <span className="text-gray-400 dark:text-gray-500">.</span>
                <span className="font-semibold text-purple-600 dark:text-purple-400">{func.name}</span>
                {func.since && (
                  <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded">
                    v{func.since}
                  </span>
                )}
                {func.githubUrl && (
                  <a
                    href={func.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-gray-400 dark:text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    title="View on GitHub"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                    </svg>
                  </a>
                )}
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400 font-mono truncate mb-2">
                <SignatureDisplay signature={func.signature} compact />
              </div>

              {func.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{func.description}</p>
              )}
            </div>

            {func.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {func.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}
