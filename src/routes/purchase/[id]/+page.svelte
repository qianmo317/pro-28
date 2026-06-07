<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { purchaseOrderStore } from '$lib/stores/purchaseOrders.svelte';
  import { toastStore } from '$lib/stores/toast.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import { formatCurrency, formatDateTime } from '$lib/utils/format';
  import { ArrowLeft, Check, PackageCheck, X as XIcon } from 'lucide-svelte';

  let confirmDialog = $state(false);
  let confirmAction = $state('');

  const orderId = $derived(Number($page.params.id));
  const order = $derived(purchaseOrderStore.getById(orderId));

  function handleAction(action: string) {
    confirmAction = action;
    confirmDialog = true;
  }

  function handleConfirm() {
    if (!order) return;
    if (confirmAction === 'approve') {
      purchaseOrderStore.updateStatus(order.id, 'approved');
      toastStore.success('采购单已审核');
    } else if (confirmAction === 'complete') {
      purchaseOrderStore.updateStatus(order.id, 'completed');
      toastStore.success('采购单已入库');
    } else if (confirmAction === 'cancel') {
      purchaseOrderStore.updateStatus(order.id, 'cancelled');
      toastStore.success('采购单已取消');
    }
  }
</script>

<svelte:head>
  <title>采购单详情 - 进销存管理系统</title>
</svelte:head>

{#if order}
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button onclick={() => goto('/purchase')} class="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-xl font-bold text-slate-800">{order.orderNo}</h1>
          <p class="text-sm text-slate-500">采购订单详情</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <StatusBadge status={order.status} />
        {#if order.status === 'pending'}
          <button onclick={() => handleAction('approve')} class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors">
            <Check class="w-4 h-4" /> 审核
          </button>
          <button onclick={() => handleAction('cancel')} class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
            <XIcon class="w-4 h-4" /> 取消
          </button>
        {/if}
        {#if order.status === 'approved'}
          <button onclick={() => handleAction('complete')} class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">
            <PackageCheck class="w-4 h-4" /> 确认入库
          </button>
        {/if}
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="bg-white rounded-xl border border-slate-200 p-5">
        <h3 class="text-sm font-semibold text-slate-800 mb-3">订单信息</h3>
        <dl class="space-y-3">
          <div class="flex justify-between"><dt class="text-sm text-slate-500">订单号</dt><dd class="text-sm font-medium text-slate-800">{order.orderNo}</dd></div>
          <div class="flex justify-between"><dt class="text-sm text-slate-500">供应商</dt><dd class="text-sm font-medium text-slate-800">{order.supplierName}</dd></div>
          <div class="flex justify-between"><dt class="text-sm text-slate-500">创建时间</dt><dd class="text-sm text-slate-800">{formatDateTime(order.createdAt)}</dd></div>
          <div class="flex justify-between"><dt class="text-sm text-slate-500">更新时间</dt><dd class="text-sm text-slate-800">{formatDateTime(order.updatedAt)}</dd></div>
        </dl>
      </div>

      <div class="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
        <h3 class="text-sm font-semibold text-slate-800 mb-3">商品明细</h3>
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-200">
              <th class="text-left text-xs font-semibold text-slate-500 py-2">商品名称</th>
              <th class="text-right text-xs font-semibold text-slate-500 py-2">数量</th>
              <th class="text-right text-xs font-semibold text-slate-500 py-2">单价</th>
              <th class="text-right text-xs font-semibold text-slate-500 py-2">小计</th>
            </tr>
          </thead>
          <tbody>
            {#each order.items as item}
              <tr class="border-b border-slate-100">
                <td class="py-3 text-sm text-slate-700">{item.productName}</td>
                <td class="py-3 text-sm text-slate-700 text-right">{item.quantity}</td>
                <td class="py-3 text-sm text-slate-700 text-right">{formatCurrency(item.price)}</td>
                <td class="py-3 text-sm font-medium text-slate-800 text-right">{formatCurrency(item.amount)}</td>
              </tr>
            {/each}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" class="py-3 text-sm font-semibold text-slate-800 text-right">合计</td>
              <td class="py-3 text-sm font-bold text-brand-600 text-right">{formatCurrency(order.totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
{:else}
  <div class="text-center py-20">
    <p class="text-slate-400">未找到该采购单</p>
    <button onclick={() => goto('/purchase')} class="mt-4 text-brand-600 hover:text-brand-700 text-sm font-medium">返回采购管理</button>
  </div>
{/if}

<ConfirmDialog
  bind:open={confirmDialog}
  title="确认操作"
  message={confirmAction === 'approve' ? '确定审核此采购单？' : confirmAction === 'complete' ? '确定确认入库？库存将自动增加。' : '确定取消此采购单？'}
  onconfirm={handleConfirm}
/>
