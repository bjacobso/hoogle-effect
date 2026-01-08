interface PackageFilterProps {
  packages: string[]
  selectedPackages: Set<string>
  onSelectionChange: (packages: Set<string>) => void
  isOpen: boolean
  onToggleOpen: () => void
  packageCounts?: Record<string, number>
}

export function PackageFilter({
  packages,
  selectedPackages,
  onSelectionChange,
  isOpen,
  onToggleOpen,
  packageCounts,
}: PackageFilterProps) {
  const togglePackage = (pkg: string) => {
    const newSet = new Set(selectedPackages)
    if (newSet.has(pkg)) {
      // Don't allow deselecting all packages
      if (newSet.size > 1) {
        newSet.delete(pkg)
      }
    } else {
      newSet.add(pkg)
    }
    onSelectionChange(newSet)
  }

  const isFiltered = selectedPackages.size < packages.length

  if (packages.length === 0) {
    return null
  }

  return (
    <div className="mt-3">
      {/* Toggle button */}
      <button
        onClick={onToggleOpen}
        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        aria-expanded={isOpen}
      >
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
        <span>Filter by package</span>
        {isFiltered && (
          <span className="px-1.5 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full">
            {selectedPackages.size}/{packages.length}
          </span>
        )}
      </button>

      {/* Collapsible panel */}
      {isOpen && (
        <div className="mt-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex flex-wrap gap-4">
            {packages.map((pkg) => (
              <label key={pkg} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedPackages.has(pkg)}
                  onChange={() => togglePackage(pkg)}
                  className="w-4 h-4 text-purple-600 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 dark:bg-gray-700"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{pkg}</span>
                {packageCounts?.[pkg] !== undefined && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    ({packageCounts[pkg]})
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
