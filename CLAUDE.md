# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hoogle-Effect is a type-signature search engine for the Effect-TS library, inspired by Haskell's Hoogle. It helps developers discover Effect functions by type signature, name, or description.

## Commands

```bash
# Development
pnpm dev                    # Start all packages in dev mode (web at http://localhost:5173)
pnpm build                  # Build all packages
pnpm build:index            # Generate search index from Effect-TS source

# Testing
pnpm test                   # Run all tests
pnpm --filter api test      # Run API package tests only (vitest)

# Package-specific
pnpm --filter web dev       # Start only the web dev server
pnpm --filter api build:index  # Rebuild search index only
```

## Architecture

**Monorepo Structure** (pnpm + Turborepo):
- `packages/api/` - Core TypeScript library with search engine and indexer
- `packages/web/` - React + Vite web interface with Tailwind CSS
- `data/` - Generated search index (index.json + function docs)

**Build-time Flow**:
1. `build-index.ts` uses ts-morph to parse Effect-TS declarations
2. Extracts function signatures, JSDoc, examples from ~35 Effect modules
3. Outputs `data/index.json` (searchable index) and `data/functions/*.json` (individual docs)

**Runtime Flow**:
1. Web app fetches `/data/index.json` on demand
2. Fuse.js provides fuzzy search over function entries
3. Results display with signatures, descriptions, and examples

**Key Types** (in `packages/api/src/types/index.ts`):
- `SearchIndex` - Main index structure with version, functions, modules
- `FunctionEntry` - Individual function with id, name, module, signature, description, examples, tags

## Tech Stack

- TypeScript (strict mode)
- Effect-TS v3.12.0 (the library being indexed)
- ts-morph (AST parsing for indexer)
- React 18 + Vite 6 (web UI)
- Tailwind CSS (styling)
- Fuse.js (fuzzy search)
- Vitest (testing, API package only)
