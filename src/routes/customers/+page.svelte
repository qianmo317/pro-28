<script lang="ts">
  import { customerStore } from '$lib/stores/customers.svelte';
  import { toastStore } from '$lib/stores/toast.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import SearchBar from '$lib/components/SearchBar.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import { Plus, Edit, Trash2, Tag } from 'lucide-svelte';
  import type { Customer } from '$lib/types';
  import { formatCurrency } from '$lib/utils/format';
  import { getCustomerLevelLabel, getCustomerLevelColor } from '$lib/utils/helpers';

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
  let formCreditLimit = $state(0);
  let formStatus = $state<'active' | 'inactive'>('active');

  let currentPage = $state(1);
  const PAGE_SIZE = 10;

  const filteredCustomers = $derived(
    searchQuery ? customerStore.search(searchQuery) : customerStore.items
  );

  const pagedCustomers = $derived(filteredCustomers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE));

  function openCreate() {
    editingId = 0;
    formName = '';
    formContact = '';
    formPhone = '';
    formEmail = '';
    formAddress = '';
    formCreditLimit = 0;
    formStatus = 'active';
    showModal = true;
  }

  function openEdit(customer: Customer) {
    editingId = customer.id;
    formName = customer.name;
    formContact = customer.contact;
    formPhone = customer.phone;
    formEmail = customer.email;
    formAddress = customer.address;
    formCreditLimit = customer.creditLimit;
    formStatus = customer.status;
    showModal = true;
  }

  function handleSave() {
    if (!formName.trim()) {
      toastStore.error('请输入客户名称');
      return;
    }
    if (editingId) {
      customerStore.update(editingId, {
        name: formName, contact: formContact, phone: formPhone,
        email: formEmail, address: formAddress,
        creditLimit: formCreditLimit, status: formStatus
      });
      toastStore.success('客户更新成功');
    } else {
      customerStore.add({
        name: formName, contact: formContact, phone: formPhone,
        email: formEmail, address: formAddress,
        creditLimit: formCreditLimit, status: formStatus
      });
      toastStore.success('客户添加成功');
    }
    showModal = false;
  }

  function handleDelete() {
    customerStore.remove(deleteId);
    toastStore.success('客户已删除');
  }
</script>

<svelte:head>
  <title>客户管理 - 进销存管理系统</title>
</svelte:head>

<PageHeader title="客户管理" subtitle="管理客户信息">
  {#snippet actions()}
    <button onclick={openCreate} class="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors">
      <Plus class="w-4 h-4" /> 添加客户
    </button>
  {/snippet}
</PageHeader>

<div class="space-y-4">
  <div class="w-full sm:w-64">
    <SearchBar bind:value={searchQuery} placeholder="搜索客户..." onchange={() => currentPage = 1} />
  </div>

  <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200">
            <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">名称</th>
            <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">等级</th>
            <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">联系人</th>
            <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">电话</th>
            <th class="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">累计消费</th>
            <th class="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">信用额度</th>
            <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">状态</th>
            <th class="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3 w-24">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          {#each pagedCustomers as customer (customer.id)}
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="px-4 py-3 text-sm font-medium text-slate-800">{customer.name}</td>
              <td class="px-4 py-3 text-sm">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style="background-color: {getCustomerLevelColor(customer.level)}20; color: {getCustomerLevelColor(customer.level)}">
                  <Tag class="w-3 h-3" />
                  {getCustomerLevelLabel(customer.level)}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-slate-600">{customer.contact}</td>
              <td class="px-4 py-3 text-sm text-slate-600">{customer.phone}</td>
              <td class="px-4 py-3 text-sm text-right font-medium text-slate-800">{formatCurrency(customer.totalSpent)}</td>
              <td class="px-4 py-3 text-sm text-right font-medium text-slate-800">{formatCurrency(customer.creditLimit)}</td>
              <td class="px-4 py-3 text-sm"><StatusBadge status={customer.status} /></td>
              <td class="px-4 py-3 text-sm">
                <div class="flex items-center gap-2">
                  <button onclick={() => openEdit(customer)} class="text-brand-600 hover:text-brand-700"><Edit class="w-4 h-4" /></button>
                  <button onclick={() => { deleteId = customer.id; deleteConfirm = true; }} class="text-red-400 hover:text-red-600"><Trash2 class="w-4 h-4" /></button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <Pagination bind:page={currentPage} total={filteredCustomers.length} pageSize={PAGE_SIZE} />
  </div>
</div>

<ConfirmDialog bind:open={deleteConfirm} title="删除客户" message="确定要删除此客户吗？" onconfirm={handleDelete} confirmText="删除" />

{#if showModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/50" onclick={() => showModal = false}></div>
    <div class="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
      <h3 class="text-lg font-semibold text-slate-800 mb-4">{editingId ? '编辑客户' : '添加客户'}</h3>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">名称</label>
          <input type="text" bind:value={formName} class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="客户名称" />
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
            <label class="block text-sm font-medium text-slate-700 mb-1">信用额度</label>
            <input type="number" bind:value={formCreditLimit} min="0" step="1000" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
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
