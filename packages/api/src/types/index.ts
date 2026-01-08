/**
 * Types for the Hoogle-Effect search index
 */

// Main search index structure
export interface SearchIndex {
  version: string;
  buildDate: string;
  effectVersion: string;
  functions: FunctionEntry[];
  modules: ModuleEntry[];
}

// Individual function entry in the index
export interface FunctionEntry {
  id: string;                          // Unique ID: "Effect.map"
  name: string;                        // Function name: "map"
  module: string;                      // Module name: "Effect"
  package: string;                     // Package name: "effect" or "@effect/platform"
  signature: string;                   // Type signature as string
  signatureParsed?: ParsedSignature;   // Parsed type for matching
  description: string;                 // Short description from JSDoc
  documentation?: string;              // Full JSDoc content
  examples: Example[];                 // Code examples
  tags: string[];                      // Search tags
  since?: string;                      // Version introduced
  deprecated?: string;                 // Deprecation message if any
  sourceFile?: string;                 // Source file path
  sourceLine?: number;                 // Line number in source
}

// Module entry for grouping
export interface ModuleEntry {
  name: string;                        // "Effect", "Stream", "Option"
  package: string;                     // "effect" or "@effect/platform"
  description: string;
  functionCount: number;
  path: string;                        // Import path
}

// Parsed type signature for search matching
export interface ParsedSignature {
  raw: string;
  typeParameters: TypeParameter[];
  parameters: Parameter[];
  returnType: TypeNode;
}

export interface TypeParameter {
  name: string;
  constraint?: TypeNode;
  default?: TypeNode;
}

export interface Parameter {
  name: string;
  type: TypeNode;
  optional: boolean;
}

export interface TypeNode {
  kind: TypeKind;
  text: string;
  children?: TypeNode[];
  // For generic types
  typeName?: string;
  typeArguments?: TypeNode[];
}

export type TypeKind =
  | "effect"          // Effect<A, E, R>
  | "function"        // (a: A) => B
  | "generic"         // Array<T>, Option<A>
  | "union"           // A | B
  | "intersection"    // A & B
  | "tuple"           // [A, B]
  | "literal"         // "hello", 42, true
  | "primitive"       // string, number, boolean
  | "reference"       // Named type reference
  | "unknown";

export interface Example {
  title?: string;
  code: string;
  description?: string;
}

// Haskell mapping types
export interface HaskellMapping {
  haskell: {
    signature: string;
    concept: string;           // "Functor", "Monad", etc.
    commonNames: string[];     // ["fmap", "<$>", "map"]
  };
  effect: {
    functions: string[];       // ["Effect.map", "Option.map"]
    description: string;
    examples: Example[];
  };
  notes?: string;              // Differences, gotchas
}

export interface HaskellMappingsIndex {
  version: string;
  mappings: HaskellMapping[];
}
