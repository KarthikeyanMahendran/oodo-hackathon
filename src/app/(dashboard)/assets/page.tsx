'use client';

import React, { useEffect, useState } from 'react';
import {
  Monitor,
  Plus,
  UserCheck,
  MoreVertical,
  Wrench,
  RotateCcw,
  Check,
  Laptop,
} from 'lucide-react';
import { useHRMS } from '@/lib/context/HRMSContext';
import {
  PageHeader,
  Card,
  CardHeader,
  Table,
  Button,
  Input,
  Select,
  Badge,
  Modal,
  EmptyState,
  type Column,
} from '@/components/ui';

interface ITAsset {
  id: string;
  asset_name: string;
  serial_number: string;
  status: 'AVAILABLE' | 'ASSIGNED' | 'RECOVERED' | 'UNDER_REPAIR';
  assigned_to: string | null;
  assigned_employee_name?: string;
  assigned_date: string | null;
  created_at: string;
}

export default function AssetsPage() {
  const { currentRole, employees } = useHRMS();
  const isAdmin = currentRole === 'ADMIN';

  const [assets, setAssets] = useState<ITAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Assign Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(employees[1]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAssets = async () => {
    try {
      const res = await fetch('/api/assets');
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleAssignAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !selectedUserId) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/assets/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset_id: selectedAssetId, user_id: selectedUserId }),
      });

      if (res.ok) {
        setIsAssignModalOpen(false);
        fetchAssets();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (assetId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/assets/${assetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setActiveMenuId(null);
        fetchAssets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAssets = assets.filter((a) => {
    const matchesSearch =
      a.asset_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.serial_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.assigned_employee_name && a.assigned_employee_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const availableAssets = assets.filter((a) => a.status === 'AVAILABLE');

  const columns: Column<ITAsset>[] = [
    {
      header: 'Hardware Asset',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <span className="hr-avatar hr-avatar-sm !bg-zinc-100 dark:!bg-zinc-800 !text-zinc-700 dark:!text-zinc-300">
            <Laptop size={14} />
          </span>
          <div className="hr-cell-stack">
            <span className="hr-cell-primary">{row.asset_name}</span>
            <span className="hr-cell-secondary hr-monospace">{row.serial_number}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row) => (
        <Badge
          tone={
            row.status === 'ASSIGNED'
              ? 'success'
              : row.status === 'AVAILABLE'
              ? 'info'
              : row.status === 'UNDER_REPAIR'
              ? 'warning'
              : 'muted'
          }
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Assigned Employee',
      render: (row) => (
        <span className="hr-cell-primary">
          {row.assigned_employee_name || (row.assigned_to ? 'Employee' : 'Unassigned')}
        </span>
      ),
    },
    {
      header: 'Assigned Date',
      render: (row) => (
        <span className="hr-monospace">
          {row.assigned_date ? new Date(row.assigned_date).toLocaleDateString('en-GB') : '—'}
        </span>
      ),
    },
    ...(isAdmin
      ? [
          {
            header: 'Lifecycle Actions',
            align: 'right' as const,
            render: (row: ITAsset) => (
              <div className="relative inline-block text-right">
                <button
                  onClick={() => setActiveMenuId(activeMenuId === row.id ? null : row.id)}
                  className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
                >
                  <MoreVertical size={16} />
                </button>

                {activeMenuId === row.id && (
                  <div className="hr-dropdown-menu">
                    <button
                      onClick={() => handleUpdateStatus(row.id, 'RECOVERED')}
                      className="hr-dropdown-item"
                    >
                      <RotateCcw size={13} /> Mark Recovered
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(row.id, 'UNDER_REPAIR')}
                      className="hr-dropdown-item"
                    >
                      <Wrench size={13} /> Send for Repair
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(row.id, 'AVAILABLE')}
                      className="hr-dropdown-item"
                    >
                      <Check size={13} /> Make Available
                    </button>
                  </div>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="hr-stack">
      <PageHeader
        title="IT Asset Management"
        subtitle="Track global hardware inventory, serial numbers, and employee assignments"
        actions={
          isAdmin && (
            <Button
              icon={<UserCheck size={14} />}
              onClick={() => {
                if (availableAssets.length > 0) {
                  setSelectedAssetId(availableAssets[0].id);
                }
                setIsAssignModalOpen(true);
              }}
            >
              Assign Asset
            </Button>
          )
        }
      />

      <Card>
        <CardHeader title="Hardware Inventory" subtitle="Manage laptops, monitors & peripherals" />

        <div className="hr-filter-bar">
          <Input
            placeholder="Search by asset name, serial number, or employee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="UNDER_REPAIR">Under Repair</option>
            <option value="RECOVERED">Recovered</option>
          </Select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-muted">Loading hardware inventory...</div>
        ) : filteredAssets.length === 0 ? (
          <EmptyState
            icon={Monitor}
            title="No IT assets found"
            description="Adjust search filter or assign equipment to staff."
          />
        ) : (
          <Table<ITAsset> columns={columns} data={filteredAssets} rowKey={(r) => r.id} />
        )}
      </Card>

      {/* Assign Hardware Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Hardware Asset"
        subtitle="Link an available company asset directly to an employee profile"
        size="md"
      >
        <form onSubmit={handleAssignAsset} className="space-y-4">
          <Select
            label="Select Available Hardware"
            value={selectedAssetId}
            onChange={(e) => setSelectedAssetId(e.target.value)}
            required
          >
            {availableAssets.length === 0 ? (
              <option value="">No available unassigned assets</option>
            ) : (
              availableAssets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.asset_name} ({a.serial_number})
                </option>
              ))
            )}
          </Select>

          <Select
            label="Select Assignee Employee"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            required
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.first_name} {emp.last_name} ({emp.login_id})
              </option>
            ))}
          </Select>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="secondary" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={availableAssets.length === 0}>
              Confirm Assignment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
