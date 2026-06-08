import type { OrderBase, OrderStore, OrderListConfig, OrderStatus } from '$lib/types';
import { toastStore } from '$lib/stores/toast.svelte';
import { goto } from '$app/navigation';

export interface OrderListState<T extends OrderBase> {
  searchQuery: string;
  statusFilter: OrderStatus | '';
  currentPage: number;
  readonly PAGE_SIZE: number;
  readonly showCreateModal: boolean;
  confirmDialog: boolean;
  readonly confirmAction: { id: number; action: 'approve' | 'complete' } | null;
  readonly statusTabs: Array<{ value: string; label: string }>;
  readonly filteredOrders: T[];
  readonly pagedOrders: T[];
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

export function useOrderList<T extends OrderBase>(
  store: OrderStore<T>,
  config: OrderListConfig<T>
): OrderListState<T> {
  let searchQuery = $state('');
  let statusFilter = $state<OrderStatus | ''>('');
  let currentPage = $state(1);
  let showCreateModal = $state(false);
  let confirmDialog = $state(false);
  let confirmAction = $state<{ id: number; action: 'approve' | 'complete' } | null>(null);

  const PAGE_SIZE = 10;
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
    get searchQuery() { return searchQuery; },
    set searchQuery(v) { searchQuery = v; },
    get statusFilter() { return statusFilter; },
    set statusFilter(v) { statusFilter = v; },
    get currentPage() { return currentPage; },
    set currentPage(v) { currentPage = v; },
    get PAGE_SIZE() { return PAGE_SIZE; },
    get showCreateModal() { return showCreateModal; },
    get confirmDialog() { return confirmDialog; },
    set confirmDialog(v) { confirmDialog = v; },
    get confirmAction() { return confirmAction; },
    get statusTabs() { return statusTabs; },
    get filteredOrders() { return filteredOrders; },
    get pagedOrders() { return pagedOrders; },
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
