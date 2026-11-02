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
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useAsync, useMaster } from '../../api/hooks';
import type { DocFlow, PurchaseRequisition } from '../../api/types';
import { DocFlowView } from '../../components/DocFlow';
import { TipCard } from '../../components/TipCard';
import { StatusTag } from '../../components/StatusTag';
import { dt, q } from '../../components/format';

export function PrListPage() {
  const { data, loading } = useAsync(
    () => api.get<PurchaseRequisition[]>('/purchase-requisitions'),
    [],
  );
  return (
    <div>
      <div className="page-head">
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            采购申请
          </Typography.Title>
          <Typography.Paragraph type="secondary">
            对应 SAP ME51N。申请只表达内部需求，释放后才能转成对供应商的采购订单。
          </Typography.Paragraph>
        </div>
        <Link to="/mm/pr/new">
          <Button type="primary">新建采购申请</Button>
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
            render: (v: string, r) => <Link to={`/mm/pr/${r.id}`}>{v}</Link>,
          },
          { title: '申请人', dataIndex: 'requester' },
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

export function PrCreatePage() {
  const nav = useNavigate();
  const master = useMaster();
  const [form] = Form.useForm();

  async function submit() {
    try {
      const values = await form.validateFields();
      const created = await api.post<PurchaseRequisition>('/purchase-requisitions', values);
      message.success(`已创建 ${created.docNumber}`);
      nav(`/mm/pr/${created.id}`);
    } catch (e) {
      if (e instanceof Error && e.message) message.error(e.message);
    }
  }

  return (
    <Card title="新建采购申请">
      <TipCard text="先选物料和工厂、填写数量。保存后是草稿，需要点「释放」才会允许转 PO。" />
      <Form form={form} layout="vertical" initialValues={{ requester: '张学员', items: [{}] }}>
        <Form.Item name="requester" label="申请人">
          <Input />
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
                    rules={[{ required: true, message: '选择物料' }]}
                    label="物料"
                  >
                    <Select
                      style={{ width: 260 }}
                      options={master.data?.materials.map((m) => ({
                        value: m.id,
                        label: `${m.code} ${m.name}`,
                      }))}
                    />
                  </Form.Item>
                  <Form.Item
                    {...field}
                    name={[field.name, 'plantId']}
                    rules={[{ required: true, message: '选择工厂' }]}
                    label="工厂"
                  >
                    <Select
                      style={{ width: 200 }}
                      options={master.data?.plants.map((p) => ({
                        value: p.id,
                        label: `${p.code} ${p.name}`,
                      }))}
                    />
                  </Form.Item>
                  <Form.Item
                    {...field}
                    name={[field.name, 'qty']}
                    rules={[{ required: true, message: '数量' }]}
                    label="数量"
                  >
                    <InputNumber min={0.001} />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(field.name)} />
                </Space>
              ))}
              <Button onClick={() => add()} icon={<PlusOutlined />} style={{ marginBottom: 16 }}>
                添加行
              </Button>
            </>
          )}
        </Form.List>
        <Space>
          <Button type="primary" onClick={() => void submit()}>
            保存草稿
          </Button>
          <Link to="/mm/pr">
            <Button>取消</Button>
          </Link>
        </Space>
      </Form>
    </Card>
  );
}

export function PrDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const master = useMaster();
  const { data, loading, reload } = useAsync(
    () => api.get<PurchaseRequisition>(`/purchase-requisitions/${id}`),
    [id],
  );
  const flow = useAsync(
    () => api.get<DocFlow>(`/process/flow/PR/${id}`),
    [id],
  );
  const [convertOpen, setConvertOpen] = useState(false);
  const [form] = Form.useForm();

  async function release() {
    try {
      await api.post(`/purchase-requisitions/${id}/release`);
      message.success('已释放');
      await reload();
    } catch (e) {
      message.error(e instanceof Error ? e.message : '失败');
    }
  }

  async function convert() {
    try {
      const values = await form.validateFields();
      const po = await api.post<{ id: number; docNumber: string }>(
        `/purchase-requisitions/${id}/convert`,
        values,
      );
      message.success(`已生成 ${po.docNumber}`);
      setConvertOpen(false);
      nav(`/mm/po/${po.id}`);
    } catch (e) {
      if (e instanceof Error && e.message) message.error(e.message);
    }
  }

  return (
    <div>
      <div className="page-head">
        <Typography.Title level={3} style={{ margin: 0 }}>
          采购申请 {data?.docNumber}
        </Typography.Title>
        <Space>
          {data?.nextActions?.some((a) => a.action === 'release') && (
            <Button type="primary" onClick={() => void release()}>
              释放
            </Button>
          )}
          {data?.nextActions?.some((a) => a.action === 'convert') && (
            <Button type="primary" onClick={() => setConvertOpen(true)}>
              转为采购订单
            </Button>
          )}
        </Space>
      </div>
      <TipCard text={data?.tips} />
      <Card loading={loading} style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, md: 3 }}>
          <Descriptions.Item label="状态">
            <StatusTag status={data?.status} />
          </Descriptions.Item>
          <Descriptions.Item label="申请人">{data?.requester}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{dt(data?.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="备注" span={3}>
            {data?.remark || '—'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
      <Card title="行项目" style={{ marginBottom: 16 }}>
        <Table
          rowKey="id"
          pagination={false}
          dataSource={data?.items}
          columns={[
            { title: '行', dataIndex: 'lineNumber', width: 70 },
            {
              title: '物料',
              render: (_, r) => `${r.material.code} ${r.material.name}`,
            },
            { title: '工厂', render: (_, r) => r.plant.code },
            { title: '数量', dataIndex: 'qty', render: q },
          ]}
        />
      </Card>
      <Card title="单据流（Document Flow）">
        <DocFlowView flow={flow.data} />
      </Card>
      <Modal
        title="转为采购订单"
        open={convertOpen}
        onOk={() => void convert()}
        onCancel={() => setConvertOpen(false)}
      >
        <Typography.Paragraph type="secondary">
          选择供应商和收货库存地点。教学版把物料标准价带入采购价，之后可在订单里理解进价。
        </Typography.Paragraph>
        <Form form={form} layout="vertical">
          <Form.Item name="vendorId" label="供应商" rules={[{ required: true }]}>
            <Select
              options={master.data?.vendors.map((v) => ({
                value: v.id,
                label: `${v.code} ${v.name}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="storageLocationId" label="库存地点" rules={[{ required: true }]}>
            <Select
              options={master.data?.slocs.map((s) => ({
                value: s.id,
                label: `${s.plant.code}/${s.code} ${s.name}`,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
