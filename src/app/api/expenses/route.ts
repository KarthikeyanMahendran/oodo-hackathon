import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// In-memory fallback store for sandbox testing
let expenseClaimsStore: any[] = [
  {
    id: 'claim-101',
    user_id: 'e3333333-3333-3333-3333-333333333333',
    employee_name: 'Alex Rivera',
    type: 'EXPENSE',
    amount: 249.50,
    merchant_or_provider: 'Acme Hardware Supplies',
    event_date: '2026-08-20',
    description: 'Monitor arm & cable dock for home workstation setup',
    document_url: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500',
    status: 'PENDING',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'claim-102',
    user_id: 'e2222222-2222-2222-2222-222222222222',
    employee_name: 'Marcus Chen',
    type: 'MEDICAL',
    amount: 180.00,
    merchant_or_provider: 'St. Jude Medical Care Clinic',
    event_date: '2026-08-18',
    description: 'Outpatient consultation and prescription reimbursement',
    document_url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=500',
    status: 'APPROVED',
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
];

export async function GET() {
  try {
    const { data: claims, error } = await supabaseAdmin
      .from('claims')
      .select('*, profiles(first_name, last_name, login_id)')
      .order('created_at', { ascending: false });

    if (!error && claims && claims.length > 0) {
      return NextResponse.json({ success: true, claims });
    }

    return NextResponse.json({ success: true, claims: expenseClaimsStore });
  } catch (err: any) {
    console.error('GET /api/expenses error:', err);
    return NextResponse.json({ success: true, claims: expenseClaimsStore });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, type, amount, merchant_or_provider, event_date, description, document_url, employee_name } = body;

    if (!user_id || !document_url) {
      return NextResponse.json(
        { error: 'user_id and document_url are required.' },
        { status: 400 }
      );
    }

    const newClaim = {
      id: `claim-${Date.now()}`,
      user_id,
      type: type || 'EXPENSE',
      amount: amount ? parseFloat(amount) : 0,
      merchant_or_provider: merchant_or_provider || 'General Vendor',
      event_date: event_date || new Date().toISOString().split('T')[0],
      description: description || 'Expense reimbursement claim',
      document_url,
      status: 'PENDING',
      employee_name: employee_name || 'Employee',
      created_at: new Date().toISOString(),
    };

    expenseClaimsStore.unshift(newClaim);

    try {
      await supabaseAdmin.from('claims').insert({
        id: newClaim.id,
        user_id: newClaim.user_id,
        type: newClaim.type,
        amount: newClaim.amount,
        merchant_or_provider: newClaim.merchant_or_provider,
        event_date: newClaim.event_date,
        description: newClaim.description,
        document_url: newClaim.document_url,
        status: 'PENDING',
      });
    } catch (dbErr) {
      console.log('Using fallback memory store for claims');
    }

    return NextResponse.json({ success: true, claim: newClaim }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/expenses error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create expense claim.' },
      { status: 500 }
    );
  }
}
