import type { SearchMode } from '../hooks/useSearch'

interface SearchModeToggleProps {
  mode: SearchMode
  onChange: (mode: SearchMode) => void
}

export function SearchModeToggle({ mode, onChange }: SearchModeToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => onChange('text')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          mode === 'text'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Text
      </button>
      <button
        onClick={() => onChange('type')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          mode === 'type'
            ? 'bg-white text-purple-700 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Type
      </button>
    </div>
  )
}
