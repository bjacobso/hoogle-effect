#!/usr/bin/env tsx
/**
 * Build the search index from Effect-TS type definitions
 *
 * This script:
 * 1. Loads Effect package from node_modules
 * 2. Parses TypeScript declarations using ts-morph
 * 3. Extracts function signatures, documentation, examples
 * 4. Generates index.json for the search UI
 */

import { Project, SourceFile, FunctionDeclaration, VariableDeclaration, Node, JSDoc, SyntaxKind, TypeAliasDeclaration, InterfaceDeclaration } from "ts-morph";
import * as fs from "node:fs";
import * as path from "node:path";
import type { SearchIndex, FunctionEntry, ModuleEntry, Example } from "../types/index.js";

// Configuration
const CONFIG = {
  // Packages and their modules to index
  packages: [
    {
      name: "effect",
      modules: [
        "effect",
        "Effect",
        "Stream",
        "Option",
        "Either",
        "Array",
        "Ref",
        "Queue",
        "Schedule",
        "Layer",
        "Context",
        "Scope",
        "Fiber",
        "FiberRef",
        "Runtime",
        "Exit",
        "Cause",
        "Config",
        "ConfigProvider",
        "Logger",
        "Metric",
        "Resource",
        "Pool",
        "Cache",
        "Deferred",
        "PubSub",
        "Chunk",
        "HashMap",
        "HashSet",
        "List",
        "SortedMap",
        "SortedSet",
        "Duration",
        "DateTime",
      ],
    },
    {
      name: "@effect/platform",
      modules: [
        "FileSystem",
        "HttpApi",
        "HttpApiBuilder",
        "HttpApiClient",
        "HttpApiEndpoint",
        "HttpApiError",
        "HttpApiGroup",
        "HttpApiMiddleware",
        "HttpApiSchema",
        "HttpApiSecurity",
        "HttpApiSwagger",
        "HttpApp",
        "HttpBody",
        "HttpClient",
        "HttpClientError",
        "HttpClientRequest",
        "HttpClientResponse",
        "HttpIncomingMessage",
        "HttpMethod",
        "HttpMiddleware",
        "HttpMultiplex",
        "HttpPlatform",
        "HttpRouter",
        "HttpServer",
        "HttpServerError",
        "HttpServerRequest",
        "HttpServerRespondable",
        "HttpServerResponse",
        "HttpTraceContext",
        "HttpLayerRouter",
        "Command",
        "CommandExecutor",
        "Cookies",
        "Error",
        "Etag",
        "FetchHttpClient",
        "Headers",
        "KeyValueStore",
        "MsgPack",
        "Multipart",
        "Ndjson",
        "OpenApi",
        "Path",
        "PlatformConfigProvider",
        "PlatformLogger",
        "Runtime",
        "Socket",
        "SocketServer",
        "Template",
        "Terminal",
        "Transferable",
        "Url",
        "UrlParams",
        "Worker",
        "WorkerError",
        "WorkerRunner",
        "ChannelSchema",
        "Effectify",
        "OpenApiJsonSchema",
      ],
    },
  ],
  outputDir: path.resolve(process.cwd(), "../../data"),
};

// Initialize ts-morph project
function createProject(): Project {
  const project = new Project({
    compilerOptions: {
      declaration: true,
      moduleResolution: 100, // NodeNext
    },
    skipAddingFilesFromTsConfig: true,
  });

  return project;
}

// Find a package in node_modules
function findPackage(packageName: string): string {
  const possiblePaths = [
    path.resolve(process.cwd(), `node_modules/${packageName}`),
    path.resolve(process.cwd(), `../../node_modules/${packageName}`),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  throw new Error(`Could not find ${packageName} package in node_modules. Run pnpm install first.`);
}

// Clean up type signatures by removing full import paths
function cleanSignature(signature: string): string {
  // Remove import(...) wrappers, keeping just the type name
  // e.g., import("/path/to/effect").Effect<A, E, R> -> Effect<A, E, R>
  let cleaned = signature.replace(
    /import\([^)]+\)\./g,
    ""
  );

  // Simplify some common verbose patterns
  cleaned = cleaned
    // Remove quotes from type literals in some cases
    .replace(/typeof import\([^)]+\)/g, "typeof Effect")
    // Clean up excessive whitespace
    .replace(/\s+/g, " ")
    .trim();

  return cleaned;
}

