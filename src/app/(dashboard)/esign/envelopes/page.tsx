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
  Send,
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
  EmptyState,
  type Column,
} from '@/components/ui';

interface Envelope {
  id: string;
  document_name: string;
  document_url: string;
  signer_name: string;
  signer_email: string;
  signer_role: string;
  status: string;
  signed_document_url?: string;
  signed_on?: string;
  created_at: string;
}

const DUMMY_ENVELOPES: Envelope[] = [
  {
    id: 'env-101',
    document_name: 'DS2019Agreement135.pdf',
    document_url: '#',
    signer_name: 'Jiffy Admin',
    signer_email: 'jiffy@company.com',
    signer_role: 'HR Admin',
    status: 'Signed',
    created_at: '2026-08-20T08:49:17Z',
    signed_on: '2026-08-20T08:49:17Z',
  },
  {
    id: 'env-102',
    document_name: 'DS2019Agreement553.pdf',
    document_url: '#',
    signer_name: 'Jiffy Admin',
    signer_email: 'jiffy@company.com',
    signer_role: 'HR Admin',
    status: 'Signed',
    created_at: '2026-08-19T10:15:00Z',
    signed_on: '2026-08-19T10:15:00Z',
  },
  {
    id: 'env-103',
    document_name: 'Offer Letter - Sunny Deol',
    document_url: '#',
    signer_name: 'Sunny Deol',
    signer_email: 'sunny@company.com',
    signer_role: 'Employee / Participant',
    status: 'Signed',
    created_at: '2026-08-14T14:20:00Z',
    signed_on: '2026-08-14T14:20:00Z',
  },
  {
    id: 'env-104',
    document_name: 'NDA - Cloud Architecture Team',
    document_url: '#',
    signer_name: 'Backslash Board',
    signer_email: 'backslash@company.com',
    signer_role: 'Department Manager',
    status: 'Yet to sign',
    created_at: '2026-08-11T09:30:00Z',
  },
  {
    id: 'env-105',
    document_name: 'Employment Contract - Rajesh K',
    document_url: '#',
    signer_name: 'Rajesh Kumar',
    signer_email: 'rajesh@company.com',
    signer_role: 'Employee / Participant',
    status: 'Signed',
    created_at: '2026-08-11T08:00:00Z',
    signed_on: '2026-08-11T08:00:00Z',
  },
];

export default function ESignMainPage() {
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
    const matchesSearch =
      e.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.signer_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || e.status.toLowerCase().includes(statusFilter.toLowerCase());
    return matchesSearch && matchesStatus;
  });

  const columns: Column<Envelope>[] = [
    {
      header: 'Document Name',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <span className="hr-avatar hr-avatar-sm !bg-zinc-100 !text-zinc-700 dark:!bg-zinc-800 dark:!text-zinc-300">
            <FileText size={14} />
          </span>
          <span className="hr-cell-primary">{row.document_name}</span>
        </div>
      ),
    },
    {
      header: 'Signer',
      render: (row) => (
        <div>
          <div className="text-xs font-semibold text-zinc-900 dark:text-white">{row.signer_name}</div>
          <div className="text-[11px] text-muted font-mono">{row.signer_email}</div>
        </div>
      ),
    },
    {
      header: 'Role',
      render: (row) => <span className="hr-cell-secondary">{row.signer_role}</span>,
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
            className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 border-none outline-none bg-transparent cursor-pointer"
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
        title="E-Signature"
        subtitle="Track and manage all documents sent for electronic signature."
        actions={
          <Link href="/esign/dispatch">
            <Button icon={<Send size={14} />}>Send for E-Sign</Button>
          </Link>
        }
      />

      <Card>
        <CardHeader title="Sent Documents" subtitle="Monitor completion status and download signed PDFs" />

        <div className="hr-filter-bar">
          <Input
            placeholder="Search by document name or signer..."
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
            description="Start by sending a document for e-signature using the button above."
          />
        ) : (
          <Table<Envelope> columns={columns} data={filteredEnvelopes} rowKey={(r) => r.id} />
        )}
      </Card>
    </div>
  );
}
