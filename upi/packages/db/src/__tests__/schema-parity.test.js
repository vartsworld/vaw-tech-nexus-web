import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Database } from '../database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Database Schema Parity & Integrity (Postgres vs SQLite) (#13)', () => {
  const pgSchemaPath = path.join(__dirname, '..', 'schema.sql');
  const sqliteSchemaPath = path.join(__dirname, '..', 'sqlite-schema.sql');

  const pgSchema = fs.readFileSync(pgSchemaPath, 'utf8');
  const sqliteSchema = fs.readFileSync(sqliteSchemaPath, 'utf8');

  function extractTableNames(sql) {
    const regex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)/gi;
    const tables = [];
    let match;
    while ((match = regex.exec(sql)) !== null) {
      tables.push(match[1].toLowerCase());
    }
    return tables;
  }

  function extractIndexNames(sql) {
    const regex = /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)/gi;
    const indexes = [];
    let match;
    while ((match = regex.exec(sql)) !== null) {
      indexes.push(match[1].toLowerCase());
    }
    return indexes;
  }

  test('PostgreSQL and SQLite schemas define identical set of tables', () => {
    const pgTables = extractTableNames(pgSchema);
    const sqliteTables = extractTableNames(sqliteSchema);

    assert.deepEqual(pgTables.sort(), sqliteTables.sort(), 'Tables in schema.sql and sqlite-schema.sql must match 1:1');
    assert.ok(pgTables.length >= 10, 'Must have at least 10 core tables defined');
  });

  test('devices table is defined before payment_sessions in both schemas to prevent foreign key errors', () => {
    const pgTables = extractTableNames(pgSchema);
    const sqliteTables = extractTableNames(sqliteSchema);

    const pgDevicesIdx = pgTables.indexOf('devices');
    const pgSessionsIdx = pgTables.indexOf('payment_sessions');
    assert.ok(pgDevicesIdx !== -1, 'devices table must exist in schema.sql');
    assert.ok(pgSessionsIdx !== -1, 'payment_sessions table must exist in schema.sql');
    assert.ok(pgDevicesIdx < pgSessionsIdx, 'devices must be declared before payment_sessions in schema.sql');

    const sqliteDevicesIdx = sqliteTables.indexOf('devices');
    const sqliteSessionsIdx = sqliteTables.indexOf('payment_sessions');
    assert.ok(sqliteDevicesIdx < sqliteSessionsIdx, 'devices must be declared before payment_sessions in sqlite-schema.sql');
  });

  test('PostgreSQL and SQLite schemas define identical core indexes', () => {
    const pgIndexes = extractIndexNames(pgSchema);
    const sqliteIndexes = extractIndexNames(sqliteSchema);

    const requiredIndexes = [
      'idx_single_active_vpa_per_merchant',
      'idx_customers_email',
      'idx_customers_mobile',
      'idx_customer_sessions_token',
      'idx_customer_sessions_customer',
      'idx_devices_customer',
      'idx_devices_fingerprint',
      'idx_devices_token',
      'idx_payment_sessions_active',
      'idx_payment_sessions_order',
      'idx_payment_sessions_device',
      'idx_single_active_session_per_order',
      'idx_one_slot_per_receiving_account',
      'idx_payment_sessions_attributed_obs',
      'idx_observations_match',
      'idx_observations_bank_ref',
      'idx_observations_unique_attributed_bank_ref',
      'idx_observations_fingerprint',
      'idx_observations_attributed_payment',
      'idx_webhook_deliveries_retry',
      'idx_support_tickets_merchant',
      'idx_support_tickets_customer',
      'idx_ticket_messages_ticket',
      'idx_audit_logs_merchant',
      'idx_audit_logs_entity',
      'idx_security_events_customer',
      'idx_security_events_session',
      'idx_security_events_type'
    ];

    for (const idx of requiredIndexes) {
      assert.ok(pgIndexes.includes(idx), `schema.sql missing index: ${idx}`);
      assert.ok(sqliteIndexes.includes(idx), `sqlite-schema.sql missing index: ${idx}`);
    }
  });

  test('customers table has required security and fraud tracking columns in both schemas', () => {
    const requiredCustomerCols = [
      'otp_attempts',
      'ban_reason',
      'banned_at',
      'unbanned_at',
      'last_device'
    ];

    for (const col of requiredCustomerCols) {
      assert.ok(pgSchema.includes(col), `schema.sql customers table missing column: ${col}`);
      assert.ok(sqliteSchema.includes(col), `sqlite-schema.sql customers table missing column: ${col}`);
    }
  });

  test('sqlite-schema.sql executes cleanly and creates complete schema on fresh database', () => {
    const db = new Database({ inMemory: true, autoMigrate: false });
    try {
      db.exec(sqliteSchema);
      const tables = db.query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
      const tableNames = tables.map(t => t.name);
      assert.ok(tableNames.includes('merchants'));
      assert.ok(tableNames.includes('payment_receiving_accounts'));
      assert.ok(tableNames.includes('customers'));
      assert.ok(tableNames.includes('devices'));
      assert.ok(tableNames.includes('payment_sessions'));
      assert.ok(tableNames.includes('payment_observations'));
      assert.ok(tableNames.includes('webhook_deliveries'));
      assert.ok(tableNames.includes('support_tickets'));
      assert.ok(tableNames.includes('audit_logs'));
      assert.ok(tableNames.includes('security_events'));
    } finally {
      db.close();
    }
  });
});
