import { createSeedState } from './seed.js';

export function createStore(seed = createSeedState()) {
  return structuredClone(seed);
}

export const store = createStore();
