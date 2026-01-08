/**
 * SearchBar Component - Form-based search input
 * Works without JavaScript via form submission
 */

interface SearchBarProps {
  value: string;
  placeholder?: string;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function SearchBar({ value, placeholder }: SearchBarProps): string {
  const defaultPlaceholder = 'Search by name, type, or description... (e.g., map, Effect<A, E, R>, retry)';
  const escapedValue = escapeHtml(value);
  const escapedPlaceholder = escapeHtml(placeholder || defaultPlaceholder);

  return `
    <form action="/" method="GET" class="mb-0" id="search-form">
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          name="q"
          value="${escapedValue}"
          placeholder="${escapedPlaceholder}"
          class="w-full pl-12 pr-24 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-shadow font-mono"
          autofocus
          id="search-input"
        />
        <button
          type="submit"
          class="absolute inset-y-0 right-0 px-4 flex items-center text-purple-600 hover:text-purple-800 font-medium"
        >
          Search
        </button>
      </div>
    </form>
  `;
}
