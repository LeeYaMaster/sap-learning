import { Card, Descriptions, Table, Typography } from 'antd';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useAsync } from '../../api/hooks';
import type { DocFlow } from '../../api/types';
import { DocFlowView } from '../../components/DocFlow';
import { StatusTag } from '../../components/StatusTag';
import { TipCard } from '../../components/TipCard';
import { DOC_PATH, cny, dt, q } from '../../components/format';

interface Cfg {
  title: string;
  listPath: string;
  flowType: string;
  parentType: 'PO' | 'SO';
  parentLabel: string;
  hint: string;
  extra?: 'amount' | 'cogs';
}

const cfgs: Record<string, Cfg> = {
  gr: {
    title: '收货入库',
    listPath: '/goods-receipts',
    flowType: 'GR',
    parentType: 'PO',
    parentLabel: '采购订单',
    hint: '对应 MIGO。每张收货单都会增加库存，并过账库存 / GR-IR。',
  },
  vi: {
    title: '供应商发票',
    listPath: '/vendor-invoices',
    flowType: 'VI',
    parentType: 'PO',
    parentLabel: '采购订单',
    hint: '对应 MIRO。三单匹配后把暂估转为应付账款。',
    extra: 'amount',
  },
  dn: {
    title: '发货出库',
    listPath: '/deliveries',
    flowType: 'DN',
    parentType: 'SO',
    parentLabel: '销售订单',
    hint: '对应 VL01N。发货扣库存，并结转销售成本。',
    extra: 'cogs',
  },
  bi: {
    title: '客户开票',
    listPath: '/customer-billings',
    flowType: 'BI',
    parentType: 'SO',
    parentLabel: '销售订单',
    hint: '对应 VF01。确认应收账款与销售收入。',
    extra: 'amount',
  },
};

export function PostedListPage({ kind }: { kind: keyof typeof cfgs }) {
  const cfg = cfgs[kind];
  const { data, loading } = useAsync(
    () => api.get<Record<string, unknown>[]>(cfg.listPath),
    [kind],
  );
  return (
    <div>
      <div className="page-head">
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            {cfg.title}
          </Typography.Title>
          <Typography.Paragraph type="secondary">{cfg.hint}</Typography.Paragraph>
        </div>
      </div>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={[
          {
            title: '单号',
            dataIndex: 'docNumber',
            render: (v: string, r) => (
              <Link to={`${listRoute(kind)}/${r.id as number}`}>{v}</Link>
            ),
          },
          {
            title: '状态',
            dataIndex: 'status',
            render: (s: string) => <StatusTag status={s} />,
          },
          {
            title: cfg.parentLabel,
            render: (_, r) => {
              const parent = r[cfg.parentType === 'PO' ? 'po' : 'so'] as
                | { id: number; docNumber: string }
                | undefined;
              if (!parent) return '—';
              return (
                <Link to={DOC_PATH[cfg.parentType](parent.id)}>{parent.docNumber}</Link>
              );
            },
          },
          { title: '过账时间', dataIndex: 'postingDate', render: (v: string) => dt(v) },
        ]}
      />
    </div>
  );
}

export function PostedDetailPage({ kind }: { kind: keyof typeof cfgs }) {
  const cfg = cfgs[kind];
  const { id } = useParams();
  const { data, loading } = useAsync(
    () => api.get<Record<string, unknown>>(`${cfg.listPath}/${id}`),
    [kind, id],
  );
  const flow = useAsync(
    () => api.get<DocFlow>(`/process/flow/${cfg.flowType}/${id}`),
    [kind, id],
  );
  const parent = data?.[cfg.parentType === 'PO' ? 'po' : 'so'] as
    | { id: number; docNumber: string }
    | undefined;
  const items = (data?.items as Array<Record<string, unknown>>) ?? [];

  return (
    <div>
      <Typography.Title level={3}>
        {cfg.title} {String(data?.docNumber ?? '')}
      </Typography.Title>
      <TipCard text={data?.tips as string | undefined} />
      <Card loading={loading} style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, md: 3 }}>
          <Descriptions.Item label="状态">
            <StatusTag status={data?.status as string} />
          </Descriptions.Item>
          <Descriptions.Item label={cfg.parentLabel}>
            {parent ? (
              <Link to={DOC_PATH[cfg.parentType](parent.id)}>{parent.docNumber}</Link>
            ) : (
              '—'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="过账时间">{dt(data?.postingDate as string)}</Descriptions.Item>
          {cfg.extra === 'amount' && (
            <Descriptions.Item label="金额">{cny(data?.amount as number)}</Descriptions.Item>
          )}
          {cfg.extra === 'cogs' && (
            <Descriptions.Item label="结转成本">
              {cny(data?.cogsAmount as number)}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>
      <Card title="行项目" style={{ marginBottom: 16 }}>
        <Table
          rowKey="id"
          pagination={false}
          dataSource={items}
          columns={[
            {
              title: '物料',
              render: (_, r) => {
                const m = r.material as { code: string; name: string };
                return `${m.code} ${m.name}`;
              },
            },
            { title: '数量', dataIndex: 'qty', render: (v: number) => q(v) },
            {
              title: '单价/成本',
              render: (_, r) => cny((r.unitPrice as number) ?? (r.unitCost as number) ?? 0),
            },
          ]}
        />
      </Card>
      <Card title="单据流">
        <DocFlowView flow={flow.data} />
      </Card>
    </div>
  );
}

function listRoute(kind: string) {
  if (kind === 'gr') return '/mm/gr';
  if (kind === 'vi') return '/mm/invoices';
  if (kind === 'dn') return '/sd/deliveries';
  return '/sd/billings';
}
