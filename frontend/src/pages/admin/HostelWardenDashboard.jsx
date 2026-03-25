import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import {
  EmptyState,
  PageHeader,
  PageSpinner,
  StatCard,
  StatusBadge,
} from '../../components/common';
import {
  FiCheckCircle,
  FiClock,
  FiHome,
  FiLogOut,
  FiShield,
} from '../../components/common/icons';

export default function HostelWardenDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [studentStats, setStudentStats] = useState(null);
  const [outpasses, setOutpasses] = useState([]);
  const [checkins, setCheckins] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/students/stats/summary'),
      api.get('/outpass', { params: { status: 'pending' } }),
      api.get('/checkin'),
    ])
      .then(([statsRes, outpassRes, checkinRes]) => {
        setStudentStats(statsRes.data.stats || null);
        setOutpasses(outpassRes.data.outpasses || []);
        setCheckins(checkinRes.data.records || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;

  const today = new Date().toDateString();
  const todayMovements = checkins.filter(record =>
    new Date(record.timestamp).toDateString() === today
  );
  const todayCheckIns = todayMovements.filter(record => record.type === 'check_in').length;
  const todayCheckOuts = todayMovements.filter(record => record.type === 'check_out').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hostel Dashboard"
        subtitle="Hostel movement and outpass overview"
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={<FiHome />}
          label="Hostel Students"
          value={studentStats?.hostel || 0}
          color="purple"
        />
        <StatCard
          icon={<FiLogOut />}
          label="Pending Outpass"
          value={outpasses.length}
          color="yellow"
        />
        <StatCard
          icon={<FiCheckCircle />}
          label="Today's Movements"
          value={todayMovements.length}
          color="green"
          sub={`${todayCheckIns} in / ${todayCheckOuts} out`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="section-title">Quick Actions</h3>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/admin/outpass')}
              className="w-full text-left px-3 py-2.5 rounded-lg bg-yellow-50 hover:bg-yellow-100 text-yellow-700 text-sm font-medium transition-colors"
            >
              Review Outpass Requests
            </button>
            <button
              onClick={() => navigate('/admin/checkin')}
              className="w-full text-left px-3 py-2.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium transition-colors"
            >
              View Check In / Out
            </button>
            <button
              onClick={() => navigate('/admin/notifications')}
              className="w-full text-left px-3 py-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium transition-colors"
            >
              Open Notifications
            </button>
          </div>
        </div>

        <div className="card lg:col-span-2">
          <h3 className="section-title">Pending Outpass Requests</h3>
          {outpasses.length === 0 ? (
            <EmptyState message="No pending outpass requests" icon={<FiShield />} />
          ) : (
            <div className="space-y-3">
              {outpasses.slice(0, 6).map(request => (
                <div
                  key={request._id}
                  className="flex items-center justify-between gap-3 border-b border-gray-50 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-sm text-gray-800">
                      {request.student?.firstName} {request.student?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {request.destination || 'Destination not set'} • {request.reason || 'No reason'}
                    </p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="card">
          <h3 className="section-title">Recent Movements</h3>
          {todayMovements.length === 0 ? (
            <EmptyState message="No movement records for today" icon={<FiClock />} />
          ) : (
            <div className="space-y-3">
              {todayMovements.slice(0, 6).map(record => (
                <div
                  key={record._id}
                  className="flex items-center justify-between gap-3 border-b border-gray-50 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-sm text-gray-800">
                      {record.student?.firstName} {record.student?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {record.location} • {new Date(record.timestamp).toLocaleTimeString('en-IN')}
                    </p>
                  </div>
                  <StatusBadge status={record.type} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
