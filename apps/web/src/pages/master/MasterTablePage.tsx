import { Button, Form, Input, InputNumber, Modal, Select, Space, Table, Typography, message } from 'antd';
import { useState } from 'react';
import { api } from '../../api/client';
import { useAsync } from '../../api/hooks';
import { cny } from '../../components/format';

interface Props {
  title: string;
  hint: string;
  path: string;
  extraFields?: 'material' | 'city';
}

export function MasterTablePage({ title, hint, path, extraFields }: Props) {
  const { data, loading, reload } = useAsync(() => api.get<Record<string, unknown>[]>(path), [path]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  async function onCreate() {
    try {
      const values = await form.validateFields();
      await api.post(path, values);
      message.success('已保存');
      setOpen(false);
      form.resetFields();
      await reload();
    } catch (e) {
      if (e instanceof Error && e.message) message.error(e.message);
    }
  }

  const columns =
    extraFields === 'material'
      ? [
          { title: '物料号', dataIndex: 'code' },
          { title: '描述', dataIndex: 'name' },
          { title: '单位', dataIndex: 'unit', width: 80 },
          { title: '类别', dataIndex: 'category', width: 100 },
          {
            title: '标准价',
            dataIndex: 'standardPrice',
            render: (v: number) => cny(v),
          },
        ]
      : [
          { title: '编号', dataIndex: 'code' },
          { title: '名称', dataIndex: 'name' },
          { title: '城市', dataIndex: 'city' },
        ];

  return (
    <div>
      <div className="page-head">
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            {title}
          </Typography.Title>
          <Typography.Paragraph type="secondary">{hint}</Typography.Paragraph>
        </div>
        <Button type="primary" onClick={() => setOpen(true)}>
          新建
        </Button>
      </div>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={columns}
        pagination={false}
      />
      <Modal
        title={`新建${title}`}
        open={open}
        onOk={() => void onCreate()}
        onCancel={() => setOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="编号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          {extraFields === 'city' && (
            <Form.Item name="city" label="城市">
              <Input />
            </Form.Item>
          )}
          {extraFields === 'material' && (
            <>
              <Space style={{ display: 'flex' }} align="start">
                <Form.Item name="unit" label="单位" initialValue="EA">
                  <Input style={{ width: 120 }} />
                </Form.Item>
                <Form.Item name="category" label="类别" initialValue="成品">
                  <Select
                    style={{ width: 160 }}
                    options={[
                      { value: '成品', label: '成品' },
                      { value: '配件', label: '配件' },
                      { value: '原材料', label: '原材料' },
                    ]}
                  />
                </Form.Item>
              </Space>
              <Form.Item name="standardPrice" label="标准价" initialValue={0}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
}
