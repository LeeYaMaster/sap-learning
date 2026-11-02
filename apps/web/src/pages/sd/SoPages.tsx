import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Typography,
  message,
} from 'antd';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useAsync, useMaster } from '../../api/hooks';
import type { DocFlow, LineItem, SalesOrder } from '../../api/types';
import { DocFlowView } from '../../components/DocFlow';
import { StatusTag } from '../../components/StatusTag';
import { TipCard } from '../../components/TipCard';
import { cny, dt, q } from '../../components/format';

export function SoListPage() {
  const { data, loading } = useAsync(() => api.get<SalesOrder[]>('/sales-orders'), []);
  return (
    <div>
      <div className="page-head">
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            销售订单
          </Typography.Title>
          <Typography.Paragraph type="secondary">
            对应 SAP VA01。发货不能超过订单数量，库存不足会被拒绝（不允许负库存）。
          </Typography.Paragraph>
        </div>
        <Link to="/sd/so/new">
          <Button type="primary">新建销售订单</Button>
        </Link>
      </div>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={[
          {
            title: '单号',
            dataIndex: 'docNumber',
            render: (v: string, r) => <Link to={`/sd/so/${r.id}`}>{v}</Link>,
          },
          {
            title: '客户',
            render: (_, r) => `${r.customer.code} ${r.customer.name}`,
          },
          {
            title: '状态',
            dataIndex: 'status',
            render: (s: string) => <StatusTag status={s} />,
          },
          { title: '创建时间', dataIndex: 'createdAt', render: dt },
        ]}
      />
    </div>
  );
}

export function SoCreatePage() {
  const nav = useNavigate();
  const master = useMaster();
  const [form] = Form.useForm();

  async function submit() {
    try {
      const values = await form.validateFields();
      const created = await api.post<SalesOrder>('/sales-orders', values);
      message.success(`已创建 ${created.docNumber}`);
      nav(`/sd/so/${created.id}`);
    } catch (e) {
      if (e instanceof Error && e.message) message.error(e.message);
    }
  }

  return (
    <Card title="新建销售订单">
      <TipCard text="售价可以高于采购进价。发货时成本按库存移动平均计算，差额就是毛利的来源。" />
      <Form form={form} layout="vertical" initialValues={{ items: [{}] }}>
        <Form.Item name="customerId" label="客户" rules={[{ required: true }]}>
          <Select
            options={master.data?.customers.map((c) => ({
              value: c.id,
              label: `${c.code} ${c.name}`,
            }))}
          />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input />
        </Form.Item>
        <Form.List name="items">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field) => (
                <Space key={field.key} align="baseline" wrap>
                  <Form.Item
                    {...field}
                    name={[field.name, 'materialId']}
                    label="物料"
                    rules={[{ required: true }]}
                  >
                    <Select
                      style={{ width: 220 }}
                      options={master.data?.materials.map((m) => ({
                        value: m.id,
                        label: `${m.code} ${m.name}`,
                      }))}
                    />
                  </Form.Item>
                  <Form.Item
                    {...field}
                    name={[field.name, 'plantId']}
                    label="工厂"
                    rules={[{ required: true }]}
                  >
                    <Select
                      style={{ width: 160 }}
                      options={master.data?.plants.map((p) => ({
                        value: p.id,
                        label: `${p.code} ${p.name}`,
                      }))}
                    />
                  </Form.Item>
                  <Form.Item
                    {...field}
                    name={[field.name, 'storageLocationId']}
                    label="库存地点"
                    rules={[{ required: true }]}
                  >
                    <Select
                      style={{ width: 180 }}
                      options={master.data?.slocs.map((s) => ({
                        value: s.id,
                        label: `${s.plant.code}/${s.code} ${s.name}`,
                      }))}
                    />
                  </Form.Item>
                  <Form.Item
                    {...field}
                    name={[field.name, 'qty']}
                    label="数量"
                    rules={[{ required: true }]}
                  >
                    <InputNumber min={0.001} />
                  </Form.Item>
                  <Form.Item
                    {...field}
                    name={[field.name, 'unitPrice']}
                    label="售价"
                    rules={[{ required: true }]}
                  >
                    <InputNumber min={0} />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(field.name)} />
                </Space>
              ))}
              <Button icon={<PlusOutlined />} onClick={() => add()} style={{ marginBottom: 16 }}>
                添加行
              </Button>
            </>
          )}
        </Form.List>
        <Space>
          <Button type="primary" onClick={() => void submit()}>
            保存
          </Button>
          <Link to="/sd/so">
            <Button>取消</Button>
          </Link>
        </Space>
      </Form>
    </Card>
  );
}

