import { useState, useMemo, useEffect } from 'react'
import type { FunctionEntry } from '@hoogle-effect/api'
import { SignatureDisplay } from './SignatureDisplay'

interface ListViewProps {
  results: FunctionEntry[]
  allFunctions: FunctionEntry[]
  query: string
  selectedId?: string
  onSelect: (func: FunctionEntry) => void
}

interface ModuleGroup {
  key: string
  moduleName: string
  packageName: string
  functions: FunctionEntry[]
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`w-5 h-5 transition-transform ${expanded ? 'rotate-90' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

export function ListView({ results, allFunctions, query, selectedId, onSelect }: ListViewProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  // Use results if there's a query, otherwise show all functions
  const functions = query.trim() ? results : allFunctions

  // Group by module
  const groupedResults = useMemo((): ModuleGroup[] => {
    const groups = new Map<string, FunctionEntry[]>()

    for (const func of functions) {
      const pkg = func.package || 'effect'
      const key = `${pkg}/${func.module}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(func)
    }

    return Array.from(groups.entries())
      .map(([key, funcs]) => {
        const [packageName, moduleName] = key.split('/')
        return {
          key,
          moduleName,
          packageName,
          functions: funcs.sort((a, b) => a.name.localeCompare(b.name)),
        }
      })
      .sort((a, b) => {
        // Sort by package first (effect before others), then by module name
        if (a.packageName !== b.packageName) {
          if (a.packageName === 'effect') return -1
          if (b.packageName === 'effect') return 1
          return a.packageName.localeCompare(b.packageName)
        }
        return a.moduleName.localeCompare(b.moduleName)
      })
  }, [functions])

  // Auto-expand when searching (show first 3 modules)
  useEffect(() => {
    if (query.trim() && groupedResults.length > 0) {
      const toExpand = groupedResults.slice(0, 3).map((g) => g.key)
      setExpandedModules(new Set(toExpand))
    } else if (!query.trim()) {
      // When browsing, collapse all initially
      setExpandedModules(new Set())
    }
  }, [query, groupedResults])

  const toggleModule = (key: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (functions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
        <p>No functions to display</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        {groupedResults.length} module{groupedResults.length !== 1 ? 's' : ''} &middot;{' '}
        {functions.length} function{functions.length !== 1 ? 's' : ''}
        {query.trim() && ` matching "${query}"`}
      </div>

      {groupedResults.map((group) => (
        <ModuleSection
          key={group.key}
          group={group}
          isExpanded={expandedModules.has(group.key)}
          onToggle={() => toggleModule(group.key)}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

function ModuleSection({
  group,
  isExpanded,
  onToggle,
  selectedId,
  onSelect,
}: {
  group: ModuleGroup
  isExpanded: boolean
  onToggle: () => void
  selectedId?: string
  onSelect: (func: FunctionEntry) => void
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <ChevronIcon expanded={isExpanded} />
          <div className="text-left">
            <span className="font-semibold text-gray-900 dark:text-gray-100">{group.moduleName}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({group.packageName})</span>
          </div>
        </div>
        <span className="text-sm px-2.5 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full">
          {group.functions.length} function{group.functions.length !== 1 ? 's' : ''}
        </span>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          {group.functions.map((func) => (
            <FunctionRow
              key={func.id}
              func={func}
              isSelected={selectedId === func.id}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FunctionRow({
  func,
  isSelected,
  onSelect,
}: {
  func: FunctionEntry
  isSelected: boolean
  onSelect: (func: FunctionEntry) => void
}) {
  return (
    <button
      onClick={() => onSelect(func)}
      className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-all ${
        isSelected
          ? 'bg-purple-50 dark:bg-purple-900/30 border-l-4 border-l-purple-500'
          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-l-4 border-l-transparent'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`font-semibold ${isSelected ? 'text-purple-700 dark:text-purple-400' : 'text-purple-600 dark:text-purple-400'}`}>
            {func.name}
          </span>
          {func.since && (
            <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded">
              v{func.since}
            </span>
          )}
          {func.deprecated && (
            <span className="text-xs px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 rounded">
              deprecated
            </span>
          )}
        </div>

        {func.tags.length > 0 && (
          <div className="flex gap-1 flex-shrink-0">
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

      <div className="text-sm text-gray-600 dark:text-gray-400 font-mono truncate mt-1">
        <SignatureDisplay signature={func.signature} compact />
      </div>

      {func.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{func.description}</p>
      )}
    </button>
  )
}
