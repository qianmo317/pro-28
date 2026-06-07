import type { Payment } from '$lib/types';

export const payments: Payment[] = [
  { id: 1, type: 'payable', relatedId: 1, relatedType: 'purchase', relatedName: 'PO20260501001', totalAmount: 19000, paidAmount: 19000, status: 'completed', method: '银行转账', createdAt: '2026-05-01T09:00:00', paidAt: '2026-05-02T14:30:00' },
  { id: 2, type: 'receivable', relatedId: 1, relatedType: 'sales', relatedName: 'SO20260502001', totalAmount: 15855, paidAmount: 15855, status: 'completed', method: '银行转账', createdAt: '2026-05-02T10:00:00', paidAt: '2026-05-03T15:00:00' },
  { id: 3, type: 'payable', relatedId: 2, relatedType: 'purchase', relatedName: 'PO20260510002', totalAmount: 20300, paidAmount: 10000, status: 'partial', method: '银行转账', createdAt: '2026-05-10T10:30:00', paidAt: '2026-05-11T09:00:00' },
  { id: 4, type: 'receivable', relatedId: 2, relatedType: 'sales', relatedName: 'SO20260512002', totalAmount: 12120, paidAmount: 0, status: 'pending', method: '', createdAt: '2026-05-12T09:30:00', paidAt: null },
  { id: 5, type: 'payable', relatedId: 3, relatedType: 'purchase', relatedName: 'PO20260520003', totalAmount: 5700, paidAmount: 0, status: 'pending', method: '', createdAt: '2026-05-20T15:00:00', paidAt: null },
  { id: 6, type: 'receivable', relatedId: 3, relatedType: 'sales', relatedName: 'SO20260522003', totalAmount: 20570, paidAmount: 5000, status: 'partial', method: '现金', createdAt: '2026-05-22T11:00:00', paidAt: '2026-05-23T10:00:00' },
  { id: 7, type: 'payable', relatedId: 4, relatedType: 'purchase', relatedName: 'PO20260601004', totalAmount: 15900, paidAmount: 15900, status: 'completed', method: '银行转账', createdAt: '2026-06-01T08:00:00', paidAt: '2026-06-02T16:00:00' },
  { id: 8, type: 'receivable', relatedId: 4, relatedType: 'sales', relatedName: 'SO20260601004', totalAmount: 8470, paidAmount: 8470, status: 'completed', method: '银行转账', createdAt: '2026-06-01T14:00:00', paidAt: '2026-06-02T10:00:00' },
  { id: 9, type: 'receivable', relatedId: 5, relatedType: 'sales', relatedName: 'SO20260603005', totalAmount: 6495, paidAmount: 0, status: 'pending', method: '', createdAt: '2026-06-03T16:00:00', paidAt: null }
];