export function SoDetailPage() {
  const { id } = useParams();
  const { data, loading, reload } = useAsync(
    () => api.get<SalesOrder>(`/sales-orders/${id}`),
    [id],
  );
  const flow = useAsync(() => api.get<DocFlow>(`/process/flow/SO/${id}`), [id]);
  const [mode, setMode] = useState<'deliver' | 'bill' | null>(null);
  const [qtys, setQtys] = useState<Record<number, number>>({});
  const lines = useMemo(() => data?.items ?? [], [data]);

  function open(kind: 'deliver' | 'bill') {
    const next: Record<number, number> = {};
    for (const it of lines) {
      next[it.id] = kind === 'deliver' ? Number(it.openQty ?? 0) : Number(it.unbilledQty ?? 0);
    }
    setQtys(next);
    setMode(kind);
  }

  async function post() {
    if (!data || !mode) return;
    const items = lines
      .map((it) => ({ soItemId: it.id, qty: Number(qtys[it.id] || 0) }))
      .filter((x) => x.qty > 0);
    if (!items.length) {
      message.warning('请填写数量');
      return;
    }
    try {
      const path = mode === 'deliver' ? '/deliveries' : '/customer-billings';
      const created = await api.post<{ docNumber: string }>(path, { soId: data.id, items });
      message.success(`已过账 ${created.docNumber}`);
      setMode(null);
      await reload();
    } catch (e) {
      message.error(e instanceof Error ? e.message : '过账失败');
    }
  }

  return (
    <div>
      <div className="page-head">
        <Typography.Title level={3} style={{ margin: 0 }}>
          销售订单 {data?.docNumber}
        </Typography.Title>
        <Space>
          {data?.nextActions?.some((a) => a.action === 'deliver') && (
            <Button type="primary" onClick={() => open('deliver')}>
              发货过账
            </Button>
          )}
          {data?.nextActions?.some((a) => a.action === 'bill') && (
            <Button onClick={() => open('bill')}>客户开票</Button>
          )}
        </Space>
      </div>
      <TipCard text={data?.tips} />
      <Card loading={loading} style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, md: 3 }}>
          <Descriptions.Item label="状态">
            <StatusTag status={data?.status} />
          </Descriptions.Item>
          <Descriptions.Item label="客户">
            {data ? `${data.customer.code} ${data.customer.name}` : ''}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">{dt(data?.createdAt)}</Descriptions.Item>
        </Descriptions>
      </Card>
      <Card title="行项目" style={{ marginBottom: 16 }}>
        <Table
          rowKey="id"
          pagination={false}
          dataSource={lines}
          scroll={{ x: 900 }}
          columns={[
            { title: '行', dataIndex: 'lineNumber', width: 70 },
            {
              title: '物料',
              render: (_, r: LineItem) => `${r.material.code} ${r.material.name}`,
            },
            {
              title: '工厂/库位',
              render: (_, r) => `${r.plant.code}/${r.storageLocation?.code ?? ''}`,
            },
            { title: '订单数量', dataIndex: 'qty', render: q },
            { title: '售价', dataIndex: 'unitPrice', render: (v: number) => cny(v) },
            { title: '已发货', dataIndex: 'deliveredQty', render: q },
            { title: '已开票', dataIndex: 'billedQty', render: q },
            { title: '未清发货', dataIndex: 'openQty', render: q },
          ]}
        />
      </Card>
      <Card title="单据流">
        <DocFlowView flow={flow.data} />
      </Card>
      <Modal
        title={mode === 'deliver' ? '发货过账（VL01N）' : '客户开票（VF01）'}
        open={!!mode}
        onOk={() => void post()}
        onCancel={() => setMode(null)}
        okText="过账"
      >
        <Typography.Paragraph type="secondary">
          {mode === 'deliver'
            ? '不能超过订单未清数量，也不能把库存打成负数。'
            : '只能对已发货未开票数量开票。'}
        </Typography.Paragraph>
        {lines.map((it) => {
          const max =
            mode === 'deliver' ? Number(it.openQty ?? 0) : Number(it.unbilledQty ?? 0);
          return (
            <div key={it.id} style={{ marginBottom: 12 }}>
              <div>
                {it.material.code} {it.material.name}　可过账 {q(max)}
              </div>
              <InputNumber
                min={0}
                max={max}
                value={qtys[it.id]}
                onChange={(v) => setQtys((s) => ({ ...s, [it.id]: Number(v || 0) }))}
              />
            </div>
          );
        })}
      </Modal>
    </div>
  );
}
