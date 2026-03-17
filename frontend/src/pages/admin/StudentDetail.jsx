import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { downloadPaymentReceipt } from '../../api/axios';
import { PageSpinner, StatusBadge } from '../../components/common';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiEdit3 } from '../../components/common/icons';

const TABS = ['Profile', 'Fees', 'Payments', 'Ledger', 'Leave', 'Outpass'];

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [fees, setFees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [outpasses, setOutpasses] = useState([]);
  const [tab, setTab] = useState('Profile');
  const [loading, setLoading] = useState(true);

  const handleReceiptDownload = async (paymentId) => {
    try {
      await downloadPaymentReceipt(paymentId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to download receipt');
    }
  };

  useEffect(() => {
    Promise.all([
      api.get(`/students/${id}`),
      api.get(`/fees/student/${id}`),
      api.get(`/payments/student/${id}`),
      api.get(`/ledger/student/${id}`),
      api.get(`/leave?studentId=${id}`),
      api.get(`/outpass?studentId=${id}`),
    ]).then(([s, f, p, l, lv, op]) => {
      setStudent(s.data.student);
      setFees(f.data.fees);
      setPayments(p.data.payments);
      setLedger(l.data.entries);
      setLeaves(lv.data.leaves);
      setOutpasses(op.data.outpasses);
    }).catch(() => toast.error('Failed to load student')).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageSpinner />;
  if (!student) return <div className="text-center py-20 text-gray-400">Student not found</div>;

  const fmt = n => `₹${(n || 0).toLocaleString('en-IN')}`;
  const personalDetails = [
    ['DOB', student.dob ? new Date(student.dob).toLocaleDateString('en-IN') : ''],
    ['Gender', student.gender],
    ['Blood Group', student.bloodGroup],
    ['Aadhar', student.aadharNo],
    ['Religion', student.religion],
    ['Category', student.category],
  ].filter(([, value]) => value);
  const addressDetails = [
    ['Street', student.address?.street],
    ['City', student.address?.city],
    ['State', student.address?.state],
    ['Pincode', student.address?.pincode],
  ].filter(([, value]) => value);
  const familyDetails = [
    ['Father', student.father?.name],
    ['Father Phone', student.father?.phone],
    ['Father Occupation', student.father?.occupation],
    ['Mother', student.mother?.name],
    ['Mother Phone', student.mother?.phone],
    ['Mother Occupation', student.mother?.occupation],
    ['Guardian', student.guardian?.name],
    ['Guardian Relation', student.guardian?.relation],
    ['Guardian Phone', student.guardian?.phone],
  ].filter(([, value]) => value);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-secondary text-sm inline-flex items-center gap-2">
          <FiArrowLeft /> Back
        </button>
        <h1 className="page-title">{student.firstName} {student.lastName}</h1>
        <StatusBadge status={student.status} />
        <button
          onClick={() => navigate(`/admin/students/${id}/edit`)}
          className="btn-primary text-sm inline-flex items-center gap-2 ml-auto"
        >
          <FiEdit3 /> Edit Student
        </button>
      </div>

      <div className="card mb-6 flex flex-wrap gap-6 items-start">
        <div className="w-20 h-20 rounded-xl bg-primary-100 text-primary-700 text-3xl font-bold flex items-center justify-center shrink-0">
          {student.photo ? <img src={student.photo} alt="" className="w-20 h-20 rounded-xl object-cover" /> : student.firstName[0]}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 flex-1 min-w-0">
          {[
            ['Reg No', student.regNo],
            ['Phone', student.phone],
            ['Course', student.course?.name],
            ['Admission', new Date(student.admissionDate).toLocaleDateString('en-IN')],
            ['Email', student.email || '-'],
            ['Hostel', student.isHosteler ? 'Yes' : 'No'],
            ['Batch', student.batch || '-'],
            ['Semester', student.semester || '-'],
          ].map(([k, v]) => (
            <div key={k} className="min-w-0">
              <p className="text-xs text-gray-400 font-medium">{k}</p>
              <p className="text-sm text-gray-800 font-medium mt-0.5 break-words">{v || '-'}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="section-title">Personal Details</h3>
            {personalDetails.length ? personalDetails.map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{k}</span>
                <span className="text-sm font-medium text-gray-800">{v}</span>
              </div>
            )) : <p className="text-sm text-gray-400">No personal details available.</p>}
          </div>

          <div className="card">
            <h3 className="section-title">Address</h3>
            {addressDetails.length ? addressDetails.map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{k}</span>
                <span className="text-sm font-medium text-gray-800">{v}</span>
              </div>
            )) : <p className="text-sm text-gray-400">No address details available.</p>}
          </div>

          <div className="card md:col-span-2">
            <h3 className="section-title">Family Details</h3>
            {familyDetails.length ? familyDetails.map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{k}</span>
                <span className="text-sm font-medium text-gray-800">{v}</span>
              </div>
            )) : <p className="text-sm text-gray-400">No parent or guardian details available.</p>}
          </div>
        </div>
      )}

      {tab === 'Fees' && (
        <div className="space-y-4">
          {fees.map(f => (
            <div key={f._id} className="card">
              <div className="flex flex-wrap gap-3 justify-between items-start mb-3">
                <div><p className="font-semibold text-gray-800">{f.academicYear} - Sem {f.semester}</p></div>
                <StatusBadge status={f.status} />
              </div>
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg"><p className="text-lg font-bold text-blue-700">{fmt(f.totalAmount)}</p><p className="text-xs text-blue-500">Billed</p></div>
                <div className="text-center p-3 bg-green-50 rounded-lg"><p className="text-lg font-bold text-green-700">{fmt(f.totalPaid)}</p><p className="text-xs text-green-500">Paid</p></div>
                <div className="text-center p-3 bg-red-50 rounded-lg"><p className="text-lg font-bold text-red-700">{fmt(f.totalDue)}</p><p className="text-xs text-red-500">Due</p></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50"><th className="text-left p-2 text-xs text-gray-500">Head</th><th className="text-right p-2 text-xs text-gray-500">Amount</th><th className="text-right p-2 text-xs text-gray-500">Paid</th><th className="text-right p-2 text-xs text-gray-500">Due</th></tr></thead>
                  <tbody>{f.feeHeads?.map((h, i) => <tr key={i} className="border-t border-gray-50"><td className="p-2">{h.headName}</td><td className="p-2 text-right">{fmt(h.amount)}</td><td className="p-2 text-right text-green-600">{fmt(h.paid)}</td><td className="p-2 text-right text-red-600">{fmt(h.due)}</td></tr>)}</tbody>
                </table>
              </div>
            </div>
          ))}
          {fees.length === 0 && <div className="card text-center py-10 text-gray-400">No fees assigned yet</div>}
        </div>
      )}

      {tab === 'Payments' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="table-header">Receipt</th><th className="table-header">Date</th><th className="table-header">Amount</th><th className="table-header">Mode</th><th className="table-header">Status</th><th className="table-header">Receipt</th></tr></thead>
            <tbody className="divide-y divide-gray-50">
              {payments.map(p => (
                <tr key={p._id}>
                  <td className="table-cell font-mono text-xs">{p.receiptNo}</td>
                  <td className="table-cell">{new Date(p.paymentDate).toLocaleDateString('en-IN')}</td>
                  <td className="table-cell font-semibold text-green-600">{fmt(p.amount)}</td>
                  <td className="table-cell capitalize">{p.paymentMode}</td>
                  <td className="table-cell"><StatusBadge status={p.status} /></td>
                  <td className="table-cell">
                    <button type="button" onClick={() => handleReceiptDownload(p._id)} className="text-primary-600 hover:underline text-xs">
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {payments.length === 0 && <div className="text-center py-10 text-gray-400">No payments found</div>}
        </div>
      )}

      {tab === 'Ledger' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="table-header">Date</th><th className="table-header">Category</th><th className="table-header">Description</th><th className="table-header">Debit</th><th className="table-header">Credit</th><th className="table-header">Balance</th></tr></thead>
            <tbody className="divide-y divide-gray-50">
              {ledger.map((e, i) => (
                <tr key={i}>
                  <td className="table-cell">{new Date(e.date).toLocaleDateString('en-IN')}</td>
                  <td className="table-cell capitalize">{e.category?.replace('_', ' ')}</td>
                  <td className="table-cell text-gray-500">{e.description}</td>
                  <td className="table-cell text-red-600">{e.type === 'debit' ? fmt(e.amount) : ''}</td>
                  <td className="table-cell text-green-600">{e.type === 'credit' ? fmt(e.amount) : ''}</td>
                  <td className="table-cell font-medium">{fmt(e.runningBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {ledger.length === 0 && <div className="text-center py-10 text-gray-400">No ledger entries</div>}
        </div>
      )}

      {tab === 'Leave' && (
        <div className="space-y-3">
          {leaves.map(l => (
            <div key={l._id} className="card flex flex-wrap gap-4 justify-between items-start">
              <div>
                <p className="font-medium text-gray-800 capitalize">{l.leaveType} Leave</p>
                <p className="text-sm text-gray-500">{new Date(l.fromDate).toLocaleDateString('en-IN')} - {new Date(l.toDate).toLocaleDateString('en-IN')} ({l.noOfDays} days)</p>
                <p className="text-sm text-gray-600 mt-1">{l.reason}</p>
              </div>
              <StatusBadge status={l.status} />
            </div>
          ))}
          {leaves.length === 0 && <div className="card text-center py-10 text-gray-400">No leave records</div>}
        </div>
      )}

      {tab === 'Outpass' && (
        <div className="space-y-3">
          {outpasses.map(o => (
            <div key={o._id} className="card flex flex-wrap gap-4 justify-between items-start">
              <div>
                <p className="font-medium text-gray-800">{o.reason}</p>
                <p className="text-sm text-gray-500">Exit: {new Date(o.exitDate).toLocaleDateString('en-IN')} | Return: {new Date(o.expectedReturn).toLocaleDateString('en-IN')}</p>
                {o.destination && <p className="text-sm text-gray-500">Destination: {o.destination}</p>}
              </div>
              <StatusBadge status={o.status} />
            </div>
          ))}
          {outpasses.length === 0 && <div className="card text-center py-10 text-gray-400">No outpass records</div>}
        </div>
      )}
    </div>
  );
}
