export interface Named {
  id: number;
  code: string;
  name: string;
}

export interface Material extends Named {
  unit: string;
  standardPrice: number;
  category: string;
}

export interface Partner extends Named {
  city: string;
}

export interface Plant extends Named {
  company: Named;
  storageLocations?: StorageLocation[];
}

export interface StorageLocation extends Named {
  plant: Plant;
}

export interface OrgResponse {
  companies: Array<Named & { plants: Plant[] }>;
}

export interface LineItem {
  id: number;
  lineNumber: number;
  material: Material;
  plant: Plant;
  storageLocation?: StorageLocation;
  qty: number;
  unitPrice?: number;
  unitCost?: number;
  receivedQty?: number;
  invoicedQty?: number;
  deliveredQty?: number;
  billedQty?: number;
  openQty?: number;
  uninvoicedQty?: number;
  unbilledQty?: number;
}

export interface DocRef {
  id: number;
  docNumber: string;
  status: string;
  postingDate?: string;
  amount?: number;
}

export interface Action {
  action: string;
  label: string;
}

export interface PurchaseRequisition {
  id: number;
  docNumber: string;
  status: string;
  requester: string;
  remark: string;
  createdAt: string;
  items: LineItem[];
  relatedPos?: DocRef[];
  tips?: string;
  nextActions?: Action[];
}

export interface PurchaseOrder {
  id: number;
  docNumber: string;
  status: string;
  vendor: Partner;
  pr?: PurchaseRequisition | null;
  remark: string;
  createdAt: string;
  items: LineItem[];
  goodsReceipts?: DocRef[];
  invoices?: DocRef[];
  tips?: string;
  nextActions?: Action[];
}

export interface GoodsReceipt {
  id: number;
  docNumber: string;
  status: string;
  postingDate: string;
  po: PurchaseOrder;
  items: LineItem[];
  tips?: string;
}

export interface VendorInvoice {
  id: number;
  docNumber: string;
  status: string;
  postingDate: string;
  amount: number;
  vendor: Partner;
  po: PurchaseOrder;
  items: LineItem[];
  tips?: string;
}

export interface SalesOrder {
  id: number;
  docNumber: string;
  status: string;
  customer: Partner;
  remark: string;
  createdAt: string;
  items: LineItem[];
  deliveries?: DocRef[];
  billings?: DocRef[];
  tips?: string;
  nextActions?: Action[];
}

export interface Delivery {
  id: number;
  docNumber: string;
  status: string;
  postingDate: string;
  cogsAmount: number;
  so: SalesOrder;
  items: LineItem[];
  tips?: string;
}

export interface CustomerBilling {
  id: number;
  docNumber: string;
  status: string;
  postingDate: string;
  amount: number;
  customer: Partner;
  so: SalesOrder;
  items: LineItem[];
  tips?: string;
}

export interface StockRow {
  id: number;
  material: Material;
  plant: Plant;
  storageLocation: StorageLocation;
  qty: number;
  value: number;
}

export interface Movement {
  id: number;
  material: Material;
  plant: Plant;
  storageLocation: StorageLocation;
  qty: number;
  unitCost: number;
  amount: number;
  movementType: string;
  movementName: string;
  refType: string;
  refNumber: string;
  createdAt: string;
}

export interface GlAccount {
  id: number;
  code: string;
  name: string;
  type: string;
}

export interface JournalLine {
  id: number;
  account: GlAccount;
  debit: number;
  credit: number;
  text: string;
}

export interface JournalEntry {
  id: number;
  docNumber: string;
  description: string;
  sourceType: string;
  sourceNumber: string;
  sourceId?: number | null;
  postingDate: string;
  lines: JournalLine[];
}

export interface TrialRow {
  account: GlAccount;
  debit: number;
  credit: number;
  balance: number;
  balanceSide: string;
}

export interface ProcessStep {
  key: string;
  title: string;
  tcode: string;
  path: string;
  done: boolean;
  blurb: string;
}

export interface Overview {
  counts: Record<string, number>;
  stockQty: number;
  stockValue: number;
  steps: ProcessStep[];
  recent: {
    pr: PurchaseRequisition[];
    po: PurchaseOrder[];
    so: SalesOrder[];
  };
}

export interface FlowNode {
  type: string;
  id: number;
  docNumber: string;
  status: string;
}

export interface DocFlow {
  process: string;
  nodes: FlowNode[];
}
