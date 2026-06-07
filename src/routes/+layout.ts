import { authStore } from '$lib/stores/auth.svelte';
import { browser } from '$app/environment';

export function load() {
  if (browser) {
    authStore.restore();
  }
  return {};
}
