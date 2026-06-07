import type { Supplier } from '$lib/types';

export const suppliers: Supplier[] = [
  { id: 1, name: '深圳电子科技有限公司', contact: '王经理', phone: '0755-86001234', email: 'wang@sztech.com', address: '深圳市南山区科技园路88号', status: 'active', settlementMethod: '月结30天' },
  { id: 2, name: '广州办公家具厂', contact: '陈总', phone: '020-85001234', email: 'chen@gzfurniture.com', address: '广州市白云区家具大道56号', status: 'active', settlementMethod: '月结60天' },
  { id: 3, name: '杭州耗材供应链', contact: '刘经理', phone: '0571-88001234', email: 'liu@hzsupply.com', address: '杭州市余杭区供应路12号', status: 'active', settlementMethod: '货到付款' },
  { id: 4, name: '上海数码配件中心', contact: '赵主管', phone: '021-62001234', email: 'zhao@shdigital.com', address: '上海市浦东新区数码城3层', status: 'inactive', settlementMethod: '月结30天' }
];
