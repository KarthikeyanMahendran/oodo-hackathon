'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, ShieldCheck, User } from 'lucide-react';
import { useHRMS } from '@/lib/context/HRMSContext';
import { Button, Input } from '@/components/ui';

const DEMO_ACCOUNTS = [
  { loginId: 'OISAJE20260001', role: 'HR Admin', name: 'Sarah Jenkins', icon: ShieldCheck },
  { loginId: 'OIALRI20260002', role: 'Employee', name: 'Alex Rivera', icon: User },
];

export default function SignInPage() {
  const router = useRouter();
  const { login } = useHRMS();

  const [loginIdOrEmail, setLoginIdOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    setTimeout(() => {
      if (login(loginIdOrEmail, password)) {
        router.push('/employees');
      } else {
        setErrorMsg('Invalid login ID / email or password. Try a demo account below.');
        setIsSubmitting(false);
      }
    }, 400);
  };

  const quickLogin = (loginId: string) => {
    if (login(loginId, 'pass123')) router.push('/employees');
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

        <div className="hr-auth-divider">
          <span>Or use a demo persona</span>
        </div>

        <div className="hr-auth-demos">
          {DEMO_ACCOUNTS.map((acc) => {
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

        <p className="hr-auth-foot">
          Need an admin workspace? <Link href="/sign-up">Register here</Link>
        </p>
      </div>
    </div>
  );
}
