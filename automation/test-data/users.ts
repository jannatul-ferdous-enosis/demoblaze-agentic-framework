/**
 * Test data factories for users and orders.
 *
 * Static fixtures live here for readability; dynamic data is generated
 * via the factories in `utils/testDataFactory.ts`.
 */

import type { User, OrderData } from '../types/domain';

export const STATIC_USERS: Record<string, User> = {
  // NOTE: these are for tests that need a known user. Most tests should
  // use the dynamic factory to avoid collisions across runs.
  smokeUser: {
    username: 'qa_smoke_user',
    password: 'P@ssw0rd!qa',
  },
};

export const STATIC_ORDERS: Record<string, OrderData> = {
  validOrder: {
    name: 'QA Tester',
    country: 'USA',
    city: 'Austin',
    creditCard: '4111111111111111',
    month: '12',
    year: String(new Date().getFullYear() + 1),
  },
};
