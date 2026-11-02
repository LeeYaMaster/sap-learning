import { Card, Table, Tabs, Tag, Typography } from 'antd';
import { api } from '../../api/client';
import { useAsync } from '../../api/hooks';
import type { Movement, StockRow } from '../../api/types';
import { cny, dt, q } from '../../components/format';

export function InventoryPage() {
  const stock = useAsync(() => api.get<StockRow[]>('/stock'), []);
  const moves = useAsync(() => api.get<Movement[]>('/stock-movements'), []);

  return (
    <div>
      <div className="page-head">
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            库存总览
          </Typography.Title>
          <Typography.Paragraph type="secondary">
            对应 SAP MMBE / MB51。库存按物料 + 工厂 + 库存地点管理；金额按移动平均（收货金额 ÷ 数量）。
          </Typography.Paragraph>
        </div>
      </div>
      <Tabs
        items={[
          {
            key: 'stock',
            label: '当前库存',
            children: (
              <Table
                rowKey="id"
                loading={stock.loading}
                dataSource={stock.data}
                pagination={false}
                locale={{ emptyText: '还没有库存，先做一笔采购收货。' }}
                columns={[
                  {
                    title: '物料',
                    render: (_, r) => `${r.material.code} ${r.material.name}`,
                  },
                  {
                    title: '工厂/库位',
                    render: (_, r) =>
                      `${r.plant.code} ${r.plant.name} / ${r.storageLocation.code} ${r.storageLocation.name}`,
                  },
                  { title: '数量', dataIndex: 'qty', render: q },
                  { title: '库存金额', dataIndex: 'value', render: (v: number) => cny(v) },
                  {
                    title: '移动平均价',
                    render: (_, r) => cny(r.qty ? r.value / r.qty : 0),
                  },
                ]}
              />
            ),
          },
          {
            key: 'moves',
            label: '物料移动',
            children: (
              <Table
                rowKey="id"
                loading={moves.loading}
                dataSource={moves.data}
                columns={[
                  { title: '时间', dataIndex: 'createdAt', render: dt },
                  {
                    title: '类型',
                    render: (_, r) => (
                      <Tag color={r.qty >= 0 ? 'green' : 'red'}>
                        {r.movementType} {r.movementName}
                      </Tag>
                    ),
                  },
                  {
                    title: '物料',
                    render: (_, r) => `${r.material.code} ${r.material.name}`,
                  },
                  {
                    title: '地点',
                    render: (_, r) => `${r.plant.code}/${r.storageLocation.code}`,
                  },
                  { title: '数量', dataIndex: 'qty', render: q },
                  { title: '金额', dataIndex: 'amount', render: (v: number) => cny(v) },
                  { title: '参考单据', dataIndex: 'refNumber' },
                ]}
              />
            ),
          },
        ]}
      />
      <Card size="small" style={{ marginTop: 16 }}>
        <Typography.Text type="secondary">
          101 = 采购收货入库（库存增加）；601 = 销售发货出库（库存减少）。教学版不允许把库存做成负数。
        </Typography.Text>
      </Card>
    </div>
  );
}
