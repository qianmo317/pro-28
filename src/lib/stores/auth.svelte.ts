import type { User } from '$lib/types';
import { users } from '$lib/data/users';

class AuthStore {
  currentUser = $state<User | null>(null);
  isLoggedIn = $derived(this.currentUser !== null);

  login(username: string, password: string): boolean {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      this.currentUser = user;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('erp_user', JSON.stringify(user));
      }
      return true;
    }
    return false;
  }

  logout() {
    this.currentUser = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('erp_user');
    }
  }

  restore() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('erp_user');
      if (saved) {
        try {
          this.currentUser = JSON.parse(saved);
        } catch {
          this.currentUser = null;
        }
      }
    }
  }
}

export const authStore = new AuthStore();
