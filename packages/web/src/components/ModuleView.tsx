import type { FunctionEntry, ModuleEntry } from '@hoogle-effect/api'
import { SignatureDisplay } from './SignatureDisplay'

interface ModuleViewProps {
  module: ModuleEntry | null
  functions: FunctionEntry[]
  onBack: () => void
  onSelectFunction: (func: FunctionEntry) => void
  selectedFunctionId?: string
}

export function ModuleView({
  module,
  functions,
  onBack,
  onSelectFunction,
  selectedFunctionId,
}: ModuleViewProps) {
  return (
    <div className="space-y-4">
      {/* Module Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Back to search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{module?.name ?? 'Module'}</h2>
            <p className="text-sm text-gray-500">
              {functions.length} function{functions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Function List */}
      <div className="space-y-2">
        {functions.map((func) => (
          <button
            key={func.id}
            onClick={() => onSelectFunction(func)}
            className={`w-full text-left p-4 rounded-lg border transition-all ${
              selectedFunctionId === func.id
                ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-200'
                : 'bg-white border-gray-200 hover:border-purple-200 hover:bg-purple-50/50'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {/* Function name */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-purple-600">{func.name}</span>
                  {func.since && (
                    <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                      v{func.since}
                    </span>
                  )}
                </div>

                {/* Signature */}
                <div className="text-sm text-gray-600 font-mono truncate mb-2">
                  <SignatureDisplay signature={func.signature} compact />
                </div>

                {/* Description */}
                {func.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">{func.description}</p>
                )}
              </div>

              {/* Tags */}
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
    </div>
  )
}
