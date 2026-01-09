#!/usr/bin/env tsx
/**
 * Build script for @hoogle-effect/data
 * Uses the indexer from @hoogle-effect/api to generate the search index
 */

import * as path from "node:path";
import { buildIndex, writeIndex } from "@hoogle-effect/api";

const OUTPUT_DIR = path.resolve(import.meta.dirname, "../generated");

async function main() {
  try {
    const index = await buildIndex();
    writeIndex(index, OUTPUT_DIR);
    console.log("\nIndex build complete!");
  } catch (error) {
    console.error("Error building index:", error);
    process.exit(1);
  }
}

main();
