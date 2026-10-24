import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { getDatabase, ensureDatabaseInitialized, runMigrations, PaymentSessionRepository, ObservationRepository } from '@vawpay/db';
import { AttributionEngine } from '@vawpay/core';
import { ObserverPollerService } from '../services/observer-poller.service.js';

describe('ObserverPollerService Hardening & Concurrency Protection', () => {
  let db;
  let eventEmitter;
  let sessionRepo;
  let obsRepo;
  let attributionEngine;
  let pollerService;

  beforeEach(() => {
    db = getDatabase(':memory:');
    ensureDatabaseInitialized(db);
    runMigrations(db);

    eventEmitter = new EventEmitter();
    sessionRepo = new PaymentSessionRepository(db);
    obsRepo = new ObservationRepository(db);
    attributionEngine = new AttributionEngine({
      sessionRepo,
      obsRepo,
      eventEmitter
    });
  });

  afterEach(() => {
    if (pollerService) {
      pollerService.destroy();
      pollerService = null;
    }
  });

  test('Requirement 5: Daemon automatically idles when no active or processing sessions exist', async () => {
    pollerService = new ObserverPollerService({
      db,
      sessionRepo,
      obsRepo,
      attributionEngine,
      eventEmitter,
      pollIntervalMs: 1000,
      minSweepCooldownMs: 2000,
      autoStart: false
    });

    // Run poll cycle when DB is completely empty of active sessions
    await pollerService.pollCycle();

    assert.equal(pollerService.isIdle, true, 'Poller must be idle when 0 active sessions exist');
    assert.equal(pollerService.isSmsSweepInFlight, false);
    assert.equal(pollerService.isGmailSweepInFlight, false);
    assert.equal(pollerService.lastSmsSweepTime, 0, 'No SMS sweep should be dispatched when idle');
    assert.equal(pollerService.lastGmailSweepTime, 0, 'No Gmail sweep should be dispatched when idle');
  });

  test('Requirement 3: Enforces minimum cooldown between consecutive sweeps and drops redundant in-flight calls', async () => {
    pollerService = new ObserverPollerService({
      db,
      sessionRepo,
      obsRepo,
      attributionEngine,
      eventEmitter,
      pollIntervalMs: 1000,
      minSweepCooldownMs: 1500, // 1.5s cooldown
      autoStart: false
    });

    // First sweep attempt: should dispatch (returns a promise)
    const sweep1Promise = pollerService.sweepSmsObserver();
    assert.equal(pollerService.isSmsSweepInFlight, true, 'In-flight flag must be true during execution');

    // Immediate second sweep while in-flight: MUST BE DROPPED
    const sweep2 = await pollerService.sweepSmsObserver();
    assert.equal(sweep2, false, 'Redundant in-flight sweep must return false and be dropped');

    await sweep1Promise;
    assert.equal(pollerService.isSmsSweepInFlight, false, 'In-flight flag must reset after completion');

    // Third sweep immediately after, within the 1.5s cooldown window: MUST BE DROPPED
    const sweep3 = await pollerService.sweepSmsObserver();
    assert.equal(sweep3, false, 'Sweep within 1.5s cooldown window must be rejected');

    // Same behavior for Gmail observer
    const gmail1Promise = pollerService.sweepGmailObserver();
    assert.equal(pollerService.isGmailSweepInFlight, true);
    const gmail2 = await pollerService.sweepGmailObserver();
    assert.equal(gmail2, false, 'Concurrent in-flight Gmail sweep must be dropped');
    await gmail1Promise;
    const gmail3 = await pollerService.sweepGmailObserver();
    assert.equal(gmail3, false, 'Gmail sweep within cooldown window must be dropped');
  });

  test('Requirement 4: Mutex and deduplication prevent concurrent attribution and SQLite contention', async () => {
    pollerService = new ObserverPollerService({
      db,
      sessionRepo,
      obsRepo,
      attributionEngine,
      eventEmitter,
      pollIntervalMs: 1000,
      minSweepCooldownMs: 2000,
      autoStart: false
    });

    // Mock active sessions sharing the same receiving account ID
    const activeSessions = [
      { id: 'sess-1', receiving_account_id: 'acc-duplicate-1', amount_paise: 50000, status: 'PROCESSING' },
      { id: 'sess-2', receiving_account_id: 'acc-duplicate-1', amount_paise: 50000, status: 'PROCESSING' },
      { id: 'sess-3', receiving_account_id: 'acc-duplicate-1', amount_paise: 50000, status: 'PROCESSING' }
    ];

    let queryCount = 0;
    const originalFindUnattributed = obsRepo.findUnattributed.bind(obsRepo);
    obsRepo.findUnattributed = (accId) => {
      queryCount++;
      return originalFindUnattributed(accId);
    };

    await pollerService.processPendingAttributions(activeSessions);

    // Invariant: Account IDs are deduplicated so findUnattributed is called exactly ONCE per account!
    assert.equal(queryCount, 1, 'findUnattributed should only be queried once per distinct receiving account');
    assert.equal(pollerService.isAttributionInProgress, false);
  });

  test('Reactive wake-up on SESSION.PROCESSING and SESSION.ACTIVATED without waiting for timer interval', async () => {
    pollerService = new ObserverPollerService({
      db,
      sessionRepo,
      obsRepo,
      attributionEngine,
      eventEmitter,
      pollIntervalMs: 60000, // 60s slow timer
      minSweepCooldownMs: 2000,
      autoStart: true
    });

    let expeditedCalled = false;
    pollerService.triggerExpeditedSweep = () => {
      expeditedCalled = true;
    };

    // Customer clicks "I have paid" -> SESSION.PROCESSING event emitted
    eventEmitter.emit('SESSION.PROCESSING', {
      sessionId: 'sess-active-1',
      receivingAccountId: 'acc-1'
    });

    assert.equal(expeditedCalled, true, 'SESSION.PROCESSING must wake up poller immediately');

    expeditedCalled = false;
    // New session activated -> SESSION.ACTIVATED event emitted
    eventEmitter.emit('SESSION.ACTIVATED', {
      sessionId: 'sess-active-2',
      receivingAccountId: 'acc-1'
    });

    assert.equal(expeditedCalled, true, 'SESSION.ACTIVATED must wake up poller immediately');
  });

  test('Clean lifecycle destruction removes event listeners and clears intervals', () => {
    pollerService = new ObserverPollerService({
      db,
      sessionRepo,
      obsRepo,
      attributionEngine,
      eventEmitter,
      pollIntervalMs: 1000,
      autoStart: true
    });

    assert.equal(pollerService.isRunning, true);
    assert.notEqual(pollerService._timer, null);

    const listenerCountBefore = eventEmitter.listenerCount('SESSION.PROCESSING');
    assert.ok(listenerCountBefore >= 1);

    pollerService.destroy();

    assert.equal(pollerService.isRunning, false);
    assert.equal(pollerService._timer, null);
    assert.equal(eventEmitter.listenerCount('SESSION.PROCESSING'), listenerCountBefore - 1);
  });
});
