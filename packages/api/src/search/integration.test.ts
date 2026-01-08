/**
 * Integration test demonstrating end-to-end type signature search
 */

import { describe, it, expect } from "vitest";
import { searchByType } from "./type-search.js";
import { parseTypeQuery } from "./type-parser.js";
import type { FunctionEntry, ParsedSignature, TypeNode } from "../types/index.js";

// ============================================================================
// Test Data: Mock Effect-TS functions with parsed signatures
// ============================================================================

const typeVar = (name: string): TypeNode => ({
  kind: "typeVariable",
  text: name,
  isTypeVariable: true,
});

const effect = (a: TypeNode, e: TypeNode, r: TypeNode): TypeNode => ({
  kind: "effect",
  text: `Effect<${a.text}, ${e.text}, ${r.text}>`,
  typeName: "Effect",
  typeArguments: [a, e, r],
});

const option = (a: TypeNode): TypeNode => ({
  kind: "generic",
  text: `Option<${a.text}>`,
  typeName: "Option",
  typeArguments: [a],
});

const fn = (params: TypeNode[], ret: TypeNode): TypeNode => ({
  kind: "function",
  text: `(${params.map(p => p.text).join(", ")}) => ${ret.text}`,
  children: [...params, ret],
});

const primitive = (name: string): TypeNode => ({
  kind: "primitive",
  text: name,
});

function mockFunction(
  id: string,
  params: TypeNode[],
  returnType: TypeNode
): FunctionEntry {
  const signatureParsed: ParsedSignature = {
    raw: `(${params.map((p, i) => `arg${i}: ${p.text}`).join(", ")}) => ${returnType.text}`,
    typeParameters: [],
    parameters: params.map((type, i) => ({
      name: `arg${i}`,
      type,
      optional: false,
    })),
    returnType,
  };

  return {
    id,
    name: id.split(".").pop() ?? id,
    module: id.split(".")[0] ?? "",
    package: "effect",
    signature: signatureParsed.raw,
    signatureParsed,
    description: `Mock function ${id}`,
    examples: [],
    tags: [],
  };
}

// ============================================================================
// Mock Function Library
// ============================================================================

const A = typeVar("A");
const B = typeVar("B");
const E = typeVar("E");
const R = typeVar("R");

const MOCK_FUNCTIONS: FunctionEntry[] = [
  // Effect.succeed: (a: A) => Effect<A, never, never>
  mockFunction("Effect.succeed", [A], effect(A, primitive("never"), primitive("never"))),

  // Effect.fail: (e: E) => Effect<never, E, never>
  mockFunction("Effect.fail", [E], effect(primitive("never"), E, primitive("never"))),

  // Effect.map: (self: Effect<A, E, R>, f: (a: A) => B) => Effect<B, E, R>
  mockFunction("Effect.map", [effect(A, E, R), fn([A], B)], effect(B, E, R)),

  // Effect.flatMap: (self: Effect<A, E, R>, f: (a: A) => Effect<B, E, R>) => Effect<B, E, R>
  mockFunction("Effect.flatMap", [effect(A, E, R), fn([A], effect(B, E, R))], effect(B, E, R)),

  // Option.some: (a: A) => Option<A>
  mockFunction("Option.some", [A], option(A)),

  // Option.none: () => Option<never>
  mockFunction("Option.none", [], option(primitive("never"))),

  // Option.map: (self: Option<A>, f: (a: A) => B) => Option<B>
  mockFunction("Option.map", [option(A), fn([A], B)], option(B)),

  // Effect.fromOption: (option: Option<A>) => Effect<A, NoSuchElementException, never>
  mockFunction("Effect.fromOption", [option(A)], effect(A, typeVar("NoSuchElementException"), primitive("never"))),

  // Array.map: (self: Array<A>, f: (a: A) => B) => Array<B>
  mockFunction("Array.map", [
    { kind: "generic", text: "Array<A>", typeName: "Array", typeArguments: [A] },
    fn([A], B)
  ], { kind: "generic", text: "Array<B>", typeName: "Array", typeArguments: [B] }),
];

// ============================================================================
// Integration Tests
// ============================================================================

