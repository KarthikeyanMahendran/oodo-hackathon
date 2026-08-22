'use client';

import React, { useState, useRef, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Upload, FileText, X, GripVertical, ArrowRight } from 'lucide-react';
import { useHRMS } from '@/lib/context/HRMSContext';
import { PageHeader, Card, CardHeader, Button, Input, Select } from '@/components/ui';

/* ------------------------------------------------------------------ */
/* Field types available for drag-and-drop                            */
/* ------------------------------------------------------------------ */
const FIELD_TYPES = [
  { id: 'initial', label: 'Initial' },
  { id: 'name', label: 'Name' },
  { id: 'date', label: 'Date' },
  { id: 'signature', label: 'Signature' },
] as const;

type FieldType = (typeof FIELD_TYPES)[number]['id'];

interface PlacedField {
  id: string;
  type: FieldType;
  label: string;
  x: number;
  y: number;
}

/* ------------------------------------------------------------------ */
/* Step 1 – Upload Document                                           */
/* ------------------------------------------------------------------ */
function StepUpload({
  documentName,
  setDocumentName,
  uploadedFile,
  setUploadedFile,
  onNext,
  onCancel,
}: {
  documentName: string;
  setDocumentName: (v: string) => void;
  uploadedFile: File | null;
  setUploadedFile: (f: File | null) => void;
  onNext: () => void;
  onCancel: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-6">
        <CardHeader title="Upload Document" subtitle="Provide a name and attach the PDF to sign" />
        <div className="space-y-5 pt-4">
          {/* Name + Upload side-by-side */}
          <div>
            <label className="hr-form-label">Name of the document <span className="hr-required">*</span></label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <input
                  className="hr-input"
                  style={{ width: '100%' }}
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="e.g. Offer Letter - Q3 2026"
                />
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setUploadedFile(f);
                  if (f && !documentName) setDocumentName(f.name.replace(/\.pdf$/i, ''));
                }}
              />
              <Button
                type="button"
                variant={uploadedFile ? 'secondary' : 'primary'}
                icon={<Upload size={14} />}
                onClick={() => fileRef.current?.click()}
              >
                {uploadedFile ? 'Re-upload' : 'Upload'}
              </Button>
            </div>
          </div>

          {uploadedFile && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs">
              <FileText size={15} className="text-amber-600 shrink-0" />
              <span className="font-mono truncate">{uploadedFile.name}</span>
              <button
                type="button"
                onClick={() => setUploadedFile(null)}
                className="ml-auto p-0.5 rounded hover:bg-amber-200/60 dark:hover:bg-amber-800/40 border-none outline-none bg-transparent cursor-pointer"
              >
                <X size={14} className="text-amber-700" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!documentName.trim() || !uploadedFile}
              icon={<ArrowRight size={14} />}
              onClick={onNext}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 2 – Configure signer, drag-and-drop fields, live PDF preview  */
