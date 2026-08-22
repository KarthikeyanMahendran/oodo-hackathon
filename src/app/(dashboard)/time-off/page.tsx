'use client';

import React, { useState } from 'react';
import { useHRMS } from '@/lib/context/HRMSContext';
import { LeaveType } from '@/lib/types/hrms';
import {
  CalendarDays,
  Plus,
  Clock,
  FileText,
  Upload,
  Calendar,
  Paperclip,
  X,
} from 'lucide-react';

export default function TimeOffPage() {
  const {
    currentUser,
    currentRole,
    timeOffRequests,
    applyForTimeOff,
    handleTimeOffAction,
    getUserLeaveBalance,
  } = useHRMS();

  const isAdmin = currentRole === 'ADMIN';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveType>('PAID');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [docPreview, setDocPreview] = useState<string | null>(null);

  const [actionReqId, setActionReqId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [adminComment, setAdminComment] = useState('');

  const calculateDays = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
  };

  const currentDuration = calculateDays(startDate, endDate);
  const userBalance = getUserLeaveBalance(currentUser?.id || 'emp-001');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setDocPreview(url);
    }
  };

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    applyForTimeOff({
      user_id: currentUser.id,
      type: leaveType,
      start_date: startDate,
      end_date: endDate,
      days_count: currentDuration,
      reason,
      document_url: docPreview,
    });

    setIsModalOpen(false);
    setReason('');
    setDocPreview(null);
  };

  const handleExecuteAdminAction = () => {
    if (!actionReqId) return;
    handleTimeOffAction(actionReqId, actionType, adminComment);
    setActionReqId(null);
    setAdminComment('');
  };

  const myLeaves = timeOffRequests.filter((r) => r.user_id === currentUser?.id);
  const pendingRequests = timeOffRequests.filter((r) => r.status === 'PENDING');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-zinc-950 border border-zinc-800 p-6 rounded-3xl shadow-2xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-white text-black font-bold">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Time Off & Leave Management
            </h1>
            <p className="text-xs text-zinc-400">
              Apply for leave, track approval workflows, and view leave balances
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-sm shadow-xl transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Apply for Time Off</span>
        </button>
      </div>

      {/* Leave Balance Summary Cards per Excalidraw (24 Days PTO, 7 Days Sick) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-xl space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-center text-xs font-bold text-zinc-400">
            <span>Paid Time Off (PTO)</span>
            <span className="px-2 py-0.5 rounded bg-white text-black font-mono text-[10px] font-extrabold">
              24 Days / Year
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {userBalance.paid_days - userBalance.paid_used}
            </span>
            <span className="text-xs text-zinc-400">days available</span>
          </div>
          <div className="w-full bg-black rounded-full h-2 overflow-hidden border border-zinc-800">
            <div
              className="bg-white h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, ((userBalance.paid_days - userBalance.paid_used) / userBalance.paid_days) * 100)}%`,
              }}
            />
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-xl space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-center text-xs font-bold text-zinc-400">
            <span>Sick Time Off</span>
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-white font-mono text-[10px] font-bold border border-zinc-700">
              7 Days / Year
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {userBalance.sick_days - userBalance.sick_used}
            </span>
            <span className="text-xs text-zinc-400">days available</span>
          </div>
          <div className="w-full bg-black rounded-full h-2 overflow-hidden border border-zinc-800">
            <div
              className="bg-zinc-400 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, ((userBalance.sick_days - userBalance.sick_used) / userBalance.sick_days) * 100)}%`,
              }}
            />
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-xl space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-center text-xs font-bold text-zinc-400">
            <span>Unpaid Leave Taken</span>
            <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 font-mono text-[10px] border border-zinc-800">
              Discretionary
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {userBalance.unpaid_used}
            </span>
            <span className="text-xs text-zinc-400">days used</span>
          </div>
          <p className="text-[11px] text-zinc-500 italic">Subject to HR approval</p>
        </div>
      </div>

      {/* ADMIN / HR VIEW: Incoming Queue */}
      {isAdmin && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-white" /> Incoming Leave Requests Queue ({pendingRequests.length} Pending)
            </h2>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-black text-zinc-400 uppercase font-bold text-[10px] tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="p-4">Employee</th>
                  <th className="p-4">Leave Type</th>
                  <th className="p-4">Date Range</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Attachment</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-zinc-200">
                {timeOffRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="p-4 font-semibold text-white">
                      <div>{req.employee_name || 'Staff Member'}</div>
                      <span className="text-[10px] text-zinc-400 font-mono">{req.department}</span>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-900 text-white border border-zinc-700">
                        {req.type}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-zinc-300">
                      {req.start_date} to {req.end_date}
                    </td>
                    <td className="p-4 font-mono font-bold text-white">{req.days_count} Days</td>
                    <td className="p-4">
                      {req.document_url ? (
                        <a
                          href={req.document_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-white underline font-bold"
                        >
                          <Paperclip className="w-3.5 h-3.5" /> Certificate Proof
                        </a>
                      ) : (
                        <span className="text-zinc-600 italic">None</span>
                      )}
                    </td>
                    <td className="p-4">
                      {req.status === 'PENDING' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-900 text-zinc-300 border border-zinc-700">
                          ⏳ Pending
                        </span>
                      )}
                      {req.status === 'APPROVED' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-black">
                          ✅ Approved
                        </span>
                      )}
                      {req.status === 'REJECTED' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-900 text-zinc-400 border border-zinc-800">
                          ❌ Rejected
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {req.status === 'PENDING' ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setActionReqId(req.id);
                              setActionType('APPROVED');
                            }}
                            className="px-3 py-1 rounded-lg bg-white text-black font-bold text-[11px] shadow hover:bg-zinc-200 cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setActionReqId(req.id);
                              setActionType('REJECTED');
                            }}
                            className="px-3 py-1 rounded-lg bg-zinc-800 text-white border border-zinc-700 font-bold text-[11px] hover:bg-zinc-700 cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-zinc-500 italic">
                          {req.admin_comment ? `"${req.admin_comment}"` : 'Actioned'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Interactive Monthly Calendar & My History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-white" /> August 2026 Calendar
            </h2>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-zinc-400">
            <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
              const dateStr = `2026-08-${String(day).padStart(2, '0')}`;
              const isLeave = myLeaves.some((r) => r.start_date <= dateStr && r.end_date >= dateStr);
              return (
                <div
                  key={day}
                  className={`p-2.5 rounded-xl text-xs font-mono font-medium transition-all ${
                    isLeave
                      ? 'bg-white text-black font-bold shadow-md'
                      : day === 22
                      ? 'bg-zinc-800 text-white font-bold border border-zinc-600'
                      : 'bg-black text-zinc-300 hover:bg-zinc-900'
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>

        {/* My Leave Request History */}
        <div className="lg:col-span-2 bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-white" /> My Leave Request History
          </h2>

          <div className="overflow-x-auto rounded-2xl border border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-black text-zinc-400 uppercase font-bold text-[10px] tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="p-4">Type</th>
                  <th className="p-4">Dates</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-zinc-200">
                {myLeaves.map((req) => (
                  <tr key={req.id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="p-4 font-bold text-white">{req.type}</td>
                    <td className="p-4 font-mono text-zinc-300">
                      {req.start_date} to {req.end_date}
                    </td>
                    <td className="p-4 font-mono font-bold text-white">{req.days_count} Days</td>
                    <td className="p-4 text-zinc-400 max-w-xs truncate">{req.reason || 'N/A'}</td>
                    <td className="p-4">
                      {req.status === 'PENDING' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-900 text-zinc-300 border border-zinc-700">
                          ⏳ Pending
                        </span>
                      )}
                      {req.status === 'APPROVED' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-black">
                          ✅ Approved
                        </span>
                      )}
                      {req.status === 'REJECTED' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-900 text-zinc-400 border border-zinc-800">
                          ❌ Rejected
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* "Apply for Time Off" Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-900"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2.5 rounded-2xl bg-white text-black font-bold">
                <CalendarDays className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Apply for Time Off</h2>
                <p className="text-xs text-zinc-400">
                  Submit a leave request for HR officer review
                </p>
              </div>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Leave Type *
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white"
                >
                  <option value="PAID">Paid Time Off (PTO)</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="UNPAID">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white font-mono"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black border border-zinc-800 flex justify-between items-center text-xs">
                <span className="text-zinc-400">Allocation Duration:</span>
                <span className="font-mono font-bold text-white">{currentDuration} Days</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Reason for Time Off
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide brief context..."
                  className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Medical Certificate / Attachment (Optional for Sick Leave)
                </label>
                <label className="flex items-center justify-center space-x-2 border border-dashed border-zinc-700 hover:border-white rounded-xl p-3 cursor-pointer bg-black hover:bg-zinc-900 transition-all">
                  <Upload className="w-4 h-4 text-zinc-400" />
                  <span className="text-xs text-zinc-400">
                    {docPreview ? 'Medical Certificate Uploaded ✅' : 'Upload document (PDF/Image)'}
                  </span>
                  <input type="file" onChange={handleFileUpload} className="hidden" />
                </label>
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
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Action Comment Modal */}
      {actionReqId && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-2">
              {actionType === 'APPROVED' ? 'Approve Leave Request' : 'Reject Leave Request'}
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Add optional HR response note for the employee.
            </p>

            <textarea
              rows={3}
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
              placeholder="e.g. Approved. Enjoy your time off!"
              className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-white mb-4"
            />

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setActionReqId(null)}
                className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-300 text-xs font-bold hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteAdminAction}
                className="px-5 py-2 rounded-xl bg-white text-black text-xs font-extrabold shadow hover:bg-zinc-200 cursor-pointer"
              >
                Confirm {actionType}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
