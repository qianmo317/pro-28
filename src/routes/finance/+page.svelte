<script lang="ts">
  import { financeStore } from '$lib/stores/finance.svelte';
  import { toastStore } from '$lib/stores/toast.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import StatCard from '$lib/components/StatCard.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import { formatCurrency, formatDate } from '$lib/utils/format';
  import { DollarSign, TrendingDown, TrendingUp, Clock, CreditCard } from 'lucide-svelte';
  import type { Payment } from '$lib/types';

  let activeTab = $state<'payable' | 'receivable'>('payable');
  let showPayModal = $state(false);
  let selectedPayment = $state<Payment | null>(null);
  let payAmount = $state(0);
  let payMethod = $state('银行转账');
  let currentPage = $state(1);
  const PAGE_SIZE = 10;

  const totalPayable = $derived(financeStore.totalPayable);
  const totalReceivable = $derived(financeStore.totalReceivable);
  const pendingPayableCount = $derived(financeStore.pendingPayables.length);
  const pendingReceivableCount = $derived(financeStore.pendingReceivables.length);

  const currentList = $derived(activeTab === 'payable' ? financeStore.payables : financeStore.receivables);
  const pagedList = $derived(currentList.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE));

  function openPayModal(payment: Payment) {
    selectedPayment = payment;
    payAmount = payment.totalAmount - payment.paidAmount;
    payMethod = '银行转账';
    showPayModal = true;
  }

  function handlePay() {
    if (!selectedPayment || payAmount <= 0) {
      toastStore.error('请输入有效金额');
      return;
    }
    financeStore.makePayment(selectedPayment.id, payAmount, payMethod);
    toastStore.success(activeTab === 'payable' ? '付款成功' : '收款成功');
    showPayModal = false;
  }
</script>

<svelte:head>
  <title>财务对账 - 进销存管理系统</title>
</svelte:head>

<PageHeader title="财务对账" subtitle="管理应收应付账款" />

<div class="space-y-6">
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <StatCard title="应付总额" value={formatCurrency(totalPayable)} color="red">
      {#snippet icon()}<TrendingDown class="w-5 h-5" />{/snippet}
    </StatCard>
    <StatCard title="应收总额" value={formatCurrency(totalReceivable)} color="blue">
      {#snippet icon()}<TrendingUp class="w-5 h-5" />{/snippet}
    </StatCard>
    <StatCard title="待付款" value={pendingPayableCount} color="amber">
      {#snippet icon()}<Clock class="w-5 h-5" />{/snippet}
    </StatCard>
    <StatCard title="待收款" value={pendingReceivableCount} color="green">
      {#snippet icon()}<DollarSign class="w-5 h-5" />{/snippet}
    </StatCard>
  </div>

  <div class="flex gap-2">
    <button
      onclick={() => { activeTab = 'payable'; currentPage = 1; }}
      class="px-4 py-2 text-sm font-medium rounded-lg transition-colors {activeTab === 'payable' ? 'bg-red-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}"
    >
      应付账款
    </button>
    <button
      onclick={() => { activeTab = 'receivable'; currentPage = 1; }}
      class="px-4 py-2 text-sm font-medium rounded-lg transition-colors {activeTab === 'receivable' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}"
    >
      应收账款
    </button>
  </div>

  <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200">
            <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">关联单号</th>
            <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">类型</th>
            <th class="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">总金额</th>
            <th class="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">已付金额</th>
            <th class="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">未付金额</th>
            <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">状态</th>
            <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3 w-24">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          {#each pagedList as payment (payment.id)}
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="px-4 py-3 text-sm font-medium text-brand-600">{payment.relatedName}</td>
              <td class="px-4 py-3 text-sm text-slate-600">{payment.relatedType === 'purchase' ? '采购' : '销售'}</td>
              <td class="px-4 py-3 text-sm text-right text-slate-800">{formatCurrency(payment.totalAmount)}</td>
              <td class="px-4 py-3 text-sm text-right text-emerald-600">{formatCurrency(payment.paidAmount)}</td>
              <td class="px-4 py-3 text-sm text-right font-medium {payment.totalAmount - payment.paidAmount > 0 ? 'text-red-600' : 'text-slate-400'}">
                {formatCurrency(payment.totalAmount - payment.paidAmount)}
              </td>
              <td class="px-4 py-3 text-sm"><StatusBadge status={payment.status} /></td>
              <td class="px-4 py-3 text-sm">
                {#if payment.status !== 'completed'}
                  <button onclick={() => openPayModal(payment)} class="flex items-center gap-1 text-brand-600 hover:text-brand-700">
                    <CreditCard class="w-4 h-4" />
                    <span class="text-xs">{activeTab === 'payable' ? '付款' : '收款'}</span>
                  </button>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <Pagination bind:page={currentPage} total={currentList.length} pageSize={PAGE_SIZE} />
  </div>
</div>

{#if showPayModal && selectedPayment}
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/50" onclick={() => showPayModal = false}></div>
    <div class="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
      <h3 class="text-lg font-semibold text-slate-800 mb-4">{activeTab === 'payable' ? '付款' : '收款'}</h3>
      <div class="space-y-4">
        <div class="p-3 bg-slate-50 rounded-lg">
          <p class="text-sm text-slate-600">关联单号：<span class="font-medium text-slate-800">{selectedPayment.relatedName}</span></p>
          <p class="text-sm text-slate-600 mt-1">未付金额：<span class="font-bold text-red-600">{formatCurrency(selectedPayment.totalAmount - selectedPayment.paidAmount)}</span></p>
        </div>
        <div>
          <label for="payAmount" class="block text-sm font-medium text-slate-700 mb-1">付款金额</label>
          <input id="payAmount" type="number" bind:value={payAmount} min="0" max={selectedPayment.totalAmount - selectedPayment.paidAmount} step="0.01" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label for="payMethod" class="block text-sm font-medium text-slate-700 mb-1">付款方式</label>
          <select id="payMethod" bind:value={payMethod} class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="银行转账">银行转账</option>
            <option value="现金">现金</option>
            <option value="支票">支票</option>
            <option value="承兑汇票">承兑汇票</option>
          </select>
        </div>
      </div>
      <div class="flex justify-end gap-3 mt-6">
        <button onclick={() => showPayModal = false} class="px-4 py-2 text-sm text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">取消</button>
        <button onclick={handlePay} class="px-4 py-2 text-sm text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors">确认</button>
      </div>
    </div>
  </div>
{/if}
