'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useHRMS } from '@/lib/context/HRMSContext';
import { Building2, User, Mail, Phone, Lock, Upload, ArrowRight } from 'lucide-react';

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
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
    }
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
        avatar_url: logoPreview || 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=150',
        about: `Founder & HR Admin at ${companyName || 'Dayflow Organization'}.`,
      });

      login(profile.login_id, password);
      router.push('/employees');
    }, 600);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4">
      <div className="max-w-xl w-full bg-zinc-950 border border-zinc-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white text-black mb-1 shadow-md">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Register Dayflow HR Workspace
          </h2>
          <p className="text-xs text-zinc-400 font-mono">
            Every workday, perfectly aligned.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company Name & Logo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-zinc-300 mb-1 uppercase tracking-wider">
                Company Name *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Dayflow Global Tech"
                  className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1 uppercase tracking-wider">
                Company Logo
              </label>
              <label className="flex items-center justify-center space-x-2 border border-dashed border-zinc-700 hover:border-white rounded-xl p-2 cursor-pointer bg-black hover:bg-zinc-900 transition-all">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-6 h-6 rounded object-cover" />
                ) : (
                  <Upload className="w-4 h-4 text-zinc-400" />
                )}
                <span className="text-xs text-zinc-400 font-medium">
                  {logoPreview ? 'Uploaded' : 'Upload'}
                </span>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Admin Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1 uppercase tracking-wider">
                Admin First Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Sarah"
                  className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1 uppercase tracking-wider">
                Admin Last Name *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Jenkins"
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white"
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1 uppercase tracking-wider">
                Work Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1 uppercase tracking-wider">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white"
                />
              </div>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1 uppercase tracking-wider">
              Admin Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-sm shadow-xl transition-all duration-200 mt-2"
          >
            <span>{isSubmitting ? 'Creating HR Workspace...' : 'Initialize Company & Log In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-4 border-t border-zinc-800 mt-4">
          <p className="text-xs text-zinc-400">
            Already registered?{' '}
            <Link href="/sign-in" className="text-white font-bold underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
