<script lang="ts">
  import { Search } from 'lucide-svelte';

  interface Props {
    placeholder?: string;
    value?: string;
    onchange?: (value: string) => void;
  }

  let { placeholder = '搜索...', value = $bindable(''), onchange }: Props = $props();

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    value = target.value;
    onchange?.(value);
  }
</script>

<div class="relative">
  <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
  <input
    type="text"
    {placeholder}
    {value}
    oninput={handleInput}
    class="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
  />
</div>
