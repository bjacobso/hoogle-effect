/**
 * Runtime type query parser
 * Lightweight parser for user query strings - does NOT use ts-morph
 * Supports both TypeScript (=>) and Haskell (->) arrow syntax
 */

import type { TypeNode, TypeKind } from "../types/index.js";

const PRIMITIVE_TYPES = new Set(["string", "number", "boolean", "void", "never", "unknown", "any", "null", "undefined"]);
const EFFECT_TYPES = new Set(["Effect", "Stream", "Layer", "Schedule", "Fiber", "Exit", "Cause"]);

/**
 * Normalize query syntax - convert Haskell-style -> to TypeScript-style =>
 */
function normalizeArrows(query: string): string {
  // Don't replace -> inside generics (e.g., Record<string, number>)
  // Only replace -> when it's surrounded by spaces or at type boundaries
  return query.replace(/\s+->\s+/g, " => ");
}

/**
 * Check if a type name represents a type variable (single uppercase letter or letter+digit)
 */
function isTypeVariable(text: string): boolean {
  return /^[A-Z]\d*$/.test(text);
}

/**
 * Split type arguments respecting nested angle brackets
 */
function splitTypeArgs(args: string): string[] {
  const result: string[] = [];
  let depth = 0;
  let current = "";

  for (const char of args) {
    if (char === "<" || char === "(") depth++;
    if (char === ">" || char === ")") depth--;
    if (char === "," && depth === 0) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) {
    result.push(current.trim());
  }
  return result;
}

/**
 * Find the top-level arrow position (not inside brackets)
 */
function findArrowPosition(input: string): number {
  let depth = 0;
  for (let i = 0; i < input.length - 1; i++) {
    const char = input[i];
    if (char === "<" || char === "(" || char === "[") depth++;
    if (char === ">" || char === ")" || char === "]") depth--;
    if (depth === 0 && input.slice(i, i + 2) === "=>") {
      return i;
    }
  }
  return -1;
}

/**
 * Parse a union type (A | B)
 */
function parseUnion(input: string): TypeNode | null {
  let depth = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === "<" || char === "(" || char === "[") depth++;
    if (char === ">" || char === ")" || char === "]") depth--;
    if (depth === 0 && char === "|") {
      const left = input.slice(0, i).trim();
      const right = input.slice(i + 1).trim();
      if (left && right) {
        return {
          kind: "union",
          text: input,
          children: [parseType(left), parseType(right)],
        };
      }
    }
  }
  return null;
}

/**
 * Parse a single type expression
 */
function parseType(input: string): TypeNode {
  input = input.trim();

  if (!input) {
    return { kind: "unknown", text: "" };
  }

  // Handle parenthesized types: (A) or (A, B) => C
  if (input.startsWith("(")) {
    // Find matching close paren
    let depth = 1;
    let closeIdx = 1;
    while (closeIdx < input.length && depth > 0) {
      if (input[closeIdx] === "(") depth++;
      if (input[closeIdx] === ")") depth--;
      closeIdx++;
    }
    closeIdx--; // Back to the close paren

    const inner = input.slice(1, closeIdx).trim();
    const rest = input.slice(closeIdx + 1).trim();

    // Check if this is a function: (params) => return
    if (rest.startsWith("=>")) {
      const returnPart = rest.slice(2).trim();
      const params = inner ? splitTypeArgs(inner).map(parseType) : [];
      return {
        kind: "function",
        text: input,
        children: [...params, parseType(returnPart)],
      };
    }

    // Just a parenthesized type
    return parseType(inner);
  }

  // Handle arrow functions: A => B (simple form without parens)
  const arrowPos = findArrowPosition(input);
  if (arrowPos !== -1) {
    const paramPart = input.slice(0, arrowPos).trim();
    const returnPart = input.slice(arrowPos + 2).trim();

    // Parse parameters (could be single type or tuple-like)
    const params = paramPart.includes(",")
      ? splitTypeArgs(paramPart).map(parseType)
      : [parseType(paramPart)];

    return {
      kind: "function",
      text: input,
      children: [...params, parseType(returnPart)],
    };
  }

  // Handle union types: A | B
  const unionResult = parseUnion(input);
  if (unionResult) return unionResult;

  // Handle wildcard: *
  if (input === "*") {
    return {
      kind: "wildcard",
      text: "*",
      isWildcard: true,
    };
  }

  // Handle generic types: Name<Args>
  const genericMatch = input.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*<(.+)>$/);
  if (genericMatch) {
    const typeName = genericMatch[1];
    const argsStr = genericMatch[2];
    const args = splitTypeArgs(argsStr).map(parseType);

    const kind: TypeKind = EFFECT_TYPES.has(typeName) ? "effect" : "generic";

    return {
      kind,
      text: input,
      typeName,
      typeArguments: args,
    };
  }

  // Handle tuple types: [A, B]
  if (input.startsWith("[") && input.endsWith("]")) {
    const inner = input.slice(1, -1).trim();
    const elements = splitTypeArgs(inner).map(parseType);
    return {
      kind: "tuple",
      text: input,
      children: elements,
    };
  }

  // Handle type variables (single uppercase letter, optionally with digit)
  if (isTypeVariable(input)) {
    return {
      kind: "typeVariable",
      text: input,
      isTypeVariable: true,
    };
  }

  // Handle primitives
  if (PRIMITIVE_TYPES.has(input.toLowerCase())) {
    return {
      kind: "primitive",
      text: input.toLowerCase(),
    };
  }

  // Default: reference type (named type like "MyCustomType")
  return {
    kind: "reference",
    text: input,
    typeName: input,
  };
}

/**
 * Parse a user's type query string into a TypeNode
 * Returns null if the query cannot be parsed
 */
export function parseTypeQuery(query: string): TypeNode | null {
  query = query.trim();
  if (!query) return null;

  try {
    // Normalize arrow syntax
    const normalized = normalizeArrows(query);
    return parseType(normalized);
  } catch {
    return null;
  }
}

/**
 * Check if a query string looks like a type query (vs text search)
 * This is now only used for display hints, not for auto-switching modes
 */
export function looksLikeTypeQuery(query: string): boolean {
  // Contains type-specific syntax
  if (/[<>]|=>|->|\||\&/.test(query)) return true;

  // Starts with known Effect types
  if (/^(Effect|Option|Either|Stream|Array|Chunk|Layer|Schedule|Fiber|Ref|Queue|Exit|Cause)/i.test(query)) return true;

  // Is a type variable pattern
  if (/^[A-Z]\d*$/.test(query.trim())) return true;

  return false;
}
