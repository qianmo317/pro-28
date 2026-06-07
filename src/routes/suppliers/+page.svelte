<script lang="ts">
  import { goto } from '$app/navigation';
  import { supplierStore } from '$lib/stores/suppliers.svelte';
  import { toastStore } from '$lib/stores/toast.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import SearchBar from '$lib/components/SearchBar.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import { Plus, Edit, Trash2, Eye } from 'lucide-svelte';
  import type { Supplier } from '$lib/types';

  let searchQuery = $state('');
  let showModal = $state(false);
  let editingId = $state(0);
  let deleteConfirm = $state(false);
  let deleteId = $state(0);

  let formName = $state('');
  let formContact = $state('');
  let formPhone = $state('');
  let formEmail = $state('');
  let formAddress = $state('');
  let formSettlement = $state('月结30天');
  let formStatus = $state<'active' | 'inactive'>('active');
  let currentPage = $state(1);
  const PAGE_SIZE = 10;

  const filteredSuppliers = $derived(
    searchQuery ? supplierStore.search(searchQuery) : supplierStore.items
  );

  const pagedSuppliers = $derived(filteredSuppliers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE));

  function openCreate() {
    editingId = 0;
    formName = '';
    formContact = '';
    formPhone = '';
    formEmail = '';
    formAddress = '';
    formSettlement = '月结30天';
    formStatus = 'active';
    showModal = true;
  }

  function openEdit(supplier: Supplier) {
    editingId = supplier.id;
    formName = supplier.name;
    formContact = supplier.contact;
    formPhone = supplier.phone;
    formEmail = supplier.email;
    formAddress = supplier.address;
    formSettlement = supplier.settlementMethod;
    formStatus = supplier.status;
    showModal = true;
  }

  function handleSave() {
    if (!formName.trim()) {
      toastStore.error('请输入供应商名称');
      return;
    }
    if (editingId) {
      supplierStore.update(editingId, {
        name: formName, contact: formContact, phone: formPhone,
        email: formEmail, address: formAddress,
        settlementMethod: formSettlement, status: formStatus
      });
      toastStore.success('供应商更新成功');
    } else {
      supplierStore.add({
        name: formName, contact: formContact, phone: formPhone,
        email: formEmail, address: formAddress,
        settlementMethod: formSettlement, status: formStatus
      });
      toastStore.success('供应商添加成功');
    }
    showModal = false;
  }

  function handleDelete() {
    supplierStore.remove(deleteId);
    toastStore.success('供应商已删除');
  }
</script>

<svelte:head>
  <title>供应商管理 - 进销存管理系统</title>
</svelte:head>

<PageHeader title="供应商管理" subtitle="管理供应商信息">
  {#snippet actions()}
    <button onclick={openCreate} class="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors">
      <Plus class="w-4 h-4" /> 添加供应商
    </button>
  {/snippet}
</PageHeader>

<div class="space-y-4">
  <div class="w-full sm:w-64">
    <SearchBar bind:value={searchQuery} placeholder="搜索供应商..." onchange={() => currentPage = 1} />
  </div>

  <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200">
            <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">名称</th>
            <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">联系人</th>
            <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">电话</th>
            <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">结算方式</th>
            <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">状态</th>
            <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3 w-24">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          {#each pagedSuppliers as supplier (supplier.id)}
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="px-4 py-3 text-sm font-medium text-slate-800">
                <button onclick={() => goto(`/suppliers/${supplier.id}`)} class="text-brand-600 hover:text-brand-700 hover:underline">
                  {supplier.name}
                </button>
              </td>
              <td class="px-4 py-3 text-sm text-slate-600">{supplier.contact}</td>
              <td class="px-4 py-3 text-sm text-slate-600">{supplier.phone}</td>
              <td class="px-4 py-3 text-sm text-slate-600">{supplier.settlementMethod}</td>
              <td class="px-4 py-3 text-sm"><StatusBadge status={supplier.status} /></td>
              <td class="px-4 py-3 text-sm">
                <div class="flex items-center gap-2">
                  <button onclick={() => goto(`/suppliers/${supplier.id}`)} class="text-slate-500 hover:text-brand-600" title="查看详情"><Eye class="w-4 h-4" /></button>
                  <button onclick={() => openEdit(supplier)} class="text-brand-600 hover:text-brand-700" title="编辑"><Edit class="w-4 h-4" /></button>
                  <button onclick={() => { deleteId = supplier.id; deleteConfirm = true; }} class="text-red-400 hover:text-red-600" title="删除"><Trash2 class="w-4 h-4" /></button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <Pagination bind:page={currentPage} total={filteredSuppliers.length} pageSize={PAGE_SIZE} />
  </div>
</div>

<ConfirmDialog bind:open={deleteConfirm} title="删除供应商" message="确定要删除此供应商吗？" onconfirm={handleDelete} confirmText="删除" />

{#if showModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/50" onclick={() => showModal = false}></div>
    <div class="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
      <h3 class="text-lg font-semibold text-slate-800 mb-4">{editingId ? '编辑供应商' : '添加供应商'}</h3>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">名称</label>
          <input type="text" bind:value={formName} class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="供应商名称" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">联系人</label>
            <input type="text" bind:value={formContact} class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">电话</label>
            <input type="text" bind:value={formPhone} class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">邮箱</label>
          <input type="email" bind:value={formEmail} class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">地址</label>
          <input type="text" bind:value={formAddress} class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">结算方式</label>
            <select bind:value={formSettlement} class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="货到付款">货到付款</option>
              <option value="月结30天">月结30天</option>
              <option value="月结60天">月结60天</option>
              <option value="预付全款">预付全款</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">状态</label>
            <select bind:value={formStatus} class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="active">启用</option>
              <option value="inactive">停用</option>
            </select>
          </div>
        </div>
      </div>
      <div class="flex justify-end gap-3 mt-6">
        <button onclick={() => showModal = false} class="px-4 py-2 text-sm text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">取消</button>
        <button onclick={handleSave} class="px-4 py-2 text-sm text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors">{editingId ? '保存' : '添加'}</button>
      </div>
    </div>
  </div>
{/if}
