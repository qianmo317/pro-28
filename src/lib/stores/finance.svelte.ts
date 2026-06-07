import type { Payment, PaymentStatus } from '$lib/types';
import { payments as initialPayments } from '$lib/data/payments';
import { generateId } from '$lib/utils/helpers';

class FinanceStore {
  items = $state<Payment[]>([...initialPayments]);

  get payables() {
    return this.items.filter(p => p.type === 'payable');
  }

  get receivables() {
    return this.items.filter(p => p.type === 'receivable');
  }

  get totalPayable() {
    return this.payables.reduce((sum, p) => sum + p.totalAmount - p.paidAmount, 0);
  }

  get totalReceivable() {
    return this.receivables.reduce((sum, p) => sum + p.totalAmount - p.paidAmount, 0);
  }

  get pendingPayables() {
    return this.payables.filter(p => p.status !== 'completed');
  }

  get pendingReceivables() {
    return this.receivables.filter(p => p.status !== 'completed');
  }

  addPayable(relatedId: number, relatedName: string, orderNo: string, totalAmount: number) {
    this.items.push({
      id: generateId(),
      type: 'payable',
      relatedId,
      relatedType: 'purchase',
      relatedName,
      totalAmount,
      paidAmount: 0,
      status: 'pending',
      method: '',
      createdAt: new Date().toISOString(),
      paidAt: null
    });
  }

  addReceivable(relatedId: number, relatedName: string, orderNo: string, totalAmount: number) {
    this.items.push({
      id: generateId(),
      type: 'receivable',
      relatedId,
      relatedType: 'sales',
      relatedName,
      totalAmount,
      paidAmount: 0,
      status: 'pending',
      method: '',
      createdAt: new Date().toISOString(),
      paidAt: null
    });
  }

  makePayment(id: number, amount: number, method: string) {
    const payment = this.items.find(p => p.id === id);
    if (!payment) return;
    payment.paidAmount += amount;
    payment.method = method;
    payment.paidAt = new Date().toISOString();
    if (payment.paidAmount >= payment.totalAmount) {
      payment.status = 'completed';
      payment.paidAmount = payment.totalAmount;
    } else {
      payment.status = 'partial';
    }
  }

  search(query: string, type?: 'payable' | 'receivable'): Payment[] {
    let result = this.items;
    if (type) result = result.filter(p => p.type === type);
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(p => p.relatedName.toLowerCase().includes(q));
    }
    return result;
  }
}

export const financeStore = new FinanceStore();