// Parse examples from markdown code blocks in description
function parseExamplesFromDescription(description: string): { cleanDescription: string; examples: Example[] } {
  const examples: Example[] = [];

  // Match markdown code blocks with optional title
  // Pattern: **Example** (Title)\n```ts\ncode\n```
  const examplePattern = /\*\*Example\*\*\s*(?:\(([^)]+)\))?\s*\n+```(?:ts|typescript)?\s*(?:[\w-]+)?\n([\s\S]*?)```/g;

  let match;
  while ((match = examplePattern.exec(description)) !== null) {
    const title = match[1]?.trim();
    const code = match[2]?.trim();
    if (code) {
      examples.push({
        title,
        code,
      });
    }
  }

  // Also match simpler code blocks that aren't labeled as examples
  const simpleCodePattern = /```(?:ts|typescript)\n([\s\S]*?)```/g;
  while ((match = simpleCodePattern.exec(description)) !== null) {
    const code = match[1]?.trim();
    // Only add if not already captured as an example and looks like real code
    if (code && !examples.some(e => e.code === code) && code.includes("Effect")) {
      examples.push({ code });
    }
  }

  // Clean description: remove example code blocks but keep structure
  let cleanDescription = description
    // Remove **Example** sections with code blocks
    .replace(/\*\*Example\*\*\s*(?:\([^)]+\))?\s*\n+```[\s\S]*?```/g, "")
    // Remove **Syntax** sections
    .replace(/\*\*Syntax\*\*\s*\n+```[\s\S]*?```/g, "")
    // Remove standalone code blocks
    .replace(/```[\s\S]*?```/g, "")
    // Clean up multiple newlines
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Extract just the main description (first paragraph or up to **Details**)
  const detailsMatch = cleanDescription.match(/^([\s\S]*?)(?=\*\*Details\*\*|\*\*When to Use\*\*|$)/);
  if (detailsMatch) {
    cleanDescription = detailsMatch[1].trim();
  }

  // Remove markdown formatting for cleaner display
  cleanDescription = cleanDescription
    .replace(/\*\*/g, "")
    .replace(/\n\n+/g, " ")
    .trim();

  return { cleanDescription, examples };
}

// Extract JSDoc comment text
function extractJSDoc(node: Node): { description: string; fullDescription: string; examples: Example[]; tags: Record<string, string> } {
  const jsDocs = (node as unknown as { getJsDocs?: () => JSDoc[] }).getJsDocs?.() ?? [];
  let rawDescription = "";
  let examples: Example[] = [];
  const tags: Record<string, string> = {};

  for (const jsDoc of jsDocs) {
    // Get main description
    const comment = jsDoc.getComment();
    if (comment) {
      rawDescription = typeof comment === "string" ? comment : comment.map((c) => c?.getText() ?? "").join("");
    }

    // Extract tags
    for (const tag of jsDoc.getTags()) {
      const tagName = tag.getTagName();
      const tagText = tag.getCommentText() ?? "";

      if (tagName === "example") {
        // Parse example code blocks from @example tags
        const code = tagText.replace(/^```[\w-]*\n?/, "").replace(/\n?```$/, "").trim();
        if (code) {
          examples.push({ code });
        }
      } else if (tagName === "since") {
        tags.since = tagText;
      } else if (tagName === "deprecated") {
        tags.deprecated = tagText;
      } else if (tagName === "category") {
        tags.category = tagText;
      }
    }
  }

  // Parse examples from markdown in description (Effect uses this pattern)
  const { cleanDescription, examples: descExamples } = parseExamplesFromDescription(rawDescription);

  // Combine examples from @example tags and description
  examples = [...examples, ...descExamples];

  return {
    description: cleanDescription,
    fullDescription: rawDescription.trim(),
    examples,
    tags,
  };
}

// Extract type signature as string
function extractSignature(node: FunctionDeclaration | VariableDeclaration): string {
  let signature: string;

  if (Node.isFunctionDeclaration(node)) {
    // Get full function signature
    const typeParams = node.getTypeParameters().map(tp => tp.getText()).join(", ");
    const params = node.getParameters().map(p => `${p.getName()}: ${p.getType().getText()}`).join(", ");
    const returnType = node.getReturnType().getText();

    const typeParamStr = typeParams ? `<${typeParams}>` : "";
    signature = `${typeParamStr}(${params}) => ${returnType}`;
  } else if (Node.isVariableDeclaration(node)) {
    // Get the type of the variable
    const type = node.getType();
    signature = type.getText();
  } else {
    signature = "unknown";
  }

  return cleanSignature(signature);
}


