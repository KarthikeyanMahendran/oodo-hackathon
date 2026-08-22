'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Upload, Plus, X, ArrowRight, FileText, CheckCircle2 } from 'lucide-react';
import { PageHeader, Card, CardHeader, Button, Input, Select } from '@/components/ui';
import { useHRMS } from '@/lib/context/HRMSContext';

export default function CreateTemplatePage() {
  const router = useRouter();
  const { employees } = useHRMS();
  const [step, setStep] = useState<1 | 2>(1);

  // Form State
  const [templateName, setTemplateName] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [associatedWorkflow, setAssociatedWorkflow] = useState<'Yes' | 'No'>('No');
  const [signingFlow, setSigningFlow] = useState<'Sequential' | 'Flexible'>('Sequential');
  const [signerRoles, setSignerRoles] = useState<string[]>(['Participant']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const addSignerRole = () => {
    setSignerRoles((prev) => [...prev, `Role ${prev.length + 1}`]);
  };

  const removeSignerRole = (index: number) => {
    if (signerRoles.length > 1) {
      setSignerRoles((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleUpdateRole = (index: number, val: string) => {
    setSignerRoles((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) {
      alert('Please enter a template name.');
      return;
    }
    setStep(2);
  };

  const handleSaveTemplate = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        template_name: templateName,
        document_url: uploadedFile
          ? URL.createObjectURL(uploadedFile)
          : 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        signer_config: {
          roles: signerRoles,
          flow: signingFlow,
          workflow: associatedWorkflow,
        },
      };

      const res = await fetch('/api/esign/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push('/esign/templates');
      } else {
        alert('Failed to save template.');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving template.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="hr-stack">
      <PageHeader
        title="Create Document Template"
        subtitle={`Step ${step} of 2 - ${step === 1 ? 'Upload Document File' : 'Configure Signing Flow & Signers'}`}
      />

      {step === 1 ? (
        /* STEP 1: Upload Document Form (img 3) */
        <Card className="max-w-2xl mx-auto">
          <CardHeader title="Template Blueprint" subtitle="Provide a template name and upload document" />
          <form onSubmit={handleNext} className="p-6 space-y-6">
            <Input
              label="Name of the template"
              required
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. Employee Offer Letter 2026 or NDA Agreement"
            />

            <div>
              <label className="hr-form-label mb-2">
                Upload document to be signed <span className="hr-required">*</span>
              </label>
              <div className="hr-upload p-8 flex flex-col items-center justify-center text-center">
                <input
                  type="file"
                  id="pdf-upload"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center gap-2">
                  <div className="p-3 rounded-full bg-zinc-100 dark:bg-zinc-800 text-primary">
                    <Upload size={22} />
                  </div>
                  {uploadedFile ? (
                    <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={14} /> {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
                    </div>
                  ) : (
                    <>
                      <span className="text-xs font-semibold">Click to upload PDF Document</span>
                      <span className="text-[11px] text-muted">Supports PDF format up to 25MB</span>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <Link href="/esign/templates">
                <Button variant="secondary" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" icon={<ArrowRight size={15} />}>
                Next →
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        /* STEP 2: Configuration & Split View Preview (img 4) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Configuration Panel */}
          <Card className="lg:col-span-5">
            <CardHeader title="Configuration" subtitle="Signing sequence and signer roles" />
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
                <span className="text-xs font-mono truncate flex items-center gap-2">
                  <FileText size={15} /> {uploadedFile?.name || 'document.pdf'}
                </span>
                <label htmlFor="pdf-reupload" className="cursor-pointer text-[11px] font-semibold text-primary underline">
                  Re-upload
                  <input type="file" id="pdf-reupload" accept="application/pdf" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <div>
                <label className="hr-form-label mb-2">
                  Is this template associated with any workflow? <span className="hr-required">*</span>
                </label>
                <div className="flex items-center gap-6 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="workflow"
                      value="Yes"
                      checked={associatedWorkflow === 'Yes'}
                      onChange={() => setAssociatedWorkflow('Yes')}
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="workflow"
                      value="No"
                      checked={associatedWorkflow === 'No'}
                      onChange={() => setAssociatedWorkflow('No')}
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="hr-form-label">Signing flow</label>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer">
                    <input
                      type="radio"
                      name="flow"
                      value="Sequential"
                      checked={signingFlow === 'Sequential'}
                      onChange={() => setSigningFlow('Sequential')}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-semibold block">Sequential signing</span>
                      <span className="text-[11px] text-muted block">Signers sign the document one after another in designated sequence.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer">
                    <input
                      type="radio"
                      name="flow"
                      value="Flexible"
                      checked={signingFlow === 'Flexible'}
                      onChange={() => setSigningFlow('Flexible')}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-semibold block">Flexible signing</span>
                      <span className="text-[11px] text-muted block">Signers can sign the document in any order concurrently.</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Dynamic Signer Roles */}
              <div className="space-y-3">
                <label className="hr-form-label">Signer Roles</label>
                {signerRoles.map((role, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="flex-1">
                      <Select
                        label={`Role of signer ${idx + 1} *`}
                        value={role}
                        onChange={(e) => handleUpdateRole(idx, e.target.value)}
                      >
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
                    {signerRoles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSignerRole(idx)}
                        className="mt-5 p-2 text-muted hover:text-red-600"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addSignerRole}
                  className="mt-1 text-xs font-semibold text-primary hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} /> Add signer
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="button" loading={isSubmitting} onClick={handleSaveTemplate}>
                  Save template
                </Button>
              </div>
            </div>
          </Card>

          {/* Right Document Preview Pane */}
          <Card className="lg:col-span-7 min-h-[550px]">
            <CardHeader title="Document Preview" subtitle={templateName || 'Sample PDF Blueprint'} />
            <div className="p-6">
              {uploadedFile ? (
                <iframe
                  src={URL.createObjectURL(uploadedFile)}
                  className="w-full h-[450px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white"
                  title="Document Preview"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900/30">
                  <FileText size={40} className="text-muted mb-2" />
                  <h4 className="text-sm font-semibold mb-1">SAMPLE SIGNATURE FORM PREVIEW</h4>
                  <p className="text-xs text-muted max-w-sm">
                    PDF layout and document fields will render here.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
