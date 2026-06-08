<script lang="ts">
  import { purchaseOrderStore } from '$lib/stores/purchaseOrders.svelte';
  import { supplierStore } from '$lib/stores/suppliers.svelte';
  import { productStore } from '$lib/stores/products.svelte';
  import { useOrderList } from '$lib/composables/useOrderList.svelte';
  import { OrderListBase, OrderCreateModal } from '$lib/components/order';
  import { formatCurrency } from '$lib/utils/format';
  import { PackageCheck, AlertTriangle } from 'lucide-svelte';
  import type { PurchaseOrder, OrderListConfig, OrderCreateConfig, OrderItem, OrderItemDraft } from '$lib/types';
  import { page } from '$app/stores';

  let preselectedProductId = $state<number | null>(null);
  const preselectedProduct = $derived(preselectedProductId ? productStore.getById(preselectedProductId) : null);
  const preselectedProductIsAlert = $derived(preselectedProduct && preselectedProduct.stock <= preselectedProduct.minStock);

  let initialItems = $state<OrderItemDraft[]>([{ productId: 0, quantity: 1, price: 0 }]);
  let initialPartyId = $state(0);

  $effect(() => {
    const productIdParam = $page.url.searchParams.get('productId');
    if (productIdParam) {
      const pid = Number(productIdParam);
      const product = productStore.getById(pid);
      if (product) {
        preselectedProductId = pid;
        const suggestedQty = Math.max(product.minStock - product.stock + 10, product.minStock * 2);
        initialItems = [{ productId: pid, quantity: suggestedQty, price: product.cost }];
        listState.openCreateModal();
      }
    }
  });

  function handleCloseModal() {
    listState.closeCreateModal();
    preselectedProductId = null;
    initialPartyId = 0;
    initialItems = [{ productId: 0, quantity: 1, price: 0 }];
    if ($page.url.searchParams.has('productId')) {
      const url = new URL($page.url);
      url.searchParams.delete('productId');
      history.replaceState({}, '', url.toString());
    }
  }

  const listConfig: OrderListConfig<PurchaseOrder> = {
    pageTitle: '采购管理',
    pageSubtitle: '管理采购订单，跟踪采购入库',
    createButtonText: '新建采购单',
    searchPlaceholder: '搜索订单号/供应商...',
    emptyText: '暂无采购订单',
    approveText: '审核',
    completeText: '入库',
    approveConfirmTitle: '审核采购单',
    approveConfirmMessage: '确定审核此采购单？',
    completeConfirmTitle: '确认入库',
    completeConfirmMessage: '确定将此采购单标记为已入库？库存将自动增加。',
    approveSuccessMessage: '采购单已审核',
    completeSuccessMessage: '采购单已入库',
    detailRoutePrefix: '/purchase',
    columns: [
      { key: 'orderNo', label: '订单号' },
      { key: 'supplierName', label: '供应商' },
      {
        key: 'totalAmount',
        label: '金额',
        render: (order) => formatCurrency(order.totalAmount)
      },
      { key: 'status', label: '状态' },
      { key: 'createdAt', label: '创建时间' }
    ]
  };

  const listState = useOrderList(purchaseOrderStore, listConfig);

  const createConfig: OrderCreateConfig<PurchaseOrder> = {
    modalTitle: '新建采购单',
    partyLabel: '供应商',
    partyPlaceholder: '请选择供应商',
    getDefaultPrice: (productId: number) => productStore.getById(productId)?.cost || 0,
    getPartyOptions: () => supplierStore.items.filter(s => s.status === 'active').map(s => ({ id: s.id, label: s.name })),
    validateParty: (partyId: number) => partyId ? null : '请选择供应商',
    createOrder: (data: { partyId: number; items: OrderItem[] }) => {
      const supplier = supplierStore.getById(data.partyId)!;
      purchaseOrderStore.add({
        supplierId: data.partyId,
        supplierName: supplier.name,
        status: 'pending',
        items: data.items,
        totalAmount: data.items.reduce((sum, i) => sum + i.amount, 0)
      });
    },
    successMessage: '采购单创建成功'
  };
</script>

<OrderListBase config={listConfig} state={listState}>
  {#snippet completeIcon()}
    <PackageCheck class="w-4 h-4" />
  {/snippet}

  {#snippet createModal()}
    <OrderCreateModal
      config={createConfig}
      onclose={handleCloseModal}
      initialItems={initialItems}
      initialPartyId={initialPartyId}
    >
      {#snippet extraHeader()}
        {#if preselectedProductIsAlert && preselectedProduct}
          <div class="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <AlertTriangle class="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-amber-800">库存预警提醒</p>
              <p class="text-xs text-amber-600 mt-0.5">
                商品「{preselectedProduct.name}」当前库存 {preselectedProduct.stock} {preselectedProduct.unit}，
                已低于最低库存 {preselectedProduct.minStock} {preselectedProduct.unit}，
                建议及时补货。已为您自动填入建议采购数量。
              </p>
            </div>
          </div>
        {/if}
      {/snippet}
    </OrderCreateModal>
  {/snippet}
</OrderListBase>
