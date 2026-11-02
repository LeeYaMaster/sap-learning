import { Button, Empty, Space, Tag } from 'antd';
import { Link } from 'react-router-dom';
import type { DocFlow as DocFlowType, FlowNode } from '../api/types';
import { DOC_LABEL, DOC_PATH } from './format';
import { StatusTag } from './StatusTag';

export function DocFlowView({ flow }: { flow?: DocFlowType | null }) {
  if (!flow?.nodes?.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无关联单据" />;
  }
  return (
    <Space wrap size="middle">
      {flow.nodes.map((n: FlowNode, idx) => (
        <span key={`${n.type}-${n.id}`}>
          {idx > 0 && <span className="flow-arrow">→</span>}
          <Link to={DOC_PATH[n.type]?.(n.id) ?? '/'}>
            <Button size="small">
              <Tag style={{ marginInlineEnd: 6 }}>{DOC_LABEL[n.type] ?? n.type}</Tag>
              {n.docNumber} <StatusTag status={n.status} />
            </Button>
          </Link>
        </span>
      ))}
    </Space>
  );
}
