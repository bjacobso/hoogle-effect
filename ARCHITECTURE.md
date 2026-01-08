# Hoogle-Effect Architecture

## Overview

Hoogle-Effect is built as a monorepo with multiple packages that share a core search engine and documentation index. The architecture is designed to support both client-side (static) and server-side search modes.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Build Time                              │
│                                                              │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────┐  │
│  │ Effect Source│─────▶│   Indexer    │─────▶│  Static  │  │
│  │    + Types   │      │   Builder    │      │  Index   │  │
│  └──────────────┘      └──────────────┘      └──────────┘  │
│         │                     │                     │        │
│         │              ┌──────▼──────┐             │        │
│         │              │   Haskell   │             │        │
│         └─────────────▶│   Mappings  │             │        │
│                        └─────────────┘             │        │
└────────────────────────────────────────────────────┼────────┘
                                                     │
                                                     │
┌────────────────────────────────────────────────────┼────────┐
│                      Runtime                       ▼        │
│                                                              │
│  ┌──────────┐       ┌──────────┐       ┌──────────────┐    │
│  │   Web    │◀─────▶│   API    │◀─────▶│    Search    │    │
│  │  (React) │       │  Server  │       │    Engine    │    │
│  └──────────┘       └──────────┘       └──────────────┘    │
│                            │                    ▲           │
│  ┌──────────┐             │                    │           │
│  │   CLI    │─────────────┘                    │           │
│  └──────────┘                                  │           │
│                                                 │           │
│  ┌──────────┐                                  │           │
│  │   MCP    │──────────────────────────────────┘           │
│  │  Server  │                                               │
│  └──────────┘                                               │
└─────────────────────────────────────────────────────────────┘
```

## Package Structure

### Monorepo Layout

```
hoogle-effect/
├── package.json                    # Root package with workspace config
├── pnpm-workspace.yaml            # pnpm workspace configuration
├── turbo.json                     # Turborepo build configuration
│
├── packages/
│   ├── api/                       # Core search engine & types
│   │   ├── src/
│   │   │   ├── index.ts          # Public API exports
│   │   │   ├── search/           # Search engine implementation
│   │   │   │   ├── index.ts
│   │   │   │   ├── type-matcher.ts
│   │   │   │   ├── text-search.ts
│   │   │   │   └── ranking.ts
│   │   │   ├── indexer/          # Documentation indexer
│   │   │   │   ├── parser.ts
│   │   │   │   ├── extractor.ts
│   │   │   │   └── builder.ts
│   │   │   ├── data/             # Haskell mappings
│   │   │   │   └── haskell-mappings.ts
│   │   │   └── types/            # Shared TypeScript types
│   │   │       ├── index.ts
│   │   │       ├── search.ts
│   │   │       └── documentation.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── web/                       # Vite + React search interface
│   │   ├── src/
│   │   │   ├── main.tsx          # Entry point
│   │   │   ├── App.tsx           # Root component
│   │   │   ├── components/       # React components
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   ├── ResultsList.tsx
│   │   │   │   ├── FunctionDetail.tsx
│   │   │   │   └── HaskellTranslation.tsx
│   │   │   ├── hooks/            # Custom React hooks
│   │   │   │   ├── useSearch.ts
│   │   │   │   └── useIndex.ts
│   │   │   ├── lib/              # Utilities
│   │   │   │   └── search-client.ts
│   │   │   └── styles/           # CSS/styling
│   │   ├── public/               # Static assets
│   │   │   └── index/            # Pre-built search index (copied at build)
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── cli/                       # Command-line interface
│   │   ├── src/
│   │   │   ├── index.ts          # CLI entry point
│   │   │   ├── commands/         # CLI commands
│   │   │   │   ├── search.ts
│   │   │   │   ├── translate.ts
│   │   │   │   └── index-build.ts
│   │   │   └── ui/               # Terminal UI components
│   │   │       ├── results-table.ts
│   │   │       └── syntax-highlight.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── mcp/                       # Model Context Protocol server
│       ├── src/
│       │   ├── index.ts          # MCP server entry
│       │   ├── tools/            # MCP tool definitions
│       │   │   ├── search.ts
│       │   │   └── translate.ts
│       │   └── server.ts         # MCP protocol handler
│       ├── package.json
│       └── tsconfig.json
│
├── data/                          # Generated documentation index
│   ├── index.json                # Main search index
│   ├── functions/                # Function documentation
│   │   ├── Effect.map.json
│   │   ├── Effect.flatMap.json
│   │   └── ...
│   └── haskell-mappings.json     # Haskell translation database
│
├── scripts/                       # Build & utility scripts
│   ├── build-index.ts            # Index builder script
│   ├── fetch-effect-types.ts     # Download Effect types
│   └── validate-index.ts         # Index validation
│
└── docs/                          # Additional documentation
    ├── search-algorithm.md
    ├── type-matching.md
    └── contributing.md
