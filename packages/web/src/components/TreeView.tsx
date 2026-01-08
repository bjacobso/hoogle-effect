import { useState, useMemo, useEffect } from 'react'
import type { FunctionEntry } from '@hoogle-effect/api'
import { SignatureDisplay } from './SignatureDisplay'

interface TreeViewProps {
  results: FunctionEntry[]
  allFunctions: FunctionEntry[]
  query: string
  selectedId?: string
  onSelect: (func: FunctionEntry) => void
}

interface TreeNode {
  type: 'package' | 'module' | 'function'
  name: string
  path: string
  children?: TreeNode[]
  function?: FunctionEntry
  count: number
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

export function TreeView({ results, allFunctions, query, selectedId, onSelect }: TreeViewProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // Use results if there's a query, otherwise show all functions
  const functions = query.trim() ? results : allFunctions

  // Build tree structure
  const treeData = useMemo(() => {
    const packages = new Map<string, Map<string, FunctionEntry[]>>()

    for (const func of functions) {
      const pkg = func.package || 'effect'
      if (!packages.has(pkg)) packages.set(pkg, new Map())
      const modules = packages.get(pkg)!
      if (!modules.has(func.module)) modules.set(func.module, [])
      modules.get(func.module)!.push(func)
    }

    // Sort packages: 'effect' first, then alphabetically
    const sortedPackages = Array.from(packages.entries()).sort((a, b) => {
      if (a[0] === 'effect') return -1
      if (b[0] === 'effect') return 1
      return a[0].localeCompare(b[0])
    })

    return sortedPackages.map(([pkgName, modules]) => {
      const sortedModules = Array.from(modules.entries()).sort((a, b) =>
        a[0].localeCompare(b[0])
      )

      return {
        type: 'package' as const,
        name: pkgName,
        path: pkgName,
        count: Array.from(modules.values()).flat().length,
        children: sortedModules.map(([modName, funcs]) => ({
          type: 'module' as const,
          name: modName,
          path: `${pkgName}/${modName}`,
          count: funcs.length,
          children: funcs
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((f) => ({
              type: 'function' as const,
              name: f.name,
              path: `${pkgName}/${modName}/${f.id}`,
              function: f,
              count: 1,
            })),
        })),
      }
    })
  }, [functions])

  // Auto-expand when searching
  useEffect(() => {
    if (query.trim() && results.length > 0) {
      const paths = new Set<string>()
      for (const func of results) {
        const pkg = func.package || 'effect'
        paths.add(pkg)
        paths.add(`${pkg}/${func.module}`)
      }
      setExpanded(paths)
    }
  }, [query, results])

  const toggleExpand = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
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
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {functions.length} function{functions.length !== 1 ? 's' : ''}
          {query.trim() ? ` matching "${query}"` : ' in index'}
        </span>
      </div>
      <div className="max-h-[600px] overflow-y-auto">
        {treeData.map((pkg) => (
          <PackageNode
            key={pkg.path}
            node={pkg}
            expanded={expanded}
            toggleExpand={toggleExpand}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}

function PackageNode({
  node,
  expanded,
  toggleExpand,
  selectedId,
  onSelect,
}: {
  node: TreeNode
  expanded: Set<string>
  toggleExpand: (path: string) => void
  selectedId?: string
  onSelect: (func: FunctionEntry) => void
}) {
  const isExpanded = expanded.has(node.path)

  return (
    <div>
      <button
        onClick={() => toggleExpand(node.path)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-left border-b border-gray-100 dark:border-gray-700"
      >
        <ChevronIcon expanded={isExpanded} />
        <svg className="w-4 h-4 text-purple-500 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
        <span className="font-medium text-gray-900 dark:text-gray-100">{node.name}</span>
        <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full ml-auto">
          {node.count}
        </span>
      </button>

      {isExpanded && node.children && (
        <div className="pl-4">
          {node.children.map((mod) => (
            <ModuleNode
              key={mod.path}
              node={mod}
              expanded={expanded}
              toggleExpand={toggleExpand}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ModuleNode({
  node,
  expanded,
  toggleExpand,
  selectedId,
  onSelect,
}: {
  node: TreeNode
  expanded: Set<string>
  toggleExpand: (path: string) => void
  selectedId?: string
  onSelect: (func: FunctionEntry) => void
}) {
  const isExpanded = expanded.has(node.path)

  return (
    <div>
      <button
        onClick={() => toggleExpand(node.path)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-left border-b border-gray-100 dark:border-gray-700"
      >
        <ChevronIcon expanded={isExpanded} />
        <svg className="w-4 h-4 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
        <span className="font-medium text-gray-800 dark:text-gray-200">{node.name}</span>
        <span className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full ml-auto">
          {node.count}
        </span>
      </button>

      {isExpanded && node.children && (
        <div className="pl-4">
          {node.children.map((fn) => (
            <FunctionNode
              key={fn.path}
              node={fn}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FunctionNode({
  node,
  selectedId,
  onSelect,
}: {
  node: TreeNode
  selectedId?: string
  onSelect: (func: FunctionEntry) => void
}) {
  const func = node.function!
  const isSelected = selectedId === func.id

  return (
    <button
      onClick={() => onSelect(func)}
      className={`w-full text-left px-3 py-2 border-b border-gray-100 dark:border-gray-700 transition-all ${
        isSelected
          ? 'bg-purple-50 dark:bg-purple-900/30 border-l-2 border-l-purple-500'
          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
      }`}
    >
      <div className="flex items-center gap-2">
        <svg className="w-3 h-3 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 12l-8 4V8l8 4z" />
        </svg>
        <span className={`font-mono text-sm ${isSelected ? 'text-purple-700 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300'}`}>
          {func.name}
        </span>
        {func.deprecated && (
          <span className="text-xs px-1 py-0.5 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 rounded">
            deprecated
          </span>
        )}
      </div>
      <div className="ml-5 mt-1 text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
        <SignatureDisplay signature={func.signature} compact />
      </div>
    </button>
  )
}
