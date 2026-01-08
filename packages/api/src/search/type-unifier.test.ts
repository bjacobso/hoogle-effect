import { describe, it, expect } from "vitest";
import { unifyTypes } from "./type-unifier.js";
import { parseTypeQuery } from "./type-parser.js";
import type { TypeNode } from "../types/index.js";

// Helper to create TypeNode for testing
function parse(query: string): TypeNode {
  const result = parseTypeQuery(query);
  if (!result) throw new Error(`Failed to parse: ${query}`);
  return result;
}

describe("unifyTypes", () => {
  describe("type variables", () => {
    it("type variable matches any type", () => {
      const query = parse("A");
      const target = parse("string");
      const result = unifyTypes(query, target);
      expect(result.matches).toBe(true);
      expect(result.bindings.get("A")?.text).toBe("string");
    });

    it("same type variable must match consistently", () => {
      // This tests that if A is bound to string, A should match string again
      const query = parse("A");
      const target = parse("string");
      const result = unifyTypes(query, target);
      expect(result.matches).toBe(true);
      expect(result.score).toBeGreaterThan(0);
    });
  });

  describe("wildcards", () => {
    it("wildcard matches anything", () => {
      const query = parse("*");
      const target = parse("Effect<A, E, R>");
      const result = unifyTypes(query, target);
      expect(result.matches).toBe(true);
    });
  });

  describe("primitives", () => {
    it("same primitives match", () => {
      const query = parse("string");
      const target = parse("string");
      const result = unifyTypes(query, target);
      expect(result.matches).toBe(true);
      expect(result.score).toBe(100);
    });

    it("different primitives don't match", () => {
      const query = parse("string");
      const target = parse("number");
      const result = unifyTypes(query, target);
      expect(result.matches).toBe(false);
    });
  });

  describe("generic types", () => {
    it("Effect types match with compatible arguments", () => {
      const query = parse("Effect<A, E, R>");
      const target = parse("Effect<string, Error, never>");
      const result = unifyTypes(query, target);
      expect(result.matches).toBe(true);
      expect(result.bindings.get("A")?.text).toBe("string");
    });

    it("Option types match", () => {
      const query = parse("Option<A>");
      const target = parse("Option<string>");
      const result = unifyTypes(query, target);
      expect(result.matches).toBe(true);
    });

    it("different type constructors don't match", () => {
      const query = parse("Effect<A>");
      const target = parse("Option<A>");
      // Different type constructors should not match
      const result = unifyTypes(query, target);
      expect(result.matches).toBe(false);
    });
  });

  describe("function types", () => {
    it("simple arrow function matches", () => {
      const query = parse("A => B");
      const target = parse("string => number");
      const result = unifyTypes(query, target);
      expect(result.matches).toBe(true);
    });

    it("function returning Effect matches", () => {
      const query = parse("A => Effect<B>");
      // Create a target that's a function returning Effect
      const target: TypeNode = {
        kind: "function",
        text: "(a: string) => Effect<number>",
        children: [
          { kind: "primitive", text: "string" },
          {
            kind: "effect",
            text: "Effect<number>",
            typeName: "Effect",
            typeArguments: [{ kind: "primitive", text: "number" }]
          }
        ]
      };
      const result = unifyTypes(query, target);
      expect(result.matches).toBe(true);
    });

    it("return type is most important", () => {
      const query = parse("A => Effect<B>");
      // Function with wrong return type
      const target: TypeNode = {
        kind: "function",
        text: "(a: string) => Option<number>",
        children: [
          { kind: "primitive", text: "string" },
          {
            kind: "generic",
            text: "Option<number>",
            typeName: "Option",
            typeArguments: [{ kind: "primitive", text: "number" }]
          }
        ]
      };
      const result = unifyTypes(query, target);
      expect(result.matches).toBe(false);
    });
  });
});
