import { describe, it, expect } from "vitest";
import { searchByType } from "./type-search.js";
import type { FunctionEntry, ParsedSignature, TypeNode } from "../types/index.js";

// Helper to create a mock FunctionEntry with parsed signature
function createEntry(
  id: string,
  returnType: TypeNode,
  params: TypeNode[] = []
): FunctionEntry {
  const signatureParsed: ParsedSignature = {
    raw: `(${params.map((_, i) => `arg${i}`).join(", ")}) => ${returnType.text}`,
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
    description: "",
    examples: [],
    tags: [],
  };
}

// Common type nodes for testing
const effectAER: TypeNode = {
  kind: "effect",
  text: "Effect<A, E, R>",
  typeName: "Effect",
  typeArguments: [
    { kind: "typeVariable", text: "A", isTypeVariable: true },
    { kind: "typeVariable", text: "E", isTypeVariable: true },
    { kind: "typeVariable", text: "R", isTypeVariable: true },
  ],
};

const effectBER: TypeNode = {
  kind: "effect",
  text: "Effect<B, E, R>",
  typeName: "Effect",
  typeArguments: [
    { kind: "typeVariable", text: "B", isTypeVariable: true },
    { kind: "typeVariable", text: "E", isTypeVariable: true },
    { kind: "typeVariable", text: "R", isTypeVariable: true },
  ],
};

const optionA: TypeNode = {
  kind: "generic",
  text: "Option<A>",
  typeName: "Option",
  typeArguments: [{ kind: "typeVariable", text: "A", isTypeVariable: true }],
};

const typeA: TypeNode = { kind: "typeVariable", text: "A", isTypeVariable: true };
const typeB: TypeNode = { kind: "typeVariable", text: "B", isTypeVariable: true };

describe("searchByType", () => {
  const mockFunctions: FunctionEntry[] = [
    createEntry("Effect.map", effectBER, [effectAER, { kind: "function", text: "(a: A) => B", children: [typeA, typeB] }]),
    createEntry("Effect.succeed", effectAER, [typeA]),
    createEntry("Option.fromNullable", optionA, [typeA]),
    createEntry("Effect.flatMap", effectBER, [effectAER, { kind: "function", text: "(a: A) => Effect<B, E, R>", children: [typeA, effectBER] }]),
  ];

  it("finds functions returning Effect", () => {
    const results = searchByType("Effect<A, E, R>", mockFunctions);
    expect(results.length).toBeGreaterThan(0);
    // Should find Effect.map, Effect.succeed, Effect.flatMap
    const ids = results.map(r => r.entry.id);
    expect(ids).toContain("Effect.succeed");
    expect(ids).toContain("Effect.map");
  });

  it("finds functions returning Option", () => {
    const results = searchByType("Option<A>", mockFunctions);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].entry.id).toBe("Option.fromNullable");
  });

  it("finds functions with arrow syntax", () => {
    const results = searchByType("A => Effect<A, E, R>", mockFunctions);
    expect(results.length).toBeGreaterThan(0);
    // Effect.succeed takes A and returns Effect<A, E, R>
    const ids = results.map(r => r.entry.id);
    expect(ids).toContain("Effect.succeed");
  });

  it("supports Haskell arrow syntax", () => {
    const results = searchByType("A -> Effect<A, E, R>", mockFunctions);
    expect(results.length).toBeGreaterThan(0);
  });

  it("returns fewer results for non-matching type constructors", () => {
    // Stream doesn't directly match Effect or Option
    // But it may still find partial matches via type variable matching
    const streamResults = searchByType("Stream<A, E, R>", mockFunctions);
    const effectResults = searchByType("Effect<A, E, R>", mockFunctions);
    // Effect should have higher-scoring matches since our mock functions use Effect
    expect(effectResults.length).toBeGreaterThanOrEqual(streamResults.length);
  });

  it("returns empty for invalid queries", () => {
    const results = searchByType("", mockFunctions);
    expect(results.length).toBe(0);
  });

  it("respects limit parameter", () => {
    const results = searchByType("Effect<A, E, R>", mockFunctions, 1);
    expect(results.length).toBeLessThanOrEqual(1);
  });

  it("sorts results by score", () => {
    const results = searchByType("Effect<A, E, R>", mockFunctions);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].matchResult.score).toBeGreaterThanOrEqual(
        results[i].matchResult.score
      );
    }
  });
});
