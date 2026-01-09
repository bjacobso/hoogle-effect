/**
 * Build-time signature parser using ts-morph
 * Converts TypeScript function signatures into ParsedSignature structures
 */

import { FunctionDeclaration, VariableDeclaration, Node, Type, TypeNode as TSMorphTypeNode } from "ts-morph";
import type { ParsedSignature, TypeNode, TypeParameter, Parameter, TypeKind } from "../types/index.js";

// Common Effect-TS type constructors
const EFFECT_TYPES = new Set(["Effect", "Stream", "Layer", "Schedule", "Fiber", "Exit", "Cause"]);
const OPTION_TYPES = new Set(["Option", "Some", "None"]);
const EITHER_TYPES = new Set(["Either", "Left", "Right"]);
const COLLECTION_TYPES = new Set(["Array", "Chunk", "List", "HashMap", "HashSet", "SortedMap", "SortedSet"]);
const PRIMITIVE_TYPES = new Set(["string", "number", "boolean", "void", "never", "unknown", "any", "null", "undefined", "bigint", "symbol", "object"]);

// Maximum depth for type recursion to prevent stack overflow
const MAX_TYPE_DEPTH = 8;

/**
 * Check if a type name represents a type variable (single uppercase letter or letter+digit)
 */
function isTypeVariable(text: string): boolean {
  return /^[A-Z]\d*$/.test(text);
}

/**
 * Determine the TypeKind for a given type
 */
function determineTypeKind(typeName: string | undefined, text: string): TypeKind {
  if (!typeName) {
    if (PRIMITIVE_TYPES.has(text.toLowerCase())) return "primitive";
    if (isTypeVariable(text)) return "typeVariable";
    return "unknown";
  }

  if (EFFECT_TYPES.has(typeName)) return "effect";
  if (OPTION_TYPES.has(typeName) || EITHER_TYPES.has(typeName) || COLLECTION_TYPES.has(typeName)) return "generic";
  if (PRIMITIVE_TYPES.has(typeName.toLowerCase())) return "primitive";
  if (isTypeVariable(typeName)) return "typeVariable";

  return "generic";
}

/**
 * Clean up type text by removing import() paths
 */
function cleanTypeText(text: string): string {
  return text
    .replace(/import\([^)]+\)\./g, "")
    .replace(/typeof import\([^)]+\)/g, "typeof Effect")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Convert a ts-morph Type to our TypeNode structure
 * @param depth Current recursion depth to prevent stack overflow
 */
function typeToTypeNode(type: Type, contextNode?: Node, depth: number = 0): TypeNode {
  const rawText = type.getText(contextNode);
  const text = cleanTypeText(rawText);

  // Prevent infinite recursion on deeply nested types
  if (depth >= MAX_TYPE_DEPTH) {
    return {
      kind: "unknown",
      text: text.length > 100 ? text.slice(0, 100) + "..." : text,
    };
  }

  // Handle type variables (single uppercase letters like A, E, R)
  if (isTypeVariable(text)) {
    return {
      kind: "typeVariable",
      text,
      isTypeVariable: true,
    };
  }

  // Handle primitives
  if (PRIMITIVE_TYPES.has(text.toLowerCase())) {
    return {
      kind: "primitive",
      text: text.toLowerCase(),
    };
  }

  // Handle union types
  if (type.isUnion()) {
    const unionTypes = type.getUnionTypes();
    // Limit union branches to prevent explosion
    const limitedUnion = unionTypes.slice(0, 5);
    return {
      kind: "union",
      text,
      children: limitedUnion.map(t => typeToTypeNode(t, contextNode, depth + 1)),
    };
  }

  // Handle intersection types
  if (type.isIntersection()) {
    const intersectionTypes = type.getIntersectionTypes();
    const limitedIntersection = intersectionTypes.slice(0, 5);
    return {
      kind: "intersection",
      text,
      children: limitedIntersection.map(t => typeToTypeNode(t, contextNode, depth + 1)),
    };
  }

  // Handle tuple types
  if (type.isTuple()) {
    const tupleTypes = type.getTupleElements();
    return {
      kind: "tuple",
      text,
      children: tupleTypes.slice(0, 10).map(t => typeToTypeNode(t, contextNode, depth + 1)),
    };
  }

  // Handle function types
  const callSignatures = type.getCallSignatures();
  if (callSignatures.length > 0) {
    const sig = callSignatures[0];
    const params = sig.getParameters().slice(0, 10).map(p => {
      const paramType = p.getTypeAtLocation(contextNode ?? p.getDeclarations()[0]);
      return typeToTypeNode(paramType, contextNode, depth + 1);
    });
    const returnType = typeToTypeNode(sig.getReturnType(), contextNode, depth + 1);

    return {
      kind: "function",
      text,
      children: [...params, returnType],
    };
  }

  // Handle generic types with type arguments
  const typeArgs = type.getTypeArguments();
  if (typeArgs.length > 0) {
    const symbol = type.getSymbol() ?? type.getAliasSymbol();
    const typeName = symbol?.getName() ?? text.split("<")[0];
    const cleanTypeName = cleanTypeText(typeName);

    return {
      kind: determineTypeKind(cleanTypeName, text),
      text,
      typeName: cleanTypeName,
      typeArguments: typeArgs.slice(0, 5).map(t => typeToTypeNode(t, contextNode, depth + 1)),
    };
  }

  // Handle literal types
  if (type.isLiteral()) {
    return {
      kind: "literal",
      text,
    };
  }

  // Default: reference type
  const symbol = type.getSymbol() ?? type.getAliasSymbol();
  const typeName = symbol?.getName();

  return {
    kind: determineTypeKind(typeName, text),
    text,
    typeName: typeName ? cleanTypeText(typeName) : undefined,
  };
}

