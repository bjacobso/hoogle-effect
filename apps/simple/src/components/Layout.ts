/**
 * Layout Component - HTML shell for all pages
 * Uses template strings for server-side rendering
 */

interface LayoutProps {
  title: string;
  children: string | string[];
}

/**
 * Escape HTML special characters in user-provided content
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function Header(): string {
  return `
    <header class="bg-white border-b border-gray-200">
      <div class="max-w-6xl mx-auto px-4 py-6">
        <a href="/" class="flex items-center gap-3 mb-4 no-underline">
          <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <span class="text-white font-bold text-lg">H</span>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Hoogle-Effect</h1>
            <p class="text-sm text-gray-500">Search Effect-TS by type signature</p>
          </div>
        </a>
      </div>
    </header>
  `;
}

function Footer(): string {
  return `
    <footer class="border-t border-gray-200 mt-12">
      <div class="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
        <p>
          Inspired by
          <a href="https://hoogle.haskell.org" class="text-purple-600 hover:underline">Hoogle</a>
          &middot;
          Built for
          <a href="https://effect.website" class="text-purple-600 hover:underline">Effect-TS</a>
        </p>
      </div>
    </footer>
  `;
}

export function Layout({ title, children }: LayoutProps): string {
  const childContent = Array.isArray(children) ? children.join('') : children;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <link rel="stylesheet" href="/styles.css" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  </head>
  <body class="min-h-screen bg-gray-50 font-sans">
    ${Header()}
    <main class="max-w-6xl mx-auto px-4 py-6">
      ${childContent}
    </main>
    ${Footer()}
    <script src="/enhance.js" defer></script>
  </body>
</html>`;
}
