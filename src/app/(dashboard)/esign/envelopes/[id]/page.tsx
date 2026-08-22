'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, RefreshCw, CheckCircle2 } from 'lucide-react';
import { PageHeader, Card, CardHeader, Button, Badge, statusTone } from '@/components/ui';

interface DocumentTrackerData {
  id: string;
  submission_id: string;
  overall_status: 'COMPLETED' | 'PENDING' | 'IN_PROGRESS';
  last_checked: string;
  document_name: string;
  signers: Array<{
    name: string;
    email: string;
    status: 'COMPLETED' | 'PENDING';
    signed_at?: string;
  }>;
}

export default function DocumentTrackerPage() {
  const params = useParams();
  const router = useRouter();
  const envelopeId = params.id as string;

  const [trackerData, setTrackerData] = useState<DocumentTrackerData>({
    id: envelopeId || 'env-101',
    submission_id: '10366950',
    overall_status: 'COMPLETED',
    last_checked: new Date().toLocaleTimeString(),
    document_name: 'DS2019Agreement135.pdf',
    signers: [
      {
        name: 'Jiffy Admin',
        email: 'jiffyadmin@gmail.com',
        status: 'COMPLETED',
        signed_at: 'Aug 20, 2026, 8:49:17 AM',
      },
    ],
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/esign/status/${envelopeId}`);
      if (res.ok) {
        const data = await res.json();
        setTrackerData((prev) => ({
          ...prev,
          overall_status: data.status === 'completed' ? 'COMPLETED' : 'IN_PROGRESS',
          last_checked: new Date().toLocaleTimeString(),
        }));
      }
    } catch (err) {
      console.error('Status refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="hr-stack max-w-4xl mx-auto">
      <div>
        <Link href="/esign/envelopes" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-primary font-medium">
          <ArrowLeft size={14} /> Back to Sent Documents
        </Link>
      </div>

      <PageHeader
        title="Document Tracker"
        subtitle={`ID: ${trackerData.submission_id} • Last checked: ${trackerData.last_checked}`}
      />

      <Card>
        <CardHeader title={trackerData.document_name} subtitle="Audit Log & Real-time Progress" />

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
            <span className="text-xs font-semibold uppercase tracking-wider">Overall Status</span>
            <Badge tone={statusTone(trackerData.overall_status)}>{trackerData.overall_status}</Badge>
          </div>

          {/* All parties signed notice */}
          {trackerData.overall_status === 'COMPLETED' ? (
            <div className="p-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-center space-y-3">
              <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">All parties have signed.</h3>
              <a
                href={`/api/esign/download/${envelopeId}`}
                download
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition-all"
              >
                <Download size={15} /> Download Signed Document
              </a>
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center space-y-2">
              <h3 className="text-sm font-semibold">Awaiting party signatures...</h3>
              <p className="text-xs text-muted">The document is currently out for signature.</p>
            </div>
          )}

          {/* Signers Timeline */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider">Signers Progress</h3>
            <div className="space-y-3">
              {trackerData.signers.map((s, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">{s.name}</span>
                      <Badge tone={statusTone(s.status)}>{s.status}</Badge>
                    </div>
                    <span className="text-xs text-muted block mt-0.5">{s.email}</span>
                  </div>
                  {s.signed_at && (
                    <div className="text-[11px] font-mono text-muted">
                      Signed: {s.signed_at}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <Button variant="secondary" loading={isRefreshing} icon={<RefreshCw size={14} />} onClick={handleRefreshStatus}>
              Refresh Status
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