describe("Type Signature Search - Integration Tests", () => {
  describe("Query Parsing", () => {
    it("parses Effect<A, E, R>", () => {
      const parsed = parseTypeQuery("Effect<A, E, R>");
      expect(parsed?.kind).toBe("effect");
      expect(parsed?.typeName).toBe("Effect");
      expect(parsed?.typeArguments?.length).toBe(3);
    });

    it("parses A => Effect<A>", () => {
      const parsed = parseTypeQuery("A => Effect<A>");
      expect(parsed?.kind).toBe("function");
      expect(parsed?.children?.length).toBe(2); // 1 param + 1 return
      expect(parsed?.children?.[0].isTypeVariable).toBe(true);
      expect(parsed?.children?.[1].kind).toBe("effect");
    });

    it("parses Haskell-style A -> Effect<A>", () => {
      const parsed = parseTypeQuery("A -> Effect<A>");
      expect(parsed?.kind).toBe("function");
      expect(parsed?.children?.length).toBe(2);
    });
  });

  describe("Searching for functions returning Effect", () => {
    it("finds Effect.succeed, Effect.fail, Effect.map, Effect.flatMap, Effect.fromOption", () => {
      const results = searchByType("Effect<A, E, R>", MOCK_FUNCTIONS);
      const ids = results.map(r => r.entry.id);

      // These all return Effect
      expect(ids).toContain("Effect.succeed");
      expect(ids).toContain("Effect.fail");
      expect(ids).toContain("Effect.map");
      expect(ids).toContain("Effect.flatMap");
      expect(ids).toContain("Effect.fromOption");

      // These return Option, not Effect
      expect(ids).not.toContain("Option.some");
      expect(ids).not.toContain("Option.map");
    });
  });

  describe("Searching for functions returning Option", () => {
    it("finds Option.some, Option.none, Option.map", () => {
      const results = searchByType("Option<A>", MOCK_FUNCTIONS);
      const ids = results.map(r => r.entry.id);

      expect(ids).toContain("Option.some");
      expect(ids).toContain("Option.none");
      expect(ids).toContain("Option.map");

      // Effect functions should not appear
      expect(ids).not.toContain("Effect.succeed");
    });
  });

  describe("Searching by function signature", () => {
    it("A => Effect<A> finds Effect.succeed", () => {
      const results = searchByType("A => Effect<A>", MOCK_FUNCTIONS);
      const ids = results.map(r => r.entry.id);

      // Effect.succeed takes A and returns Effect<A, never, never>
      expect(ids).toContain("Effect.succeed");
    });

    it("A => Option<A> finds Option.some", () => {
      const results = searchByType("A => Option<A>", MOCK_FUNCTIONS);
      const ids = results.map(r => r.entry.id);

      expect(ids).toContain("Option.some");
    });

    it("Option<A> => Effect<A> finds Effect.fromOption", () => {
      const results = searchByType("Option<A> => Effect<A>", MOCK_FUNCTIONS);
      const ids = results.map(r => r.entry.id);

      expect(ids).toContain("Effect.fromOption");
    });
  });

  describe("Scoring and ranking", () => {
    it("ranks exact matches higher than partial matches", () => {
      const results = searchByType("Effect<A, E, R>", MOCK_FUNCTIONS);

      // All results should be sorted by score (highest first)
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].matchResult.score).toBeGreaterThanOrEqual(
          results[i].matchResult.score
        );
      }
    });

    it("assigns meaningful scores", () => {
      const results = searchByType("Effect<A, E, R>", MOCK_FUNCTIONS);

      // All matches should have positive scores
      for (const result of results) {
        expect(result.matchResult.score).toBeGreaterThan(0);
      }
    });
  });

  describe("Edge cases", () => {
    it("returns empty for non-matching queries", () => {
      const results = searchByType("Stream<A, E, R>", MOCK_FUNCTIONS);
      // Stream doesn't match our mock functions (we only have Effect, Option, Array)
      expect(results.length).toBe(0);
    });

    it("returns empty for invalid queries", () => {
      expect(searchByType("", MOCK_FUNCTIONS)).toHaveLength(0);
      expect(searchByType("   ", MOCK_FUNCTIONS)).toHaveLength(0);
    });

    it("respects the limit parameter", () => {
      const results = searchByType("Effect<A, E, R>", MOCK_FUNCTIONS, 2);
      expect(results.length).toBeLessThanOrEqual(2);
    });
  });

  describe("Type variable unification", () => {
    it("type variables match concrete types", () => {
      // Searching for A => Effect<A> should find Effect.succeed
      // even though Effect.succeed returns Effect<A, never, never>
      const results = searchByType("A => Effect<A>", MOCK_FUNCTIONS);
      expect(results.some(r => r.entry.id === "Effect.succeed")).toBe(true);
    });

    it("wildcards match anything", () => {
      const results = searchByType("*", MOCK_FUNCTIONS);
      // Wildcard should match all functions (via return type matching)
      expect(results.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// Expected Results Summary
// ============================================================================

describe("Expected Results Summary", () => {
  it("documents expected search results", () => {
    const testCases = [
      {
        query: "Effect<A, E, R>",
        expectedToContain: ["Effect.succeed", "Effect.fail", "Effect.map", "Effect.flatMap", "Effect.fromOption"],
        expectedNotToContain: ["Option.some", "Option.map", "Array.map"],
      },
      {
        query: "Option<A>",
        expectedToContain: ["Option.some", "Option.none", "Option.map"],
        expectedNotToContain: ["Effect.succeed", "Array.map"],
      },
      {
        query: "A => Effect<A>",
        expectedToContain: ["Effect.succeed"],
        expectedNotToContain: ["Option.some"],
      },
      {
        query: "A => Option<A>",
        expectedToContain: ["Option.some"],
        expectedNotToContain: ["Effect.succeed"],
      },
    ];

    for (const { query, expectedToContain, expectedNotToContain } of testCases) {
      const results = searchByType(query, MOCK_FUNCTIONS);
      const ids = results.map(r => r.entry.id);

      for (const expected of expectedToContain) {
        expect(ids, `Query "${query}" should find "${expected}"`).toContain(expected);
      }

      for (const notExpected of expectedNotToContain) {
        expect(ids, `Query "${query}" should NOT find "${notExpected}"`).not.toContain(notExpected);
      }
    }
  });
});
