# ERP Lite - 进销存管理系统

一款面向中小型企业的轻量级进销存管理系统，基于 Svelte 5 + Skeleton UI + Tailwind CSS 构建，涵盖采购、销售、库存、供应商/客户、财务对账及报表分析六大核心模块。

## 技术栈

- **前端框架**：Svelte 5 + SvelteKit + TypeScript
- **UI 组件库**：Skeleton UI v3
- **CSS 框架**：Tailwind CSS v4
- **图表**：Chart.js
- **图标**：Lucide Svelte
- **状态管理**：Svelte 5 Runes（$state, $derived, $effect）
- **构建工具**：Vite

## 功能模块

| 模块 | 功能 |
|------|------|
| 登录认证 | 用户登录/登出，角色权限（管理员/操作员/财务） |
| 仪表盘 | 销售采购概览，趋势图表，库存预警，待对账提醒 |
| 采购管理 | 采购订单 CRUD，审核/入库流程，自动更新库存和应付 |
| 销售管理 | 销售订单 CRUD，审核/出库流程，自动扣减库存和生成应收 |
| 库存管理 | 库存查看，预警标识，出入库记录 |
| 供应商管理 | 供应商信息 CRUD，结算方式管理 |
| 客户管理 | 客户信息 CRUD，信用额度管理 |
| 财务对账 | 应收应付总览，收付款操作，对账核销 |
| 报表分析 | 销售/采购/库存/利润多维度报表与图表 |

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 演示账户

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 操作员 | operator | op123 |
| 财务 | finance | fin123 |

## 项目结构

```
src/
├── lib/
│   ├── components/       # 通用 UI 组件
│   │   ├── ChartWrapper.svelte
│   │   ├── ConfirmDialog.svelte
│   │   ├── DataTable.svelte
│   │   ├── PageHeader.svelte
│   │   ├── SearchBar.svelte
│   │   ├── StatCard.svelte
│   │   ├── StatusBadge.svelte
│   │   └── ToastContainer.svelte
│   ├── stores/           # Svelte 5 状态管理
│   │   ├── auth.svelte.ts
│   │   ├── products.svelte.ts
│   │   ├── purchaseOrders.svelte.ts
│   │   ├── salesOrders.svelte.ts
│   │   ├── suppliers.svelte.ts
│   │   ├── customers.svelte.ts
│   │   ├── inventory.svelte.ts
│   │   ├── finance.svelte.ts
│   │   └── toast.svelte.ts
│   ├── data/             # Mock 数据
│   ├── types/            # TypeScript 类型定义
│   └── utils/            # 工具函数
├── routes/               # 页面路由
│   ├── login/            # 登录页
│   ├── purchase/         # 采购管理
│   ├── sales/            # 销售管理
│   ├── inventory/        # 库存管理
│   ├── suppliers/        # 供应商管理
│   ├── customers/        # 客户管理
│   ├── finance/          # 财务对账
│   └── reports/          # 报表分析
├── app.css               # 全局样式
└── app.html              # HTML 模板
```

## 核心业务流程

**采购流程**：创建采购单 → 审核采购单 → 采购入库（自动更新库存、生成应付）→ 付款对账

**销售流程**：创建销售单 → 审核销售单 → 销售出库（自动扣减库存、生成应收）→ 收款对账

**库存预警**：库存低于阈值 → 系统自动标记预警 → 仪表盘展示 → 操作员处理

## 数据说明

本系统使用前端 Mock 数据，不依赖后端服务。所有数据存储在内存中，页面刷新后数据将重置为初始状态。认证信息通过 LocalStorage 持久化。
