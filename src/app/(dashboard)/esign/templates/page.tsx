'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Send,
  MoreVertical,
  Edit2,
  Copy,
  Trash2,
} from 'lucide-react';
import {
  PageHeader,
  Card,
  CardHeader,
  Table,
  Button,
  Input,
  Select,
  EmptyState,
  type Column,
} from '@/components/ui';
import { useHRMS } from '@/lib/context/HRMSContext';

interface EsignTemplate {
  template_id: string;
  template_name: string;
  signer_config: { roles?: string[] } | null;
  document_url: string;
  category?: string;
  created_at: string;
}

export default function TemplatesPage() {
  const router = useRouter();
  const { employees } = useHRMS();
  const [templates, setTemplates] = useState<EsignTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch('/api/esign/templates');
        if (res.ok) {
          const data = await res.json();
          setTemplates(data.templates || []);
        }
      } catch (err) {
        console.error('Failed to load templates:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTemplates();
  }, []);

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch = t.template_name.toLowerCase().includes(searchQuery.toLowerCase());
    const roles = t.signer_config?.roles || ['Participant'];
    const matchesRole =
      selectedRoleFilter === 'ALL' || roles.some((r) => r.toLowerCase().includes(selectedRoleFilter.toLowerCase()));
    return matchesSearch && matchesRole;
  });

  const handleDuplicate = (template: EsignTemplate) => {
    const duplicated: EsignTemplate = {
      ...template,
      template_id: `tpl-${Date.now()}`,
      template_name: `${template.template_name} (Copy)`,
      created_at: new Date().toISOString(),
    };
    setTemplates((prev) => [duplicated, ...prev]);
    setActiveMenuId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      setTemplates((prev) => prev.filter((t) => t.template_id !== id));
      setActiveMenuId(null);
    }
  };

  const columns: Column<EsignTemplate>[] = [
    {
      header: 'Template Name',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <span className="hr-avatar hr-avatar-sm !bg-zinc-100 !text-zinc-700">
            <FileText size={14} />
          </span>
          <span className="hr-cell-primary">{row.template_name}</span>
        </div>
      ),
    },
    {
      header: 'Signer Roles',
      render: (row) => (
        <span className="hr-cell-secondary">
          {row.signer_config?.roles?.join(', ') || 'Participant'}
        </span>
      ),
    },
    {
      header: 'Program Category',
      render: (row) => <span>{row.category || 'General'}</span>,
    },
    {
      header: 'Last Updated',
      render: (row) => (
        <span className="hr-monospace">
          {new Date(row.created_at).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      header: 'Action',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2 relative">
          <Link href={`/esign/dispatch?template_id=${row.template_id}`}>
            <Button variant="secondary" className="!py-1 !px-3 !text-xs">
              Use Template
            </Button>
          </Link>
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveMenuId(activeMenuId === row.template_id ? null : row.template_id)}
              className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
            >
              <MoreVertical size={16} />
            </button>

            {activeMenuId === row.template_id && (
              <div className="hr-dropdown-menu">
                <button
                  type="button"
                  onClick={() => router.push(`/esign/templates/create?edit_id=${row.template_id}`)}
                  className="hr-dropdown-item"
                >
                  <Edit2 size={14} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDuplicate(row)}
                  className="hr-dropdown-item"
                >
                  <Copy size={14} /> Duplicate
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(row.template_id)}
                  className="hr-dropdown-item is-danger"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="hr-stack">
      <PageHeader
        title="Templates"
        subtitle="Manage and send reusable document templates for electronic signature."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/esign/templates/create">
              <Button variant="secondary" icon={<Plus size={14} />}>
                Create template
              </Button>
            </Link>
            <Link href="/esign/dispatch">
              <Button icon={<Send size={14} />}>
                Send for E-sign
              </Button>
            </Link>
          </div>
        }
      />

      <Card>
        <CardHeader title="Document Blueprints" subtitle="Select a template to dispatch or configure new workflows" />

        <div className="hr-filter-bar">
          <Input
            placeholder="Search templates by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search templates"
          />
          <Select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            aria-label="Filter by role"
          >
            <option value="ALL">All Signer Roles</option>
            <option value="HR Admin">HR Admin</option>
            <option value="Employee / Participant">Employee / Participant</option>
            <option value="Department Manager">Department Manager</option>
            {employees.map((emp) => (
              <option key={emp.id} value={`${emp.first_name} ${emp.last_name}`}>
                {emp.first_name} {emp.last_name} ({emp.job_position || emp.role})
              </option>
            ))}
          </Select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-muted">Loading document templates...</div>
        ) : filteredTemplates.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No templates found"
            description="Adjust your search or click 'Create template' to add your first reusable blueprint."
          />
        ) : (
          <Table<EsignTemplate> columns={columns} data={filteredTemplates} rowKey={(r) => r.template_id} />
        )}
      </Card>
    </div>
  );
}
