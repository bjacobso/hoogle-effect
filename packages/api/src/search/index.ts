/**
 * Type signature search module exports
 */

// Types
export type { TypeSearchResult, TypeMatchResult, UnificationContext } from "./types.js";
export { createContext, noMatch, match } from "./types.js";

// Query parsing
export { parseTypeQuery, looksLikeTypeQuery } from "./type-parser.js";

// Type search
export { searchByType, getTypeSuggestions } from "./type-search.js";

// Unification (for advanced use cases)
export { unifyTypes } from "./type-unifier.js";
