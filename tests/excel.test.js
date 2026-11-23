import test from 'node:test';
import assert from 'node:assert/strict';
import { monthKey, monthLabel, formatDate } from '../src/utils/date.js';

test('util bulan & tanggal', () => {
  assert.equal(monthKey('2026-11-19'), '2026-11');
  assert.equal(monthLabel('2026-11'), 'November 2026');
  assert.equal(formatDate('2026-11-19'), '19/11/2026');
});
