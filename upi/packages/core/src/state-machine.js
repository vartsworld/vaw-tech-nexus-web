import { isValidTransition, isTerminalStatus, VALID_TRANSITIONS } from '@vawpay/common';

/**
 * The transition graph and helpers live in `@vawpay/common` so the database layer can enforce
 * them too (`@vawpay/db` cannot import `@vawpay/core`). They are re-exported here to keep
 * `@vawpay/core` the canonical import site for engine consumers.
 */
export { VALID_TRANSITIONS, isValidTransition, isTerminalStatus };

/**
 * Asserts a valid transition, throwing a detailed domain error if violated.
 * @param {string} currentState
 * @param {string} nextState
 */
export function assertValidTransition(currentState, nextState) {
  if (!isValidTransition(currentState, nextState)) {
    throw new Error(
      `Illegal payment state transition: Cannot move from '${currentState}' to '${nextState}'.`
    );
  }
}

/**
 * Converts internal payment status to the public contract outcome.
 * Throws if the status is not terminal.
 * @param {string} status
 * @returns {string}
 */
export function toPublicOutcome(status) {
  switch (status) {
    case 'SUCCESS':
      return 'SUCCESS';
    case 'FAILED':
      return 'FAILED';
    case 'EXPIRED':
      return 'EXPIRED';
    case 'CANCELLED':
      return 'CANCELLED';
    default:
      throw new Error(`Status '${status}' is an internal non-terminal state and cannot be mapped to a public outcome.`);
  }
}