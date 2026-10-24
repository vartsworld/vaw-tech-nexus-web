import { PaymentStatus } from './enums.js';

/**
 * Allowed payment session state transitions.
 *
 * This lives in `@vawpay/common` rather than `@vawpay/core` because the database layer
 * (`@vawpay/db`) must enforce it too, and `@vawpay/db` cannot depend on `@vawpay/core`
 * (which already depends on it). `@vawpay/core` re-exports these helpers unchanged.
 */
export const VALID_TRANSITIONS = Object.freeze({
  // EXPIRED is reachable from every non-terminal state: it is the universal "gave up"
  // outcome (timer elapsed, or an administrator clearing the queue), so it must never be
  // blocked just because the session had not reached the next stage yet.
  [PaymentStatus.INITIATED]: [
    PaymentStatus.ACTIVE,
    PaymentStatus.QUEUED,
    PaymentStatus.CANCELLED,
    PaymentStatus.EXPIRED,
    // COD: placing a Cash-on-Delivery order is a business success even before any UPI
    // slot is acquired, so an order that was never activated still terminates as SUCCESS.
    PaymentStatus.SUCCESS
  ],
  [PaymentStatus.QUEUED]: [
    PaymentStatus.ACTIVE,
    PaymentStatus.CANCELLED,
    PaymentStatus.EXPIRED,
    // COD: a queued UPI order can be converted to a placed COD order.
    PaymentStatus.SUCCESS
  ],
  [PaymentStatus.ACTIVE]: [
    PaymentStatus.PROCESSING,
    // Tier-1 attribution settles a still-ACTIVE session as soon as the bank notification is
    // attributed, without waiting for the customer to press "I have paid". A bank-confirmed
    // credit is terminal regardless of whether the customer pressed the button.
    PaymentStatus.SUCCESS,
    PaymentStatus.FAILED,
    PaymentStatus.EXPIRED,
    PaymentStatus.CANCELLED
  ],
  [PaymentStatus.PROCESSING]: [
    PaymentStatus.SUCCESS,
    PaymentStatus.FAILED,
    PaymentStatus.EXPIRED
  ],
  [PaymentStatus.SUCCESS]: [],
  [PaymentStatus.FAILED]: [],
  [PaymentStatus.EXPIRED]: [],
  [PaymentStatus.CANCELLED]: []
});

/** States that can never change again. */
export const TERMINAL_STATES = Object.freeze([
  PaymentStatus.SUCCESS,
  PaymentStatus.FAILED,
  PaymentStatus.EXPIRED,
  PaymentStatus.CANCELLED
]);

/** States that occupy a merchant's single UPI concurrency slot. */
export const SLOT_OCCUPYING_STATES = Object.freeze([
  PaymentStatus.ACTIVE,
  PaymentStatus.PROCESSING
]);

/**
 * Validates whether a state transition is permitted.
 * @param {string} currentState
 * @param {string} nextState
 * @returns {boolean}
 */
export function isValidTransition(currentState, nextState) {
  const allowed = VALID_TRANSITIONS[currentState];
  if (!allowed) return false;
  return allowed.includes(nextState);
}

/** True when the state is a final, terminal outcome. */
export function isTerminalStatus(status) {
  return TERMINAL_STATES.includes(status);
}

/** True when the state holds a merchant concurrency slot. */
export function holdsSlot(status) {
  return SLOT_OCCUPYING_STATES.includes(status);
}