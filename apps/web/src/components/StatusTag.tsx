import { Tag } from 'antd';

const MAP: Record<string, { color: string; text: string }> = {
  DRAFT: { color: 'default', text: '草稿' },
  RELEASED: { color: 'blue', text: '已释放' },
  CONVERTED: { color: 'green', text: '已转单' },
  OPEN: { color: 'blue', text: '未清' },
  PARTIAL: { color: 'gold', text: '部分完成' },
  RECEIVED: { color: 'cyan', text: '已收货' },
  DELIVERED: { color: 'cyan', text: '已发货' },
  CLOSED: { color: 'green', text: '已完成' },
  POSTED: { color: 'green', text: '已过账' },
};

export function StatusTag({ status }: { status?: string }) {
  if (!status) return null;
  const meta = MAP[status] ?? { color: 'default', text: status };
  return <Tag color={meta.color}>{meta.text}</Tag>;
}
