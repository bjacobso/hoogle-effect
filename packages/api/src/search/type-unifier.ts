/**
 * Type unification algorithm for matching user queries against indexed signatures
 */

import type { TypeNode } from "../types/index.js";
import type { UnificationContext, TypeMatchResult } from "./types.js";
import { createContext, noMatch, match } from "./types.js";

// Maximum recursion depth to prevent stack overflow on complex types
const MAX_UNIFY_DEPTH = 10;

/**
 * Attempt to unify a query type with a target type
 * Returns a match result with score and variable bindings
 */
export function unifyTypes(
  query: TypeNode,
  target: TypeNode,
  context: UnificationContext = createContext(),
  depth: number = 0
): TypeMatchResult {
  // Prevent infinite recursion
  if (depth >= MAX_UNIFY_DEPTH) {
    // At max depth, do a simple text comparison
    if (query.text === target.text) {
      return match(60, context.bindings, [target.text]);
    }
    // Type variables at max depth still match
    if (query.isTypeVariable || target.isTypeVariable) {
      return match(50, context.bindings, [target.text]);
    }
    return noMatch();
  }
  // Wildcard in query matches anything
  if (query.isWildcard) {
    return match(80, context.bindings, [target.text]);
  }

  // Type variable in query - can bind to anything
  if (query.isTypeVariable) {
    const existing = context.bindings.get(query.text);
    if (existing) {
      // Same variable used before - check consistency
      // Avoid infinite recursion: if bound to same text, just succeed
      if (existing.text === target.text) {
        return match(90, context.bindings, [target.text]);
      }
      // If bound to another type variable, allow flexible matching
      if (existing.isTypeVariable || target.isTypeVariable) {
        return match(85, context.bindings, [target.text]);
      }
      // Check structural compatibility without recursing
      if (existing.kind !== target.kind) {
        return noMatch();
      }
      if (existing.typeName && target.typeName && existing.typeName !== target.typeName) {
        return noMatch();
      }
      return match(80, context.bindings, [target.text]);
    }
    // Bind the variable to this type
    context.bindings.set(query.text, target);
    return match(90, context.bindings, [target.text]);
  }

  // Type variable in target (from indexed function) - matches query
  if (target.isTypeVariable) {
    return match(85, context.bindings, [target.text]);
  }

  // Handle function types specially
  if (query.kind === "function" && target.kind === "function") {
    return unifyFunctionTypes(query, target, context, depth);
  }

  // For non-function types, kinds must match (with some flexibility)
  if (!kindsCompatible(query.kind, target.kind)) {
    return noMatch();
  }

  // Generic/Effect types: match constructor and arguments
  if ((query.kind === "generic" || query.kind === "effect") && query.typeArguments && target.typeArguments) {
    // Constructor name must match
    if (query.typeName?.toLowerCase() !== target.typeName?.toLowerCase()) {
      return noMatch();
    }

    return unifyTypeArguments(query.typeArguments, target.typeArguments, context, depth);
  }

  // Primitives: exact match
  if (query.kind === "primitive") {
    const matches = query.text.toLowerCase() === target.text.toLowerCase();
    return matches ? match(100, context.bindings, [target.text]) : noMatch();
  }

  // References: match by name
  if (query.kind === "reference") {
    const matches = query.typeName?.toLowerCase() === target.typeName?.toLowerCase() ||
                   query.text.toLowerCase() === target.text.toLowerCase();
    return matches ? match(100, context.bindings, [target.text]) : noMatch();
  }

  // Union types: query must be subset of target
  if (query.kind === "union" && target.kind === "union") {
    return unifyUnionTypes(query, target, context, depth);
  }

  // Tuple types: match element by element
  if (query.kind === "tuple" && target.kind === "tuple") {
    if (!query.children || !target.children) return noMatch();
    if (query.children.length !== target.children.length) return noMatch();

    let totalScore = 0;
    const matchedParts: string[] = [];

    for (let i = 0; i < query.children.length; i++) {
      const result = unifyTypes(query.children[i], target.children[i], context, depth + 1);
      if (!result.matches) return noMatch();
      totalScore += result.score;
      matchedParts.push(...result.matchedParts);
    }

    return match(totalScore / query.children.length, context.bindings, matchedParts);
  }

  // Fallback: text-based comparison for unknown types
  if (query.text.toLowerCase() === target.text.toLowerCase()) {
    return match(70, context.bindings, [target.text]);
  }

  return noMatch();
}

/**
 * Check if two type kinds are compatible for matching
 */
function kindsCompatible(queryKind: string, targetKind: string): boolean {
  if (queryKind === targetKind) return true;

  // Effect types are a special case of generic
  if ((queryKind === "effect" && targetKind === "generic") ||
      (queryKind === "generic" && targetKind === "effect")) {
    return true;
  }

  // Type variables can match anything
  if (queryKind === "typeVariable" || targetKind === "typeVariable") {
    return true;
  }

  return false;
}