/* ------------------------------------------------------------------ */
function StepConfigure({
  documentName,
  setDocumentName,
  uploadedFile,
  setUploadedFile,
  onBack,
}: {
  documentName: string;
  setDocumentName: (v: string) => void;
  uploadedFile: File;
  setUploadedFile: (f: File | null) => void;
  onBack: () => void;
}) {
  const router = useRouter();
  const { employees } = useHRMS();
  const fileRef = useRef<HTMLInputElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  const [signerRole, setSignerRole] = useState('Participant');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedFields, setPlacedFields] = useState<PlacedField[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string>(() => URL.createObjectURL(uploadedFile));
  const [draggingField, setDraggingField] = useState<FieldType | null>(null);

  const selectedUser = employees.find((e) => e.id === selectedUserId);

  /* ---------- Drag helpers ---------- */
  const handleDragStart = useCallback((type: FieldType) => {
    setDraggingField(type);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!draggingField || !pdfContainerRef.current) return;

      const rect = pdfContainerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      const meta = FIELD_TYPES.find((f) => f.id === draggingField)!;
      setPlacedFields((prev) => [
        ...prev,
        { id: `${draggingField}-${Date.now()}`, type: draggingField, label: meta.label, x, y },
      ]);
      setDraggingField(null);
    },
    [draggingField]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const removeField = (id: string) => {
    setPlacedFields((prev) => prev.filter((f) => f.id !== id));
  };

  /* ---------- Re-upload ---------- */
  const handleReupload = () => fileRef.current?.click();
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f) {
      setUploadedFile(f);
      setPdfUrl(URL.createObjectURL(f));
      setPlacedFields([]);
    }
  };

  /* ---------- Send ---------- */
  const handleSend = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);

    try {
      const payload = {
        document_name: documentName,
        document_url: pdfUrl,
        signer_name: `${selectedUser.first_name} ${selectedUser.last_name}`,
        signer_email: selectedUser.email,
        signer_role: signerRole,
        placed_fields: placedFields.map((f) => ({
          type: f.type,
          label: f.label,
          x: f.x,
          y: f.y,
        })),
      };

      const res = await fetch('/api/esign/create-envelope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push('/esign/envelopes');
      } else {
        alert('Failed to dispatch envelope.');
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
      {/* ====== Left Panel ====== */}
      <div className="lg:col-span-4 space-y-4">
        <Card className="p-5 space-y-5">
          {/* Document name */}
          <Input
            label="Document name"
            required
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
          />

          {/* File info + Re-upload */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-mono truncate text-zinc-700 dark:text-zinc-300">
              <FileText size={14} className="text-amber-600 shrink-0" />
              <span className="truncate max-w-[160px]">{uploadedFile.name}</span>
            </div>
            <div>
              <input ref={fileRef} type="file" accept="application/pdf" className="hidden" style={{ display: 'none' }} onChange={onFileChange} />
              <button
                type="button"
                onClick={handleReupload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold border-none outline-none cursor-pointer transition-colors"
              >
                <Upload size={12} /> Re-upload
              </button>
            </div>
          </div>

          {/* Role of signer */}
          <Select
            label="Role of signer 1"
            value={signerRole}
            onChange={(e) => setSignerRole(e.target.value)}
          >
            <option value="HR Admin">HR Admin</option>
            <option value="Employee / Participant">Employee / Participant</option>
            <option value="Department Manager">Department Manager</option>
            <option value="Participant">Participant</option>
            <option value="Employer">Employer</option>
          </Select>

          {/* Select user */}
          <div>
            <label className="hr-form-label mb-1">Select user <span className="hr-required">*</span></label>
            {selectedUser ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-white">
                    {selectedUser.first_name} {selectedUser.last_name}
                  </div>
                  <div className="text-[11px] text-muted font-mono">{selectedUser.email}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUserId('')}
                  className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 border-none outline-none bg-transparent cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <select
                value=""
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="hr-input w-full"
              >
                <option value="" disabled>Search or select user…</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} — {emp.email}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Draggable field palette */}
          <div className="p-4 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 space-y-3">
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
              Drag and drop the fields in the document, where you want the signer to fill in
            </p>
            <div className="flex flex-wrap gap-2">
              {FIELD_TYPES.map((f) => (
                <div
                  key={f.id}
                  draggable
                  onDragStart={() => handleDragStart(f.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-dashed border-zinc-400 dark:border-zinc-600 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 cursor-grab active:cursor-grabbing hover:border-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors select-none bg-white dark:bg-zinc-900"
                >
                  <GripVertical size={11} className="text-zinc-400" />
                  {f.label}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted font-mono">
              {placedFields.length} field(s) placed
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="secondary" onClick={onBack}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!selectedUser || isSubmitting}
              loading={isSubmitting}
              icon={<Send size={14} />}
              onClick={handleSend}
            >
              Send
            </Button>
          </div>
        </Card>
      </div>

      {/* ====== Right Panel – PDF Preview + Drop Zone ====== */}
      <Card className="lg:col-span-8 overflow-hidden">
        <CardHeader title="Document Preview" subtitle="Drop signing fields onto the document below" />
        <div
          ref={pdfContainerRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="relative bg-zinc-100 dark:bg-zinc-900 min-h-[680px]"
          style={{ cursor: draggingField ? 'copy' : 'default' }}
        >
          {/* Embedded PDF */}
          <iframe
            src={pdfUrl}
            title="PDF Preview"
            className="w-full h-full absolute inset-0 border-none"
            style={{ minHeight: 680, pointerEvents: draggingField ? 'none' : 'auto' }}
          />

          {/* Placed fields overlay */}
          {placedFields.map((field) => (
            <div
              key={field.id}
              className="absolute flex items-center gap-1 px-2 py-1 rounded bg-white/90 dark:bg-zinc-800/90 border border-indigo-400 text-[10px] font-bold text-indigo-900 dark:text-indigo-300 shadow-sm backdrop-blur-sm z-10 group"
              style={{ left: `${field.x}%`, top: `${field.y}%`, transform: 'translate(-50%, -50%)' }}
            >
              <GripVertical size={10} className="text-indigo-400" />
              Signer 1: {field.label}
              <button
                type="button"
                onClick={() => removeField(field.id)}
                className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/40 border-none outline-none bg-transparent cursor-pointer"
              >
                <X size={10} className="text-red-600" />
              </button>
            </div>
          ))}

          {/* Drag indicator overlay */}
          {draggingField && (
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
              <div className="px-4 py-2 rounded-xl bg-amber-500/20 border-2 border-dashed border-amber-500 text-amber-700 dark:text-amber-300 text-xs font-bold backdrop-blur-sm">
                Drop &quot;{FIELD_TYPES.find((f) => f.id === draggingField)?.label}&quot; here
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Page Component                                                */
/* ------------------------------------------------------------------ */
function DispatchForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [documentName, setDocumentName] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  return (
    <div className="hr-stack">
      <PageHeader
        title="Send Document for E-Signature"
        subtitle={step === 1 ? 'Step 1 of 2 — Upload your document' : 'Step 2 of 2 — Configure signer & place fields'}
      />

      {step === 1 ? (
        <StepUpload
          documentName={documentName}
          setDocumentName={setDocumentName}
          uploadedFile={uploadedFile}
          setUploadedFile={setUploadedFile}
          onNext={() => setStep(2)}
          onCancel={() => router.push('/esign/envelopes')}
        />
      ) : (
        <StepConfigure
          documentName={documentName}
          setDocumentName={setDocumentName}
          uploadedFile={uploadedFile!}
          setUploadedFile={(f) => { setUploadedFile(f); if (!f) setStep(1); }}
          onBack={() => setStep(1)}
        />
      )}
    </div>
  );
}

export default function DispatchEnvelopePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted">Loading…</div>}>
      <DispatchForm />
    </Suspense>
  );
}
