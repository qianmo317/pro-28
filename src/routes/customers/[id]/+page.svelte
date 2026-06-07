<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { customerStore } from '$lib/stores/customers.svelte';
  import { salesOrderStore } from '$lib/stores/salesOrders.svelte';
  import { financeStore } from '$lib/stores/finance.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import StatCard from '$lib/components/StatCard.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import ChartWrapper from '$lib/components/ChartWrapper.svelte';
  import { formatCurrency, formatDateTime, formatDate } from '$lib/utils/format';
  import { getCustomerLevelLabel, getCustomerLevelColor, getStatusLabel } from '$lib/utils/helpers';
  import { ArrowLeft, Tag, Phone, Mail, MapPin, CreditCard, ShoppingCart, DollarSign, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-svelte';
  import type { OrderStatus } from '$lib/types';

  const customerId = $derived(Number($page.params.id));
  const customer = $derived(customerStore.getById(customerId));
  const customerOrders = $derived(salesOrderStore.items.filter(o => o.customerId === customerId));
  const customerReceivables = $derived(financeStore.receivables.filter(p => p.relatedId && customerOrders.some(o => o.id === p.relatedId)));

  const totalOrders = $derived(customerOrders.length);
  const totalSpent = $derived(customer?.totalSpent || 0);
  const totalReceivable = $derived(
    customerReceivables.reduce((sum, p) => sum + (p.totalAmount - p.paidAmount), 0)
  );
  const lastTransaction = $derived(
    customerOrders.length > 0
      ? customerOrders.reduce((latest, o) => (o.createdAt > latest.createdAt ? o : latest)).createdAt
      : null
  );

  const orderStatusDistribution = $derived(() => {
    const counts: Record<OrderStatus, number> = { pending: 0, approved: 0, completed: 0, cancelled: 0 };
    customerOrders.forEach(o => {
      counts[o.status]++;
    });
    return counts;
  });

  const statusChartData = $derived(() => {
    const dist = orderStatusDistribution();
    return {
      labels: ['待审核', '已审核', '已完成', '已取消'],
      datasets: [{
        data: [dist.pending, dist.approved, dist.completed, dist.cancelled],
        backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'],
        borderWidth: 0
      }]
    };
  });

  const spendingTrendData = $derived(() => {
    const monthlyData: Record<string, number> = {};
    customerOrders.forEach(o => {
      if (o.status === 'completed') {
        const month = o.createdAt.substring(0, 7);
        monthlyData[month] = (monthlyData[month] || 0) + o.totalAmount;
      }
    });
    const sortedMonths = Object.keys(monthlyData).sort();
    let cumulative = 0;
    const cumulativeData = sortedMonths.map(month => {
      cumulative += monthlyData[month];
      return cumulative;
    });
    return {
      labels: sortedMonths.map(m => m.replace('-', '年') + '月'),
      datasets: [{
        label: '累计消费金额',
        data: cumulativeData,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#2563eb',
        pointRadius: 4
      }]
    };
  });

  const pendingReceivables = $derived(
    customerReceivables
      .filter(p => p.status !== 'completed')
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  );

  const recentTransactions = $derived(
    [...customerOrders]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5)
  );

  function getStatusDotColor(status: string): string {
    const map: Record<string, string> = {
      pending: 'bg-amber-500',
      approved: 'bg-blue-500',
      completed: 'bg-emerald-500',
      cancelled: 'bg-red-500'
    };
    return map[status] || 'bg-gray-500';
  }

  function getPaymentStatusIcon(status: string) {
    if (status === 'completed') return CheckCircle;
    if (status === 'partial') return Clock;
    return AlertTriangle;
  }

  function getPaymentStatusColor(status: string): string {
    const map: Record<string, string> = {
      completed: 'text-emerald-600',
      partial: 'text-amber-600',
      pending: 'text-red-600'
    };
    return map[status] || 'text-gray-600';
  }
</script>

<svelte:head>
  <title>客户详情 - 进销存管理系统</title>
</svelte:head>

