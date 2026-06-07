<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { purchaseReturnStore } from '$lib/stores/purchaseReturns.svelte';
  import { purchaseOrderStore } from '$lib/stores/purchaseOrders.svelte';
  import { toastStore } from '$lib/stores/toast.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import { formatCurrency, formatDateTime } from '$lib/utils/format';
  import { ArrowLeft, Check, X, PackageMinus, FileText } from 'lucide-svelte';

  let confirmDialog = $state(false);
  let confirmAction = $state('');

  const returnId = $derived(Number($page.params.id));
  const returnItem = $derived(purchaseReturnStore.getById(returnId));
  const originalOrder = $derived(returnItem ? purchaseOrderStore.getById(returnItem.purchaseOrderId) : undefined);

  function handleAction(action: string) {
    confirmAction = action;
    confirmDialog = true;
  }

  function handleConfirm() {
    if (!returnItem) return;
    if (confirmAction === 'approve') {
      purchaseReturnStore.approve(returnItem.id);
      toastStore.success('退货单已审核通过，库存已扣减，应付账款已调整');
    } else if (confirmAction === 'reject') {
      purchaseReturnStore.reject(returnItem.id);
      toastStore.success('退货单已拒绝');
    } else if (confirmAction === 'complete') {
      purchaseReturnStore.complete(returnItem.id);
      toastStore.success('退货单已完成');
    }
  }

  function getActionMessage(action: string): string {
    switch (action) {
      case 'approve':
        return '确定审核通过此退货单？库存将自动扣减，应付账款将自动调整。';
      case 'reject':
        return '确定拒绝此退货单？';
      case 'complete':
        return '确定此退货已完成？';
      default:
        return '确定执行此操作？';
    }
  }
</script>

<svelte:head>
  <title>退货单详情 - 进销存管理系统</title>
</svelte:head>

