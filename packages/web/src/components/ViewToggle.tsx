export type ViewMode = 'flat' | 'tree' | 'list'

interface ViewToggleProps {
  mode: ViewMode
  onChange: (mode: ViewMode) => void
}

export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div className="flex rounded-lg bg-gray-100 p-1">
      <button
        onClick={() => onChange('flat')}
        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
          mode === 'flat'
            ? 'bg-white text-purple-700 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        title="Flat list"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <button
        onClick={() => onChange('tree')}
        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
          mode === 'tree'
            ? 'bg-white text-purple-700 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        title="Tree view"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      </button>
      <button
        onClick={() => onChange('list')}
        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
          mode === 'list'
            ? 'bg-white text-purple-700 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        title="Grouped list"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </button>
    </div>
  )
}
