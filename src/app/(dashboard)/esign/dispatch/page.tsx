'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Send, FileText } from 'lucide-react';
import { useHRMS } from '@/lib/context/HRMSContext';
import { PageHeader, Card, CardHeader, Button, Input, Select } from '@/components/ui';

function DispatchEnvelopeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateIdParam = searchParams.get('template_id');

  const { employees } = useHRMS();

  const [documentName, setDocumentName] = useState('UCSD - Offer');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(employees[1]?.id || '');
  const [signerEmail, setSignerEmail] = useState(employees[1]?.email || 'alex.rivera@acme.com');
  const [signerName, setSignerName] = useState(
    employees[1] ? `${employees[1].first_name} ${employees[1].last_name}` : 'Alex Rivera'
  );
  const [isBulkSend, setIsBulkSend] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncedEmployeeId, setSyncedEmployeeId] = useState(selectedEmployeeId);

  // Re-seed signer details when the selected employee changes, without an effect.
  if (selectedEmployeeId && selectedEmployeeId !== syncedEmployeeId) {
    setSyncedEmployeeId(selectedEmployeeId);
    const emp = employees.find((e) => e.id === selectedEmployeeId);
    if (emp) {
      setSignerEmail(emp.email);
      setSignerName(`${emp.first_name} ${emp.last_name}`);
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        template_id: templateIdParam || 'tpl-001',
        document_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        config: {
          document_name: documentName,
          signers: [
            {
              role: 'Signer 1 - Participant',
              name: signerName,
              email: signerEmail,
            },
          ],
          signing_order: 'Sequential',
        },
      };

      const res = await fetch('/api/esign/create-envelope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push('/esign/envelopes');
      } else {
        alert('Failed to dispatch envelope for signature.');
      }
    } catch (err) {
      console.error(err);
      alert('Error dispatching envelope.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Form Panel (img 2) */}
      <Card className="lg:col-span-5">
        <CardHeader title="Envelope Configuration" subtitle="Assign signers and set document details" />
        <form onSubmit={handleSend} className="p-6 space-y-6">
          <Input
            label="Document name"
            required
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
            placeholder="e.g. Offer Letter - Alex Rivera"
          />

          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
            <span className="text-xs font-mono truncate flex items-center gap-2">
              <FileText size={15} /> document.pdf
            </span>
            <label className="cursor-pointer text-[11px] font-semibold text-primary underline">
              Re-upload
              <input type="file" accept="application/pdf" className="hidden" />
            </label>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1 text-xs">
            <div className="font-semibold">Template used: UCSD - Offer</div>
            <div className="text-muted">Signing order: Sequential</div>
            <div className="text-muted">Signer roles: Signer 1 - Participant</div>
          </div>

          {/* Assign Signers */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider">Assign signers</h3>

            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold">Signer 1 - Participant *</span>
                <label className="flex items-center gap-1.5 cursor-pointer text-muted text-[11px]">
                  <span>Bulk send</span>
                  <input
                    type="checkbox"
                    checked={isBulkSend}
                    onChange={(e) => setIsBulkSend(e.target.checked)}
                  />
                </label>
              </div>

              <Select
                label="Select Employee / User"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} ({emp.email})
                  </option>
                ))}
              </Select>

              <Input
                label="Signer Email"
                type="email"
                required
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Link href="/esign/templates">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button type="submit" loading={isSubmitting} icon={<Send size={15} />}>
              Send
            </Button>
          </div>
        </form>
      </Card>

      {/* Right PDF Preview Pane (img 2) */}
      <Card className="lg:col-span-7">
        <CardHeader title="SAMPLE SIGNATURE FORM" subtitle="Interactive Document Preview" />
        <div className="p-6 space-y-4">
          <div className="bg-white rounded-xl p-8 text-black min-h-[500px] border border-zinc-200 space-y-6 shadow-sm font-serif">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h2 className="text-lg font-bold uppercase tracking-wide text-red-800">Carleton University</h2>
                <span className="text-xs font-semibold text-zinc-600">Canada&apos;s Capital University</span>
              </div>
              <div className="text-right">
                <h3 className="text-base font-extrabold uppercase">SAMPLE SIGNATURE FORM</h3>
              </div>
            </div>

            <div className="space-y-2 text-xs leading-relaxed text-zinc-800">
              <p className="font-bold">PURPOSE:</p>
              <p>
                This form is used to collect sample signatures of authorized signing authorities and will be used to
                verify the signature on any University expenditure form.
              </p>
              <p className="font-bold mt-3">INSTRUCTIONS:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Print this document.</li>
                <li>
                  Write the following in the spaces provided below:
                  <ul className="list-disc pl-5">
                    <li>Employee ID Number</li>
                    <li>Sign your name</li>
                    <li>Print your name</li>
                    <li>Department Name</li>
                  </ul>
                </li>
              </ol>
            </div>

            <div className="border-2 border-dashed border-indigo-400 bg-indigo-50/50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-indigo-900 block">
                  1. Carleton University Employee # (General Person #)
                </span>
                <span className="text-[11px] text-indigo-700 font-mono">Signer 1: Signature Field Placeholder</span>
              </div>
              <div className="px-3 py-1 bg-indigo-200 text-indigo-900 font-mono text-[11px] rounded-lg border border-indigo-300 font-bold">
                :: Signer 1: Signature
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function DispatchEnvelopePage() {
  return (
    <div className="hr-stack">
      <PageHeader title="Send Document for E-Signature" subtitle="Configure signers and dispatch envelope" />
      <Suspense fallback={<div className="p-8 text-center text-xs text-muted">Loading envelope form...</div>}>
        <DispatchEnvelopeForm />
      </Suspense>
    </div>
  );
}