{#if returnItem}
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button onclick={() => goto('/purchase-returns')} class="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-xl font-bold text-slate-800">{returnItem.returnNo}</h1>
          <p class="text-sm text-slate-500">采购退货单详情</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <StatusBadge status={returnItem.status} />
        {#if returnItem.status === 'pending'}
          <button onclick={() => handleAction('approve')} class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">
            <Check class="w-4 h-4" /> 审核通过
          </button>
          <button onclick={() => handleAction('reject')} class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
            <X class="w-4 h-4" /> 拒绝
          </button>
        {/if}
        {#if returnItem.status === 'approved'}
          <button onclick={() => handleAction('complete')} class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors">
            <PackageMinus class="w-4 h-4" /> 确认退货完成
          </button>
        {/if}
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="space-y-6">
        <div class="bg-white rounded-xl border border-slate-200 p-5">
          <h3 class="text-sm font-semibold text-slate-800 mb-3">退货单信息</h3>
          <dl class="space-y-3">
            <div class="flex justify-between"><dt class="text-sm text-slate-500">退货单号</dt><dd class="text-sm font-medium text-slate-800">{returnItem.returnNo}</dd></div>
            <div class="flex justify-between"><dt class="text-sm text-slate-500">原采购单号</dt><dd class="text-sm font-medium text-brand-600">{returnItem.purchaseOrderNo}</dd></div>
            <div class="flex justify-between"><dt class="text-sm text-slate-500">供应商</dt><dd class="text-sm font-medium text-slate-800">{returnItem.supplierName}</dd></div>
            <div class="flex justify-between"><dt class="text-sm text-slate-500">创建时间</dt><dd class="text-sm text-slate-800">{formatDateTime(returnItem.createdAt)}</dd></div>
            <div class="flex justify-between"><dt class="text-sm text-slate-500">更新时间</dt><dd class="text-sm text-slate-800">{formatDateTime(returnItem.updatedAt)}</dd></div>
            {#if returnItem.approvedAt}
              <div class="flex justify-between"><dt class="text-sm text-slate-500">审核时间</dt><dd class="text-sm text-slate-800">{formatDateTime(returnItem.approvedAt)}</dd></div>
            {/if}
            {#if returnItem.completedAt}
              <div class="flex justify-between"><dt class="text-sm text-slate-500">完成时间</dt><dd class="text-sm text-slate-800">{formatDateTime(returnItem.completedAt)}</dd></div>
            {/if}
          </dl>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-5">
          <h3 class="text-sm font-semibold text-slate-800 mb-3">退货原因</h3>
          <div class="flex items-start gap-2">
            <FileText class="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <p class="text-sm text-slate-700 leading-relaxed">{returnItem.reason}</p>
          </div>
        </div>
      </div>

      <div class="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
        <h3 class="text-sm font-semibold text-slate-800 mb-3">退货商品明细</h3>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-slate-200">
                <th class="text-left text-xs font-semibold text-slate-500 py-2">商品名称</th>
                <th class="text-right text-xs font-semibold text-slate-500 py-2">原采购数量</th>
                <th class="text-right text-xs font-semibold text-slate-500 py-2">已退数量</th>
                <th class="text-right text-xs font-semibold text-slate-500 py-2">本次退货</th>
                <th class="text-right text-xs font-semibold text-slate-500 py-2">单价</th>
                <th class="text-right text-xs font-semibold text-slate-500 py-2">小计</th>
              </tr>
            </thead>
            <tbody>
              {#each returnItem.items as item}
                <tr class="border-b border-slate-100">
                  <td class="py-3 text-sm text-slate-700">{item.productName}</td>
                  <td class="py-3 text-sm text-slate-700 text-right">{originalOrder?.items.find(i => i.productId === item.productId)?.quantity || '-'}</td>
                  <td class="py-3 text-sm text-slate-500 text-right">{(originalOrder?.items.find(i => i.productId === item.productId)?.quantity || 0) - item.quantity}</td>
                  <td class="py-3 text-sm font-medium text-red-600 text-right">-{item.quantity}</td>
                  <td class="py-3 text-sm text-slate-700 text-right">{formatCurrency(item.price)}</td>
                  <td class="py-3 text-sm font-medium text-red-600 text-right">-{formatCurrency(item.amount)}</td>
                </tr>
              {/each}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="5" class="py-3 text-sm font-semibold text-slate-800 text-right">退货合计</td>
                <td class="py-3 text-sm font-bold text-red-600 text-right">-{formatCurrency(returnItem.totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>

    {#if originalOrder}
      <div class="bg-white rounded-xl border border-slate-200 p-5">
        <h3 class="text-sm font-semibold text-slate-800 mb-3">原采购单商品对照</h3>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-slate-200">
                <th class="text-left text-xs font-semibold text-slate-500 py-2">商品名称</th>
                <th class="text-right text-xs font-semibold text-slate-500 py-2">采购数量</th>
                <th class="text-right text-xs font-semibold text-slate-500 py-2">已入库</th>
                <th class="text-right text-xs font-semibold text-slate-500 py-2">已退货</th>
                <th class="text-right text-xs font-semibold text-slate-500 py-2">剩余库存</th>
                <th class="text-right text-xs font-semibold text-slate-500 py-2">单价</th>
                <th class="text-right text-xs font-semibold text-slate-500 py-2">采购金额</th>
              </tr>
            </thead>
            <tbody>
              {#each originalOrder.items as item}
                {@const totalReturned = purchaseReturnStore.getByPurchaseOrderId(originalOrder.id)
                  .filter(r => r.status !== 'rejected')
                  .reduce((sum, r) => sum + (r.items.find(ri => ri.productId === item.productId)?.quantity || 0), 0)}
                <tr class="border-b border-slate-100">
                  <td class="py-3 text-sm text-slate-700">{item.productName}</td>
                  <td class="py-3 text-sm text-slate-700 text-right">{item.quantity}</td>
                  <td class="py-3 text-sm text-emerald-600 text-right">+{item.quantity}</td>
                  <td class="py-3 text-sm text-red-600 text-right">{totalReturned > 0 ? `-` : ''}{totalReturned}</td>
                  <td class="py-3 text-sm font-medium text-slate-800 text-right">{item.quantity - totalReturned}</td>
                  <td class="py-3 text-sm text-slate-700 text-right">{formatCurrency(item.price)}</td>
                  <td class="py-3 text-sm text-slate-700 text-right">{formatCurrency(item.amount)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  </div>
{:else}
  <div class="text-center py-20">
    <p class="text-slate-400">未找到该退货单</p>
    <button onclick={() => goto('/purchase-returns')} class="mt-4 text-brand-600 hover:text-brand-700 text-sm font-medium">返回采购退货</button>
  </div>
{/if}

<ConfirmDialog
  bind:open={confirmDialog}
  title={confirmAction === 'approve' ? '审核通过退货单' : confirmAction === 'reject' ? '拒绝退货单' : '确认退货完成'}
  message={getActionMessage(confirmAction)}
  onconfirm={handleConfirm}
/>