/**
 * Unify function types
 */
function unifyFunctionTypes(
  query: TypeNode,
  target: TypeNode,
  context: UnificationContext,
  depth: number
): TypeMatchResult {
  const queryChildren = query.children ?? [];
  const targetChildren = target.children ?? [];

  if (queryChildren.length === 0 || targetChildren.length === 0) {
    return noMatch();
  }

  // Last child is return type
  const queryReturn = queryChildren[queryChildren.length - 1];
  const targetReturn = targetChildren[targetChildren.length - 1];

  // Unify return types first (most important for search)
  const returnResult = unifyTypes(queryReturn, targetReturn, context, depth + 1);
  if (!returnResult.matches) {
    return noMatch();
  }

  // Get parameters (all but last child)
  const queryParams = queryChildren.slice(0, -1);
  const targetParams = targetChildren.slice(0, -1);

  // If query has no params, match any function with matching return type
  if (queryParams.length === 0) {
    return match(returnResult.score * 0.9, context.bindings, returnResult.matchedParts);
  }

  // Unify parameters
  const paramResult = unifyParameters(queryParams, targetParams, context, depth);

  // Combined score: return type is weighted more heavily (60%) than params (40%)
  const score = (returnResult.score * 0.6) + (paramResult.score * 0.4);

  return match(
    score,
    context.bindings,
    [...returnResult.matchedParts, ...paramResult.matchedParts]
  );
}

/**
 * Unify parameter lists
 */
function unifyParameters(
  queryParams: TypeNode[],
  targetParams: TypeNode[],
  context: UnificationContext,
  depth: number
): TypeMatchResult {
  // No query params - partial match
  if (queryParams.length === 0) {
    return match(70, context.bindings, []);
  }

  // Try to match params positionally
  let totalScore = 0;
  let matchCount = 0;
  const matchedParts: string[] = [];

  for (let i = 0; i < queryParams.length; i++) {
    if (i >= targetParams.length) {
      // Query has more params than target - partial match
      break;
    }

    const result = unifyTypes(queryParams[i], targetParams[i], context, depth + 1);
    if (result.matches) {
      totalScore += result.score;
      matchCount++;
      matchedParts.push(...result.matchedParts);
    } else {
      // Parameter mismatch - still continue to try others
      // but reduce score
      totalScore += 20;
      matchCount++;
    }
  }

  if (matchCount === 0) {
    return match(50, context.bindings, []);
  }

  // Bonus for matching all params
  let score = totalScore / matchCount;
  if (queryParams.length === targetParams.length && matchCount === queryParams.length) {
    score = Math.min(100, score * 1.1);
  }

  return match(score, context.bindings, matchedParts);
}

/**
 * Unify type arguments (for generic types)
 */
function unifyTypeArguments(
  queryArgs: TypeNode[],
  targetArgs: TypeNode[],
  context: UnificationContext,
  depth: number
): TypeMatchResult {
  // Different arity - might still partially match
  const minLen = Math.min(queryArgs.length, targetArgs.length);

  if (minLen === 0) {
    // One side has no args - partial match if other does
    return queryArgs.length === 0 && targetArgs.length === 0
      ? match(100, context.bindings, [])
      : match(60, context.bindings, []);
  }

  let totalScore = 0;
  const matchedParts: string[] = [];

  for (let i = 0; i < minLen; i++) {
    const result = unifyTypes(queryArgs[i], targetArgs[i], context, depth + 1);
    if (!result.matches) {
      // Strict matching for type arguments
      return noMatch();
    }
    totalScore += result.score;
    matchedParts.push(...result.matchedParts);
  }

  // Penalize if arities don't match
  let score = totalScore / minLen;
  if (queryArgs.length !== targetArgs.length) {
    score *= 0.8;
  }

  return match(score, context.bindings, matchedParts);
}

/**
 * Unify union types
 */
function unifyUnionTypes(
  query: TypeNode,
  target: TypeNode,
  context: UnificationContext,
  depth: number
): TypeMatchResult {
  const queryChildren = query.children ?? [];
  const targetChildren = target.children ?? [];

  if (queryChildren.length === 0 || targetChildren.length === 0) {
    return noMatch();
  }

  // Each query union member should match some target union member
  let totalScore = 0;
  const matchedParts: string[] = [];

  for (const queryMember of queryChildren) {
    let bestScore = 0;
    let bestMatch: TypeMatchResult = noMatch();

    for (const targetMember of targetChildren) {
      const result = unifyTypes(queryMember, targetMember, { ...context, bindings: new Map(context.bindings) }, depth + 1);
      if (result.matches && result.score > bestScore) {
        bestScore = result.score;
        bestMatch = result;
      }
    }

    if (!bestMatch.matches) {
      return noMatch();
    }

    totalScore += bestMatch.score;
    matchedParts.push(...bestMatch.matchedParts);
  }

  return match(totalScore / queryChildren.length, context.bindings, matchedParts);
}
