import type { Customer } from '$lib/types';
import { getCustomerLevel } from '$lib/utils/helpers';

const customerSpentData: Record<number, number> = {
  1: 24325,
  2: 18615,
  3: 20570,
  4: 0
};

export const customers: Customer[] = [
  { id: 1, name: '北京星辰科技有限公司', contact: '孙经理', phone: '010-65001234', email: 'sun@bjstar.com', address: '北京市朝阳区建国路88号', creditLimit: 500000, status: 'active', totalSpent: customerSpentData[1], level: getCustomerLevel(customerSpentData[1]) },
  { id: 2, name: '成都云帆网络科技', contact: '周总', phone: '028-85001234', email: 'zhou@cdcloud.com', address: '成都市高新区天府三街66号', creditLimit: 300000, status: 'active', totalSpent: customerSpentData[2], level: getCustomerLevel(customerSpentData[2]) },
  { id: 3, name: '武汉长江贸易公司', contact: '吴经理', phone: '027-82001234', email: 'wu@whtrade.com', address: '武汉市江汉区解放大道123号', creditLimit: 200000, status: 'active', totalSpent: customerSpentData[3], level: getCustomerLevel(customerSpentData[3]) },
  { id: 4, name: '南京紫金商贸', contact: '郑总', phone: '025-84001234', email: 'zheng@njtrade.com', address: '南京市鼓楼区中山路456号', creditLimit: 150000, status: 'inactive', totalSpent: customerSpentData[4], level: getCustomerLevel(customerSpentData[4]) }
];
