# Hoogle-Effect

> A powerful search engine for Effect-TS that helps you discover functions by type signatures, translate Haskell patterns to Effect, and explore rich documentation with AI-generated examples.

## What is Hoogle-Effect?

Hoogle-Effect brings the power of Haskell's [Hoogle](https://hoogle.haskell.org/) to the Effect-TS ecosystem. It provides:

- **Type Signature Search**: Find Effect functions by their type signatures (e.g., `string => Effect<number>`)
- **Haskell Translation**: Map Haskell functional patterns to their Effect equivalents (e.g., `fmap` → `Effect.map`)
- **Rich Documentation**: Comprehensive docs with AI-generated usage examples
- **Multiple Interfaces**: Web app, CLI, API, and MCP server

## Quick Start

### Web Interface

```bash
pnpm install
pnpm dev
```

Visit `http://localhost:5173` to start searching!

### CLI

```bash
pnpm cli search "string => Effect<number>"
pnpm cli translate "fmap"
```

### MCP Server

```bash
pnpm mcp start
```

Exposes Hoogle-Effect as a tool for AI assistants via Model Context Protocol.

## Project Structure

```
hoogle-effect/
├── packages/
│   ├── api/          # Core search engine & indexing
│   ├── web/          # Vite + React search interface
│   ├── cli/          # Command-line interface
│   └── mcp/          # Model Context Protocol server
├── data/             # Compiled documentation indices
├── scripts/          # Build & indexing scripts
└── docs/             # Project documentation
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed technical documentation.

## Features

### Current
- ✅ Static documentation compilation
- ✅ Client-side type signature search
- ✅ Haskell-to-Effect mapping database
- ✅ React-based search interface

### Planned
- ⏳ AI-generated usage examples
- ⏳ Advanced type unification
- ⏳ Server-side search API
- ⏳ VSCode extension
- ⏳ Interactive playground

## How It Works

1. **Indexing**: We parse Effect-TS source code and type definitions to build a searchable index
2. **Compilation**: The index is compiled into static JSON files that ship with the web app
3. **Client-Side Search**: The React app loads the index and performs fuzzy type matching in-browser
4. **Scalability**: The architecture supports moving to a server-side API when needed

## Use Cases

### For Effect Developers
```typescript
// Search: "retry with exponential backoff"
// Finds: Effect.retry, Schedule.exponential

Effect.retry(Schedule.exponential("100 millis"))
```

### For Haskell Developers
```typescript
// Search: "traverse :: (a -> m b) -> [a] -> m [b]"
// Finds: Effect.forEach, Effect.all

Effect.forEach([1, 2, 3], (n) => Effect.succeed(n * 2))
```

### For Learning
```typescript
// Search: "How do I handle errors?"
// Finds: Effect.catchAll, Effect.catchTag, Effect.orElse
```

## Development

### Prerequisites
- Node.js 18+
- pnpm 8+

### Setup
```bash
# Install dependencies
pnpm install

# Build the documentation index
pnpm build:index

# Start all packages in dev mode
pnpm dev

# Run tests
pnpm test
```

### Package Scripts

```bash
# Web interface
pnpm --filter web dev
pnpm --filter web build

# CLI
pnpm --filter cli dev
pnpm --filter cli build

# API
pnpm --filter api dev
pnpm --filter api test

# MCP Server
pnpm --filter mcp dev
pnpm --filter mcp start
```

## Documentation Index

The documentation index is built from:
- Effect-TS core library types
- JSDoc comments and descriptions
- Curated Haskell-to-Effect mappings
- Community-contributed examples

To rebuild the index:
```bash
pnpm build:index
```

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Adding Haskell Mappings

Edit `packages/api/src/data/haskell-mappings.ts`:

```typescript
{
  haskell: {
    signature: "fmap :: (a -> b) -> f a -> f b",
    concept: "Functor",
    commonNames: ["fmap", "<$>"]
  },
  effect: {
    functions: ["Effect.map"],
    signature: "<A, B>(f: (a: A) => B) => <E, R>(self: Effect<A, E, R>) => Effect<B, E, R>"
  }
}
```

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for:
- Monorepo structure
- Package responsibilities
- Data flow diagrams
- Type matching algorithm
- Search index format

## Roadmap

### Phase 1: MVP (Current)
- [x] Project setup
- [ ] Basic type signature search
- [ ] React search interface
- [ ] CLI tool

### Phase 2: Haskell Translation
- [ ] Haskell mapping database
- [ ] Translation engine
- [ ] Side-by-side comparisons

### Phase 3: AI Enhancement
- [ ] LLM integration for examples
- [ ] Conversational search
- [ ] Type explanation feature

### Phase 4: Scale
- [ ] Server-side API
- [ ] Multi-user support
- [ ] VSCode extension

## License

MIT

## Acknowledgments

- Inspired by [Hoogle](https://hoogle.haskell.org/)
- Built for the [Effect-TS](https://effect.website/) community
- Powered by [Vite](https://vitejs.dev/) and [React](https://react.dev/)