```

## Package Responsibilities

### `@hoogle-effect/api`

**Purpose**: Core search engine and type matching logic

**Exports**:
```typescript
// Search API
export function search(query: string, options?: SearchOptions): SearchResult[]
export function searchByType(signature: string): TypeSearchResult[]
export function translateFromHaskell(haskellSig: string): HaskellTranslation[]

// Types
export type { SearchResult, TypeSearchResult, HaskellTranslation }
export type { DocumentationIndex, FunctionDoc }
```

**Dependencies**:
- `effect` - Type definitions and runtime
- `@effect/schema` - For parsing and validation
- `fuse.js` - Fuzzy text search
- Custom type unification algorithm

### `@hoogle-effect/web`

**Purpose**: React-based search interface

**Features**:
- Type signature input with syntax highlighting
- Real-time search results
- Function documentation viewer
- Haskell translation side-by-side view
- Copy code snippets
- Dark/light mode

**Tech Stack**:
- Vite - Build tool and dev server
- React 18 - UI framework
- TanStack Query - Data fetching and caching
- Tailwind CSS - Styling
- Shiki - Syntax highlighting

**Bundle Strategy**:
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'search-index': ['./public/index/index.json'], // Lazy load index
        }
      }
    }
  }
})
```

### `@hoogle-effect/cli`

**Purpose**: Command-line interface for terminal users

**Commands**:
```bash
hoogle-effect search <query>           # Search by text or type
hoogle-effect translate <haskell>      # Translate Haskell to Effect
hoogle-effect explain <function>       # Show detailed docs
hoogle-effect build-index              # Rebuild search index
```

**Tech Stack**:
- `commander` - CLI framework
- `chalk` - Terminal colors
- `cli-table3` - Pretty tables
- `enquirer` - Interactive prompts

### `@hoogle-effect/mcp`

**Purpose**: Expose Hoogle-Effect as a tool for AI assistants

**MCP Tools**:
```json
{
  "tools": [
    {
      "name": "search_effect",
      "description": "Search Effect-TS functions by type or description",
      "inputSchema": {
        "type": "object",
        "properties": {
          "query": { "type": "string" }
        }
      }
    },
    {
      "name": "translate_haskell",
      "description": "Translate Haskell patterns to Effect",
      "inputSchema": {
        "type": "object",
        "properties": {
          "haskellSignature": { "type": "string" }
        }
      }
    }
  ]
}
```

**Use Case**: AI assistants (Claude, GPT) can search Effect docs during conversations

## Data Flow

### Build Time: Index Generation

```
1. Fetch Effect-TS sources
   └─> npm:effect (from node_modules or npm registry)

2. Parse TypeScript AST
   ├─> Extract type signatures
   ├─> Extract JSDoc comments
   └─> Extract module structure

3. Build Haskell mappings
   └─> Load curated Haskell → Effect mappings

4. Generate index files
   ├─> data/index.json (main index)
   ├─> data/functions/*.json (per-function docs)
   └─> data/haskell-mappings.json

5. Copy to web/public
   └─> Bundled with web app for client-side search
```

### Runtime: Search Execution

#### Client-Side (Web App)

```
1. User enters query
   └─> SearchBar component

2. Parse query type
   ├─> Type signature? → parseTypeSignature()
   ├─> Haskell pattern? → detectHaskellPattern()
   └─> Text search? → parseTextQuery()

3. Load index (lazy)
   └─> Fetch /index/index.json (cached)

4. Execute search
   ├─> Type matching → unifyTypes()
   ├─> Text search → fuzzySearch()
   └─> Haskell translation → matchHaskellPattern()

5. Rank results
   └─> Score by relevance, popularity

6. Display results
   └─> ResultsList component
```

#### Server-Side (Future API)

```
1. HTTP Request
   └─> GET /api/search?q=...

2. Server search
   ├─> Load index from memory/cache
   ├─> Execute search (same logic as client)
   └─> Return JSON results

3. Client renders
   └─> Same UI as client-side mode
```

## Search Index Format

### Main Index (`data/index.json`)

```typescript
interface SearchIndex {
  version: string;
  buildDate: string;
  functions: FunctionIndexEntry[];
  modules: ModuleIndexEntry[];
  haskellMappings: HaskellMappingEntry[];
}

interface FunctionIndexEntry {
  id: string;                          // "Effect.map"
  name: string;                        // "map"
  module: string;                      // "Effect"
  signature: TypeSignature;            // Parsed type
  signatureRaw: string;                // Original string
  description: string;                 // Short description
  tags: string[];                      // ["transformation", "functor"]
  popularity: number;                  // Usage score (0-100)
  since: string;                       // "2.0.0"

  // For client-side search optimization
  searchTerms: string[];               // Pre-computed search terms
  typeFingerprint: string;             // Hash for quick type matching
}

interface TypeSignature {
  params: TypeParam[];
  returnType: Type;
  constraints: Constraint[];
}

interface HaskellMappingEntry {
  haskellSignature: string;
  haskellConcept: string;              // "Functor", "Monad", etc.
  haskellNames: string[];              // ["fmap", "<$>"]
  effectFunctions: string[];           // ["Effect.map"]
  similarity: number;                  // 0-100
}
```

