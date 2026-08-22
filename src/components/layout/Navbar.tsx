'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useHRMS } from '@/lib/context/HRMSContext';
import {
  Users,
  Clock,
  CalendarDays,
  User,
  LogOut,
  ChevronDown,
  Building2,
  Play,
  Square,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const {
    currentUser,
    currentRole,
    setCurrentRole,
    employees,
    switchUser,
    logout,
    isPunchedIn,
    elapsedSeconds,
    handlePunchToggle,
  } = useHRMS();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const navLinks = [
    { href: '/employees', label: 'Employees', icon: Users },
    { href: '/attendance', label: 'Attendance', icon: Clock },
    { href: '/time-off', label: 'Time Off', icon: CalendarDays },
  ];

  return (
    <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-zinc-800 text-zinc-100 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Dayflow Logo & Module Links */}
          <div className="flex items-center space-x-8">
            <Link href="/employees" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-white p-0.5 shadow-md shadow-white/10 group-hover:scale-105 transition-transform duration-200">
                <div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight text-white block leading-none">
                  Dayflow
                </span>
                <span className="text-[9px] font-mono tracking-widest text-zinc-400 uppercase">
                  Every workday, aligned.
                </span>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || (link.href === '/employees' && pathname === '/');
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-zinc-100 text-black shadow-md'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-zinc-400'}`} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Actions: Punch Action & Profile Dropdown */}
          <div className="flex items-center space-x-4">
            {/* Live Punch Clock Widget */}
            {currentUser && (
              <div className="flex items-center space-x-3 bg-zinc-950 px-3.5 py-1.5 rounded-xl border border-zinc-800 shadow-inner">
                <div className="flex items-center space-x-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        isPunchedIn ? 'bg-white' : 'bg-zinc-600'
                      }`}
                    />
                    <span
                      className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                        isPunchedIn ? 'bg-white' : 'bg-zinc-600'
                      }`}
                    />
                  </span>
                  <span className="font-mono text-xs text-zinc-200 font-bold tracking-wider">
                    {isPunchedIn ? formatTimer(elapsedSeconds) : 'PUNCHED OUT'}
                  </span>
                </div>

                <button
                  onClick={() => handlePunchToggle()}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 ${
                    isPunchedIn
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                      : 'bg-white hover:bg-zinc-200 text-black shadow-md'
                  }`}
                >
                  {isPunchedIn ? (
                    <>
                      <Square className="w-3 h-3 fill-current" />
                      <span>Punch Out</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current" />
                      <span>Check In</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Profile Avatar Dropdown */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2.5 p-1 rounded-xl hover:bg-zinc-900 transition-colors duration-150 focus:outline-none"
                >
                  <img
                    src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                    alt={currentUser.first_name}
                    className="w-9 h-9 rounded-lg object-cover ring-1 ring-zinc-700 shadow-sm"
                  />
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-bold text-white">
                      {currentUser.first_name} {currentUser.last_name}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      {currentUser.login_id} • {currentRole}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-zinc-400" />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-72 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95"
                    onMouseLeave={() => setIsDropdownOpen(false)}
                  >
                    {/* Header info */}
                    <div className="px-4 py-3 border-b border-zinc-800">
                      <p className="text-xs text-zinc-400">Signed in as</p>
                      <p className="text-sm font-bold text-white truncate">
                        {currentUser.first_name} {currentUser.last_name}
                      </p>
                      <p className="text-xs font-mono text-zinc-400">{currentUser.email}</p>
                    </div>

                    {/* Role Switcher for Demo */}
                    <div className="px-4 py-2.5 border-b border-zinc-800 bg-black/50">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                          Active Role View
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-zinc-800 text-white border border-zinc-700">
                          {currentRole}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => {
                            setCurrentRole('ADMIN');
                            setIsDropdownOpen(false);
                          }}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold text-center transition-all ${
                            currentRole === 'ADMIN'
                              ? 'bg-white text-black shadow'
                              : 'bg-zinc-900 text-zinc-400 hover:text-white'
                          }`}
                        >
                          Admin Mode
                        </button>
                        <button
                          onClick={() => {
                            setCurrentRole('EMPLOYEE');
                            setIsDropdownOpen(false);
                          }}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold text-center transition-all ${
                            currentRole === 'EMPLOYEE'
                              ? 'bg-white text-black shadow'
                              : 'bg-zinc-900 text-zinc-400 hover:text-white'
                          }`}
                        >
                          Employee Mode
                        </button>
                      </div>
                    </div>

                    {/* Persona Selector */}
                    <div className="px-4 py-2 border-b border-zinc-800">
                      <p className="text-[10px] font-bold uppercase text-zinc-400 mb-1.5 tracking-wider">
                        Switch Persona
                      </p>
                      <select
                        value={currentUser.id}
                        onChange={(e) => {
                          switchUser(e.target.value);
                          setIsDropdownOpen(false);
                        }}
                        className="w-full text-xs bg-black border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-zinc-500"
                      >
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.first_name} {emp.last_name} ({emp.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Links */}
                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors"
                      >
                        <User className="w-4 h-4 text-white" />
                        <span>My Profile</span>
                      </Link>

                      <button
                        onClick={() => {
                          logout();
                          router.push('/sign-in');
                        }}
                        className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/sign-in"
                  className="text-xs font-bold text-zinc-300 hover:text-white px-3 py-1.5 rounded-xl hover:bg-zinc-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="text-xs font-bold bg-white text-black px-4 py-1.5 rounded-xl hover:bg-zinc-200 shadow-md transition-all"
                >
                  Register HR Workspace
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
