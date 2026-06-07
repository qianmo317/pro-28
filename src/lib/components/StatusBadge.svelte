<script lang="ts">
  import { getStatusColor, getStatusLabel } from '$lib/utils/helpers';

  interface Props {
    status: string;
  }

  let { status }: Props = $props();
</script>

<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(status)}">
  {getStatusLabel(status)}
</span>
