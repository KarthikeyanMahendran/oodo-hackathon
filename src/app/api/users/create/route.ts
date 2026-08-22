import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id: requestedId,
      login_id,
      role = 'EMPLOYEE',
      first_name,
      last_name,
      email,
      phone,
      department,
      job_position,
      department_id,
      designation_id,
      avatar_url,
      initialSalary = 75000,
    } = body;

    if (!first_name || !last_name || !email) {
      return NextResponse.json(
        { success: false, error: 'first_name, last_name, and email are required' },
        { status: 400 }
      );
    }

    let finalUserId = requestedId || crypto.randomUUID();

    // 1. Try creating user in auth.users first so profiles_id_fk foreign key constraint is satisfied
    try {
      const tempPassword = `Welcome@${Math.floor(1000 + Math.random() * 9000)}`;
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { first_name, last_name, role },
      });

      if (!authError && authUser?.user?.id) {
        finalUserId = authUser.user.id;
      }
    } catch (authErr) {
      console.warn('[admin] auth.admin.createUser warning:', authErr);
    }

    const profilePayload = {
      id: finalUserId,
      login_id:
        login_id ||
        `OI${(first_name || 'XX').slice(0, 2).toUpperCase()}${(last_name || 'XX').slice(0, 2).toUpperCase()}20260001`,
      role,
      first_name,
      last_name,
      email,
      phone: phone || null,
      department: department || 'General',
      job_position: job_position || 'Employee',
      department_id: department_id || null,
      designation_id: designation_id || null,
      avatar_url: avatar_url || null,
      must_change_password: true,
      is_active: true,
    };

    // 2. Upsert into profiles using supabaseAdmin (bypasses RLS & anon limitations)
    let finalProfile = profilePayload;
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert([profilePayload], { onConflict: 'id' })
      .select('*')
      .single();

    if (profileError) {
      console.error('[admin] profiles upsert error:', profileError.message);
      // Fallback retry with core columns
      const { data: fallbackData } = await supabaseAdmin
        .from('profiles')
        .insert([
          {
            id: finalUserId,
            login_id: profilePayload.login_id,
            role,
            first_name,
            last_name,
            email,
          },
        ])
        .select('*')
        .single();

      if (fallbackData) {
        finalProfile = fallbackData;
      }
    } else if (profileData) {
      finalProfile = profileData;
    }

    // 3. Upsert into salaries table
    const { error: salaryError } = await supabaseAdmin.from('salaries').upsert(
      [
        {
          user_id: finalUserId,
          fixed_wage: initialSalary,
          basic_salary: Math.round(initialSalary * 0.5),
          hra: Math.round(initialSalary * 0.25),
          standard_allowance: Math.round(initialSalary * 0.15),
          pf: Math.round(initialSalary * 0.05),
          tax: Math.round(initialSalary * 0.05),
        },
      ],
      { onConflict: 'user_id' }
    );

    if (salaryError) {
      console.warn('[admin] salaries upsert warning:', salaryError.message);
    }

    return NextResponse.json({
      success: true,
      profile: finalProfile,
    });
  } catch (err: unknown) {
    console.error('[admin] /api/users/create endpoint error:', err);
    return NextResponse.json(
      { success: false, error: (err instanceof Error ? err.message : 'Failed to create user') },
      { status: 500 }
    );
  }
}
