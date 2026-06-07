let nextId = 1000;

export function generateId(): number {
  return nextId++;
}

export function generateOrderNo(prefix: string): string {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');
  const seq = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${dateStr}${seq}`;
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: '待审核',
    approved: '已审核',
    completed: '已完成',
    cancelled: '已取消',
    rejected: '已拒绝',
    active: '启用',
    inactive: '停用'
  };
  return map[status] || status;
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    approved: 'bg-blue-100 text-blue-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800',
    rejected: 'bg-red-100 text-red-800',
    active: 'bg-emerald-100 text-emerald-800',
    inactive: 'bg-gray-100 text-gray-600'
  };
  return map[status] || 'bg-gray-100 text-gray-600';
}
