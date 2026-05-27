import { AsyncLocalStorage } from 'async_hooks';
import type { EntityManager } from 'typeorm';

export const transactionContext = new AsyncLocalStorage<EntityManager>();