/**
 * Extract type parameters from a function declaration
 */
function extractTypeParameters(node: FunctionDeclaration | VariableDeclaration): TypeParameter[] {
  if (Node.isFunctionDeclaration(node)) {
    return node.getTypeParameters().map(tp => {
      const constraint = tp.getConstraint();
      const defaultType = tp.getDefault();

      return {
        name: tp.getName(),
        constraint: constraint ? typeToTypeNode(constraint.getType(), node) : undefined,
        default: defaultType ? typeToTypeNode(defaultType.getType(), node) : undefined,
      };
    });
  }

  // For variable declarations, extract from the type's call signature
  const type = node.getType();
  const callSigs = type.getCallSignatures();
  if (callSigs.length > 0) {
    const sig = callSigs[0];
    return sig.getTypeParameters().map(tp => {
      // TypeParameter from call signature uses getSymbol() for the name
      const symbol = tp.getSymbol();
      const name = symbol?.getName() ?? tp.getText();
      const constraint = tp.getConstraint();
      const defaultType = tp.getDefault();

      return {
        name,
        constraint: constraint ? typeToTypeNode(constraint, node) : undefined,
        default: defaultType ? typeToTypeNode(defaultType, node) : undefined,
      };
    });
  }

  return [];
}

/**
 * Extract parameters from a function declaration
 */
function extractParameters(node: FunctionDeclaration | VariableDeclaration): Parameter[] {
  if (Node.isFunctionDeclaration(node)) {
    return node.getParameters().map(p => ({
      name: p.getName(),
      type: typeToTypeNode(p.getType(), node),
      optional: p.isOptional(),
    }));
  }

  // For variable declarations, extract from the type's call signature
  const type = node.getType();
  const callSigs = type.getCallSignatures();
  if (callSigs.length > 0) {
    const sig = callSigs[0];
    return sig.getParameters().map(p => {
      const paramDecl = p.getDeclarations()[0];
      const paramType = p.getTypeAtLocation(node);
      return {
        name: p.getName(),
        type: typeToTypeNode(paramType, node),
        optional: paramDecl ? Node.isParameterDeclaration(paramDecl) && paramDecl.isOptional() : false,
      };
    });
  }

  return [];
}

/**
 * Extract return type from a function declaration
 */
function extractReturnType(node: FunctionDeclaration | VariableDeclaration): TypeNode {
  if (Node.isFunctionDeclaration(node)) {
    return typeToTypeNode(node.getReturnType(), node);
  }

  // For variable declarations, extract from the type's call signature
  const type = node.getType();
  const callSigs = type.getCallSignatures();
  if (callSigs.length > 0) {
    return typeToTypeNode(callSigs[0].getReturnType(), node);
  }

  return {
    kind: "unknown",
    text: "unknown",
  };
}

/**
 * Parse a function declaration or variable declaration into a ParsedSignature
 */
export function parseSignature(
  node: FunctionDeclaration | VariableDeclaration,
  rawSignature: string
): ParsedSignature {
  const typeParameters = extractTypeParameters(node);
  const parameters = extractParameters(node);
  const returnType = extractReturnType(node);

  return {
    raw: rawSignature,
    typeParameters,
    parameters,
    returnType,
  };
}
