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
import type { DocFlow, LineItem, PurchaseOrder } from '../../api/types';
import { DocFlowView } from '../../components/DocFlow';
import { StatusTag } from '../../components/StatusTag';
import { TipCard } from '../../components/TipCard';
import { cny, dt, q } from '../../components/format';

export function PoListPage() {
  const { data, loading } = useAsync(
    () => api.get<PurchaseOrder[]>('/purchase-orders'),
    [],
  );
  return (
    <div>
      <div className="page-head">
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            采购订单
          </Typography.Title>
          <Typography.Paragraph type="secondary">
            对应 SAP ME21N。可以从采购申请转换，也可以直接创建。收货、发票都在订单详情上操作。
          </Typography.Paragraph>
        </div>
        <Link to="/mm/po/new">
          <Button type="primary">直接创建采购订单</Button>
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
            render: (v: string, r) => <Link to={`/mm/po/${r.id}`}>{v}</Link>,
          },
          {
            title: '供应商',
            render: (_, r) => `${r.vendor.code} ${r.vendor.name}`,
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

export function PoCreatePage() {
  const nav = useNavigate();
  const master = useMaster();
  const [form] = Form.useForm();

  async function submit() {
    try {
      const values = await form.validateFields();
      const created = await api.post<PurchaseOrder>('/purchase-orders', values);
      message.success(`已创建 ${created.docNumber}`);
      nav(`/mm/po/${created.id}`);
    } catch (e) {
      if (e instanceof Error && e.message) message.error(e.message);
    }
  }

  return (
    <Card title="新建采购订单">
      <TipCard text="不经过采购申请也可以下单（SAP 同样允许）。请填写进价，收货时库存将按该价格增值。" />
      <Form form={form} layout="vertical" initialValues={{ items: [{}] }}>
        <Form.Item name="vendorId" label="供应商" rules={[{ required: true }]}>
          <Select
            options={master.data?.vendors.map((v) => ({
              value: v.id,
              label: `${v.code} ${v.name}`,
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
                    label="单价"
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
          <Link to="/mm/po">
            <Button>取消</Button>
          </Link>
        </Space>
      </Form>
    </Card>
  );
}

export function PoDetailPage() {
  const { id } = useParams();
  const { data, loading, reload } = useAsync(
    () => api.get<PurchaseOrder>(`/purchase-orders/${id}`),
    [id],
  );
  const flow = useAsync(() => api.get<DocFlow>(`/process/flow/PO/${id}`), [id]);
  const [mode, setMode] = useState<'gr' | 'invoice' | null>(null);
  const [qtys, setQtys] = useState<Record<number, number>>({});

  const lines = useMemo(() => data?.items ?? [], [data]);

  function open(kind: 'gr' | 'invoice') {
    const next: Record<number, number> = {};
    for (const it of lines) {
      next[it.id] = kind === 'gr' ? Number(it.openQty ?? 0) : Number(it.uninvoicedQty ?? 0);
    }
    setQtys(next);
    setMode(kind);
  }

  async function post() {
    if (!data || !mode) return;
    const items = lines
      .map((it) => ({ poItemId: it.id, qty: Number(qtys[it.id] || 0) }))
      .filter((x) => x.qty > 0);
    if (!items.length) {
      message.warning('请填写数量');
      return;
    }
    try {
      const path = mode === 'gr' ? '/goods-receipts' : '/vendor-invoices';
      const created = await api.post<{ id: number; docNumber: string }>(path, {
        poId: data.id,
        items,
      });
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
          采购订单 {data?.docNumber}
        </Typography.Title>
        <Space>
          {data?.nextActions?.some((a) => a.action === 'gr') && (
            <Button type="primary" onClick={() => open('gr')}>
              收货入库
            </Button>
          )}
          {data?.nextActions?.some((a) => a.action === 'invoice') && (
            <Button onClick={() => open('invoice')}>发票校验</Button>
          )}
        </Space>
      </div>
      <TipCard text={data?.tips} />
      <Card loading={loading} style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, md: 3 }}>
          <Descriptions.Item label="状态">
            <StatusTag status={data?.status} />
          </Descriptions.Item>
          <Descriptions.Item label="供应商">
            {data ? `${data.vendor.code} ${data.vendor.name}` : ''}
          </Descriptions.Item>
          <Descriptions.Item label="来源申请">
            {data?.pr ? (
              <Link to={`/mm/pr/${data.pr.id}`}>{data.pr.docNumber}</Link>
            ) : (
              '直接创建'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">{dt(data?.createdAt)}</Descriptions.Item>
        </Descriptions>
      </Card>
      <Card title="行项目" style={{ marginBottom: 16 }}>
        <Table
          rowKey="id"
          pagination={false}
          dataSource={lines}
          columns={[
            { title: '行', dataIndex: 'lineNumber', width: 70 },
            {
              title: '物料',
              render: (_, r: LineItem) => `${r.material.code} ${r.material.name}`,
            },
            {
              title: '工厂/库位',
              render: (_, r) =>
                `${r.plant.code}/${r.storageLocation?.code ?? ''}`,
            },
            { title: '订单数量', dataIndex: 'qty', render: q },
            { title: '单价', dataIndex: 'unitPrice', render: (v: number) => cny(v) },
            { title: '已收货', dataIndex: 'receivedQty', render: q },
            { title: '已开票', dataIndex: 'invoicedQty', render: q },
            { title: '未清收货', dataIndex: 'openQty', render: q },
          ]}
          scroll={{ x: 900 }}
        />
      </Card>
      <Card title="单据流" style={{ marginBottom: 16 }}>
        <DocFlowView flow={flow.data} />
      </Card>
      <Modal
        title={mode === 'gr' ? '收货入库（MIGO）' : '发票校验（MIRO）'}
        open={!!mode}
        onOk={() => void post()}
        onCancel={() => setMode(null)}
        okText="过账"
      >
        <Typography.Paragraph type="secondary">
          {mode === 'gr'
            ? '数量不能超过订单未清数量。过账后库存增加，并生成借库存 / 贷暂估的凭证。'
            : '只能对已收货未开票数量开票（三单匹配）。过账后暂估转为应付账款。'}
        </Typography.Paragraph>
        {lines.map((it) => {
          const max =
            mode === 'gr' ? Number(it.openQty ?? 0) : Number(it.uninvoicedQty ?? 0);
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
