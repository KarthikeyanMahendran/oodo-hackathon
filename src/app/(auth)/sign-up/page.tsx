'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Upload } from 'lucide-react';
import { useHRMS } from '@/lib/context/HRMSContext';
import { Button, Input, FieldRow } from '@/components/ui';

export default function SignUpPage() {
  const router = useRouter();
  const { addEmployee, login } = useHRMS();

  const [companyName, setCompanyName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const { profile } = addEmployee({
        role: 'ADMIN',
        first_name: firstName || 'Company',
        last_name: lastName || 'Admin',
        email,
        phone,
        department: 'Executive Administration',
        job_position: 'HR Admin & Founder',
        avatar_url: logoPreview,
        about: `Founder & HR Admin at ${companyName || 'Dayflow Organization'}.`,
      });

      login(profile.login_id, password);
      router.push('/employees');
    }, 600);
  };

  return (
    <div className="hr-auth">
      <div className="hr-auth-card is-wide">
        <div className="hr-auth-head">
          <span className="hr-brand-mark hr-auth-mark" aria-hidden />
          <h1>Create your workspace</h1>
          <p className="hr-subtext">Sets up the admin account that runs payroll and approvals.</p>
        </div>

        <form onSubmit={handleSubmit} className="hr-auth-form">
          <Input
            label="Company name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Acme Industries"
            required
          />

          <FieldRow>
            <Input
              label="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Sarah"
              required
            />
            <Input
              label="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Jenkins"
              required
            />
          </FieldRow>

          <FieldRow>
            <Input
              label="Work email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah@acme.com"
              required
            />
            <Input
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
            />
          </FieldRow>

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            hint="You will use this with the login ID generated for you."
            required
          />

          <div className="hr-form-group">
            <label className="hr-form-label">Company logo</label>
            <label className="hr-upload">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoPreview} alt="Logo preview" className="hr-upload-preview" />
              ) : (
                <Upload size={16} aria-hidden />
              )}
              <span>{logoPreview ? 'Change logo' : 'Upload a logo (optional)'}</span>
              <input type="file" accept="image/*" onChange={handleLogoUpload} hidden />
            </label>
          </div>

          <Button type="submit" loading={isSubmitting} icon={<ArrowRight size={15} />} className="w-full">
            {isSubmitting ? 'Creating workspace…' : 'Create workspace'}
          </Button>
        </form>

        <p className="hr-auth-foot">
          Already have an account? <Link href="/sign-in">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
