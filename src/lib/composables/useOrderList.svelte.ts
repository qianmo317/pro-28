import type { OrderBase, OrderStore, OrderListConfig, OrderStatus } from '$lib/types';
import { toastStore } from '$lib/stores/toast.svelte';
import { goto } from '$app/navigation';

export function useOrderList<T extends OrderBase>(
  store: OrderStore<T>,
  config: OrderListConfig<T>
) {
  let searchQuery = $state('');
  let statusFilter = $state<OrderStatus | ''>('');
  let currentPage = $state(1);
  const PAGE_SIZE = 10;

  let showCreateModal = $state(false);
  let confirmDialog = $state(false);
  let confirmAction = $state<{ id: number; action: 'approve' | 'complete' } | null>(null);

  const statusTabs = [
    { value: '', label: '全部' },
    { value: 'pending', label: '待审核' },
    { value: 'approved', label: '已审核' },
    { value: 'completed', label: '已完成' },
    { value: 'cancelled', label: '已取消' }
  ];

  const filteredOrders = $derived(
    store.search(searchQuery, statusFilter || undefined)
  );

  const pagedOrders = $derived(
    filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  );

  function handleStatusTabClick(value: OrderStatus | '') {
    currentPage = 1;
    statusFilter = value;
  }

  function handleSearchChange() {
    currentPage = 1;
  }

  function handleApprove(id: number) {
    confirmAction = { id, action: 'approve' };
    confirmDialog = true;
  }

  function handleComplete(id: number) {
    confirmAction = { id, action: 'complete' };
    confirmDialog = true;
  }

  function handleConfirm() {
    if (!confirmAction) return;
    if (confirmAction.action === 'approve') {
      store.updateStatus(confirmAction.id, 'approved');
      toastStore.success(config.approveSuccessMessage);
    } else if (confirmAction.action === 'complete') {
      store.updateStatus(confirmAction.id, 'completed');
      toastStore.success(config.completeSuccessMessage);
    }
    confirmAction = null;
  }

  function handleCancel() {
    confirmAction = null;
  }

  function handleViewDetail(id: number) {
    goto(`${config.detailRoutePrefix}/${id}`);
  }

  function openCreateModal() {
    showCreateModal = true;
  }

  function closeCreateModal() {
    showCreateModal = false;
  }

  return {
    searchQuery,
    statusFilter,
    currentPage,
    PAGE_SIZE,
    showCreateModal,
    confirmDialog,
    confirmAction,
    statusTabs,
    filteredOrders,
    pagedOrders,
    handleStatusTabClick,
    handleSearchChange,
    handleApprove,
    handleComplete,
    handleConfirm,
    handleCancel,
    handleViewDetail,
    openCreateModal,
    closeCreateModal
  };
}
