// Explicit donor-facing allowlist: never return gateway credentials.
const BANK_KEYS = new Set(['bank_name', 'account_no', 'account_name', 'account_holder', 'account_holder_name', 'bank_branch', 'bank_code', 'swift_code', 'instructions']);

export function storedQrKey(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const key = value.trim();
  // Uploads store a filename. Do not fetch arbitrary URLs or persist blob previews.
  return key && !/[\\/:\u0000]/.test(key) && !key.includes('..') && /\.(png|jpe?g|webp|gif)$/i.test(key) ? key : null;
}

export function publicPaymentMethods(configs: any[], entityType: string, entityId: number) {
  const groups = new Map<number, any[]>();
  for (const config of configs) {
    const p = config.paymentplatform;
    if (p?.status !== 'active' || p.category !== 'manual' || !config.paymentfield) continue;
    groups.set(p.id, [...(groups.get(p.id) ?? []), config]);
  }
  return [...groups.values()].flatMap(rows => {
    const p = rows[0].paymentplatform;
    const definitions = p.paymentfields ?? [];
    if (definitions.some((f: any) => f.required && !rows.some(r => r.paymentfield.id === f.id && String(r.value ?? '').trim()))) return [];
    const qr = rows.find(r => r.paymentfield.fieldtype === 'image' && storedQrKey(r.value));
    const fields = rows.filter(r => BANK_KEYS.has(r.paymentfield.key) && ['text', 'textarea'].includes(r.paymentfield.fieldtype) && String(r.value ?? '').trim())
      .map(r => ({ key: r.paymentfield.key, label: r.paymentfield.label, fieldtype: r.paymentfield.fieldtype, value: r.value }));
    const hasBank = ['bank_name', 'account_no'].every(key => fields.some(f => f.key === key));
    const isQr = /qr/i.test(p.code) || (!hasBank && !!qr);
    if (isQr && !qr || !isQr && !hasBank) return [];
    return [{ code: p.code, name: p.name, kind: isQr ? 'qr' : 'bank', fields,
      qrUrl: isQr ? `/api/payment-display/${entityType}/${entityId}/qr/${qr.id}` : null }];
  }).sort((a, b) => Number(a.kind !== 'bank') - Number(b.kind !== 'bank'));
}
