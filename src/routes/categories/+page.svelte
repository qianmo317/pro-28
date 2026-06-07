<script lang="ts">
  import { categoryStore } from '$lib/stores/categories.svelte';
  import { toastStore } from '$lib/stores/toast.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import SearchBar from '$lib/components/SearchBar.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import { Plus, Edit, Trash2, Package, DollarSign, FolderOpen } from 'lucide-svelte';
  import { formatCurrency, formatDate } from '$lib/utils/format';
  import type { CategoryStats } from '$lib/types';
  import { productStore } from '$lib/stores/products.svelte';

  let searchQuery = $state('');
  let showModal = $state(false);
  let editingId = $state(0);
  let deleteConfirm = $state(false);
  let deleteId = $state(0);

  let formName = $state('');
  let formDescription = $state('');

  const filteredCategories = $derived(
    searchQuery ? categoryStore.search(searchQuery) : categoryStore.getStats()
  );

  function openCreate() {
    editingId = 0;
    formName = '';
    formDescription = '';
    showModal = true;
  }

  function openEdit(category: CategoryStats) {
    editingId = category.id;
    formName = category.name;
    formDescription = category.description;
    showModal = true;
  }

  function handleSave() {
    if (!formName.trim()) {
      toastStore.error('请输入分类名称');
      return;
    }

    const existing = categoryStore.getByName(formName.trim());
    if (existing && existing.id !== editingId) {
      toastStore.error('分类名称已存在');
      return;
    }

    if (editingId) {
      const oldCategory = categoryStore.getById(editingId);
      categoryStore.update(editingId, {
        name: formName.trim(),
        description: formDescription.trim()
      });

      if (oldCategory && oldCategory.name !== formName.trim()) {
        productStore.items.forEach(p => {
          if (p.category === oldCategory.name) {
            p.category = formName.trim();
          }
        });
      }

      toastStore.success('分类更新成功');
    } else {
      categoryStore.add({
        name: formName.trim(),
        description: formDescription.trim()
      });
      toastStore.success('分类添加成功');
    }
    showModal = false;
  }

  function handleDeleteClick(category: CategoryStats) {
    deleteId = category.id;
    if (!categoryStore.canRemove(category.id)) {
      toastStore.error(`无法删除：该分类下还有 ${category.productCount} 个商品，请先转移或删除这些商品`);
      return;
    }
    deleteConfirm = true;
  }

  function handleDelete() {
    if (categoryStore.remove(deleteId)) {
      toastStore.success('分类已删除');
    } else {
      toastStore.error('删除失败：该分类下还有商品');
    }
    deleteConfirm = false;
  }
</script>

<svelte:head>
  <title>商品分类管理 - 进销存管理系统</title>
</svelte:head>

<PageHeader title="商品分类管理" subtitle="管理商品分类信息">
  {#snippet actions()}
    <button onclick={openCreate} class="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors">
      <Plus class="w-4 h-4" /> 添加分类
    </button>
  {/snippet}
</PageHeader>

<div class="space-y-4">
  <div class="w-full sm:w-64">
    <SearchBar bind:value={searchQuery} placeholder="搜索分类..." />
  </div>

  {#if filteredCategories.length === 0}
    <div class="bg-white rounded-xl border border-slate-200 p-12 text-center">
      <FolderOpen class="w-12 h-12 text-slate-300 mx-auto mb-4" />
      <p class="text-slate-500 text-sm">暂无分类数据</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each filteredCategories as category (category.id)}
        <div class="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                <FolderOpen class="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <h3 class="font-semibold text-slate-800">{category.name}</h3>
                <p class="text-xs text-slate-400">创建于 {formatDate(category.createdAt)}</p>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <button onclick={() => openEdit(category)} class="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="编辑">
                <Edit class="w-4 h-4" />
              </button>
              <button onclick={() => handleDeleteClick(category)} class="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="删除">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          {#if category.description}
            <p class="text-sm text-slate-500 mb-4 line-clamp-2">{category.description}</p>
          {:else}
            <p class="text-sm text-slate-400 italic mb-4">暂无描述</p>
          {/if}

          <div class="flex items-center gap-4 pt-4 border-t border-slate-100">
            <div class="flex items-center gap-2">
              <Package class="w-4 h-4 text-slate-400" />
              <span class="text-sm">
                <span class="font-semibold text-slate-700">{category.productCount}</span>
                <span class="text-slate-500"> 个商品</span>
              </span>
            </div>
            <div class="flex items-center gap-2">
              <DollarSign class="w-4 h-4 text-slate-400" />
              <span class="text-sm">
                <span class="font-semibold text-slate-700">{formatCurrency(category.totalStockValue)}</span>
                <span class="text-slate-500"> 库存价值</span>
              </span>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<ConfirmDialog bind:open={deleteConfirm} title="删除分类" message="确定要删除此分类吗？" onconfirm={handleDelete} confirmText="删除" />

{#if showModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/50" onclick={() => showModal = false}></div>
    <div class="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
      <h3 class="text-lg font-semibold text-slate-800 mb-4">{editingId ? '编辑分类' : '添加分类'}</h3>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">分类名称 <span class="text-red-500">*</span></label>
          <input type="text" bind:value={formName} class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="请输入分类名称" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">分类描述</label>
          <textarea bind:value={formDescription} rows="3" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" placeholder="请输入分类描述（可选）"></textarea>
        </div>
      </div>
      <div class="flex justify-end gap-3 mt-6">
        <button onclick={() => showModal = false} class="px-4 py-2 text-sm text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">取消</button>
        <button onclick={handleSave} class="px-4 py-2 text-sm text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors">{editingId ? '保存' : '添加'}</button>
      </div>
    </div>
  </div>
{/if}
