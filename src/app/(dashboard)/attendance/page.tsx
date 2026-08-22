'use client';

import React, { useState } from 'react';
import { useHRMS } from '@/lib/context/HRMSContext';
import {
  Clock,
  Calendar as CalendarIcon,
  Play,
  Square,
  Search,
  Users,
  UserCheck,
  UserX,
  Plane,
} from 'lucide-react';

export default function AttendancePage() {
  const {
    currentUser,
    currentRole,
    employees,
    attendanceLogs,
    isPunchedIn,
    elapsedSeconds,
    handlePunchToggle,
    getUserLiveStatus,
  } = useHRMS();

  const isAdmin = currentRole === 'ADMIN';

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [punchNotes, setPunchNotes] = useState('');

  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const myLogs = attendanceLogs.filter((log) => log.user_id === currentUser?.id);

  // Admin view organization metrics
  const totalEmployeesCount = employees.length;
  const presentTodayCount = employees.filter((e) => getUserLiveStatus(e.id) === 'PRESENT').length;
  const halfDayTodayCount = employees.filter((e) => getUserLiveStatus(e.id) === 'HALF_DAY').length;
  const absentTodayCount = employees.filter((e) => getUserLiveStatus(e.id) === 'ABSENT').length;
  const leaveTodayCount = employees.filter((e) => getUserLiveStatus(e.id) === 'LEAVE').length;

  const filteredAdminLogs = employees.filter((emp) => {
    const nameMatch =
      `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.login_id.toLowerCase().includes(searchQuery.toLowerCase());
    const deptMatch = selectedDept === 'ALL' || emp.department === selectedDept;
    return nameMatch && deptMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-zinc-950 border border-zinc-800 p-6 rounded-3xl shadow-2xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-white text-black font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Attendance & Time Tracking
            </h1>
            <p className="text-xs text-zinc-400">
              {isAdmin
                ? 'Organizational shift matrix & daily staff attendance tracking'
                : 'Personal monthly attendance log & real-time shift check-in/check-out'}
            </p>
          </div>
        </div>
      </div>

      {/* Live Punch Clock Banner */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start space-x-2">
              <span className={`h-3 w-3 rounded-full ${isPunchedIn ? 'bg-white animate-ping' : 'bg-zinc-600'}`} />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                {isPunchedIn ? 'Shift Active (Checked In)' : 'Out of Office (Checked Out)'}
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-mono font-black text-white">
              {isPunchedIn ? formatTimer(elapsedSeconds) : '00:00:00'}
            </div>
            <p className="text-xs text-zinc-400">
              Logged in as <strong className="text-white">{currentUser?.first_name} {currentUser?.last_name}</strong> ({currentUser?.login_id})
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            {!isPunchedIn && (
              <input
                type="text"
                value={punchNotes}
                onChange={(e) => setPunchNotes(e.target.value)}
                placeholder="Optional shift notes (e.g. Work from Home)..."
                className="w-full sm:w-64 bg-black border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white font-mono"
              />
            )}

            <button
              onClick={() => {
                handlePunchToggle(punchNotes);
                setPunchNotes('');
              }}
              className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl font-extrabold text-sm shadow-xl transition-all cursor-pointer ${
                isPunchedIn
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                  : 'bg-white hover:bg-zinc-200 text-black shadow-lg'
              }`}
            >
              {isPunchedIn ? (
                <>
                  <Square className="w-4 h-4 fill-current" />
                  <span>Check Out Shift</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Check In Shift</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ADMIN / HR VIEW: Matrix */}
      {isAdmin && (
        <div className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-lg flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-white text-black font-bold">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-zinc-400 font-semibold block">Total Staff</span>
                <span className="text-2xl font-extrabold text-white font-mono">{totalEmployeesCount}</span>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-lg flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-zinc-900 text-white font-bold border border-zinc-700">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-zinc-400 font-semibold block">Present Today</span>
                <span className="text-2xl font-extrabold text-white font-mono">{presentTodayCount}</span>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-lg flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-zinc-900 text-zinc-400 font-bold border border-zinc-800">
                <UserX className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-zinc-400 font-semibold block">Absent Today</span>
                <span className="text-2xl font-extrabold text-zinc-400 font-mono">{absentTodayCount}</span>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-lg flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-zinc-900 text-white font-bold border border-zinc-700">
                <Plane className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-zinc-400 font-semibold block">On Approved Leave</span>
                <span className="text-2xl font-extrabold text-white font-mono">{leaveTodayCount}</span>
              </div>
            </div>
          </div>

          {/* Admin Matrix */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-white" /> Daily Organizational Shift Matrix
              </h2>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-black border border-zinc-800 rounded-xl px-3.5 py-1.5 text-xs text-white focus:outline-none focus:border-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search staff by name or Login ID..."
                  className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white font-mono"
                />
              </div>

              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-black border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-white"
              >
                <option value="ALL">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Product & Design">Product & Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Finance">Finance</option>
                <option value="Human Resources">Human Resources</option>
              </select>
            </div>

            {/* Attendance Matrix Table */}
            <div className="overflow-x-auto rounded-2xl border border-zinc-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-black text-zinc-400 uppercase font-bold text-[10px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="p-4">Employee</th>
                    <th className="p-4">Login ID</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Check In</th>
                    <th className="p-4">Check Out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-zinc-200">
                  {filteredAdminLogs.map((emp) => {
                    const status = getUserLiveStatus(emp.id);
                    const empLog = attendanceLogs.find((l) => l.user_id === emp.id && l.date === selectedDate);

                    return (
                      <tr key={emp.id} className="hover:bg-zinc-900/50 transition-colors">
                        <td className="p-4 font-semibold flex items-center space-x-3">
                          <img
                            src={emp.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                            alt={emp.first_name}
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                          <span>{emp.first_name} {emp.last_name}</span>
                        </td>
                        <td className="p-4 font-mono font-bold text-white">{emp.login_id}</td>
                        <td className="p-4 text-zinc-300">{emp.department}</td>
                        <td className="p-4">
                          {status === 'PRESENT' && (
                            <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-white text-black">
                              🟢 Present
                            </span>
                          )}
                          {status === 'ABSENT' && (
                            <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-zinc-900 text-zinc-400 border border-zinc-700">
                              🟡 Absent
                            </span>
                          )}
                          {status === 'HALF_DAY' && (
                            <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-zinc-800 text-white border border-zinc-600">
                              🌓 Half-Day
                            </span>
                          )}
                          {status === 'LEAVE' && (
                            <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-zinc-900 text-white border border-zinc-700">
                              ✈️ On Leave
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-mono text-zinc-300">
                          {empLog?.check_in ? new Date(empLog.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </td>
                        <td className="p-4 font-mono text-zinc-300">
                          {empLog?.check_out ? new Date(empLog.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* EMPLOYEE VIEW: Monthly Personal Logs */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-white" /> My Monthly Attendance Log
        </h2>

        <div className="overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-black text-zinc-400 uppercase font-bold text-[10px] tracking-wider border-b border-zinc-800">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Check In</th>
                <th className="p-4">Check Out</th>
                <th className="p-4">Work Hours</th>
                <th className="p-4">Break Time</th>
                <th className="p-4">Status</th>
                <th className="p-4">Shift Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-zinc-200">
              {myLogs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-900/50 transition-colors">
                  <td className="p-4 font-mono font-bold text-white">{log.date}</td>
                  <td className="p-4 font-mono text-zinc-300">
                    {new Date(log.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-4 font-mono text-zinc-300">
                    {log.check_out
                      ? new Date(log.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Active Shift'}
                  </td>
                  <td className="p-4 font-mono font-bold text-white">
                    {log.work_hours || 4} hrs
                  </td>
                  <td className="p-4 font-mono text-zinc-400">
                    {log.break_time_mins || 15} mins
                  </td>
                  <td className="p-4">
                    {log.status === 'HALF_DAY' ? (
                      <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-zinc-800 text-white border border-zinc-600">
                        🌓 Half-Day
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-white text-black">
                        🟢 Present
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-zinc-400 italic">{log.notes || 'Regular Shift'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
