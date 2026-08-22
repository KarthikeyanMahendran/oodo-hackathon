export interface EsignEnvelopeStoreItem {
  id: string;
  template_id?: string | null;
  template_name?: string;
  docuseal_submission_id: string;
  document_name: string;
  status: 'Pending' | 'Signed' | 'Voided';
  signed_document_url?: string | null;
  signed_on?: string | null;
  created_at: string;
  submitters?: Array<{
    name: string;
    email: string;
    role?: string;
    status?: 'pending' | 'completed';
    signed_at?: string | null;
  }>;
}

export const memoryEnvelopes: EsignEnvelopeStoreItem[] = [
  {
    id: 'env-1001-1001-1001-1001',
    template_id: 'tpl-10101010-1111-1111-1111-111111111111',
    template_name: 'Employee NDA & Confidentiality Agreement',
    docuseal_submission_id: 'docuseal_sub_1001_demo',
    document_name: 'Alex Rivera - Employee NDA',
    status: 'Pending',
    signed_document_url: null,
    signed_on: null,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    submitters: [
      { name: 'Alex Rivera', email: 'alex.rivera@acme.com', role: 'Employee', status: 'pending' },
      { name: 'Sarah Jenkins', email: 'sarah.jenkins@acme.com', role: 'HR Admin', status: 'pending' }
    ]
  },
  {
    id: 'env-2002-2002-2002-2002',
    template_id: 'tpl-20202020-2222-2222-2222-222222222222',
    template_name: 'Standard Employment Offer Letter',
    docuseal_submission_id: 'docuseal_sub_2002_demo',
    document_name: 'Marcus Chen - Offer Letter',
    status: 'Signed',
    signed_document_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    signed_on: new Date(Date.now() - 3600000 * 6).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    submitters: [
      { name: 'Marcus Chen', email: 'marcus.chen@acme.com', role: 'Candidate', status: 'completed', signed_at: new Date(Date.now() - 3600000 * 6).toISOString() }
    ]
  }
];
