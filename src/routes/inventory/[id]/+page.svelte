<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { productStore } from '$lib/stores/products.svelte';
  import { inventoryStore } from '$lib/stores/inventory.svelte';
  import { purchaseOrderStore } from '$lib/stores/purchaseOrders.svelte';
  import { salesOrderStore } from '$lib/stores/salesOrders.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import StatCard from '$lib/components/StatCard.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { formatCurrency, formatDateTime, formatDate, formatNumber } from '$lib/utils/format';
  import { getOrderTypeLabel, getStatusLabel, getStatusColor } from '$lib/utils/helpers';
  import {
    ArrowLeft, Package, AlertTriangle, TrendingUp, TrendingDown,
    ShoppingCart, DollarSign, Clock, Tag, Barcode, Layers,
    ArrowUpCircle, ArrowDownCircle, XCircle, CheckCircle,
    Calendar, Info
  } from 'lucide-svelte';

  const productId = $derived(Number($page.params.id));
  const product = $derived(productStore.getById(productId));
  const productAlert = $derived(productStore.getProductAlertDetails(productId));
  const inventoryRecords = $derived(inventoryStore.getByProductId(productId));

  const relatedPurchaseOrders = $derived(
    purchaseOrderStore.items
      .filter(o => o.items.some(item => item.productId === productId))
      .map(o => {
        const item = o.items.find(i => i.productId === productId)!;
        return { ...o, productItem: item };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );

  const relatedSalesOrders = $derived(
    salesOrderStore.items
      .filter(o => o.items.some(item => item.productId === productId))
      .map(o => {
        const item = o.items.find(i => i.productId === productId)!;
        return { ...o, productItem: item };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );

  const totalPurchased = $derived(
    relatedPurchaseOrders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + o.productItem.quantity, 0)
  );

  const totalSold = $derived(
    relatedSalesOrders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + o.productItem.quantity, 0)
  );

  const timelineRecords = $derived(
    [...inventoryRecords].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );

  let activeTab = $state<'timeline' | 'purchases' | 'sales'>('timeline');

  const tabs = [
    { value: 'timeline' as const, label: '库存变动时间线', icon: Clock },
    { value: 'purchases' as const, label: '采购入库记录', icon: TrendingUp },
    { value: 'sales' as const, label: '销售出库记录', icon: TrendingDown }
  ];

  function getUrgencyColor(urgency: string): string {
    const map: Record<string, string> = {
      normal: 'text-emerald-600',
      warning: 'text-amber-600',
      critical: 'text-red-600'
    };
    return map[urgency] || 'text-slate-600';
  }

  function getUrgencyBgColor(urgency: string): string {
    const map: Record<string, string> = {
      normal: 'bg-emerald-100',
      warning: 'bg-amber-100',
      critical: 'bg-red-100'
    };
    return map[urgency] || 'bg-slate-100';
  }

  function getUrgencyLabel(urgency: string): string {
    const map: Record<string, string> = {
      normal: '正常',
      warning: '预警',
      critical: '紧急'
    };
    return map[urgency] || '正常';
  }

  function getTimelineIcon(type: string) {
    return type === 'in' ? ArrowUpCircle : ArrowDownCircle;
  }

  function getTimelineColor(type: string): string {
    return type === 'in' ? 'text-emerald-600' : 'text-red-600';
  }

  function getTimelineBgColor(type: string): string {
    return type === 'in' ? 'bg-emerald-100' : 'bg-red-100';
  }
</script>

<svelte:head>
  <title>商品详情 - 进销存管理系统</title>
</svelte:head>

{#if product && productAlert}
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button onclick={() => goto('/inventory')} class="p-2 rounded-lg hover:bg-slate-100 text-slate-400"><ArrowLeft class="w-5 h-5" /></button>
        <div>
          <h1 class="text-xl font-bold text-slate-800">{product.name}</h1>
          <div class="flex items-center gap-2 mt-1">
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
              <Layers class="w-3 h-3" />
              {product.category}
            </span>
            {#if product.stock <= product.minStock}
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium {getUrgencyBgColor(productAlert.urgency)} {getUrgencyColor(productAlert.urgency)}">
                <AlertTriangle class="w-3 h-3" />
                {getUrgencyLabel(productAlert.urgency)}
              </span>
            {:else}
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                <CheckCircle class="w-3 h-3" />
                库存正常
              </span>
            {/if}
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="当前库存" value={`${product.stock} ${product.unit}`} color={product.stock <= product.minStock ? 'red' : 'blue'}>
        {#snippet icon()}
          <Package class="w-5 h-5" />
        {/snippet}
        {#snippet subtext()}
          <p class="text-xs text-slate-400">最低库存 {product.minStock} {product.unit}</p>
        {/snippet}
      </StatCard>
      <StatCard title="累计采购" value={`${totalPurchased} ${product.unit}`} color="green">
        {#snippet icon()}
          <TrendingUp class="w-5 h-5" />
        {/snippet}
        {#snippet subtext()}
          <p class="text-xs text-slate-400">{relatedPurchaseOrders.filter(o => o.status === 'completed').length} 笔订单</p>
        {/snippet}
      </StatCard>
      <StatCard title="累计销售" value={`${totalSold} ${product.unit}`} color="purple">
        {#snippet icon()}
          <TrendingDown class="w-5 h-5" />
        {/snippet}
        {#snippet subtext()}
          <p class="text-xs text-slate-400">{relatedSalesOrders.filter(o => o.status === 'completed').length} 笔订单</p>
        {/snippet}
      </StatCard>
      <StatCard
        title={product.stock <= product.minStock ? '预警持续' : '库存状态'}
        value={product.stock <= product.minStock ? `${productAlert.daysBelowMin} 天` : '正常'}
        color={product.stock <= product.minStock ? (productAlert.urgency === 'critical' ? 'red' : 'amber') : 'green'}
      >
        {#snippet icon()}
          {#if product.stock <= product.minStock}
            <AlertTriangle class="w-5 h-5" />
          {:else}
            <CheckCircle class="w-5 h-5" />
          {/if}
        {/snippet}
        {#snippet subtext()}
          {#if product.stock <= product.minStock}
            <p class="text-xs text-slate-400">自 {formatDate(product.belowMinSince!)} 起</p>
          {:else if product.lastReplenishmentAt}
            <p class="text-xs text-slate-400">最近补货 {formatDate(product.lastReplenishmentAt)}</p>
          {:else}
            <p class="text-xs text-slate-400">暂无补货记录</p>
          {/if}
        {/snippet}
      </StatCard>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="bg-white rounded-xl border border-slate-200 p-5">
        <h3 class="text-sm font-semibold text-slate-800 mb-4">商品基本信息</h3>
        <dl class="space-y-4">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Tag class="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <dt class="text-xs text-slate-500">商品名称</dt>
              <dd class="text-sm font-medium text-slate-800 mt-0.5">{product.name}</dd>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Barcode class="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <dt class="text-xs text-slate-500">SKU编码</dt>
              <dd class="text-sm font-medium text-slate-800 mt-0.5 font-mono">{product.sku}</dd>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Layers class="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <dt class="text-xs text-slate-500">商品分类</dt>
              <dd class="text-sm font-medium text-slate-800 mt-0.5">{product.category}</dd>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Package class="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <dt class="text-xs text-slate-500">计量单位</dt>
              <dd class="text-sm font-medium text-slate-800 mt-0.5">{product.unit}</dd>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <DollarSign class="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <dt class="text-xs text-slate-500">销售价格</dt>
              <dd class="text-sm font-medium text-slate-800 mt-0.5">{formatCurrency(product.price)}</dd>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <ShoppingCart class="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <dt class="text-xs text-slate-500">采购成本</dt>
              <dd class="text-sm font-medium text-slate-800 mt-0.5">{formatCurrency(product.cost)}</dd>
            </div>
          </div>
        </dl>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-5">
        <h3 class="text-sm font-semibold text-slate-800 mb-4">库存预警信息</h3>
        {#if product.stock <= product.minStock}
          <div class="space-y-4">
            <div class={`p-4 rounded-lg ${getUrgencyBgColor(productAlert.urgency)}`}>
              <div class="flex items-start gap-3">
                <AlertTriangle class={`w-5 h-5 ${getUrgencyColor(productAlert.urgency)} flex-shrink-0 mt-0.5`} />
                <div>
                  <p class={`text-sm font-semibold ${getUrgencyColor(productAlert.urgency)}`}>
                    库存{getUrgencyLabel(productAlert.urgency)}预警
                  </p>
                  <p class="text-xs text-slate-600 mt-1">
                    当前库存 {product.stock} {product.unit}，已低于最低库存 {product.minStock} {product.unit}
                  </p>
                </div>
              </div>
            </div>
            <dl class="space-y-3">
              <div class="flex items-center justify-between">
                <dt class="text-xs text-slate-500">预警开始时间</dt>
                <dd class="text-sm font-medium text-slate-800">{formatDateTime(product.belowMinSince!)}</dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-xs text-slate-500">持续天数</dt>
                <dd class="text-sm font-medium {getUrgencyColor(productAlert.urgency)}">{productAlert.daysBelowMin} 天</dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-xs text-slate-500">紧急程度</dt>
                <dd class="text-sm font-medium {getUrgencyColor(productAlert.urgency)}">{getUrgencyLabel(productAlert.urgency)}</dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-xs text-slate-500">最高库存</dt>
                <dd class="text-sm font-medium text-slate-800">{product.maxStock} {product.unit}</dd>
              </div>
              {#if product.lastReplenishmentAt}
                <div class="flex items-center justify-between">
                  <dt class="text-xs text-slate-500">最近补货</dt>
                  <dd class="text-sm font-medium text-slate-800">{formatDate(product.lastReplenishmentAt)}</dd>
                </div>
              {/if}
            </dl>
          </div>
        {:else}
          <div class="text-center py-8">
            <div class="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle class="w-6 h-6 text-emerald-600" />
            </div>
            <p class="text-sm font-medium text-slate-800">库存状态正常</p>
            <p class="text-xs text-slate-500 mt-1">当前库存高于最低预警线</p>
            <dl class="mt-6 space-y-3 text-left">
              <div class="flex items-center justify-between">
                <dt class="text-xs text-slate-500">当前库存</dt>
                <dd class="text-sm font-medium text-slate-800">{product.stock} {product.unit}</dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-xs text-slate-500">最低库存</dt>
                <dd class="text-sm font-medium text-slate-800">{product.minStock} {product.unit}</dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-xs text-slate-500">最高库存</dt>
                <dd class="text-sm font-medium text-slate-800">{product.maxStock} {product.unit}</dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-xs text-slate-500">安全库存</dt>
                <dd class="text-sm font-medium text-emerald-600">{product.stock - product.minStock} {product.unit}</dd>
              </div>
              {#if product.lastReplenishmentAt}
                <div class="flex items-center justify-between">
                  <dt class="text-xs text-slate-500">最近补货</dt>
                  <dd class="text-sm font-medium text-slate-800">{formatDate(product.lastReplenishmentAt)}</dd>
                </div>
              {/if}
            </dl>
          </div>
        {/if}
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-5">
        <h3 class="text-sm font-semibold text-slate-800 mb-4">往来统计</h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <TrendingUp class="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p class="text-xs text-slate-500">采购总数量</p>
                <p class="text-lg font-bold text-emerald-700">{formatNumber(totalPurchased)} <span class="text-xs font-normal text-slate-500">{product.unit}</span></p>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <TrendingDown class="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p class="text-xs text-slate-500">销售总数量</p>
                <p class="text-lg font-bold text-red-700">{formatNumber(totalSold)} <span class="text-xs font-normal text-slate-500">{product.unit}</span></p>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <ShoppingCart class="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p class="text-xs text-slate-500">采购订单数</p>
                <p class="text-lg font-bold text-blue-700">{relatedPurchaseOrders.length} <span class="text-xs font-normal text-slate-500">笔</span></p>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <DollarSign class="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p class="text-xs text-slate-500">销售订单数</p>
                <p class="text-lg font-bold text-purple-700">{relatedSalesOrders.length} <span class="text-xs font-normal text-slate-500">笔</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-200">
        <div class="flex gap-2 flex-wrap">
          {#each tabs as tab}
            <button
              onclick={() => { activeTab = tab.value; }}
              class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors {activeTab === tab.value ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
            >
              <tab.icon class="w-4 h-4" />
              {tab.label}
              {#if tab.value === 'purchases' && relatedPurchaseOrders.length > 0}
                <span class="ml-1 px-1.5 py-0.5 text-xs rounded-full {activeTab === tab.value ? 'bg-white/20' : 'bg-slate-200'}">{relatedPurchaseOrders.length}</span>
              {/if}
              {#if tab.value === 'sales' && relatedSalesOrders.length > 0}
                <span class="ml-1 px-1.5 py-0.5 text-xs rounded-full {activeTab === tab.value ? 'bg-white/20' : 'bg-slate-200'}">{relatedSalesOrders.length}</span>
              {/if}
            </button>
          {/each}
        </div>
      </div>

      {#if activeTab === 'timeline'}
        <div class="p-5">
          {#if timelineRecords.length === 0}
            <div class="text-center py-12">
              <Clock class="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p class="text-sm text-slate-600">暂无库存变动记录</p>
              <p class="text-xs text-slate-400 mt-1">完成采购入库或销售出库后将显示变动记录</p>
            </div>
          {:else}
            <div class="relative">
              <div class="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200"></div>
              <div class="space-y-6">
                {#each timelineRecords as record (record.id)}
                  <div class="relative pl-12">
                    <div class="absolute left-3 w-4 h-4 rounded-full border-4 border-white {getTimelineBgColor(record.type)} flex items-center justify-center">
                      <svelte:component this={getTimelineIcon(record.type)} class={`w-3 h-3 ${getTimelineColor(record.type)}`} />
                    </div>
                    <div class="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors">
                      <div class="flex items-start justify-between mb-2">
                        <div class="flex items-center gap-2">
                          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {getTimelineBgColor(record.type)} {getTimelineColor(record.type)}">
                            {record.type === 'in' ? '入库' : '出库'}
                          </span>
                          <span class="text-xs text-slate-500">
                            {getOrderTypeLabel(record.orderType)} #{record.orderId}
                          </span>
                        </div>
                        <span class="text-sm font-bold {getTimelineColor(record.type)}">
                          {record.type === 'in' ? '+' : '-'}{record.quantity} {product.unit}
                        </span>
                      </div>
                      <p class="text-sm text-slate-700">{record.productName}</p>
                      {#if record.remark}
                        <p class="text-xs text-slate-500 mt-1">备注：{record.remark}</p>
                      {/if}
                      <div class="flex items-center gap-1 mt-2 text-xs text-slate-400">
                        <Calendar class="w-3 h-3" />
                        {formatDateTime(record.createdAt)}
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {:else if activeTab === 'purchases'}
        <div class="overflow-x-auto">
          {#if relatedPurchaseOrders.length === 0}
            <div class="text-center py-12">
              <ShoppingCart class="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p class="text-sm text-slate-600">暂无采购记录</p>
            </div>
          {:else}
            <table class="w-full">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200">
                  <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">采购单号</th>
                  <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">供应商</th>
                  <th class="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">采购数量</th>
                  <th class="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">采购单价</th>
                  <th class="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">小计金额</th>
                  <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">状态</th>
                  <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">创建时间</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                {#each relatedPurchaseOrders as order (order.id)}
                  <tr class="hover:bg-slate-50 transition-colors cursor-pointer" onclick={() => goto(`/purchase/${order.id}`)}>
                    <td class="px-4 py-3 text-sm font-medium text-brand-600">{order.orderNo}</td>
                    <td class="px-4 py-3 text-sm text-slate-800">{order.supplierName}</td>
                    <td class="px-4 py-3 text-sm text-right font-medium text-emerald-600">+{order.productItem.quantity} {product.unit}</td>
                    <td class="px-4 py-3 text-sm text-right text-slate-600">{formatCurrency(order.productItem.price)}</td>
                    <td class="px-4 py-3 text-sm text-right font-medium text-slate-800">{formatCurrency(order.productItem.amount)}</td>
                    <td class="px-4 py-3 text-sm"><StatusBadge status={order.status} /></td>
                    <td class="px-4 py-3 text-sm text-slate-500">{formatDateTime(order.createdAt)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {/if}
        </div>
      {:else}
        <div class="overflow-x-auto">
          {#if relatedSalesOrders.length === 0}
            <div class="text-center py-12">
              <DollarSign class="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p class="text-sm text-slate-600">暂无销售记录</p>
            </div>
          {:else}
            <table class="w-full">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200">
                  <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">销售单号</th>
                  <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">客户</th>
                  <th class="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">销售数量</th>
                  <th class="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">销售单价</th>
                  <th class="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">小计金额</th>
                  <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">状态</th>
                  <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">创建时间</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                {#each relatedSalesOrders as order (order.id)}
                  <tr class="hover:bg-slate-50 transition-colors cursor-pointer" onclick={() => goto(`/sales/${order.id}`)}>
                    <td class="px-4 py-3 text-sm font-medium text-brand-600">{order.orderNo}</td>
                    <td class="px-4 py-3 text-sm text-slate-800">{order.customerName}</td>
                    <td class="px-4 py-3 text-sm text-right font-medium text-red-600">-{order.productItem.quantity} {product.unit}</td>
                    <td class="px-4 py-3 text-sm text-right text-slate-600">{formatCurrency(order.productItem.price)}</td>
                    <td class="px-4 py-3 text-sm text-right font-medium text-slate-800">{formatCurrency(order.productItem.amount)}</td>
                    <td class="px-4 py-3 text-sm"><StatusBadge status={order.status} /></td>
                    <td class="px-4 py-3 text-sm text-slate-500">{formatDateTime(order.createdAt)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {/if}
        </div>
      {/if}
    </div>
  </div>
{:else}
  <div class="text-center py-20">
    <XCircle class="w-16 h-16 text-slate-300 mx-auto mb-4" />
    <p class="text-slate-500">未找到该商品</p>
    <button onclick={() => goto('/inventory')} class="mt-4 text-brand-600 hover:text-brand-700 text-sm font-medium">返回库存管理</button>
  </div>
{/if}
