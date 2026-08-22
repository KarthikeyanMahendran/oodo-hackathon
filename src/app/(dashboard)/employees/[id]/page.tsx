'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useHRMS } from '@/lib/context/HRMSContext';
import { calculateSalaryBreakdown, formatCurrency } from '@/lib/utils/salaryCalculator';
import { WagePeriod } from '@/lib/types/hrms';
import {
  User,
  Mail,
  Phone,
  Building,
  Shield,
  FileText,
  Lock,
  DollarSign,
  Edit3,
  Save,
  Award,
  Sparkles,
  Briefcase,
  Calendar,
  CreditCard,
  Plus,
  X,
  Printer,
  CheckCircle,
  Heart,
  Smile,
} from 'lucide-react';

export default function EmployeeProfilePage() {
  const params = useParams();
  const {
    currentUser,
    currentRole,
    employees,
    updateProfile,
    updateSalary,
    getSalaryBreakdown,
  } = useHRMS();

  const employeeId = (params?.id as string) || currentUser?.id || 'admin-001';
  const targetEmployee = employees.find((e) => e.id === employeeId) || currentUser || employees[0];

  const isAdmin = currentRole === 'ADMIN';

  const [activeTab, setActiveTab] = useState<'general' | 'private' | 'salary'>('general');

  // Edit Mode Flags
  const [isEditingPrivate, setIsEditingPrivate] = useState(false);
  const [isEditingSalary, setIsEditingSalary] = useState(false);
  const [showPayslipModal, setShowPayslipModal] = useState(false);

  // Private Info Form state
  const [address, setAddress] = useState(targetEmployee?.address || '');
  const [personalEmail, setPersonalEmail] = useState(targetEmployee?.personal_email || '');
  const [nationality, setNationality] = useState(targetEmployee?.nationality || '');
  const [gender, setGender] = useState(targetEmployee?.gender || '');
  const [dob, setDob] = useState(targetEmployee?.date_of_birth || '');
  const [maritalStatus, setMaritalStatus] = useState(targetEmployee?.marital_status || 'Single');
  const [panNumber, setPanNumber] = useState(targetEmployee?.pan_number || '');
  const [uanNumber, setUanNumber] = useState(targetEmployee?.uan_number || '');
  const [bankName, setBankName] = useState(targetEmployee?.bank_name || '');
  const [bankAccount, setBankAccount] = useState(targetEmployee?.bank_account_number || '');
  const [bankIfsc, setBankIfsc] = useState(targetEmployee?.bank_ifsc || '');

  // General Bio & Skills Form state
  const [about, setAbout] = useState(targetEmployee?.about || '');
  const [whatILove, setWhatILove] = useState(targetEmployee?.what_i_love_about_job || '');
  const [hobbies, setHobbies] = useState<string[]>(targetEmployee?.hobbies || []);
  const [newHobbyInput, setNewHobbyInput] = useState('');
  const [skills, setSkills] = useState<string[]>(targetEmployee?.skills || []);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [certifications, setCertifications] = useState<string[]>(targetEmployee?.certifications || []);
  const [newCertInput, setNewCertInput] = useState('');

  // Salary Form state
  const currentSalaryBreakdown = getSalaryBreakdown(targetEmployee.id);
  const [wagePeriod, setWagePeriod] = useState<WagePeriod>(currentSalaryBreakdown.wage_period || 'MONTHLY');
  const [wageInput, setWageInput] = useState(
    String(wagePeriod === 'YEARLY' ? currentSalaryBreakdown.annual_ctc : currentSalaryBreakdown.monthly_wage)
  );

  const computedBreakdown = calculateSalaryBreakdown(Number(wageInput) || 0, wagePeriod);

  const handleSavePrivateInfo = () => {
    updateProfile({
      id: targetEmployee.id,
      address,
      personal_email: personalEmail,
      nationality,
      gender,
      date_of_birth: dob,
      marital_status: maritalStatus,
      pan_number: panNumber,
      uan_number: uanNumber,
      bank_name: bankName,
      bank_account_number: bankAccount,
      bank_ifsc: bankIfsc,
    });
    setIsEditingPrivate(false);
  };

  const handleSaveGeneralInfo = () => {
    updateProfile({
      id: targetEmployee.id,
      about,
      what_i_love_about_job: whatILove,
      hobbies,
      skills,
      certifications,
    });
  };

  const handleAddSkill = () => {
    if (!newSkillInput.trim()) return;
    const updated = [...skills, newSkillInput.trim()];
    setSkills(updated);
    setNewSkillInput('');
    updateProfile({ id: targetEmployee.id, skills: updated });
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const updated = skills.filter((s) => s !== skillToRemove);
    setSkills(updated);
    updateProfile({ id: targetEmployee.id, skills: updated });
  };

  const handleAddHobby = () => {
    if (!newHobbyInput.trim()) return;
    const updated = [...hobbies, newHobbyInput.trim()];
    setHobbies(updated);
    setNewHobbyInput('');
    updateProfile({ id: targetEmployee.id, hobbies: updated });
  };

  const handleRemoveHobby = (hToRemove: string) => {
    const updated = hobbies.filter((h) => h !== hToRemove);
    setHobbies(updated);
    updateProfile({ id: targetEmployee.id, hobbies: updated });
  };

  const handleAddCert = () => {
    if (!newCertInput.trim()) return;
    const updated = [...certifications, newCertInput.trim()];
    setCertifications(updated);
    setNewCertInput('');
    updateProfile({ id: targetEmployee.id, certifications: updated });
  };

  const handleRemoveCert = (certToRemove: string) => {
    const updated = certifications.filter((c) => c !== certToRemove);
    setCertifications(updated);
    updateProfile({ id: targetEmployee.id, certifications: updated });
  };

  const handleSaveSalary = () => {
    const numWage = Number(wageInput) || 0;
    updateSalary(targetEmployee.id, numWage, wagePeriod);
    setIsEditingSalary(false);
  };

  return (
    <div className="space-y-6">
      {/* Profile Header Banner */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <img
              src={targetEmployee.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt={targetEmployee.first_name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-2 ring-zinc-700 shadow-xl"
            />
            <div className="space-y-1.5">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {targetEmployee.first_name} {targetEmployee.last_name}
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-white text-black">
                  {targetEmployee.role}
                </span>
              </div>
              <p className="text-sm font-mono font-bold text-zinc-400">
                Login ID: {targetEmployee.login_id}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-300 pt-1">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-white" /> {targetEmployee.email}
                </span>
                {targetEmployee.phone && (
                  <span className="flex items-center gap-1.5 font-mono">
                    <Phone className="w-3.5 h-3.5 text-white" /> {targetEmployee.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-white" /> {targetEmployee.department}
                </span>
                {targetEmployee.job_position && (
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-white" /> {targetEmployee.job_position}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 border-t border-zinc-800 mt-8 pt-4">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'general'
                ? 'bg-white text-black shadow-lg'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Resume & General Info</span>
          </button>

          <button
            onClick={() => setActiveTab('private')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'private'
                ? 'bg-white text-black shadow-lg'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Private & Statutory Info</span>
          </button>

          {isAdmin ? (
            <button
              onClick={() => setActiveTab('salary')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'salary'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Salary Info (Admin-Only)</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-medium text-zinc-600 opacity-60 cursor-not-allowed">
              <Lock className="w-3.5 h-3.5" />
              <span>Salary Info (Admin Restricted)</span>
            </div>
          )}
        </div>
      </div>

      {/* TAB 1: RESUME & GENERAL INFO */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Bio / About me */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-white" /> Professional Biography
              </h2>
              <textarea
                rows={3}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                onBlur={handleSaveGeneralInfo}
                placeholder="Professional background, career milestones..."
                className="w-full bg-black border border-zinc-800 rounded-2xl p-3.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-white"
              />
            </div>

            {/* What I love about my job (Excalidraw feature) */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Heart className="w-4 h-4 text-white" /> What I Love About My Job
              </h2>
              <textarea
                rows={3}
                value={whatILove}
                onChange={(e) => setWhatILove(e.target.value)}
                onBlur={handleSaveGeneralInfo}
                placeholder="Workplace passion, favorite tasks, team culture..."
                className="w-full bg-black border border-zinc-800 rounded-2xl p-3.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-white"
              />
            </div>

            {/* Hobbies & Interests (Excalidraw feature) */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Smile className="w-4 h-4 text-white" /> Interests & Hobbies
              </h2>
              <div className="flex flex-wrap gap-2">
                {hobbies.map((h) => (
                  <span
                    key={h}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-200"
                  >
                    {h}
                    <button onClick={() => handleRemoveHobby(h)} className="hover:text-white p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex space-x-2 pt-1">
                <input
                  type="text"
                  value={newHobbyInput}
                  onChange={(e) => setNewHobbyInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddHobby()}
                  placeholder="Add hobby (e.g. Photography)..."
                  className="flex-1 bg-black border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-white"
                />
                <button onClick={handleAddHobby} className="p-2 rounded-xl bg-white text-black font-bold">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Skills & Certifications */}
          <div className="space-y-6">
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-white" /> Professional Skills
              </h2>

              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-white text-black"
                  >
                    {skill}
                    <button onClick={() => handleRemoveSkill(skill)} className="hover:opacity-70 p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex space-x-2 pt-1">
                <input
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                  placeholder="Add skill (e.g. React)..."
                  className="flex-1 bg-black border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-white"
                />
                <button onClick={handleAddSkill} className="p-2 rounded-xl bg-white text-black font-bold">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-white" /> Certifications
              </h2>

              <div className="space-y-2">
                {certifications.map((cert) => (
                  <div
                    key={cert}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-black border border-zinc-800 text-xs font-medium text-zinc-200"
                  >
                    <span>{cert}</span>
                    <button onClick={() => handleRemoveCert(cert)} className="text-zinc-500 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex space-x-2 pt-1">
                <input
                  type="text"
                  value={newCertInput}
                  onChange={(e) => setNewCertInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCert()}
                  placeholder="Add certification..."
                  className="flex-1 bg-black border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-white"
                />
                <button onClick={handleAddCert} className="p-2 rounded-xl bg-white text-black font-bold">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRIVATE INFO */}
      {activeTab === 'private' && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-white" /> Private Demographics & Statutory Data
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Residing address, statutory identifiers (PAN, UAN), and payroll banking credentials
              </p>
            </div>

            {!isEditingPrivate ? (
              <button
                onClick={() => setIsEditingPrivate(true)}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-all cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile Info</span>
              </button>
            ) : (
              <button
                onClick={handleSavePrivateInfo}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Demographics */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-800 pb-2">
                Personal Demographics
              </h3>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Residing Address</label>
                {isEditingPrivate ? (
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white"
                  />
                ) : (
                  <p className="text-xs font-medium text-zinc-200">{address || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Personal Email</label>
                {isEditingPrivate ? (
                  <input
                    type="email"
                    value={personalEmail}
                    onChange={(e) => setPersonalEmail(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white font-mono"
                  />
                ) : (
                  <p className="text-xs font-mono text-zinc-200">{personalEmail || 'Not provided'}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Nationality</label>
                  {isEditingPrivate ? (
                    <input
                      type="text"
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white"
                    />
                  ) : (
                    <p className="text-xs font-medium text-zinc-200">{nationality || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Gender</label>
                  {isEditingPrivate ? (
                    <input
                      type="text"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white"
                    />
                  ) : (
                    <p className="text-xs font-medium text-zinc-200">{gender || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Marital Status</label>
                  {isEditingPrivate ? (
                    <input
                      type="text"
                      value={maritalStatus}
                      onChange={(e) => setMaritalStatus(e.target.value)}
                      className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white"
                    />
                  ) : (
                    <p className="text-xs font-medium text-zinc-200">{maritalStatus || 'Single'}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Date of Birth</label>
                {isEditingPrivate ? (
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white font-mono"
                  />
                ) : (
                  <p className="text-xs font-mono text-zinc-200">{dob || 'Not provided'}</p>
                )}
              </div>
            </div>

            {/* Statutory Identification & Banking */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-800 pb-2">
                Statutory ID & Banking
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">PAN Number</label>
                  {isEditingPrivate ? (
                    <input
                      type="text"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value)}
                      className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white font-mono uppercase"
                    />
                  ) : (
                    <p className="text-xs font-mono font-bold text-white">{panNumber || 'ABCDE1234F'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">UAN Number</label>
                  {isEditingPrivate ? (
                    <input
                      type="text"
                      value={uanNumber}
                      onChange={(e) => setUanNumber(e.target.value)}
                      className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white font-mono"
                    />
                  ) : (
                    <p className="text-xs font-mono text-zinc-200">{uanNumber || '100928374615'}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Bank Name</label>
                {isEditingPrivate ? (
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white"
                  />
                ) : (
                  <p className="text-xs font-medium text-zinc-200">{bankName || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Account Number</label>
                {isEditingPrivate ? (
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white font-mono"
                  />
                ) : (
                  <p className="text-xs font-mono text-white font-bold">
                    {bankAccount ? `•••• ${bankAccount.slice(-4)}` : 'Not provided'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">IFSC / SWIFT Code</label>
                {isEditingPrivate ? (
                  <input
                    type="text"
                    value={bankIfsc}
                    onChange={(e) => setBankIfsc(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white font-mono uppercase"
                  />
                ) : (
                  <p className="text-xs font-mono text-zinc-200">{bankIfsc || 'Not provided'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SALARY INFO (ADMIN ONLY) */}
      {activeTab === 'salary' && isAdmin && (
        <div className="space-y-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-white" /> Statutory Salary Components & Breakdown
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                  Calculates Basic, HRA, Standard Allowance, Performance Bonus, LTA, Fixed Allowance, PF & Tax
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowPayslipModal(true)}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white text-xs font-bold cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Generate Payslip</span>
                </button>

                {!isEditingSalary ? (
                  <button
                    onClick={() => setIsEditingSalary(true)}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-extrabold cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Wage</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSaveSalary}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-extrabold cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save & Recalculate</span>
                  </button>
                )}
              </div>
            </div>

            {/* Wage Input & Period Toggle */}
            <div className="bg-black border border-zinc-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Defined Fixed Wage:
                  </span>
                  <div className="inline-flex p-0.5 bg-zinc-900 border border-zinc-800 rounded-lg">
                    <button
                      onClick={() => {
                        setWagePeriod('MONTHLY');
                        if (wagePeriod === 'YEARLY') {
                          setWageInput(String(Math.round((Number(wageInput) || 0) / 12)));
                        }
                      }}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                        wagePeriod === 'MONTHLY' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => {
                        setWagePeriod('YEARLY');
                        if (wagePeriod === 'MONTHLY') {
                          setWageInput(String((Number(wageInput) || 0) * 12));
                        }
                      }}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                        wagePeriod === 'YEARLY' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Yearly
                    </button>
                  </div>
                </div>

                {isEditingSalary ? (
                  <input
                    type="number"
                    value={wageInput}
                    onChange={(e) => setWageInput(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-xl font-bold text-white focus:outline-none focus:border-white font-mono"
                  />
                ) : (
                  <div className="text-2xl font-extrabold text-white font-mono">
                    {formatCurrency(computedBreakdown.monthly_wage)} / mo
                  </div>
                )}
              </div>

              <div className="text-right sm:border-l sm:border-zinc-800 sm:pl-6">
                <span className="text-xs text-zinc-400 font-bold block">Annual Cost to Company (CTC)</span>
                <span className="text-xl font-extrabold text-white font-mono">
                  {formatCurrency(computedBreakdown.annual_ctc)} / yr
                </span>
              </div>
            </div>

            {/* Component Breakdown Tables per Excalidraw */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Earnings Components */}
              <div className="bg-black border border-zinc-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span>Gross Earnings Components</span>
                  <span className="font-mono text-sm">{formatCurrency(computedBreakdown.gross_salary)}</span>
                </h3>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center text-zinc-300">
                    <span>Basic Salary (50% of Wage)</span>
                    <span className="font-bold text-white">{formatCurrency(computedBreakdown.basic_salary)}</span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-300">
                    <span>House Rent Allowance (HRA - 50% of Basic)</span>
                    <span className="font-bold text-white">{formatCurrency(computedBreakdown.hra)}</span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-300">
                    <span>Standard Allowance (8.33% of Wage)</span>
                    <span className="font-bold text-white">{formatCurrency(computedBreakdown.standard_allowance)}</span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-300">
                    <span>Performance Bonus (8.33% of Basic)</span>
                    <span className="font-bold text-white">{formatCurrency(computedBreakdown.performance_bonus)}</span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-300">
                    <span>Leave Travel Allowance (LTA - 8.333% of Basic)</span>
                    <span className="font-bold text-white">{formatCurrency(computedBreakdown.lta)}</span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-300 pt-1 border-t border-zinc-900">
                    <span>Fixed Allowance (Balance)</span>
                    <span className="font-bold text-white">{formatCurrency(computedBreakdown.fixed_allowance)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="bg-black border border-zinc-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span>Statutory Deductions</span>
                  <span className="font-mono text-sm">{formatCurrency(computedBreakdown.total_deductions)}</span>
                </h3>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center text-zinc-300">
                    <span>Provident Fund (PF - 12% of Basic)</span>
                    <span className="font-bold text-white">- {formatCurrency(computedBreakdown.pf)}</span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-300">
                    <span>Professional Tax (Statutory)</span>
                    <span className="font-bold text-white">- {formatCurrency(computedBreakdown.tax)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net In-Hand Highlight */}
            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-700 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-white">
                  Net Monthly In-Hand Take-Home Salary
                </span>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Calculated after statutory PF and professional tax deductions
                </p>
              </div>
              <div className="text-3xl font-black text-white font-mono">
                {formatCurrency(computedBreakdown.net_salary)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Payslip Modal Generator */}
      {showPayslipModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-xl w-full p-8 shadow-2xl relative">
            <button
              onClick={() => setShowPayslipModal(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-zinc-800 pb-4 mb-6 text-center">
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">Dayflow Enterprise HRMS</span>
              <h3 className="text-2xl font-extrabold text-white mt-1">Official Salary Slip</h3>
              <p className="text-xs text-zinc-400">Pay Period: August 2026</p>
            </div>

            <div className="space-y-4 font-mono text-xs text-zinc-300">
              <div className="grid grid-cols-2 gap-2 bg-black p-3.5 rounded-xl border border-zinc-800">
                <div>
                  <span className="text-zinc-500 block">Employee:</span>
                  <span className="text-white font-bold">{targetEmployee.first_name} {targetEmployee.last_name}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Login ID:</span>
                  <span className="text-white font-bold">{targetEmployee.login_id}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">PAN Number:</span>
                  <span className="text-white font-bold">{targetEmployee.pan_number || 'ABCDE1234F'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">UAN Number:</span>
                  <span className="text-white font-bold">{targetEmployee.uan_number || '100928374615'}</span>
                </div>
              </div>

              <div className="border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800 text-[10px] uppercase">
                    <tr>
                      <th className="p-3">Salary Component</th>
                      <th className="p-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-xs">
                    <tr><td className="p-2.5">Basic Salary</td><td className="p-2.5 text-right font-bold">{formatCurrency(computedBreakdown.basic_salary)}</td></tr>
                    <tr><td className="p-2.5">House Rent Allowance (HRA)</td><td className="p-2.5 text-right font-bold">{formatCurrency(computedBreakdown.hra)}</td></tr>
                    <tr><td className="p-2.5">Standard Allowance</td><td className="p-2.5 text-right font-bold">{formatCurrency(computedBreakdown.standard_allowance)}</td></tr>
                    <tr><td className="p-2.5">Performance Bonus</td><td className="p-2.5 text-right font-bold">{formatCurrency(computedBreakdown.performance_bonus)}</td></tr>
                    <tr><td className="p-2.5">Leave Travel Allowance (LTA)</td><td className="p-2.5 text-right font-bold">{formatCurrency(computedBreakdown.lta)}</td></tr>
                    <tr><td className="p-2.5">Fixed Allowance</td><td className="p-2.5 text-right font-bold">{formatCurrency(computedBreakdown.fixed_allowance)}</td></tr>
                    <tr className="bg-zinc-900 font-bold text-white">
                      <td className="p-2.5">Gross Salary</td>
                      <td className="p-2.5 text-right">{formatCurrency(computedBreakdown.gross_salary)}</td>
                    </tr>
                    <tr><td className="p-2.5">Provident Fund (PF) Deduction</td><td className="p-2.5 text-right font-bold">- {formatCurrency(computedBreakdown.pf)}</td></tr>
                    <tr><td className="p-2.5">Professional Tax</td><td className="p-2.5 text-right font-bold">- {formatCurrency(computedBreakdown.tax)}</td></tr>
                    <tr className="bg-white text-black font-extrabold text-sm">
                      <td className="p-3">Net Take-Home Pay</td>
                      <td className="p-3 text-right">{formatCurrency(computedBreakdown.net_salary)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowPayslipModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-white text-black text-xs font-extrabold shadow cursor-pointer"
              >
                Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
