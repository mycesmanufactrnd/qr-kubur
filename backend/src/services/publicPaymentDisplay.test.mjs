import test from 'node:test';
import assert from 'node:assert/strict';
import { publicPaymentMethods, storedQrKey } from './publicPaymentDisplay.ts';

const field = (id, key, fieldtype = 'text', required = true) => ({ id, key, label: key, fieldtype, required });
const bankFields = [field(1, 'bank_name'), field(2, 'account_no')];
const qrFields = [field(3, 'qr_image', 'image')];
const platform = (id, code, paymentfields) => ({ id, code, name: code, category: 'manual', status: 'active', paymentfields });
const bank = platform(1, 'FPX', bankFields);
const qr = platform(2, 'QR', qrFields);
const rows = [
  { id: 3, paymentplatform: qr, paymentfield: qrFields[0], value: 'uploaded-qr.png' },
  { id: 1, paymentplatform: bank, paymentfield: bankFields[0], value: 'Maybank' },
  { id: 2, paymentplatform: bank, paymentfield: bankFields[1], value: '12345678' },
];
test('bank is first; QR URL is scoped to current recipient', () => {
  const methods = publicPaymentMethods(rows, 'organisation', 7);
  assert.deepEqual(methods.map(m => m.kind), ['bank', 'qr']);
  assert.equal(methods[0].fields[1].value, '12345678');
  assert.equal(methods[1].qrUrl, '/api/payment-display/organisation/7/qr/3');
  assert.notEqual(methods[1].qrUrl, publicPaymentMethods(rows, 'organisation', 8)[1].qrUrl);
});
test('QR fallback; incomplete and inactive methods hidden', () => {
  assert.deepEqual(publicPaymentMethods(rows.slice(0, 2), 'organisation', 1).map(m => m.kind), ['qr']);
  assert.deepEqual(publicPaymentMethods([{ ...rows[0], paymentplatform: { ...qr, status: 'inactive' } }], 'organisation', 1), []);
  assert.deepEqual(publicPaymentMethods([{ ...rows[0], value: '' }], 'organisation', 1), []);
});
test('passwords, unknown fields and gateway credentials never returned', () => {
  const secret = { id: 4, paymentplatform: bank, paymentfield: field(4, 'api_key', 'password', false), value: 'DO_NOT_EXPOSE' };
  const methods = publicPaymentMethods([...rows, secret, { ...secret, paymentfield: field(5, 'secret', 'text', false) }], 'organisation', 1);
  assert.ok(!JSON.stringify(methods).includes('DO_NOT_EXPOSE'));
  assert.deepEqual(publicPaymentMethods([{ ...secret, paymentplatform: { ...bank, category: 'gateway' } }], 'organisation', 1), []);
});
test('temporary URLs, remote fetches and traversal cannot become public QR images', () => {
  for (const value of ['blob:preview', 'data:image/png;base64,123', 'https://example.com/qr.png', '../qr.png', 'folder/qr.png', 'qr.svg']) {
    assert.equal(storedQrKey(value), null);
    assert.deepEqual(publicPaymentMethods([{ ...rows[0], value }], 'organisation', 1), []);
  }
});
