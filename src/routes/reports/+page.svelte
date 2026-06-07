<script lang="ts">
  import { salesOrderStore } from '$lib/stores/salesOrders.svelte';
  import { purchaseOrderStore } from '$lib/stores/purchaseOrders.svelte';
  import { productStore } from '$lib/stores/products.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import StatCard from '$lib/components/StatCard.svelte';
  import ChartWrapper from '$lib/components/ChartWrapper.svelte';
  import { formatCurrency, formatNumber } from '$lib/utils/format';
  import { BarChart3, TrendingUp, ShoppingCart, Package, Percent } from 'lucide-svelte';

  let activeTab = $state<'sales' | 'purchase' | 'inventory' | 'profit'>('sales');

  const completedSales = $derived(salesOrderStore.items.filter(o => o.status === 'completed'));
  const completedPurchases = $derived(purchaseOrderStore.items.filter(o => o.status === 'completed'));

  const totalSales = $derived(completedSales.reduce((s, o) => s + o.totalAmount, 0));
  const totalPurchase = $derived(completedPurchases.reduce((s, o) => s + o.totalAmount, 0));
  const totalCost = $derived(completedSales.reduce((sum, order) => {
    return sum + order.items.reduce((s, item) => {
      const product = productStore.getById(item.productId);
      return s + (product ? product.cost * item.quantity : 0);
    }, 0);
  }, 0));
  const grossProfit = $derived(totalSales - totalCost);
  const profitMargin = $derived(totalSales > 0 ? (grossProfit / totalSales * 100).toFixed(1) : '0');

  const salesChartData = $derived({
    labels: completedSales.map(o => o.orderNo.slice(-6)),
    datasets: [{
      label: '销售额',
      data: completedSales.map(o => o.totalAmount),
      backgroundColor: 'rgba(59, 130, 246, 0.7)',
      borderColor: '#3b82f6',
      borderWidth: 1,
      borderRadius: 4
    }]
  });

  const purchaseChartData = $derived({
    labels: completedPurchases.map(o => o.orderNo.slice(-6)),
    datasets: [{
      label: '采购额',
      data: completedPurchases.map(o => o.totalAmount),
      backgroundColor: 'rgba(16, 185, 129, 0.7)',
      borderColor: '#10b981',
      borderWidth: 1,
      borderRadius: 4
    }]
  });

  const categories = $derived([...new Set(productStore.items.map(p => p.category))]);
  const inventoryChartData = $derived({
    labels: categories,
    datasets: [{
      data: categories.map(cat => productStore.items.filter(p => p.category === cat).reduce((s, p) => s + p.stock, 0)),
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
      borderWidth: 0
    }]
  });

  const profitChartData = $derived({
    labels: ['销售额', '采购成本', '毛利润'],
    datasets: [{
      label: '金额',
      data: [totalSales, totalCost, grossProfit],
      backgroundColor: ['rgba(59, 130, 246, 0.7)', 'rgba(239, 68, 68, 0.7)', 'rgba(16, 185, 129, 0.7)'],
      borderColor: ['#3b82f6', '#ef4444', '#10b981'],
      borderWidth: 1,
      borderRadius: 4
    }]
  });

  const tabs = [
    { value: 'sales' as const, label: '销售报表', icon: TrendingUp },
    { value: 'purchase' as const, label: '采购报表', icon: ShoppingCart },
    { value: 'inventory' as const, label: '库存报表', icon: Package },
    { value: 'profit' as const, label: '利润分析', icon: Percent }
  ];

  const inventoryByCategory = $derived(
    categories.map(cat => ({
      category: cat,
      count: productStore.items.filter(p => p.category === cat).length,
      totalStock: productStore.items.filter(p => p.category === cat).reduce((s, p) => s + p.stock, 0),
      totalValue: productStore.items.filter(p => p.category === cat).reduce((s, p) => s + p.stock * p.price, 0)
    }))
  );
</script>

<svelte:head>
  <title>报表分析 - 进销存管理系统</title>
</svelte:head>

<PageHeader title="报表分析" subtitle="数据分析与报表" />

