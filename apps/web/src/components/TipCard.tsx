import { Alert } from 'antd';

export function TipCard({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <Alert
      type="info"
      showIcon
      message="学习提示"
      description={text}
      style={{ marginBottom: 16 }}
    />
  );
}
