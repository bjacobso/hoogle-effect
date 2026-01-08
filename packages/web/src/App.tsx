import { useState } from 'react'
import { SearchBar } from './components/SearchBar'
import { ResultsList } from './components/ResultsList'
import { FunctionDetail } from './components/FunctionDetail'
import { useSearch } from './hooks/useSearch'
import type { FunctionEntry } from '@hoogle-effect/api'

function App() {
  const [query, setQuery] = useState('')
  const [selectedFunction, setSelectedFunction] = useState<FunctionEntry | null>(null)
  const { results, isLoading, error, indexStats } = useSearch(query)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">H</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Hoogle-Effect</h1>
              <p className="text-sm text-gray-500">Search Effect-TS by type signature</p>
            </div>
          </div>

          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search by name, type, or description... (e.g., map, Effect<A, E, R>, retry)"
          />

          {indexStats && (
            <div className="mt-3 text-sm text-gray-500">
              {indexStats.totalFunctions} functions indexed from Effect {indexStats.effectVersion}
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            <span className="ml-3 text-gray-500">Loading index...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Results list */}
            <div>
              <ResultsList
                results={results}
                query={query}
                selectedId={selectedFunction?.id}
                onSelect={setSelectedFunction}
              />
            </div>

            {/* Detail panel */}
            <div className="lg:sticky lg:top-6 lg:self-start">
              {selectedFunction ? (
                <FunctionDetail func={selectedFunction} />
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                  <p>Select a function to see details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p>
            Inspired by{' '}
            <a href="https://hoogle.haskell.org" className="text-purple-600 hover:underline">
              Hoogle
            </a>
            {' '}&middot;{' '}
            Built for{' '}
            <a href="https://effect.website" className="text-purple-600 hover:underline">
              Effect-TS
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
