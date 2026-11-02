import { Card, Descriptions, Table, Typography } from 'antd';
import { useAsync } from '../../api/hooks';
import { api } from '../../api/client';
import type { OrgResponse, Plant } from '../../api/types';

export function OrgPage() {
  const { data, loading } = useAsync(() => api.get<OrgResponse>('/org'), []);
  const plants: Plant[] = data?.companies.flatMap((c) => c.plants) ?? [];

  return (
    <div>
      <div className="page-head">
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            组织主数据
          </Typography.Title>
          <Typography.Paragraph type="secondary">
            对应 SAP 的公司代码 / 工厂 / 库存地点。本教学版只保留一层最常用结构：一张公司、一座工厂、两个仓库。
          </Typography.Paragraph>
        </div>
      </div>
      {data?.companies.map((c) => (
        <Card key={c.id} title={`${c.code} ${c.name}`} style={{ marginBottom: 16 }} loading={loading}>
          <Descriptions column={2} size="small">
            <Descriptions.Item label="公司代码">{c.code}</Descriptions.Item>
            <Descriptions.Item label="对应 SAP">公司代码 Company Code</Descriptions.Item>
          </Descriptions>
        </Card>
      ))}
      <Card title="工厂与库存地点">
        <Table
          rowKey="id"
          loading={loading}
          pagination={false}
          dataSource={plants}
          columns={[
            { title: '工厂', dataIndex: 'code', width: 100 },
            { title: '名称', dataIndex: 'name' },
            {
              title: '库存地点',
              render: (_, p) =>
                (p.storageLocations ?? [])
                  .map((s) => `${s.code} ${s.name}`)
                  .join('、') || '—',
            },
          ]}
        />
      </Card>
    </div>
  );
}
