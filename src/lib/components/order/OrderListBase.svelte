<script lang="ts" generics="T extends import('$lib/types').OrderBase">
  import type { OrderBase, OrderListConfig, OrderStatus } from '$lib/types';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import SearchBar from '$lib/components/SearchBar.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import { formatDateTime } from '$lib/utils/format';
  import { Plus, Check, Eye } from 'lucide-svelte';
  import type { Snippet } from 'svelte';

  interface UseOrderListReturn {
    searchQuery: string;
    statusFilter: OrderStatus | '';
    currentPage: number;
    PAGE_SIZE: number;
    showCreateModal: boolean;
    confirmDialog: boolean;
    confirmAction: { id: number; action: 'approve' | 'complete' } | null;
    statusTabs: Array<{ value: string; label: string }>;
    filteredOrders: T[];
    pagedOrders: T[];
    handleStatusTabClick: (value: OrderStatus | '') => void;
    handleSearchChange: () => void;
    handleApprove: (id: number) => void;
    handleComplete: (id: number) => void;
    handleConfirm: () => void;
    handleCancel: () => void;
    handleViewDetail: (id: number) => void;
    openCreateModal: () => void;
    closeCreateModal: () => void;
  }

  interface Props {
    config: OrderListConfig<T>;
    state: UseOrderListReturn;
    completeIcon?: Snippet;
    createModal?: Snippet;
    extraRowContent?: Snippet<[T]>;
  }

  let { config, state, completeIcon, createModal, extraRowContent }: Props = $props();
</script>

<svelte:head>
  <title>{config.pageTitle} - 进销存管理系统</title>
</svelte:head>

<PageHeader title={config.pageTitle} subtitle={config.pageSubtitle}>
  {#snippet actions()}
    <button
      onclick={state.openCreateModal}
      class="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
    >
      <Plus class="w-4 h-4" />
      {config.createButtonText}
    </button>
  {/snippet}
</PageHeader>

<div class="space-y-4">
  <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
    <div class="flex gap-2 flex-wrap">
      {#each state.statusTabs as tab}
        <button
          onclick={() => state.handleStatusTabClick(tab.value as OrderStatus | '')}
          class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors {state.statusFilter === tab.value ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}"
        >
          {tab.label}
        </button>
      {/each}
    </div>
    <div class="w-full sm:w-64">
      <SearchBar bind:value={state.searchQuery} placeholder={config.searchPlaceholder} onchange={state.handleSearchChange} />
    </div>
  </div>

  <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200">
            {#each config.columns as col}
              <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3 {col.class || ''}">
                {col.label}
              </th>
            {/each}
            <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3 w-32">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          {#if state.filteredOrders.length === 0}
            <tr>
              <td colspan={config.columns.length + 1} class="text-center py-12 text-slate-400 text-sm">
                {config.emptyText}
              </td>
            </tr>
          {:else}
            {#each state.pagedOrders as order (order.id)}
              <tr class="hover:bg-slate-50 transition-colors">
                {#each config.columns as col}
                  <td class="px-4 py-3 text-sm {col.class || ''}">
                    {#if col.renderHtml}
                      {@html col.renderHtml(order)}
                    {:else if col.render}
                      {col.render(order)}
                    {:else if col.key === 'orderNo'}
                      <span class="font-medium text-brand-600">{order.orderNo}</span>
                    {:else if col.key === 'status'}
                      <StatusBadge status={order.status} />
                    {:else if col.key === 'createdAt'}
                      <span class="text-slate-500">{formatDateTime(order.createdAt)}</span>
                    {:else if col.key === 'totalAmount'}
                      <span class="text-slate-700">{order.totalAmount}</span>
                    {:else}
                      {order[col.key as keyof T] ?? '-'}
                    {/if}
                  </td>
                {/each}
                {#if extraRowContent}
                  {@render extraRowContent(order)}
                {/if}
                <td class="px-4 py-3 text-sm">
                  <div class="flex items-center gap-2">
                    {#if order.status === 'pending'}
                      <button onclick={() => state.handleApprove(order.id)} class="text-brand-600 hover:text-brand-700" title={config.approveText}>
                        <Check class="w-4 h-4" />
                      </button>
                    {/if}
                    {#if order.status === 'approved' && completeIcon}
                      <button onclick={() => state.handleComplete(order.id)} class="text-emerald-600 hover:text-emerald-700" title={config.completeText}>
                        {@render completeIcon()}
                      </button>
                    {/if}
                    <button onclick={() => state.handleViewDetail(order.id)} class="text-slate-400 hover:text-slate-600" title="详情">
                      <Eye class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
    <Pagination bind:page={state.currentPage} total={state.filteredOrders.length} pageSize={state.PAGE_SIZE} />
  </div>
</div>

<ConfirmDialog
  bind:open={state.confirmDialog}
  title={state.confirmAction?.action === 'approve' ? config.approveConfirmTitle : config.completeConfirmTitle}
  message={state.confirmAction?.action === 'approve' ? config.approveConfirmMessage : config.completeConfirmMessage}
  onconfirm={state.handleConfirm}
  oncancel={state.handleCancel}
/>

{#if state.showCreateModal && createModal}
  {@render createModal()}
{/if}
