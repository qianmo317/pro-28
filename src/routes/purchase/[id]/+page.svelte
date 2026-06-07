<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { purchaseOrderStore } from '$lib/stores/purchaseOrders.svelte';
  import { toastStore } from '$lib/stores/toast.svelte';
  import { inventoryStore } from '$lib/stores/inventory.svelte';
  import { financeStore } from '$lib/stores/finance.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import { formatCurrency, formatDateTime } from '$lib/utils/format';
  import { ArrowLeft, Check, PackageCheck, X as XIcon, Package, CreditCard, Clock, CheckCircle2 } from 'lucide-svelte';

  let confirmDialog = $state(false);
  let confirmAction = $state('');

  const orderId = $derived(Number($page.params.id));
  const order = $derived(purchaseOrderStore.getById(orderId));
  const inventoryRecords = $derived(inventoryStore.getByOrderId(orderId, 'purchase'));
  const payable = $derived(financeStore.getPayableByPurchaseOrderId(orderId));

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

    <div class="bg-white rounded-xl border border-slate-200 p-5">
      <div class="flex items-center gap-2 mb-4">
        <Package class="w-5 h-5 text-emerald-600" />
        <h3 class="text-sm font-semibold text-slate-800">入库历史明细</h3>
      </div>
      {#if inventoryRecords.length > 0}
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-200">
              <th class="text-left text-xs font-semibold text-slate-500 py-2">入库时间</th>
              <th class="text-left text-xs font-semibold text-slate-500 py-2">商品名称</th>
              <th class="text-right text-xs font-semibold text-slate-500 py-2">入库数量</th>
              <th class="text-left text-xs font-semibold text-slate-500 py-2">备注</th>
            </tr>
          </thead>
          <tbody>
            {#each inventoryRecords as record}
              <tr class="border-b border-slate-100">
                <td class="py-3 text-sm text-slate-700">{formatDateTime(record.createdAt)}</td>
                <td class="py-3 text-sm text-slate-700">{record.productName}</td>
                <td class="py-3 text-sm font-medium text-emerald-600 text-right">+{record.quantity}</td>
                <td class="py-3 text-sm text-slate-500">{record.remark || '-'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {:else}
        <div class="text-center py-8">
          <Package class="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p class="text-slate-400 text-sm">暂无入库记录</p>
        </div>
      {/if}
    </div>

    <div class="bg-white rounded-xl border border-slate-200 p-5">
      <div class="flex items-center gap-2 mb-4">
        <CreditCard class="w-5 h-5 text-brand-600" />
        <h3 class="text-sm font-semibold text-slate-800">应付账款</h3>
      </div>
      {#if payable}
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <div class="bg-slate-50 rounded-lg p-4">
            <p class="text-xs text-slate-500 mb-1">应付金额</p>
            <p class="text-lg font-bold text-slate-800">{formatCurrency(payable.totalAmount)}</p>
          </div>
          <div class="bg-slate-50 rounded-lg p-4">
            <p class="text-xs text-slate-500 mb-1">已付金额</p>
            <p class="text-lg font-bold text-emerald-600">{formatCurrency(payable.paidAmount)}</p>
          </div>
          <div class="bg-slate-50 rounded-lg p-4">
            <p class="text-xs text-slate-500 mb-1">待付金额</p>
            <p class="text-lg font-bold text-amber-600">{formatCurrency(payable.totalAmount - payable.paidAmount)}</p>
          </div>
          <div class="bg-slate-50 rounded-lg p-4">
            <p class="text-xs text-slate-500 mb-1">付款状态</p>
            <div class="flex items-center gap-1 mt-1">
              {#if payable.status === 'completed'}
                <CheckCircle2 class="w-4 h-4 text-emerald-500" />
                <span class="text-sm font-medium text-emerald-600">已付清</span>
              {:else if payable.status === 'partial'}
                <Clock class="w-4 h-4 text-amber-500" />
                <span class="text-sm font-medium text-amber-600">部分付款</span>
              {:else}
                <Clock class="w-4 h-4 text-slate-400" />
                <span class="text-sm font-medium text-slate-500">待付款</span>
              {/if}
            </div>
          </div>
        </div>

        {#if payable.paidAmount > 0}
          <div class="border-t border-slate-200 pt-4">
            <h4 class="text-xs font-semibold text-slate-500 mb-3">付款记录</h4>
            <table class="w-full">
              <thead>
                <tr class="border-b border-slate-200">
                  <th class="text-left text-xs font-semibold text-slate-500 py-2">付款时间</th>
                  <th class="text-right text-xs font-semibold text-slate-500 py-2">付款金额</th>
                  <th class="text-left text-xs font-semibold text-slate-500 py-2">付款方式</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-slate-100">
                  <td class="py-3 text-sm text-slate-700">{payable.paidAt ? formatDateTime(payable.paidAt) : '-'}</td>
                  <td class="py-3 text-sm font-medium text-emerald-600 text-right">{formatCurrency(payable.paidAmount)}</td>
                  <td class="py-3 text-sm text-slate-700">{payable.method || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        {/if}

        {#if payable.adjustments && payable.adjustments.length > 0}
          <div class="border-t border-slate-200 pt-4 mt-4">
            <h4 class="text-xs font-semibold text-slate-500 mb-3">调整记录</h4>
            <table class="w-full">
              <thead>
                <tr class="border-b border-slate-200">
                  <th class="text-left text-xs font-semibold text-slate-500 py-2">调整时间</th>
                  <th class="text-left text-xs font-semibold text-slate-500 py-2">类型</th>
                  <th class="text-right text-xs font-semibold text-slate-500 py-2">调整金额</th>
                  <th class="text-left text-xs font-semibold text-slate-500 py-2">关联单据</th>
                  <th class="text-left text-xs font-semibold text-slate-500 py-2">原因</th>
                </tr>
              </thead>
              <tbody>
                {#each payable.adjustments as adj}
                  <tr class="border-b border-slate-100">
                    <td class="py-3 text-sm text-slate-700">{formatDateTime(adj.createdAt)}</td>
                    <td class="py-3 text-sm">
                      <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-red-50 text-red-600">
                        {adj.type === 'return' ? '采购退货' : adj.type}
                      </span>
                    </td>
                    <td class="py-3 text-sm font-medium text-red-600 text-right">-{formatCurrency(adj.amount)}</td>
                    <td class="py-3 text-sm text-slate-700">{adj.relatedName}</td>
                    <td class="py-3 text-sm text-slate-500">{adj.reason}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      {:else}
        <div class="text-center py-8">
          <CreditCard class="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p class="text-slate-400 text-sm">暂无应付账款记录</p>
          <p class="text-slate-400 text-xs mt-1">采购单审核后将自动生成应付账款</p>
        </div>
      {/if}
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
