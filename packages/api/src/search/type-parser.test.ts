import { describe, it, expect } from "vitest";
import { parseTypeQuery, looksLikeTypeQuery } from "./type-parser.js";

describe("parseTypeQuery", () => {
  it("parses simple type variable", () => {
    const result = parseTypeQuery("A");
    expect(result).not.toBeNull();
    expect(result?.kind).toBe("typeVariable");
    expect(result?.isTypeVariable).toBe(true);
  });

  it("parses primitive types", () => {
    const result = parseTypeQuery("string");
    expect(result).not.toBeNull();
    expect(result?.kind).toBe("primitive");
    expect(result?.text).toBe("string");
  });

  it("parses Effect type", () => {
    const result = parseTypeQuery("Effect<A, E, R>");
    expect(result).not.toBeNull();
    expect(result?.kind).toBe("effect");
    expect(result?.typeName).toBe("Effect");
    expect(result?.typeArguments).toHaveLength(3);
    expect(result?.typeArguments?.[0].kind).toBe("typeVariable");
    expect(result?.typeArguments?.[0].text).toBe("A");
  });

  it("parses Option type", () => {
    const result = parseTypeQuery("Option<A>");
    expect(result).not.toBeNull();
    expect(result?.kind).toBe("generic");
    expect(result?.typeName).toBe("Option");
    expect(result?.typeArguments).toHaveLength(1);
  });

  it("parses arrow function with TypeScript syntax", () => {
    const result = parseTypeQuery("A => Effect<B>");
    expect(result).not.toBeNull();
    expect(result?.kind).toBe("function");
    expect(result?.children).toHaveLength(2);
    expect(result?.children?.[0].kind).toBe("typeVariable");
    expect(result?.children?.[1].kind).toBe("effect");
  });

  it("parses arrow function with Haskell syntax", () => {
    const result = parseTypeQuery("A -> Effect<B>");
    expect(result).not.toBeNull();
    expect(result?.kind).toBe("function");
    expect(result?.children).toHaveLength(2);
  });

  it("parses parenthesized function", () => {
    const result = parseTypeQuery("(A, B) => Effect<C>");
    expect(result).not.toBeNull();
    expect(result?.kind).toBe("function");
    expect(result?.children).toHaveLength(3); // 2 params + 1 return
  });

  it("parses wildcard", () => {
    const result = parseTypeQuery("*");
    expect(result).not.toBeNull();
    expect(result?.kind).toBe("wildcard");
    expect(result?.isWildcard).toBe(true);
  });

  it("parses complex nested types", () => {
    const result = parseTypeQuery("Effect<A, E, R> => Effect<B, E, R>");
    expect(result).not.toBeNull();
    expect(result?.kind).toBe("function");
    expect(result?.children?.[0].kind).toBe("effect");
    expect(result?.children?.[1].kind).toBe("effect");
  });

  it("returns null for empty query", () => {
    expect(parseTypeQuery("")).toBeNull();
    expect(parseTypeQuery("  ")).toBeNull();
  });
});

describe("looksLikeTypeQuery", () => {
  it("detects type syntax", () => {
    expect(looksLikeTypeQuery("Effect<A>")).toBe(true);
    expect(looksLikeTypeQuery("A => B")).toBe(true);
    expect(looksLikeTypeQuery("A -> B")).toBe(true);
    expect(looksLikeTypeQuery("A | B")).toBe(true);
  });

  it("detects Effect types", () => {
    expect(looksLikeTypeQuery("Effect")).toBe(true);
    expect(looksLikeTypeQuery("Option")).toBe(true);
    expect(looksLikeTypeQuery("Either")).toBe(true);
    expect(looksLikeTypeQuery("Stream")).toBe(true);
  });

  it("detects type variables", () => {
    expect(looksLikeTypeQuery("A")).toBe(true);
    expect(looksLikeTypeQuery("B")).toBe(true);
  });

  it("returns false for text queries", () => {
    expect(looksLikeTypeQuery("map")).toBe(false);
    expect(looksLikeTypeQuery("flatMap")).toBe(false);
    expect(looksLikeTypeQuery("hello world")).toBe(false);
  });
});