{#if customer}
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button onclick={() => goto('/customers')} class="p-2 rounded-lg hover:bg-slate-100 text-slate-400"><ArrowLeft class="w-5 h-5" /></button>
        <div>
          <h1 class="text-xl font-bold text-slate-800">{customer.name}</h1>
          <div class="flex items-center gap-2 mt-1">
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style="background-color: {getCustomerLevelColor(customer.level)}20; color: {getCustomerLevelColor(customer.level)}">
              <Tag class="w-3 h-3" />
              {getCustomerLevelLabel(customer.level)}
            </span>
            <StatusBadge status={customer.status} />
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="累计消费" value={formatCurrency(totalSpent)} color="blue">
        {#snippet icon()}
          <DollarSign class="w-5 h-5" />
        {/snippet}
        {#snippet subtext()}
          <p class="text-xs text-slate-400">信用额度: {formatCurrency(customer.creditLimit)}</p>
        {/snippet}
      </StatCard>
      <StatCard title="订单总数" value={totalOrders} color="green">
        {#snippet icon()}
          <ShoppingCart class="w-5 h-5" />
        {/snippet}
        {#snippet subtext()}
          <p class="text-xs text-slate-400">
            已完成 {customerOrders.filter(o => o.status === 'completed').length} 笔
          </p>
        {/snippet}
      </StatCard>
      <StatCard title="应收账款" value={formatCurrency(totalReceivable)} color={totalReceivable > 0 ? 'amber' : 'green'}>
        {#snippet icon()}
          <CreditCard class="w-5 h-5" />
        {/snippet}
        {#snippet subtext()}
          <p class="text-xs text-slate-400">
            {pendingReceivables.length} 笔未结清
          </p>
        {/snippet}
      </StatCard>
      <StatCard title="最近交易" value={lastTransaction ? formatDate(lastTransaction) : '暂无'} color="purple">
        {#snippet icon()}
          <Clock class="w-5 h-5" />
        {/snippet}
        {#snippet subtext()}
          {#if lastTransaction}
            <p class="text-xs text-slate-400">{formatDateTime(lastTransaction)}</p>
          {/if}
        {/snippet}
      </StatCard>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="bg-white rounded-xl border border-slate-200 p-5">
        <h3 class="text-sm font-semibold text-slate-800 mb-4">基本资料</h3>
        <dl class="space-y-4">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Tag class="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <dt class="text-xs text-slate-500">联系人</dt>
              <dd class="text-sm font-medium text-slate-800 mt-0.5">{customer.contact}</dd>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Phone class="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <dt class="text-xs text-slate-500">联系电话</dt>
              <dd class="text-sm font-medium text-slate-800 mt-0.5">{customer.phone}</dd>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Mail class="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <dt class="text-xs text-slate-500">电子邮箱</dt>
              <dd class="text-sm font-medium text-slate-800 mt-0.5">{customer.email || '-'}</dd>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <MapPin class="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <dt class="text-xs text-slate-500">联系地址</dt>
              <dd class="text-sm font-medium text-slate-800 mt-0.5">{customer.address || '-'}</dd>
            </div>
          </div>
        </dl>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-5">
        <h3 class="text-sm font-semibold text-slate-800 mb-4">订单状态分布</h3>
        <ChartWrapper type="doughnut" data={statusChartData()} height={240} options={{
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 15,
                usePointStyle: true
              }
            }
          }
        }} />
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-5">
        <h3 class="text-sm font-semibold text-slate-800 mb-4">应收账款概要</h3>
        {#if pendingReceivables.length > 0}
          <div class="space-y-3">
            {#each pendingReceivables.slice(0, 3) as payment}
              <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div class="flex items-center gap-3">
                  <div class={`w-8 h-8 rounded-lg flex items-center justify-center ${payment.status === 'partial' ? 'bg-amber-100' : 'bg-red-100'}`}>
                    <svelte:component this={getPaymentStatusIcon(payment.status)} class={`w-4 h-4 ${getPaymentStatusColor(payment.status)}`} />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-slate-800">{payment.relatedName}</p>
                    <p class="text-xs text-slate-500">{formatDate(payment.createdAt)}</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-sm font-semibold text-red-600">{formatCurrency(payment.totalAmount - payment.paidAmount)}</p>
                  <p class="text-xs text-slate-400">{getStatusLabel(payment.status)}</p>
                </div>
              </div>
            {/each}
            {#if pendingReceivables.length > 3}
              <p class="text-center text-sm text-slate-400">还有 {pendingReceivables.length - 3} 笔未结清</p>
            {/if}
          </div>
        {:else}
          <div class="text-center py-8">
            <div class="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle class="w-6 h-6 text-emerald-600" />
            </div>
            <p class="text-sm text-slate-600">所有款项已结清</p>
            <p class="text-xs text-slate-400 mt-1">信用状况良好</p>
          </div>
        {/if}
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 p-5">
      <h3 class="text-sm font-semibold text-slate-800 mb-4">累计消费趋势</h3>
      {#if customerOrders.filter(o => o.status === 'completed').length > 0}
        <ChartWrapper type="line" data={spendingTrendData()} height={280} options={{
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value: number) => '¥' + (value / 1000) + 'k'
              }
            }
          }
        }} />
      {:else}
        <div class="text-center py-12">
          <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <DollarSign class="w-6 h-6 text-slate-400" />
          </div>
          <p class="text-sm text-slate-600">暂无完成的订单</p>
          <p class="text-xs text-slate-400 mt-1">完成订单后将显示消费趋势</p>
        </div>
      {/if}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-200">
          <h3 class="text-sm font-semibold text-slate-800">历史销售订单</h3>
        </div>
        {#if customerOrders.length > 0}
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200">
                  <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">订单号</th>
                  <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">日期</th>
                  <th class="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">金额</th>
                  <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">状态</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                {#each customerOrders.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) as order (order.id)}
                  <tr class="hover:bg-slate-50 transition-colors cursor-pointer" onclick={() => goto(`/sales/${order.id}`)}>
                    <td class="px-4 py-3 text-sm font-medium text-brand-600">{order.orderNo}</td>
                    <td class="px-4 py-3 text-sm text-slate-600">{formatDate(order.createdAt)}</td>
                    <td class="px-4 py-3 text-sm text-right font-medium text-slate-800">{formatCurrency(order.totalAmount)}</td>
                    <td class="px-4 py-3 text-sm"><StatusBadge status={order.status} /></td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <div class="text-center py-12">
            <ShoppingCart class="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p class="text-sm text-slate-600">暂无销售订单</p>
          </div>
        {/if}
      </div>

      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-200">
          <h3 class="text-sm font-semibold text-slate-800">最近交易记录</h3>
        </div>
        {#if recentTransactions.length > 0}
          <div class="divide-y divide-slate-100">
            {#each recentTransactions as transaction (transaction.id)}
              <div class="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer" onclick={() => goto(`/sales/${transaction.id}`)}>
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <ShoppingCart class="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-slate-800">{transaction.orderNo}</p>
                    <p class="text-xs text-slate-500">{formatDateTime(transaction.createdAt)}</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-sm font-semibold text-slate-800">{formatCurrency(transaction.totalAmount)}</p>
                  <div class="flex items-center gap-1 justify-end">
                    <span class={`w-2 h-2 rounded-full ${getStatusDotColor(transaction.status)}`}></span>
                    <span class="text-xs text-slate-500">{getStatusLabel(transaction.status)}</span>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="text-center py-12">
            <Clock class="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p class="text-sm text-slate-600">暂无交易记录</p>
          </div>
        {/if}
      </div>
    </div>

    {#if pendingReceivables.length > 0}
      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-200">
          <h3 class="text-sm font-semibold text-slate-800">未结清应收账款</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200">
                <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">关联订单</th>
                <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">创建时间</th>
                <th class="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">应收金额</th>
                <th class="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">已收金额</th>
                <th class="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">待收金额</th>
                <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">状态</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              {#each pendingReceivables as payment (payment.id)}
                <tr class="hover:bg-slate-50 transition-colors">
                  <td class="px-4 py-3 text-sm font-medium text-brand-600 cursor-pointer" onclick={() => {
                    const order = customerOrders.find(o => o.id === payment.relatedId);
                    if (order) goto(`/sales/${order.id}`);
                  }}>{payment.relatedName}</td>
                  <td class="px-4 py-3 text-sm text-slate-600">{formatDateTime(payment.createdAt)}</td>
                  <td class="px-4 py-3 text-sm text-right text-slate-800">{formatCurrency(payment.totalAmount)}</td>
                  <td class="px-4 py-3 text-sm text-right text-emerald-600">{formatCurrency(payment.paidAmount)}</td>
                  <td class="px-4 py-3 text-sm text-right font-semibold text-red-600">{formatCurrency(payment.totalAmount - payment.paidAmount)}</td>
                  <td class="px-4 py-3 text-sm">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium {
                      payment.status === 'partial' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                    }">
                      <svelte:component this={getPaymentStatusIcon(payment.status)} class="w-3 h-3" />
                      {getStatusLabel(payment.status)}
                    </span>
                  </td>
                </tr>
              {/each}
            </tbody>
            <tfoot>
              <tr class="bg-slate-50">
                <td colspan="4" class="px-4 py-3 text-sm font-semibold text-slate-800 text-right">合计待收</td>
                <td class="px-4 py-3 text-sm font-bold text-red-600 text-right">{formatCurrency(totalReceivable)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    {/if}
  </div>
{:else}
  <div class="text-center py-20">
    <XCircle class="w-16 h-16 text-slate-300 mx-auto mb-4" />
    <p class="text-slate-500">未找到该客户</p>
    <button onclick={() => goto('/customers')} class="mt-4 text-brand-600 hover:text-brand-700 text-sm font-medium">返回客户管理</button>
  </div>
{/if}
