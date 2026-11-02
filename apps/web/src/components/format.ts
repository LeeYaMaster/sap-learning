export function cny(n: number | undefined | null) {
  const v = Number(n ?? 0);
  return `¥${v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function q(n: number | undefined | null) {
  const v = Number(n ?? 0);
  return v.toLocaleString('zh-CN', { maximumFractionDigits: 3 });
}

export function dt(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('zh-CN', { hour12: false });
}

export const DOC_PATH: Record<string, (id: number) => string> = {
  PR: (id) => `/mm/pr/${id}`,
  PO: (id) => `/mm/po/${id}`,
  GR: (id) => `/mm/gr/${id}`,
  VI: (id) => `/mm/invoices/${id}`,
  SO: (id) => `/sd/so/${id}`,
  DN: (id) => `/sd/deliveries/${id}`,
  BI: (id) => `/sd/billings/${id}`,
  FI: (id) => `/fi/journals/${id}`,
};

export const DOC_LABEL: Record<string, string> = {
  PR: '采购申请',
  PO: '采购订单',
  GR: '收货单',
  VI: '供应商发票',
  SO: '销售订单',
  DN: '交货单',
  BI: '客户发票',
  FI: '会计凭证',
};
