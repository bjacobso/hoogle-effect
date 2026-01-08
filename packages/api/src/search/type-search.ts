/**
 * Type signature search - main orchestration
 */

import type { FunctionEntry, ParsedSignature, TypeNode } from "../types/index.js";
import type { TypeSearchResult, TypeMatchResult } from "./types.js";
import { createContext, noMatch } from "./types.js";
import { parseTypeQuery } from "./type-parser.js";
import { unifyTypes } from "./type-unifier.js";

/**
 * Search functions by type signature
 * Returns matching functions sorted by score (highest first)
 */
export function searchByType(
  query: string,
  functions: FunctionEntry[],
  limit: number = 50
): TypeSearchResult[] {
  const queryType = parseTypeQuery(query);
  if (!queryType) {
    return [];
  }

  const results: TypeSearchResult[] = [];

  for (const entry of functions) {
    if (!entry.signatureParsed) {
      continue;
    }

    const matchResult = matchFunction(queryType, entry.signatureParsed);
    if (matchResult.matches && matchResult.score > 30) {
      results.push({
        entry,
        matchResult,
      });
    }
  }

  // Sort by score (highest first)
  results.sort((a, b) => b.matchResult.score - a.matchResult.score);

  // Limit results
  return results.slice(0, limit);
}

/**
 * Check if a type is a complex generic type (not just a type variable or primitive)
 */
function isComplexType(type: TypeNode): boolean {
  return type.kind === "generic" || type.kind === "effect" || type.kind === "function";
}

/**
 * Match a query type against a function signature
 */
function matchFunction(query: TypeNode, signature: ParsedSignature): TypeMatchResult {
  // Try matching against the full function type
  const fullType = signatureToTypeNode(signature);
  const fullMatch = unifyTypes(query, fullType, createContext());

  if (fullMatch.matches) {
    return fullMatch;
  }

  // Try matching just the return type (common query pattern)
  // e.g., searching for "Effect<A, E, R>" should find functions that return Effect
  const returnMatch = unifyTypes(query, signature.returnType, createContext());
  if (returnMatch.matches) {
    // Reduce score since it's a partial match (only return type)
    return {
      ...returnMatch,
      score: returnMatch.score * 0.75,
    };
  }

  // Try matching as a parameter type
  // e.g., searching for "Option<A>" should find functions that take Option
  // Skip this if the query is a complex type (generic/effect) - we don't want
  // "Effect<A, E, R>" to match a simple type variable parameter
  if (!isComplexType(query)) {
    for (const param of signature.parameters) {
      const paramMatch = unifyTypes(query, param.type, createContext());
      if (paramMatch.matches) {
        return {
          ...paramMatch,
          score: paramMatch.score * 0.6, // Lower score for param matches
        };
      }
    }
  }

  return noMatch();
}

/**
 * Convert a ParsedSignature to a function TypeNode for matching
 */
function signatureToTypeNode(sig: ParsedSignature): TypeNode {
  const paramTypes = sig.parameters.map(p => p.type);

  return {
    kind: "function",
    text: sig.raw,
    children: [...paramTypes, sig.returnType],
  };
}

/**
 * Get search suggestions based on query
 * Useful for autocomplete
 */
export function getTypeSuggestions(query: string): string[] {
  const suggestions: string[] = [];

  // Common Effect-TS type patterns
  const commonPatterns = [
    "Effect<A, E, R>",
    "Effect<A, never, never>",
    "Option<A>",
    "Either<E, A>",
    "Stream<A, E, R>",
    "A => Effect<B>",
    "Effect<A, E, R> => Effect<B, E, R>",
    "Option<A> => Effect<B>",
    "Array<A> => Effect<Array<B>>",
    "* => Effect<*>",
    "* => Option<*>",
  ];

  const lowerQuery = query.toLowerCase();
  for (const pattern of commonPatterns) {
    if (pattern.toLowerCase().includes(lowerQuery)) {
      suggestions.push(pattern);
    }
  }

  return suggestions.slice(0, 5);
}
