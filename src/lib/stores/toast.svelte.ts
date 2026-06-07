import type { ToastMessage } from '$lib/types';

class ToastStore {
  messages = $state<ToastMessage[]>([]);
  private nextId = 1;

  show(type: ToastMessage['type'], message: string, duration = 3000) {
    const id = this.nextId++;
    this.messages.push({ id, type, message });
    setTimeout(() => {
      this.messages = this.messages.filter(m => m.id !== id);
    }, duration);
  }

  success(message: string) { this.show('success', message); }
  error(message: string) { this.show('error', message); }
  warning(message: string) { this.show('warning', message); }
  info(message: string) { this.show('info', message); }

  remove(id: number) {
    this.messages = this.messages.filter(m => m.id !== id);
  }
}

export const toastStore = new ToastStore();