### Individual Function Docs (`data/functions/Effect.map.json`)

```typescript
interface FunctionDoc {
  ...FunctionIndexEntry;

  // Extended documentation
  documentation: string;               // Full markdown docs
  examples: Example[];
  relatedFunctions: string[];
  sourceUrl: string;

  // AI-generated (optional)
  aiExamples?: AIExample[];
  commonPatterns?: string[];
  pitfalls?: string[];
}

interface Example {
  title: string;
  code: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
}
```

## Type Matching Algorithm

### Level 1: Exact Match (Fast Path)

```typescript
function exactMatch(query: TypeSignature, candidate: TypeSignature): boolean {
  return query.typeFingerprint === candidate.typeFingerprint;
}
```

### Level 2: Structural Match

```typescript
function structuralMatch(query: Type, candidate: Type): boolean {
  // Match shape: (A) => Effect<B> matches (string) => Effect<number>
  if (query.kind !== candidate.kind) return false;

  if (query.kind === "function") {
    return (
      structuralMatch(query.param, candidate.param) &&
      structuralMatch(query.return, candidate.return)
    );
  }

  // Recurse through type structure
}
```

### Level 3: Unification (Hoogle-style)

```typescript
function unify(query: Type, candidate: Type, subst: Substitution): boolean {
  // Type variable unification
  if (query.kind === "var") {
    if (subst.has(query.name)) {
      return unify(subst.get(query.name)!, candidate, subst);
    }
    subst.set(query.name, candidate);
    return true;
  }

  // Constructor matching
  if (query.kind === "constructor" && candidate.kind === "constructor") {
    if (query.name !== candidate.name) return false;
    return query.args.every((arg, i) =>
      unify(arg, candidate.args[i], subst)
    );
  }

  return false;
}
```

## Client-Side vs Server-Side Modes

### Client-Side (Current)

**Pros**:
- Zero server costs
- Instant search (no network latency)
- Works offline
- Easy deployment (static site)

**Cons**:
- Larger initial bundle (index must download)
- Limited to simpler search algorithms (performance)
- No usage analytics

**Implementation**:
```typescript
// web/src/hooks/useIndex.ts
export function useIndex() {
  return useQuery({
    queryKey: ['search-index'],
    queryFn: async () => {
      const response = await fetch('/index/index.json');
      return response.json() as SearchIndex;
    },
    staleTime: Infinity, // Cache forever
  });
}
```

### Server-Side (Future)

**Pros**:
- Smaller client bundle
- More sophisticated algorithms
- Analytics and telemetry
- Dynamic index updates

**Cons**:
- Hosting costs
- Network latency
- Requires backend infrastructure

**Implementation**:
```typescript
// api/src/server.ts
app.get('/api/search', (req, res) => {
  const { q, type } = req.query;
  const results = search(q as string, { type: type as any });
  res.json(results);
});
```

## Technology Choices

### Why Vite?
- Fast HMR for development
- Excellent TypeScript support
- Optimized production builds
- Easy static asset handling

### Why pnpm + Turborepo?
- pnpm: Efficient disk usage, fast installs
- Turborepo: Intelligent build caching, parallel builds

### Why Client-Side First?
- Faster MVP iteration
- No infrastructure costs
- Proves value before scaling
- Can migrate to hybrid model later

## Deployment Strategy

### Phase 1: Static Site

```bash
# Build process
pnpm build:index                    # Generate data/index.json
pnpm --filter web build            # Build React app
# Output: web/dist/ with bundled index

# Deploy to:
- Vercel / Netlify (free tier)
- GitHub Pages
- Cloudflare Pages
```

### Phase 2: Hybrid

```bash
# API server
pnpm --filter api build
# Deploy to: Railway, Fly.io, AWS Lambda

# Web app
pnpm --filter web build
# Still static, but can call API for complex queries
```

## Performance Targets

- Initial load: < 3s (including index download)
- Search response: < 100ms (client-side)
- Index size: < 2MB compressed
- Type matching: < 50ms for 1000 functions

## Security Considerations

- Client-side only: No auth needed
- Index is public: No sensitive data
- Future API: Rate limiting, API keys

## Monitoring & Analytics

### Client-Side
- Plausible / Simple Analytics (privacy-friendly)
- Track: Search queries, result clicks, navigation

### Server-Side (Future)
- OpenTelemetry for tracing
- Error tracking (Sentry)
- Performance monitoring

## Future Architecture Enhancements

1. **Incremental Index Updates**
   - WebSocket for live index updates
   - Service worker for background sync

2. **AI Integration**
   - Edge Functions for AI example generation
   - Streaming responses for explanations

3. **VSCode Extension**
   - Language Server Protocol integration
   - Inline documentation on hover

4. **Community Features**
   - User-submitted examples
   - Voting on AI-generated content
   - Custom Haskell mappings

---

**Last Updated**: 2026-01-07
