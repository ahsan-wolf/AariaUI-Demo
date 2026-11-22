export interface Employee {
  id: number;
  name: string;
  role: string;
  department: string;
  salary: number;
  status: 'Active' | 'On Leave' | 'Terminated';
  joinDate: string;
}

export const mockEmployees: Employee[] = [
  { id: 101, name: "Eleanor Vance", role: "Principal Architect", department: "Engineering", salary: 165000, status: "Active", joinDate: "2019-03-15" },
  { id: 102, name: "Marcus Brody", role: "Senior Frontend Lead", department: "Engineering", salary: 142000, status: "Active", joinDate: "2020-07-01" },
  { id: 103, name: "Sophia Chen", role: "Product VP", department: "Product", salary: 178000, status: "Active", joinDate: "2018-11-12" },
  { id: 104, name: "Liam Gallagher", role: "DevOps Specialist", department: "Infrastructure", salary: 135000, status: "Active", joinDate: "2021-04-20" },
  { id: 105, name: "Amara Patel", role: "UX Design Director", department: "Design", salary: 148000, status: "Active", joinDate: "2020-02-10" },
  { id: 106, name: "David Kim", role: "Backend Engineer", department: "Engineering", salary: 128000, status: "On Leave", joinDate: "2022-01-18" },
  { id: 107, name: "Clara Oswald", role: "Security Engineer", department: "Security", salary: 152000, status: "Active", joinDate: "2019-09-05" },
  { id: 108, name: "Robert Chase", role: "QA Automation Lead", department: "Quality", salary: 122000, status: "Active", joinDate: "2021-08-30" },
];

export interface OrderItem {
  orderId: string;
  customer: string;
  total: number;
  itemsCount: number;
  orderDate: string;
  status: 'Shipped' | 'Processing' | 'Pending' | 'Cancelled';
}

export type Order = OrderItem;

export const mockOrders: OrderItem[] = [
  { orderId: "ORD-9281", customer: "Acme Global Corp", total: 12450.00, itemsCount: 42, orderDate: "2026-09-28", status: "Shipped" },
  { orderId: "ORD-9282", customer: "Nexus Financial", total: 4890.50, itemsCount: 12, orderDate: "2026-09-29", status: "Processing" },
  { orderId: "ORD-9283", customer: "Starlight Media", total: 18200.00, itemsCount: 65, orderDate: "2026-09-30", status: "Shipped" },
  { orderId: "ORD-9284", customer: "Apex Health Group", total: 3100.25, itemsCount: 8, orderDate: "2026-10-01", status: "Pending" },
  { orderId: "ORD-9285", customer: "Vanguard Tech", total: 9400.00, itemsCount: 29, orderDate: "2026-10-01", status: "Processing" },
];

export interface SiteMapNodeItem {
  title: string;
  url: string;
  children?: SiteMapNodeItem[];
}

export const mockSiteMap: SiteMapNodeItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    children: [
      { title: "Analytics Overview", url: "/dashboard/analytics" },
      { title: "Real-time Monitoring", url: "/dashboard/monitoring" },
      { title: "Financial KPIs", url: "/dashboard/kpis" },
    ],
  },
  {
    title: "Customer Management",
    url: "/customers",
    children: [
      { title: "All Accounts", url: "/customers/all" },
      { title: "Enterprise Leads", url: "/customers/leads" },
      { title: "Support Tickets", url: "/customers/support" },
    ],
  },
  {
    title: "System Administration",
    url: "/admin",
    children: [
      { title: "User Roles & Permissions", url: "/admin/roles" },
      { title: "Audit Trail", url: "/admin/audit" },
      { title: "API Keys & Integrations", url: "/admin/integrations" },
    ],
  },
];
