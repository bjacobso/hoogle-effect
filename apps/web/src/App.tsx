import { useState } from 'react'
import { SearchBar } from './components/SearchBar'
import { ResultsList } from './components/ResultsList'
import { TreeView } from './components/TreeView'
import { ListView } from './components/ListView'
import { FunctionDetail } from './components/FunctionDetail'
import { ViewToggle, type ViewMode } from './components/ViewToggle'
import { SearchModeToggle } from './components/SearchModeToggle'
import { PackageFilter } from './components/PackageFilter'
import { ModuleView } from './components/ModuleView'
import { DarkModeToggle } from './components/DarkModeToggle'
import { ThemeProvider } from './contexts/ThemeContext'
import { useSearch, type SearchMode } from './hooks/useSearch'
import { useModuleFunctions } from './hooks/useModuleFunctions'
import type { FunctionEntry } from '@hoogle-effect/api'

type ViewState = { view: 'search' } | { view: 'module'; moduleName: string }

function App() {
  const [query, setQuery] = useState('')
  const [selectedFunction, setSelectedFunction] = useState<FunctionEntry | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('flat')
  const [searchMode, setSearchMode] = useState<SearchMode>('text')
  const [selectedPackages, setSelectedPackages] = useState<Set<string>>(
    new Set(['effect', '@effect/platform', '@effect/experimental'])
  )
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [viewState, setViewState] = useState<ViewState>({ view: 'search' })
  const { results, allFunctions, isLoading, error, indexStats, availablePackages } = useSearch(
    query,
    { packages: selectedPackages },
    searchMode
  )
  const { functions: moduleFunctions, module: selectedModule } = useModuleFunctions(
    viewState.view === 'module' ? viewState.moduleName : null
  )

  const handleModuleClick = (moduleName: string) => {
    setViewState({ view: 'module', moduleName })
    setSelectedFunction(null)
  }

  const handleBackToSearch = () => {
    setViewState({ view: 'search' })
    setSelectedFunction(null)
  }

  return (
    <ThemeProvider>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Hoogle-Effect</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Search Effect-TS by type signature</p>
              </div>
            </div>
            <DarkModeToggle />
          </div>

          {viewState.view === 'search' ? (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <SearchBar
                    value={query}
                    onChange={setQuery}
                    placeholder={
                      searchMode === 'type'
                        ? "Search by type signature... (e.g., Option a -> Effect b, Effect<A, E, R>)"
                        : "Search by name or description... (e.g., map, flatMap, retry)"
                    }
                  />
                </div>
                <SearchModeToggle mode={searchMode} onChange={setSearchMode} />
              </div>

              <PackageFilter
                packages={availablePackages}
                selectedPackages={selectedPackages}
                onSelectionChange={setSelectedPackages}
                isOpen={isFilterOpen}
                onToggleOpen={() => setIsFilterOpen(!isFilterOpen)}
                packageCounts={indexStats?.packageCounts}
              />

              <div className="mt-3 flex items-center justify-between">
                {indexStats && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {indexStats.totalFunctions} functions indexed from Effect {indexStats.effectVersion}
                  </div>
                )}
                <ViewToggle mode={viewMode} onChange={setViewMode} />
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Viewing module: <span className="font-semibold text-gray-900 dark:text-gray-100">{viewState.moduleName}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            <span className="ml-3 text-gray-500 dark:text-gray-400">Loading index...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Results list or Module view */}
            <div>
              {viewState.view === 'search' ? (
                <>
                  {viewMode === 'flat' && (
                    <ResultsList
                      results={results}
                      query={query}
                      selectedId={selectedFunction?.id}
                      onSelect={setSelectedFunction}
                      onModuleClick={handleModuleClick}
                    />
                  )}
                  {viewMode === 'tree' && (
                    <TreeView
                      results={results}
                      allFunctions={allFunctions}
                      query={query}
                      selectedId={selectedFunction?.id}
                      onSelect={setSelectedFunction}
                    />
                  )}
                  {viewMode === 'list' && (
                    <ListView
                      results={results}
                      allFunctions={allFunctions}
                      query={query}
                      selectedId={selectedFunction?.id}
                      onSelect={setSelectedFunction}
                    />
                  )}
                </>
              ) : (
                <ModuleView
                  module={selectedModule}
                  functions={moduleFunctions}
                  onBack={handleBackToSearch}
                  onSelectFunction={setSelectedFunction}
                  selectedFunctionId={selectedFunction?.id}
                />
              )}
            </div>

            {/* Detail panel */}
            <div className="lg:sticky lg:top-6 lg:self-start">
              {selectedFunction ? (
                <FunctionDetail func={selectedFunction} />
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
                  <p>Select a function to see details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Inspired by{' '}
            <a href="https://hoogle.haskell.org" className="text-purple-600 dark:text-purple-400 hover:underline">
              Hoogle
            </a>
            {' '}&middot;{' '}
            Built for{' '}
            <a href="https://effect.website" className="text-purple-600 dark:text-purple-400 hover:underline">
              Effect-TS
            </a>
          </p>
        </div>
      </footer>
    </div>
    </ThemeProvider>
  )
}

export default App
