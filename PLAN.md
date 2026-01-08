# Hoogle-Effect: Project Plan

## Vision

A powerful search engine for Effect-TS that combines:
1. **Type signature search** - Find Effect functions by their type signatures (like Haskell's Hoogle)
2. **Haskell-to-Effect translation** - Map Haskell functional patterns to their Effect equivalents
3. **Rich documentation** - Comprehensive docs with AI-generated usage examples
4. **Interactive exploration** - Help developers discover Effect APIs naturally

## Core Features

### 1. Type Signature Search
- Search Effect functions by type signatures
  - Example: `string => Effect<number>` finds relevant transformations
  - Support for constraints/requirements (e.g., `Effect<A, E, R>`)
  - Fuzzy matching for approximate types
- Unification-based matching (similar to Hoogle)
- Rank results by relevance and commonality

### 2. Haskell-to-Effect Translator
- Input: Haskell function signatures or concepts
  - Example: `fmap :: (a -> b) -> f a -> f b` → `Effect.map`
  - Example: `>>=` → `Effect.flatMap`
  - Example: `traverse` → `Effect.forEach` / `Effect.all`
- Common pattern mappings:
  - Functor → Effect.map
  - Applicative → Effect.zipWith, Effect.all
  - Monad → Effect.flatMap, Effect.gen
  - MonadError → Effect.catchAll, Effect.orElse
  - Reader → Effect with requirements (R parameter)
  - State → Ref
  - IO → Effect
- Show side-by-side comparisons

### 3. Documentation Browser
- Display official Effect documentation
- Show function signatures with full type information
- Parameter descriptions
- Return type details
- Links to source code
- Related functions and common combinations

### 4. AI-Generated Examples
- Generate practical usage examples for each function
- Show common patterns and combinations
- Real-world use cases
- Anti-patterns and gotchas
- Interactive examples (runnable in browser?)

### 5. Advanced Search Features
- Text search across function names, descriptions
- Search by module/package
- Filter by:
  - Error types
  - Requirements (Context/Services)
  - Complexity level (beginner/advanced)
- Search by use case ("How do I retry a failing effect?")
- Search by concept ("dependency injection", "error handling")

## Technical Architecture

### Data Layer

#### 1. Index Builder
- Parse Effect-TS source code and type definitions
- Extract:
  - Function signatures with full type information
  - JSDoc comments and descriptions
  - Module structure
  - Examples from docs
- Build searchable index of:
  - Type signatures (for unification matching)
  - Full-text search index
  - Haskell concept mappings

#### 2. Haskell Mapping Database
- Curated database of Haskell → Effect mappings
- Structure:
  ```typescript
  {
    haskell: {
      signature: "fmap :: (a -> b) -> f a -> f b",
      concept: "Functor",
      commonNames: ["fmap", "map", "<$>"]
    },
    effect: {
      functions: ["Effect.map", "Stream.map", "Option.map"],
      signature: "(self: Effect<A, E, R>, f: (a: A) => B) => Effect<B, E, R>",
      examples: [...]
    },
    explanation: "...",
    differences: [...]
  }
  ```

#### 3. Storage
- Options:
  - **SQLite** - Simple, embedded, good for local search
  - **PostgreSQL** - If building web service
  - **MeiliSearch/Typesense** - Specialized search engines
  - **In-memory index** - For fast local tool

### Search Engine

#### Type Signature Matching
- Parse type queries into AST
- Implement unification algorithm
- Rank by:
  - Exact matches
  - Structural similarity
  - Type complexity
  - Usage frequency

#### Text Search
- Full-text search across:
  - Function names
  - Descriptions
  - Module names
  - Tags/categories

#### Haskell Translation
- Pattern matching against Haskell signature database
- Fuzzy matching for similar concepts
- Show multiple Effect equivalents when applicable

### Frontend

#### Technology Options
- **Web App**: React/Solid + TanStack Query
- **CLI Tool**: Ink (React for CLI) or Oclif
- **VSCode Extension**: Webview + Language Server
- **All of the above**: Shared core with multiple interfaces

#### UI Components
1. **Search Bar**
   - Type signature input with syntax highlighting
   - Autocomplete for common patterns
   - Quick filters

2. **Results View**
   - Function cards with:
     - Signature
     - Description
     - Popularity/usage indicators
     - Quick example preview
   - Grouping by module/category

3. **Detail View**
   - Full documentation
   - Multiple examples (simple → advanced)
   - Type information panel
   - Related functions
   - "Copy to clipboard" for imports

4. **Haskell Translation View**
   - Side-by-side Haskell/Effect comparison
   - Conceptual mapping explanation
   - Migration guide snippets

### AI Integration

#### Example Generation
- Use LLM (GPT-4, Claude, etc.) to:
  - Generate realistic usage examples
  - Create explanations for complex types
  - Suggest common patterns
  - Generate anti-pattern warnings

#### Caching Strategy
- Pre-generate examples for core functions
- Generate on-demand for less common functions
- Cache generated content
- Allow community feedback/improvements

#### Prompting Strategy
```
Given this Effect function:
- Name: Effect.retry
- Signature: (policy: Schedule) => <A, E, R>(self: Effect<A, E, R>) => Effect<A, E, R>
- Description: Returns an effect that retries according to the schedule

Generate 3 examples:
1. Basic usage (beginner)
2. Practical use case (intermediate)
3. Complex composition (advanced)

Each example should be runnable and demonstrate best practices.
```

## Implementation Phases

### Phase 1: Core Index & Search (MVP)
- [ ] Set up project structure (monorepo with packages)
- [ ] Build Effect-TS AST parser and indexer
- [ ] Create basic type signature search
- [ ] Implement simple CLI interface
- [ ] Index core Effect modules (Effect, Stream, Option, Either)

**Deliverable**: CLI tool that can search Effect functions by type

### Phase 2: Haskell Translation
- [ ] Create Haskell → Effect mapping database
- [ ] Implement Haskell signature parser
- [ ] Build translation engine
- [ ] Add side-by-side comparison view
- [ ] Cover core typeclasses (Functor, Monad, etc.)

**Deliverable**: Can search "fmap" and get Effect.map

### Phase 3: Web Interface
- [ ] Build web frontend
- [ ] Implement rich documentation browser
- [ ] Add interactive examples
- [ ] Deploy static site or web service
- [ ] Responsive design for mobile

**Deliverable**: Public website for searching Effect

### Phase 4: AI Examples & Enhancement
- [ ] Integrate LLM for example generation
- [ ] Pre-generate examples for top 100 functions
- [ ] Add conversational search ("How do I...?")
- [ ] Implement feedback system for examples
- [ ] Add "explain this type" feature

**Deliverable**: Rich AI-powered documentation

### Phase 5: Advanced Features
- [ ] VSCode extension
- [ ] Interactive playground (run examples in browser)
- [ ] Community contributions (custom examples, mappings)
- [ ] Advanced type search (higher-kinded types, constraints)
- [ ] Integration with Effect Discord/community

## Technical Decisions to Make

### 1. Deployment Model
- **Local-first tool**: Downloadable CLI/desktop app with embedded index
- **Web service**: Centralized search with API
- **Hybrid**: Offline-capable PWA with sync

### 2. Indexing Strategy
- **Static**: Build index from Effect releases
- **Dynamic**: Parse on-demand from source
- **Community**: Allow user contributions and corrections

### 3. AI Provider
- **Hosted**: Use OpenAI/Anthropic APIs (costs money)
- **Local**: Use Ollama/local models (slower, privacy-friendly)
- **Hybrid**: Pre-generate with hosted, allow local regeneration

### 4. Type Matching Algorithm
- **Exact**: Only exact type matches (fast, limited)
- **Unification**: Hoogle-style unification (complex, powerful)
- **Embedding**: Use ML embeddings for semantic similarity (experimental)

## Success Metrics

- **Discoverability**: Users can find functions 90%+ of the time
- **Learning**: Helps Haskell devs transition to Effect
- **Adoption**: Becomes go-to resource for Effect developers
- **Accuracy**: Type search returns relevant results in top 5
- **Performance**: Sub-100ms search response time

## Open Questions

1. How to handle Effect's version differences? (multi-version support?)
2. Should we include ecosystem packages (effect-http, etc.)?
3. How to keep Haskell mappings accurate and comprehensive?
4. Community moderation for AI-generated content?
5. Monetization? (Open source vs. hosted service?)

## Resources Needed

- Effect-TS type definitions and source
- Haskell Prelude documentation for mapping
- LLM API access for example generation
- Hosting infrastructure (if web-based)
- Domain name (hoogle-effect.dev?)

## Inspiration & References

- [Hoogle](https://hoogle.haskell.org/) - Original Haskell search
- [Rust's docs.rs](https://docs.rs/) - Excellent documentation UX
- [DevDocs](https://devdocs.io/) - Multi-documentation browser
- [TypeScript Playground](https://www.typescriptlang.org/play) - Interactive examples
- [Effect website](https://effect.website/) - Official documentation

## Next Steps

1. Validate concept with Effect community
2. Build Phase 1 MVP (CLI with basic search)
3. Create sample Haskell mapping database
4. Test with both Haskell and TypeScript developers
5. Iterate based on feedback

---

**Last Updated**: 2026-01-07
**Status**: Planning
