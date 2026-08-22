'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  MoreVertical,
  Eye,
  Download,
  FileCheck,
} from 'lucide-react';
import {
  PageHeader,
  Card,
  CardHeader,
  Table,
  Button,
  Input,
  Select,
  Badge,
  statusTone,
  EmptyState,
  type Column,
} from '@/components/ui';

interface Envelope {
  id: string;
  template_id: string;
  docuseal_submission_id: string;
  document_name: string;
  status: string;
  signed_document_url?: string;
  signed_on?: string;
  created_at: string;
  template_used?: string;
  signers_str?: string;
}

const DUMMY_ENVELOPES: Envelope[] = [
  {
    id: 'env-101',
    template_id: 'tpl-001',
    docuseal_submission_id: '10366950',
    document_name: 'DS2019Agreement135.pdf',
    template_used: 'Integration DS2019',
    signers_str: 'Jiffy Admin',
    status: 'Signed',
    created_at: '2026-08-20T08:49:17Z',
    signed_on: '2026-08-20T08:49:17Z',
  },
  {
    id: 'env-102',
    template_id: 'tpl-001',
    docuseal_submission_id: '10366951',
    document_name: 'DS2019Agreement553.pdf',
    template_used: 'Integration DS2019',
    signers_str: 'Jiffy Admin',
    status: 'Signed',
    created_at: '2026-08-19T10:15:00Z',
    signed_on: '2026-08-19T10:15:00Z',
  },
  {
    id: 'env-103',
    template_id: 'tpl-002',
    docuseal_submission_id: '10366952',
    document_name: 'test test test',
    template_used: 'Workspace checking',
    signers_str: 'Backslash Board',
    status: 'Signed',
    created_at: '2026-08-14T14:20:00Z',
    signed_on: '2026-08-14T14:20:00Z',
  },
  {
    id: 'env-104',
    template_id: 'tpl-003',
    docuseal_submission_id: '10366953',
    document_name: 'Offer Letter - Sunny Deol',
    template_used: '-',
    signers_str: 'Sunny Deol',
    status: 'Signed',
    created_at: '2026-08-12T11:00:00Z',
    signed_on: '2026-08-12T11:00:00Z',
  },
  {
    id: 'env-105',
    template_id: 'tpl-001',
    docuseal_submission_id: '10366954',
    document_name: 'DS2019Agreement109.pdf',
    template_used: 'Integration DS2019',
    signers_str: 'Jiffy Admin',
    status: 'Yet to sign',
    created_at: '2026-08-11T09:30:00Z',
  },
  {
    id: 'env-106',
    template_id: 'tpl-001',
    docuseal_submission_id: '10366955',
    document_name: 'DS2019Agreement017.pdf',
    template_used: 'Integration DS2019',
    signers_str: 'Jiffy Admin',
    status: 'Signed',
    created_at: '2026-08-11T08:00:00Z',
    signed_on: '2026-08-11T08:00:00Z',
  },
];

export default function SentDocumentsPage() {
  const router = useRouter();
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEnvelopes() {
      try {
        const res = await fetch('/api/esign/envelopes');
        if (res.ok) {
          const data = await res.json();
          setEnvelopes(data.envelopes && data.envelopes.length > 0 ? data.envelopes : DUMMY_ENVELOPES);
        } else {
          setEnvelopes(DUMMY_ENVELOPES);
        }
      } catch (err) {
        console.error(err);
        setEnvelopes(DUMMY_ENVELOPES);
      } finally {
        setLoading(false);
      }
    }
    fetchEnvelopes();
  }, []);

  const filteredEnvelopes = envelopes.filter((e) => {
    const matchesSearch = e.document_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || e.status.toLowerCase().includes(statusFilter.toLowerCase());
    return matchesSearch && matchesStatus;
  });

  const columns: Column<Envelope>[] = [
    {
      header: 'Document Name',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <span className="hr-avatar hr-avatar-sm !bg-zinc-100 !text-zinc-700">
            <FileText size={14} />
          </span>
          <span className="hr-cell-primary">{row.document_name}</span>
        </div>
      ),
    },
    {
      header: 'Template Used',
      render: (row) => <span className="hr-cell-secondary">{row.template_used || 'Integration DS2019'}</span>,
    },
    {
      header: 'Signers',
      render: (row) => <span>{row.signers_str || 'Jiffy Admin'}</span>,
    },
    {
      header: 'Sent On',
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
      header: 'Status',
      render: (row) => {
        const isSigned = row.status === 'Signed' || row.status === 'COMPLETED';
        return <Badge tone={isSigned ? 'success' : 'warning'}>{row.status}</Badge>;
      },
    },
    {
      header: 'Action',
      align: 'right',
      render: (row) => (
        <div className="relative inline-block text-right">
          <button
            type="button"
            onClick={() => setActiveMenuId(activeMenuId === row.id ? null : row.id)}
            className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
          >
            <MoreVertical size={16} />
          </button>

          {activeMenuId === row.id && (
            <div className="hr-dropdown-menu">
              <button
                type="button"
                onClick={() => router.push(`/esign/envelopes/${row.id}`)}
                className="hr-dropdown-item"
              >
                <Eye size={14} /> View details
              </button>
              <button
                type="button"
                onClick={() => window.open(`/api/esign/download/${row.id}`, '_blank')}
                className="hr-dropdown-item"
              >
                <FileCheck size={14} /> View document
              </button>
              <button
                type="button"
                onClick={() => (window.location.href = `/api/esign/download/${row.id}`)}
                className="hr-dropdown-item"
              >
                <Download size={14} /> Download document
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="hr-stack">
      <PageHeader
        title="Sent Documents"
        subtitle="Track and view real-time signature progress for dispatched documents."
      />

      <Card>
        <CardHeader title="Envelope Outbox" subtitle="Monitor completion status and download signed PDFs" />

        <div className="hr-filter-bar">
          <Input
            placeholder="Search documents by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search documents"
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="ALL">All Statuses</option>
            <option value="Signed">Signed</option>
            <option value="Yet to sign">Yet to sign</option>
          </Select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-muted">Loading sent documents...</div>
        ) : filteredEnvelopes.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No sent documents found"
            description="Adjust search or status filters to view dispatched envelopes."
          />
        ) : (
          <Table<Envelope> columns={columns} data={filteredEnvelopes} rowKey={(r) => r.id} />
        )}
      </Card>
    </div>
  );
}
