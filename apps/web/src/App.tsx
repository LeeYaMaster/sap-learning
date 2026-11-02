import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { PostedDetailPage, PostedListPage } from './pages/docs/PostedDocPages';
import { FiPage, JournalDetailPage } from './pages/fi/FiPages';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { MasterTablePage } from './pages/master/MasterTablePage';
import { OrgPage } from './pages/master/OrgPage';
import { PoCreatePage, PoDetailPage, PoListPage } from './pages/mm/PoPages';
import { PrCreatePage, PrDetailPage, PrListPage } from './pages/mm/PrPages';
import { SoCreatePage, SoDetailPage, SoListPage } from './pages/sd/SoPages';

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#0A6ED1',
          borderRadius: 8,
          fontFamily:
            '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/master/org" element={<OrgPage />} />
            <Route
              path="/master/materials"
              element={
                <MasterTablePage
                  title="物料"
                  path="/materials"
                  extraFields="material"
                  hint="对应 SAP 物料主数据 MM01。标准价会在「采购申请转订单」时作为默认进价。"
                />
              }
            />
            <Route
              path="/master/customers"
              element={
                <MasterTablePage
                  title="客户"
                  path="/customers"
                  extraFields="city"
                  hint="对应 SAP 客户主数据 VD01 / BP。销售订单必须选择客户。"
                />
              }
            />
            <Route
              path="/master/vendors"
              element={
                <MasterTablePage
                  title="供应商"
                  path="/vendors"
                  extraFields="city"
                  hint="对应 SAP 供应商主数据 XK01 / BP。采购订单必须选择供应商。"
                />
              }
            />
            <Route path="/mm/pr" element={<PrListPage />} />
            <Route path="/mm/pr/new" element={<PrCreatePage />} />
            <Route path="/mm/pr/:id" element={<PrDetailPage />} />
            <Route path="/mm/po" element={<PoListPage />} />
            <Route path="/mm/po/new" element={<PoCreatePage />} />
            <Route path="/mm/po/:id" element={<PoDetailPage />} />
            <Route path="/mm/gr" element={<PostedListPage kind="gr" />} />
            <Route path="/mm/gr/:id" element={<PostedDetailPage kind="gr" />} />
            <Route path="/mm/invoices" element={<PostedListPage kind="vi" />} />
            <Route path="/mm/invoices/:id" element={<PostedDetailPage kind="vi" />} />
            <Route path="/sd/so" element={<SoListPage />} />
            <Route path="/sd/so/new" element={<SoCreatePage />} />
            <Route path="/sd/so/:id" element={<SoDetailPage />} />
            <Route path="/sd/deliveries" element={<PostedListPage kind="dn" />} />
            <Route path="/sd/deliveries/:id" element={<PostedDetailPage kind="dn" />} />
            <Route path="/sd/billings" element={<PostedListPage kind="bi" />} />
            <Route path="/sd/billings/:id" element={<PostedDetailPage kind="bi" />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/fi/trial-balance" element={<FiPage />} />
            <Route path="/fi/journals/:id" element={<JournalDetailPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
