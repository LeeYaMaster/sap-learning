import {
  AccountBookOutlined,
  ApartmentOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { Layout, Menu, Typography } from 'antd';
import { useMemo } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

export function AppLayout() {
  const loc = useLocation();
  const selected = loc.pathname;

  const items = useMemo(
    () => [
      {
        key: '/',
        icon: <DashboardOutlined />,
        label: <Link to="/">业务流程导览</Link>,
      },
      {
        type: 'group' as const,
        label: '主数据',
        children: [
          {
            key: '/master/org',
            icon: <ApartmentOutlined />,
            label: <Link to="/master/org">组织（公司/工厂）</Link>,
          },
          {
            key: '/master/materials',
            icon: <DatabaseOutlined />,
            label: <Link to="/master/materials">物料</Link>,
          },
          {
            key: '/master/customers',
            icon: <TeamOutlined />,
            label: <Link to="/master/customers">客户</Link>,
          },
          {
            key: '/master/vendors',
            icon: <ShopOutlined />,
            label: <Link to="/master/vendors">供应商</Link>,
          },
        ],
      },
      {
        type: 'group' as const,
        label: '采购 MM · P2P',
        children: [
          {
            key: '/mm/pr',
            icon: <UnorderedListOutlined />,
            label: <Link to="/mm/pr">采购申请</Link>,
          },
          {
            key: '/mm/po',
            icon: <ShoppingCartOutlined />,
            label: <Link to="/mm/po">采购订单</Link>,
          },
          {
            key: '/mm/gr',
            icon: <UnorderedListOutlined />,
            label: <Link to="/mm/gr">收货入库</Link>,
          },
          {
            key: '/mm/invoices',
            icon: <UnorderedListOutlined />,
            label: <Link to="/mm/invoices">供应商发票</Link>,
          },
        ],
      },
      {
        type: 'group' as const,
        label: '销售 SD · O2C',
        children: [
          {
            key: '/sd/so',
            icon: <UnorderedListOutlined />,
            label: <Link to="/sd/so">销售订单</Link>,
          },
          {
            key: '/sd/deliveries',
            icon: <UnorderedListOutlined />,
            label: <Link to="/sd/deliveries">发货出库</Link>,
          },
          {
            key: '/sd/billings',
            icon: <UnorderedListOutlined />,
            label: <Link to="/sd/billings">客户开票</Link>,
          },
        ],
      },
      {
        type: 'group' as const,
        label: '库存与财务',
        children: [
          {
            key: '/inventory',
            icon: <DatabaseOutlined />,
            label: <Link to="/inventory">库存总览</Link>,
          },
          {
            key: '/fi/trial-balance',
            icon: <AccountBookOutlined />,
            label: <Link to="/fi/trial-balance">科目余额 / 凭证</Link>,
          },
        ],
      },
    ],
    [],
  );

  const selectedKeys = [
    selected.startsWith('/mm/pr')
      ? '/mm/pr'
      : selected.startsWith('/mm/po')
        ? '/mm/po'
        : selected.startsWith('/mm/gr')
          ? '/mm/gr'
          : selected.startsWith('/mm/invoices')
            ? '/mm/invoices'
            : selected.startsWith('/sd/so')
              ? '/sd/so'
              : selected.startsWith('/sd/deliveries')
                ? '/sd/deliveries'
                : selected.startsWith('/sd/billings')
                  ? '/sd/billings'
                  : selected.startsWith('/fi')
                    ? '/fi/trial-balance'
                    : selected.startsWith('/inventory')
                      ? '/inventory'
                      : selected,
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth={0}
        width={236}
        style={{ background: '#1b2a3a' }}
      >
        <div className="logo-block">
          <div className="logo-mark">SAP</div>
          <div>
            <div className="logo-title">学习版 Mini ERP</div>
            <div className="logo-sub">O2C · P2P · 库存 · FI</div>
          </div>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          items={items}
          style={{ background: '#1b2a3a', borderInlineEnd: 0 }}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <Typography.Title level={4} style={{ margin: 0 }}>
            用一张完整单据流，学懂 SAP 端到端业务
          </Typography.Title>
          <Typography.Text type="secondary">教学演示 · SQLite · 非生产系统</Typography.Text>
        </Header>
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
