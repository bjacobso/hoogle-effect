import type { FunctionEntry } from '@hoogle-effect/api'
import { SignatureDisplay } from './SignatureDisplay'

interface ResultsListProps {
  results: FunctionEntry[]
  query: string
  selectedId?: string
  onSelect: (func: FunctionEntry) => void
}

export function ResultsList({ results, query, selectedId, onSelect }: ResultsListProps) {
  if (!query) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-500 mb-4">Start typing to search Effect functions</p>
        <div className="text-sm text-gray-400 space-y-2">
          <p>Try searching for:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {['map', 'flatMap', 'retry', 'Effect<A, E, R>', 'forEach'].map((term) => (
              <code
                key={term}
                className="px-2 py-1 bg-gray-100 rounded text-gray-600 cursor-default"
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
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
        <p>No results found for "{query}"</p>
        <p className="text-sm mt-2">Try a different search term</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-500 mb-3">
        {results.length} result{results.length !== 1 ? 's' : ''}
      </div>

      {results.map((func) => (
        <button
          key={func.id}
          onClick={() => onSelect(func)}
          className={`w-full text-left p-4 rounded-lg border transition-all ${
            selectedId === func.id
              ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-200'
              : 'bg-white border-gray-200 hover:border-purple-200 hover:bg-purple-50/50'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-900">{func.module}</span>
                <span className="text-gray-400">.</span>
                <span className="font-semibold text-purple-600">{func.name}</span>
                {func.since && (
                  <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                    v{func.since}
                  </span>
                )}
              </div>

              <div className="text-sm text-gray-600 font-mono truncate mb-2">
                <SignatureDisplay signature={func.signature} compact />
              </div>

              {func.description && (
                <p className="text-sm text-gray-500 line-clamp-2">{func.description}</p>
              )}
            </div>

            {func.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {func.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full"
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
