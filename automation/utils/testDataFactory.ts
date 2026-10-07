/**
 * Dynamic test data factory.
 *
 * Generates unique usernames per call so tests don't collide on the
 * shared Demoblaze API.
 */

import type { User, OrderData } from '../types/domain';
import { generateUsername } from './apiClient';

export function createUser(opts?: { prefix?: string; password?: string }): User {
  return {
    username: generateUsername(opts?.prefix ?? 'qa'),
    password: opts?.password ?? 'P@ssw0rd!qa',
  };
}

export function createOrder(overrides: Partial<OrderData> = {}): OrderData {
  return {
    name: 'QA Tester',
    country: 'USA',
    city: 'Austin',
    creditCard: '4111111111111111',
    month: '12',
    year: String(new Date().getFullYear() + 1),
    ...overrides,
  };
}
