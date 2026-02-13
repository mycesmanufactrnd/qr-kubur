import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PAYMENT_TYPE = ['registration', 'yearly'];
const PAYMENT_METHODS = ['cash', 'fpx', 'bank_transfer', 'cheque', 'other'];

export default function PaymentForm({ memberId, onSubmit, onCancel }) {
  const currentYear = new Date().getFullYear();
  
  const [formData, setFormData] = useState({
    member: memberId ? { id: Number(memberId) } : null,
    amount: '',
    paymenttype: 'yearly',
    paymentmethod: 'cash',
    referenceno: '',
    paidat: new Date().toISOString().split('T')[0],
    coversfromyear: currentYear,
    yearstopay: 1,
    notes: ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const fromYear = parseInt(formData.coversfromyear);
    const yearsToPay = parseInt(formData.yearstopay) || 1;
    const toYear = fromYear + yearsToPay - 1;
    
    const dataToSubmit = {
      member: formData.member,
      amount: parseFloat(formData.amount) || 0,
      paymenttype: formData.paymenttype,
      paymentmethod: formData.paymentmethod,
      referenceno: formData.referenceno || null,
      paidat: formData.paidat,
      coversfromyear: fromYear,
      coverstoyear: toYear,
      notes: formData.notes
    };
    
    onSubmit(dataToSubmit);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Amount (RM) *</Label>
          <Input
            required
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) => handleChange('amount', e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label>Payment Date *</Label>
          <Input
            required
            type="date"
            value={formData.paidat}
            onChange={(e) => handleChange('paidat', e.target.value)}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Payment Type *</Label>
          <Select value={formData.paymenttype} onValueChange={(v) => handleChange('paymenttype', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_TYPE.map(type => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Payment Method *</Label>
          <Select value={formData.paymentmethod} onValueChange={(v) => handleChange('paymentmethod', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map(method => (
                <SelectItem key={method} value={method}>
                  {method === 'fpx' ? 'FPX' : method.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Starting Year *</Label>
          <Input
            required
            type="number"
            min={currentYear}
            value={formData.coversfromyear}
            onChange={(e) => handleChange('coversfromyear', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>How Many Years *</Label>
          <Input
            required
            type="number"
            min="1"
            value={formData.yearstopay}
            onChange={(e) => handleChange('yearstopay', e.target.value)}
            placeholder="e.g., 1, 2, 5"
          />
          <p className="text-xs text-slate-500">Number of years to pay for</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Reference Number</Label>
        <Input
          value={formData.referenceno}
          onChange={(e) => handleChange('referenceno', e.target.value)}
          placeholder="Optional - for bank transfers, FPX, etc."
        />
        <p className="text-xs text-slate-500">Leave empty for cash payments</p>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          rows={3}
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Additional payment notes..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-indigo-500 hover:bg-indigo-600">
          Add Payment
        </Button>
      </div>
    </form>
  );
}