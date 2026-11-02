import { ReloadOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Popconfirm,
  Row,
  Space,
  Statistic,
  Typography,
  message,
} from 'antd';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAsync } from '../api/hooks';
import type { Overview } from '../api/types';
import { cny, q } from '../components/format';

export function Dashboard() {
  const { data, loading, reload } = useAsync(
    () => api.get<Overview>('/process/overview'),
    [],
  );
  const p2p = data?.steps.filter((s) =>
    ['master', 'pr', 'po', 'gr', 'vi'].includes(s.key),
  );
  const o2c = data?.steps.filter((s) => ['so', 'dn', 'bi', 'fi'].includes(s.key));

  async function resetDemo() {
    try {
      await api.post('/seed');
      message.success('已重置演示数据');
      await reload();
    } catch (e) {
      message.error(e instanceof Error ? e.message : '重置失败');
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            业务流程导览
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            建议学习路径：先看左侧采购（P2P），再看右侧销售（O2C），最后对照库存与财务凭证。库里已预置一条完整 happy
            path，你也可以用「显示器 / 无线键盘」自己再做一遍。
          </Typography.Paragraph>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => void reload()}>
            刷新
          </Button>
          <Popconfirm
            title="将清空业务单据并重新写入演示数据，确定吗？"
            onConfirm={() => void resetDemo()}
          >
            <Button danger>重置演示数据</Button>
          </Popconfirm>
        </Space>
      </div>

      <div className="kpi-row">
        <Card loading={loading}>
          <Statistic title="采购订单" value={data?.counts.po ?? 0} />
        </Card>
        <Card loading={loading}>
          <Statistic title="销售订单" value={data?.counts.so ?? 0} />
        </Card>
        <Card loading={loading}>
          <Statistic title="库存数量" value={q(data?.stockQty)} />
        </Card>
        <Card loading={loading}>
          <Statistic title="库存金额" value={cny(data?.stockValue)} />
        </Card>
      </div>

      <div className="process-grid">
        <Card title="采购到付款 P2P（Purchase to Pay）">
          {p2p?.map((s, i) => (
            <Step key={s.key} step={s} index={i + 1} />
          ))}
        </Card>
        <Card title="订单到收款 O2C（Order to Cash）">
          {o2c?.map((s, i) => (
            <Step key={s.key} step={s} index={i + 1} />
          ))}
        </Card>
      </div>

      <Card style={{ marginTop: 16 }} title="这条演示数据在算什么？">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Typography.Paragraph>
              <b>采购：</b>申请 10 台笔记本 → 订单进价 ¥4,800 → 全部收货并发票校验。库存先变成 10
              台、金额 ¥48,000。
            </Typography.Paragraph>
            <Typography.Paragraph>
              会计分录：收货时借「库存商品」贷「应付暂估」；发票时借「应付暂估」贷「应付账款」。暂估清零，应付留下
              ¥48,000。
            </Typography.Paragraph>
          </Col>
          <Col xs={24} md={12}>
            <Typography.Paragraph>
              <b>销售：</b>卖给华东数码 3 台，售价 ¥5,999。发货后库存剩 7 台；成本按移动平均（¥4,800）结转
              ¥14,400。
            </Typography.Paragraph>
            <Typography.Paragraph>
              发货：借「主营业务成本」贷「库存」；开票：借「应收账款」贷「主营业务收入」¥17,997。
            </Typography.Paragraph>
          </Col>
        </Row>
        <Space wrap>
          <Link to="/mm/po">
            <Button type="primary">从采购订单看起</Button>
          </Link>
          <Link to="/sd/so">
            <Button>从销售订单看起</Button>
          </Link>
          <Link to="/inventory">
            <Button>看库存</Button>
          </Link>
          <Link to="/fi/trial-balance">
            <Button>看科目余额</Button>
          </Link>
        </Space>
      </Card>
    </div>
  );
}

function Step({
  step,
  index,
}: {
  step: Overview['steps'][number];
  index: number;
}) {
  return (
    <div className={`step-card ${step.done ? 'done' : ''}`}>
      <div className="step-index">{index}</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <b>{step.title}</b>
          <span className="tcode">{step.tcode}</span>
        </div>
        <div style={{ color: '#5b7083', margin: '4px 0 8px' }}>{step.blurb}</div>
        <Link to={step.path}>
          <Button size="small" type={step.done ? 'default' : 'primary'}>
            {step.done ? '查看单据' : '去完成这一步'}
          </Button>
        </Link>
      </div>
    </div>
  );
}