<div class="space-y-6">
  <div class="flex gap-2 flex-wrap">
    {#each tabs as tab}
      <button
        onclick={() => activeTab = tab.value}
        class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors {activeTab === tab.value ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}"
      >
        <tab.icon class="w-4 h-4" />
        {tab.label}
      </button>
    {/each}
  </div>

  {#if activeTab === 'sales'}
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <StatCard title="已完成订单" value={completedSales.length} color="blue">
        {#snippet icon()}<TrendingUp class="w-5 h-5" />{/snippet}
      </StatCard>
      <StatCard title="销售总额" value={formatCurrency(totalSales)} color="green">
        {#snippet icon()}<BarChart3 class="w-5 h-5" />{/snippet}
      </StatCard>
      <StatCard title="平均订单额" value={formatCurrency(completedSales.length > 0 ? totalSales / completedSales.length : 0)} color="purple">
        {#snippet icon()}<Percent class="w-5 h-5" />{/snippet}
      </StatCard>
    </div>
    <div class="bg-white rounded-xl border border-slate-200 p-5">
      <h3 class="text-sm font-semibold text-slate-800 mb-4">销售订单金额分布</h3>
      <ChartWrapper type="bar" data={salesChartData} height={350} />
    </div>
  {:else if activeTab === 'purchase'}
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <StatCard title="已完成订单" value={completedPurchases.length} color="blue">
        {#snippet icon()}<ShoppingCart class="w-5 h-5" />{/snippet}
      </StatCard>
      <StatCard title="采购总额" value={formatCurrency(totalPurchase)} color="green">
        {#snippet icon()}<BarChart3 class="w-5 h-5" />{/snippet}
      </StatCard>
      <StatCard title="平均订单额" value={formatCurrency(completedPurchases.length > 0 ? totalPurchase / completedPurchases.length : 0)} color="purple">
        {#snippet icon()}<Percent class="w-5 h-5" />{/snippet}
      </StatCard>
    </div>
    <div class="bg-white rounded-xl border border-slate-200 p-5">
      <h3 class="text-sm font-semibold text-slate-800 mb-4">采购订单金额分布</h3>
      <ChartWrapper type="bar" data={purchaseChartData} height={350} />
    </div>
  {:else if activeTab === 'inventory'}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl border border-slate-200 p-5">
        <h3 class="text-sm font-semibold text-slate-800 mb-4">库存分类分布</h3>
        <ChartWrapper type="doughnut" data={inventoryChartData} height={300} />
      </div>
      <div class="bg-white rounded-xl border border-slate-200 p-5">
        <h3 class="text-sm font-semibold text-slate-800 mb-4">分类明细</h3>
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-200">
              <th class="text-left text-xs font-semibold text-slate-500 py-2">分类</th>
              <th class="text-right text-xs font-semibold text-slate-500 py-2">商品数</th>
              <th class="text-right text-xs font-semibold text-slate-500 py-2">总库存</th>
              <th class="text-right text-xs font-semibold text-slate-500 py-2">库存价值</th>
            </tr>
          </thead>
          <tbody>
            {#each inventoryByCategory as item}
              <tr class="border-b border-slate-100">
                <td class="py-2.5 text-sm text-slate-700">{item.category}</td>
                <td class="py-2.5 text-sm text-slate-700 text-right">{item.count}</td>
                <td class="py-2.5 text-sm text-slate-700 text-right">{formatNumber(item.totalStock)}</td>
                <td class="py-2.5 text-sm font-medium text-slate-800 text-right">{formatCurrency(item.totalValue)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard title="销售总额" value={formatCurrency(totalSales)} color="blue">
        {#snippet icon()}<TrendingUp class="w-5 h-5" />{/snippet}
      </StatCard>
      <StatCard title="销售成本" value={formatCurrency(totalCost)} color="red">
        {#snippet icon()}<ShoppingCart class="w-5 h-5" />{/snippet}
      </StatCard>
      <StatCard title="毛利润" value={formatCurrency(grossProfit)} color="green">
        {#snippet icon()}<BarChart3 class="w-5 h-5" />{/snippet}
      </StatCard>
      <StatCard title="毛利率" value={profitMargin + '%'} color="purple">
        {#snippet icon()}<Percent class="w-5 h-5" />{/snippet}
      </StatCard>
    </div>
    <div class="bg-white rounded-xl border border-slate-200 p-5">
      <h3 class="text-sm font-semibold text-slate-800 mb-4">销售额 / 成本 / 利润对比</h3>
      <ChartWrapper type="bar" data={profitChartData} height={350} />
    </div>
  {/if}
</div>
