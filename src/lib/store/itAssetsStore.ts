export interface ITAsset {
  id: string;
  asset_name: string;
  serial_number: string;
  status: 'AVAILABLE' | 'ASSIGNED' | 'RECOVERED' | 'UNDER_REPAIR';
  assigned_to: string | null;
  assigned_employee_name?: string;
  assigned_date: string | null;
  created_at: string;
}

export const INITIAL_IT_ASSETS: ITAsset[] = [
  {
    id: 'ast-101',
    asset_name: 'MacBook Pro 16" M3 Max',
    serial_number: 'C02G8192MD6R',
    status: 'ASSIGNED',
    assigned_to: 'e2222222-2222-2222-2222-222222222222',
    assigned_employee_name: 'Marcus Chen',
    assigned_date: '2023-06-01T09:00:00Z',
    created_at: '2023-06-01T09:00:00Z',
  },
  {
    id: 'ast-102',
    asset_name: 'Dell UltraSharp 34" Curved Monitor',
    serial_number: 'CN092817263541',
    status: 'ASSIGNED',
    assigned_to: 'e3333333-3333-3333-3333-333333333333',
    assigned_employee_name: 'Alex Rivera',
    assigned_date: '2023-01-10T10:00:00Z',
    created_at: '2023-01-10T10:00:00Z',
  },
  {
    id: 'ast-103',
    asset_name: 'MacBook Air 15" M2',
    serial_number: 'C02H9182NB7S',
    status: 'AVAILABLE',
    assigned_to: null,
    assigned_date: null,
    created_at: '2024-01-15T08:30:00Z',
  },
  {
    id: 'ast-104',
    asset_name: 'Keychron K8 Pro Wireless Keyboard',
    serial_number: 'KC8-92817263',
    status: 'UNDER_REPAIR',
    assigned_to: null,
    assigned_date: null,
    created_at: '2024-03-01T11:00:00Z',
  },
];

export let memoryAssetsStore: ITAsset[] = [...INITIAL_IT_ASSETS];
