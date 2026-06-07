import type { Payment, PaymentStatus, PaymentAdjustment } from '$lib/types';
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

  getPayableByPurchaseOrderId(purchaseOrderId: number): Payment | undefined {
    return this.payables.find(p => p.relatedId === purchaseOrderId && p.relatedType === 'purchase');
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
      paidAt: null,
      adjustments: []
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
      paidAt: null,
      adjustments: []
    });
  }

  adjustPayableForReturn(purchaseOrderId: number, returnNo: string, amount: number, reason: string, returnId: number) {
    const payment = this.getPayableByPurchaseOrderId(purchaseOrderId);
    if (!payment) return;

    const adjustment: PaymentAdjustment = {
      id: generateId(),
      paymentId: payment.id,
      type: 'return',
      amount,
      reason,
      relatedId: returnId,
      relatedName: returnNo,
      createdAt: new Date().toISOString()
    };

    if (!payment.adjustments) {
      payment.adjustments = [];
    }
    payment.adjustments.push(adjustment);

    payment.totalAmount = Math.max(0, payment.totalAmount - amount);

    if (payment.paidAmount >= payment.totalAmount) {
      payment.status = 'completed';
      payment.paidAmount = payment.totalAmount;
    } else if (payment.paidAmount > 0) {
      payment.status = 'partial';
    } else {
      payment.status = 'pending';
    }
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
