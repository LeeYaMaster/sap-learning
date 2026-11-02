import { Card, Descriptions, Table, Tabs, Tag, Typography } from 'antd';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useAsync } from '../../api/hooks';
import type { JournalEntry, TrialRow } from '../../api/types';
import { DOC_PATH, cny, dt } from '../../components/format';

const TYPE_LABEL: Record<string, string> = {
  ASSET: '资产',
  LIABILITY: '负债',
  EQUITY: '权益',
  REVENUE: '收入',
  EXPENSE: '成本费用',
};

export function FiPage() {
  const nav = useNavigate();
  const trial = useAsync(() => api.get<TrialRow[]>('/trial-balance'), []);
  const journals = useAsync(() => api.get<JournalEntry[]>('/journal-entries'), []);

  return (
    <div>
      <div className="page-head">
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            简易财务 FI
          </Typography.Title>
          <Typography.Paragraph type="secondary">
            收货、发票、发货、开票都会自动生成借贷平衡的会计凭证。科目余额表把所有凭证汇总在一起。
          </Typography.Paragraph>
        </div>
      </div>
      <Tabs
        items={[
          {
            key: 'tb',
            label: '科目余额表',
            children: (
              <Table
                rowKey={(r) => r.account.id}
                loading={trial.loading}
                dataSource={trial.data}
                pagination={false}
                columns={[
                  { title: '科目', render: (_, r) => r.account.code },
                  { title: '名称', render: (_, r) => r.account.name },
                  {
                    title: '类型',
                    render: (_, r) => TYPE_LABEL[r.account.type] ?? r.account.type,
                  },
                  { title: '借方发生额', dataIndex: 'debit', render: (v: number) => cny(v) },
                  { title: '贷方发生额', dataIndex: 'credit', render: (v: number) => cny(v) },
                  {
                    title: '余额',
                    render: (_, r) => (
                      <span>
                        {cny(r.balance)}{' '}
                        <Tag color={r.balanceSide === '借' ? 'blue' : r.balanceSide === '贷' ? 'gold' : 'default'}>
                          {r.balanceSide}
                        </Tag>
                      </span>
                    ),
                  },
                ]}
              />
            ),
          },
          {
            key: 'je',
            label: '会计凭证',
            children: (
              <Table
                rowKey="id"
                loading={journals.loading}
                dataSource={journals.data}
                onRow={(r) => ({
                  onClick: () => nav(`/fi/journals/${r.id}`),
                  style: { cursor: 'pointer' },
                })}
                columns={[
                  { title: '凭证号', dataIndex: 'docNumber' },
                  { title: '摘要', dataIndex: 'description' },
                  { title: '来源', render: (_, r) => `${r.sourceType} ${r.sourceNumber}` },
                  { title: '过账时间', dataIndex: 'postingDate', render: dt },
                ]}
              />
            ),
          },
        ]}
      />
    </div>
  );
}

export function JournalDetailPage() {
  const { id } = useParams();
  const { data, loading } = useAsync(
    () => api.get<JournalEntry>(`/journal-entries/${id}`),
    [id],
  );
  const sourcePath =
    data?.sourceId && DOC_PATH[data.sourceType]
      ? DOC_PATH[data.sourceType](data.sourceId)
      : undefined;

  return (
    <div>
      <Typography.Title level={3}>会计凭证 {data?.docNumber}</Typography.Title>
      <Card loading={loading} style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, md: 2 }}>
          <Descriptions.Item label="摘要">{data?.description}</Descriptions.Item>
          <Descriptions.Item label="过账时间">{dt(data?.postingDate)}</Descriptions.Item>
          <Descriptions.Item label="来源单据">
            {data ? `${data.sourceType} ${data.sourceNumber}` : ''}
            {sourcePath && (
              <>
                {' '}
                <Link to={sourcePath}>打开业务单据</Link>
              </>
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>
      <Table
        rowKey="id"
        pagination={false}
        dataSource={data?.lines}
        columns={[
          { title: '科目', render: (_, r) => `${r.account.code} ${r.account.name}` },
          { title: '借方', dataIndex: 'debit', render: (v: number) => (v ? cny(v) : '') },
          { title: '贷方', dataIndex: 'credit', render: (v: number) => (v ? cny(v) : '') },
          { title: '行文本', dataIndex: 'text' },
        ]}
        summary={(rows) => {
          const list = [...rows];
          const d = list.reduce((s, r) => s + Number(r.debit), 0);
          const c = list.reduce((s, r) => s + Number(r.credit), 0);
          return (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0}>合计</Table.Summary.Cell>
              <Table.Summary.Cell index={1}>{cny(d)}</Table.Summary.Cell>
              <Table.Summary.Cell index={2}>{cny(c)}</Table.Summary.Cell>
              <Table.Summary.Cell index={3} />
            </Table.Summary.Row>
          );
        }}
      />
    </div>
  );
}