// Generate GitHub URL for a source location
function generateGitHubUrl(sourceFilePath: string, line: number): string {
  // Extract the module name from the .d.ts path
  // e.g., "/path/to/node_modules/effect/dist/dts/Effect.d.ts" -> "Effect"
  const match = sourceFilePath.match(/\/dist\/dts\/(.+)\.d\.ts$/);
  if (!match) {
    return "";
  }
  const moduleName = match[1];

  // Construct GitHub URL pointing to the source .ts file
  // Effect-TS repo structure: packages/effect/src/{ModuleName}.ts
  return `https://github.com/Effect-TS/effect/blob/main/packages/effect/src/${moduleName}.ts#L${line}`;
}

// Process a source file and extract function entries
function processSourceFile(sourceFile: SourceFile, moduleName: string, packageName: string): FunctionEntry[] {
  const entries: FunctionEntry[] = [];

  console.log(`  Processing: ${sourceFile.getFilePath()}`);

  // Process exported function declarations
  for (const func of sourceFile.getFunctions()) {
    if (!func.isExported()) continue;

    const name = func.getName();
    if (!name) continue;

    const { description, fullDescription, examples, tags } = extractJSDoc(func);
    const signature = extractSignature(func);

    const filePath = sourceFile.getFilePath();
    const lineNumber = func.getStartLineNumber();

    entries.push({
      id: `${moduleName}.${name}`,
      name,
      module: moduleName,
      package: packageName,
      signature,
      description,
      documentation: fullDescription,
      examples,
      tags: tags.category ? [tags.category] : [],
      since: tags.since,
      deprecated: tags.deprecated,
      sourceFile: filePath,
      sourceLine: lineNumber,
      githubUrl: generateGitHubUrl(filePath, lineNumber),
    });
  }

  // Process exported variable declarations (const functions)
  for (const statement of sourceFile.getVariableStatements()) {
    if (!statement.isExported()) continue;

    for (const decl of statement.getDeclarations()) {
      const name = decl.getName();
      const { description, fullDescription, examples, tags } = extractJSDoc(statement);
      const signature = extractSignature(decl);

      const filePath = sourceFile.getFilePath();
      const lineNumber = decl.getStartLineNumber();

      entries.push({
        id: `${moduleName}.${name}`,
        name,
        module: moduleName,
        package: packageName,
        signature,
        description,
        documentation: fullDescription,
        examples,
        tags: tags.category ? [tags.category] : [],
        since: tags.since,
        deprecated: tags.deprecated,
        sourceFile: filePath,
        sourceLine: lineNumber,
        githubUrl: generateGitHubUrl(filePath, lineNumber),
      });
    }
  }

  // Process namespace exports (Effect uses namespaces)
  for (const ns of sourceFile.getModules()) {
    if (!ns.isExported()) continue;

    const nsName = ns.getName().replace(/['"]/g, "");

    // Get exported declarations from namespace
    for (const func of ns.getFunctions()) {
      const name = func.getName();
      if (!name) continue;

      const { description, fullDescription, examples, tags } = extractJSDoc(func);
      const signature = extractSignature(func);

      const filePath = sourceFile.getFilePath();
      const lineNumber = func.getStartLineNumber();

      entries.push({
        id: `${nsName}.${name}`,
        name,
        module: nsName,
        package: packageName,
        signature,
        description,
        documentation: fullDescription,
        examples,
        tags: tags.category ? [tags.category] : [],
        since: tags.since,
        deprecated: tags.deprecated,
        sourceFile: filePath,
        sourceLine: lineNumber,
        githubUrl: generateGitHubUrl(filePath, lineNumber),
      });
    }

    // Variable declarations in namespace
    for (const statement of ns.getVariableStatements()) {
      for (const decl of statement.getDeclarations()) {
        const name = decl.getName();
        const { description, fullDescription, examples, tags } = extractJSDoc(statement);
        const signature = extractSignature(decl);

        const filePath = sourceFile.getFilePath();
        const lineNumber = decl.getStartLineNumber();

        entries.push({
          id: `${nsName}.${name}`,
          name,
          module: nsName,
          package: packageName,
          signature,
          description,
          documentation: fullDescription,
          examples,
          tags: tags.category ? [tags.category] : [],
          since: tags.since,
          deprecated: tags.deprecated,
          sourceFile: filePath,
          sourceLine: lineNumber,
          githubUrl: generateGitHubUrl(filePath, lineNumber),
        });
      }
    }
  }

  return entries;
}

// Load and process all configured packages
async function buildIndex(): Promise<SearchIndex> {
  console.log("Building Hoogle-Effect search index...\n");

  const project = createProject();
  const allFunctions: FunctionEntry[] = [];
  const moduleMap = new Map<string, ModuleEntry>();
  const packageVersions: Record<string, string> = {};

  // Process each package
  for (const pkg of CONFIG.packages) {
    const pkgPath = findPackage(pkg.name);
    console.log(`Found ${pkg.name} at: ${pkgPath}`);

    // Read package.json for version info
    const pkgJson = JSON.parse(
      fs.readFileSync(path.join(pkgPath, "package.json"), "utf-8")
    );
    packageVersions[pkg.name] = pkgJson.version;
    console.log(`${pkg.name} version: ${pkgJson.version}\n`);

    // Add type definitions to project
    for (const moduleName of pkg.modules) {
      const dtsPath = path.join(pkgPath, "dist", "dts", `${moduleName}.d.ts`);

      if (fs.existsSync(dtsPath)) {
        console.log(`Adding: ${pkg.name}/${moduleName}`);
        const sourceFile = project.addSourceFileAtPath(dtsPath);

        const functions = processSourceFile(sourceFile, moduleName, pkg.name);
        allFunctions.push(...functions);

        // Track module info with unique key (package + module)
        const moduleKey = `${pkg.name}/${moduleName}`;
        if (!moduleMap.has(moduleKey)) {
          moduleMap.set(moduleKey, {
            name: moduleName,
            package: pkg.name,
            description: "",
            functionCount: 0,
            path: `${pkg.name}/${moduleName}`,
          });
        }
        const mod = moduleMap.get(moduleKey)!;
        mod.functionCount += functions.length;
      } else {
        console.log(`  Skipping (not found): ${dtsPath}`);
      }
    }
  }

  console.log(`\nIndexed ${allFunctions.length} functions from ${moduleMap.size} modules`);

  return {
    version: "1.0.0",
    buildDate: new Date().toISOString(),
    effectVersion: packageVersions["effect"] ?? "unknown",
    functions: allFunctions,
    modules: Array.from(moduleMap.values()),
  };
}

// Write index to disk
function writeIndex(index: SearchIndex): void {
  const outputDir = CONFIG.outputDir;

  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  // Write main index
  const indexPath = path.join(outputDir, "index.json");
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  console.log(`\nWrote index to: ${indexPath}`);

  // Write individual function files for detailed docs
  const functionsDir = path.join(outputDir, "functions");
  fs.mkdirSync(functionsDir, { recursive: true });

  for (const func of index.functions) {
    const funcPath = path.join(functionsDir, `${func.id}.json`);
    fs.writeFileSync(funcPath, JSON.stringify(func, null, 2));
  }
  console.log(`Wrote ${index.functions.length} function files to: ${functionsDir}`);

  // Write summary stats
  const stats = {
    totalFunctions: index.functions.length,
    totalModules: index.modules.length,
    buildDate: index.buildDate,
    effectVersion: index.effectVersion,
    topModules: index.modules
      .sort((a, b) => b.functionCount - a.functionCount)
      .slice(0, 10)
      .map(m => ({ name: m.name, count: m.functionCount })),
  };

  console.log("\n=== Build Summary ===");
  console.log(`Total functions: ${stats.totalFunctions}`);
  console.log(`Total modules: ${stats.totalModules}`);
  console.log(`Effect version: ${stats.effectVersion}`);
  console.log("\nTop modules by function count:");
  for (const m of stats.topModules) {
    console.log(`  ${m.name}: ${m.count}`);
  }
}

// Main entry point
async function main() {
  try {
    const index = await buildIndex();
    writeIndex(index);
    console.log("\nIndex build complete!");
  } catch (error) {
    console.error("Error building index:", error);
    process.exit(1);
  }
}

main();
