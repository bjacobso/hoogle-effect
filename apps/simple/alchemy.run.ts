/**
 * Alchemy Infrastructure-as-Code
 * Defines Cloudflare Workers deployment configuration
 */

import alchemy from 'alchemy';
import { Worker } from 'alchemy/cloudflare';

const stage = process.env.STAGE || 'dev';

const app = await alchemy('hoogle-effect', {
  stage,
  phase: process.argv.includes('--destroy') ? 'destroy' : 'up',
});

// Define the Worker
const worker = await Worker('hoogle-effect-worker', {
  name: stage === 'prod' ? 'hoogle-effect' : `hoogle-effect-${stage}`,
  entrypoint: './src/index.ts',
  compatibilityDate: '2024-12-01',
  compatibilityFlags: ['nodejs_compat'],

  // Static assets
  assets: {
    directory: './src/static',
  },

  // Future: Durable Objects
  // durableObjects: {
  //   SEARCH_INDEX: {
  //     className: 'SearchIndexDO',
  //   },
  // },
});

console.log(`Worker deployed: ${worker.url}`);

await app.finalize();
