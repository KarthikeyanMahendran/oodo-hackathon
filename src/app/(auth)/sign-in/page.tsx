'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, ShieldCheck, User } from 'lucide-react';
import { useHRMS } from '@/lib/context/HRMSContext';
import { Button, Input } from '@/components/ui';

export default function SignInPage() {
  const router = useRouter();
  const { login, employees, isLoading } = useHRMS();

  // Sign-in shortcuts are built from the real directory, not a hardcoded list.
  const quickAccounts = employees.slice(0, 2).map((e) => ({
    loginId: e.login_id,
    role: e.role === 'ADMIN' ? 'HR Admin' : e.job_position || 'Employee',
    name: `${e.first_name} ${e.last_name}`.trim(),
    icon: e.role === 'ADMIN' ? ShieldCheck : User,
  }));

  const [loginIdOrEmail, setLoginIdOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    const ok = await login(loginIdOrEmail, password);
    if (ok) {
      router.push('/dashboard');
    } else {
      setErrorMsg('No employee found for that login ID or email.');
      setIsSubmitting(false);
    }
  };

  const quickLogin = async (loginId: string) => {
    if (await login(loginId, 'pass123')) router.push('/dashboard');
  };

  return (
    <div className="hr-auth">
      <div className="hr-auth-card">
        <div className="hr-auth-head">
          <span className="hr-brand-mark hr-auth-mark" aria-hidden />
          <h1>Sign in to Dayflow</h1>
          <p className="hr-subtext">Employees, attendance, leave and payroll.</p>
        </div>

        {errorMsg && <div className="hr-alert hr-alert-danger">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="hr-auth-form">
          <Input
            label="Login ID or email"
            value={loginIdOrEmail}
            onChange={(e) => setLoginIdOrEmail(e.target.value)}
            placeholder="OISAJE20260001"
            autoComplete="username"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
          <Button type="submit" loading={isSubmitting} icon={<LogIn size={15} />} className="w-full">
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        {quickAccounts.length > 0 && (
          <>
        <div className="hr-auth-divider">
          <span>Or continue as</span>
        </div>

        <div className="hr-auth-demos">
          {quickAccounts.map((acc) => {
            const Icon = acc.icon;
            return (
              <button key={acc.loginId} type="button" className="hr-demo-card" onClick={() => quickLogin(acc.loginId)}>
                <div className="hr-demo-head">
                  <span className="hr-demo-role">{acc.role}</span>
                  <Icon size={14} aria-hidden />
                </div>
                <span className="hr-monospace hr-demo-id">{acc.loginId}</span>
                <span className="hr-cell-secondary">{acc.name}</span>
              </button>
            );
          })}
        </div>
          </>
        )}

        {isLoading && <p className="hr-form-hint">Loading directory…</p>}

        <p className="hr-auth-foot">
          Need an admin workspace? <Link href="/sign-up">Register here</Link>
        </p>
      </div>
    </div>
  );
}
