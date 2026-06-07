import type { User } from '$lib/types';

export const users: User[] = [
  { id: 1, username: 'admin', password: 'admin123', role: 'admin', avatar: '', displayName: '系统管理员' },
  { id: 2, username: 'operator', password: 'op123', role: 'operator', avatar: '', displayName: '张操作' },
  { id: 3, username: 'finance', password: 'fin123', role: 'finance', avatar: '', displayName: '李财务' }
];
