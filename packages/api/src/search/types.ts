/**
 * Types for type signature search
 */

import type { FunctionEntry, TypeNode } from "../types/index.js";

/**
 * Context for type unification - tracks variable bindings during matching
 */
export interface UnificationContext {
  bindings: Map<string, TypeNode>;  // Type variable bindings: A -> string
  score: number;                     // Match quality score (0-100)
}

/**
 * Result of attempting to unify two types
 */
export interface TypeMatchResult {
  matches: boolean;
  score: number;           // 0-100, higher is better
  bindings: Map<string, TypeNode>;
  matchedParts: string[];  // For highlighting in UI
}

/**
 * A function entry with its type match result
 */
export interface TypeSearchResult {
  entry: FunctionEntry;
  matchResult: TypeMatchResult;
}

/**
 * Create a fresh unification context
 */
export function createContext(): UnificationContext {
  return { bindings: new Map(), score: 100 };
}

/**
 * Create a failed match result
 */
export function noMatch(): TypeMatchResult {
  return { matches: false, score: 0, bindings: new Map(), matchedParts: [] };
}

/**
 * Create a successful match result
 */
export function match(score: number, bindings: Map<string, TypeNode>, matchedParts: string[] = []): TypeMatchResult {
  return { matches: true, score, bindings, matchedParts };
}
