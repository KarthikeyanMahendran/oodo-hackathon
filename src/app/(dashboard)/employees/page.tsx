'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useHRMS } from '@/lib/context/HRMSContext';
import {
  Users,
  Search,
  UserPlus,
  Mail,
  Building,
  Briefcase,
  Copy,
  Check,
  X,
  ExternalLink,
  Plane,
} from 'lucide-react';

export default function EmployeeDirectoryPage() {
  const { employees, currentRole, getUserLiveStatus, addEmployee } = useHRMS();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // New Employee Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDept, setNewDept] = useState('Engineering');
  const [newJobPos, setNewJobPos] = useState('Software Engineer');
  const [newWage, setNewWage] = useState('75000');

  // Success state after creation
  const [createdCredential, setCreatedCredential] = useState<{
    name: string;
    login_id: string;
    tempPass: string;
  } | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);

  const departments = Array.from(new Set(employees.map((e) => e.department).filter(Boolean)));

  const filteredEmployees = employees.filter((emp) => {
    const nameMatch =
      `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.login_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase());

    const deptMatch = selectedDept === 'ALL' || emp.department === selectedDept;
    const status = getUserLiveStatus(emp.id);
    const statusMatch = selectedStatus === 'ALL' || status === selectedStatus;

    return nameMatch && deptMatch && statusMatch;
  });

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const { profile, tempPass } = addEmployee({
      role: 'EMPLOYEE',
      first_name: newFirstName,
      last_name: newLastName,
      email: newEmail,
      phone: newPhone,
      department: newDept,
      job_position: newJobPos,
      initialSalary: Number(newWage) || 75000,
    });

    setCreatedCredential({
      name: `${profile.first_name} ${profile.last_name}`,
      login_id: profile.login_id,
      tempPass,
    });

    setNewFirstName('');
    setNewLastName('');
    setNewEmail('');
    setNewPhone('');
  };

  const handleCopyCredentials = () => {
    if (!createdCredential) return;
    const text = `Name: ${createdCredential.name}\nLogin ID: ${createdCredential.login_id}\nInitial Password: ${createdCredential.tempPass}`;
    navigator.clipboard.writeText(text);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-zinc-950 border border-zinc-800 p-6 rounded-3xl shadow-2xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-white text-black font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Employee Directory
            </h1>
            <p className="text-xs text-zinc-400">
              Dayflow organizational directory, live status tracking, and member profiles
            </p>
          </div>
        </div>

        {currentRole === 'ADMIN' && (
          <button
            onClick={() => {
              setCreatedCredential(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-sm shadow-xl transition-all duration-200 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ New Employee</span>
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, Login ID (OISAJE...), or email..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white font-mono"
          />
        </div>

        <div className="relative">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-white"
          >
            <option value="ALL">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="PRESENT">🟢 Present</option>
            <option value="ABSENT">🟡 Absent</option>
            <option value="HALF_DAY">🌓 Half-Day</option>
            <option value="LEAVE">✈️ On Leave</option>
          </select>
        </div>
      </div>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredEmployees.map((emp) => {
          const liveStatus = getUserLiveStatus(emp.id);

          return (
            <Link
              key={emp.id}
              href={`/employees/${emp.id}`}
              className="group bg-zinc-950 border border-zinc-800 hover:border-white rounded-3xl p-5 shadow-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
            >
              {/* Status Badge */}
              <div className="absolute top-4 right-4 z-10">
                {liveStatus === 'PRESENT' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-black border border-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-black" />
                    Present
                  </span>
                )}
                {liveStatus === 'ABSENT' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-900 text-zinc-400 border border-zinc-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                    Absent
                  </span>
                )}
                {liveStatus === 'HALF_DAY' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-800 text-white border border-zinc-600">
                    🌓 Half-Day
                  </span>
                )}
                {liveStatus === 'LEAVE' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-900 text-white border border-zinc-700">
                    <Plane className="w-3 h-3" /> On Leave
                  </span>
                )}
              </div>

              {/* Header */}
              <div>
                <div className="flex items-center space-x-3.5 mb-4">
                  <img
                    src={emp.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                    alt={emp.first_name}
                    className="w-14 h-14 rounded-2xl object-cover ring-1 ring-zinc-700 group-hover:scale-105 transition-transform"
                  />
                  <div>
                    <h3 className="font-bold text-base text-white group-hover:text-zinc-300 transition-colors">
                      {emp.first_name} {emp.last_name}
                    </h3>
                    <p className="text-xs text-zinc-400 font-mono font-bold">
                      {emp.login_id}
                    </p>
                    <span className="inline-block mt-0.5 text-[9px] uppercase tracking-wider font-mono font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      {emp.role}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs text-zinc-400 border-t border-zinc-800/80 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <Building className="w-3.5 h-3.5 text-white" /> Dept:
                    </span>
                    <span className="font-medium text-zinc-200">{emp.department}</span>
                  </div>

                  {emp.job_position && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-zinc-400">
                        <Briefcase className="w-3.5 h-3.5 text-white" /> Position:
                      </span>
                      <span className="font-medium text-zinc-200">{emp.job_position}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <Mail className="w-3.5 h-3.5 text-white" /> Email:
                    </span>
                    <span className="font-mono text-zinc-300 truncate max-w-[140px]">
                      {emp.email}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-white font-bold group-hover:translate-x-1 transition-transform">
                <span>View Full Profile</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Register New Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-900"
            >
              <X className="w-5 h-5" />
            </button>

            {!createdCredential ? (
              <>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2.5 rounded-2xl bg-white text-black font-bold">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Register New Employee</h2>
                    <p className="text-xs text-zinc-400 font-mono">
                      Auto-generates custom Login ID pattern (e.g. OIFILASTYYYYSEQ)
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCreateEmployee} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newFirstName}
                        onChange={(e) => setNewFirstName(e.target.value)}
                        placeholder="e.g. Sarah"
                        className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newLastName}
                        onChange={(e) => setNewLastName(e.target.value)}
                        placeholder="e.g. Jenkins"
                        className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="sarah@acme.com"
                        className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        placeholder="+1 (555) 019-2834"
                        className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1">
                        Department
                      </label>
                      <select
                        value={newDept}
                        onChange={(e) => setNewDept(e.target.value)}
                        className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white"
                      >
                        <option value="Engineering">Engineering</option>
                        <option value="Product & Design">Product & Design</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Finance">Finance</option>
                        <option value="Human Resources">Human Resources</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1">
                        Job Position
                      </label>
                      <input
                        type="text"
                        value={newJobPos}
                        onChange={(e) => setNewJobPos(e.target.value)}
                        placeholder="e.g. Product Specialist"
                        className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Monthly Fixed Wage (INR ₹)
                    </label>
                    <input
                      type="number"
                      value={newWage}
                      onChange={(e) => setNewWage(e.target.value)}
                      placeholder="75000"
                      className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white font-mono"
                    />
                  </div>

                  <div className="pt-2 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-300 text-xs font-bold hover:bg-zinc-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-extrabold shadow-lg"
                    >
                      Create & Generate Credentials
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="space-y-5 text-center py-2">
                <div className="w-14 h-14 bg-white text-black rounded-2xl flex items-center justify-center mx-auto shadow-xl">
                  <Check className="w-7 h-7" />
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-white">Employee Account Generated</h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Copy and share these auto-generated credentials with{' '}
                    <strong className="text-white">{createdCredential.name}</strong>
                  </p>
                </div>

                <div className="bg-black border border-zinc-800 rounded-2xl p-4 text-left space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Login ID:</span>
                    <span className="text-white font-bold">{createdCredential.login_id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Initial Password:</span>
                    <span className="text-white font-bold">{createdCredential.tempPass}</span>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleCopyCredentials}
                    className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-bold text-xs hover:bg-zinc-800"
                  >
                    {copiedPass ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedPass ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
                  </button>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
