import { PageHeader } from '../components/PageHeader';
import { Card, Badge } from '../components/Primitives';
import { Icon } from '../components/Icons';
import { TATDashboard } from '../components/TATDashboard';
import { useState, useEffect } from 'react';

const kpiData = [
  {
    title: 'Total Patients',
    value: '1,247',
    change: '+12%',
    changeType: 'positive' as const,
    icon: 'Users',
  },
  {
    title: 'Active Cases',
    value: '89',
    change: '+5%',
    changeType: 'positive' as const,
    icon: 'Activity',
  },
  {
    title: 'Discharged Today',
    value: '23',
    change: '+8%',
    changeType: 'positive' as const,
    icon: 'CheckCircle',
  },
  {
    title: 'Pending Claims',
    value: '156',
    change: '-3%',
    changeType: 'negative' as const,
    icon: 'FileText',
  },
  {
    title: 'Notes Today',
    value: '47',
    change: '+15%',
    changeType: 'positive' as const,
    icon: 'Edit',
  },
  {
    title: 'Patient Files',
    value: '12',
    change: '+8%',
    changeType: 'positive' as const,
    icon: 'FileText',
  },
];

const recentActivity = [ // TODO: Implement recent activity display
  {
    id: 1,
    type: 'admission',
    patient: 'John Doe',
    time: '2 minutes ago',
    icon: 'User',
    color: 'text-blue-600',
  },
  {
    id: 2,
    type: 'discharge',
    patient: 'Jane Smith',
    time: '15 minutes ago',
    icon: 'CheckCircle',
    color: 'text-green-600',
  },
  {
    id: 3,
    type: 'note',
    patient: 'Mike Johnson',
    time: '1 hour ago',
    icon: 'Edit',
    color: 'text-purple-600',
  },
  {
    id: 4,
    type: 'claim',
    patient: 'Sarah Wilson',
    time: '2 hours ago',
    icon: 'FileText',
    color: 'text-orange-600',
  },
  {
    id: 5,
    type: 'handover',
    patient: 'Robert Brown',
    time: '3 hours ago',
    icon: 'Users',
    color: 'text-indigo-600',
  },
];

export default function Dashboard() {

  const recentActivity = [
    {
      id: 1,
      type: 'admission',
      patient: 'Rajesh Kumar Sharma',
      time: '2 minutes ago',
      icon: 'User',
      color: 'text-blue-600',
    },
    {
      id: 2,
      type: 'discharge',
      patient: 'Sunita Devi',
      time: '15 minutes ago',
      icon: 'CheckCircle',
      color: 'text-green-600',
    },
    {
      id: 3,
      type: 'note',
      patient: 'Vikram Singh',
      time: '1 hour ago',
      icon: 'Edit',
      color: 'text-purple-600',
    },
    {
      id: 4,
      type: 'claim',
      patient: 'Rajesh Kumar Sharma',
      time: '2 hours ago',
      icon: 'FileText',
      color: 'text-orange-600',
    },
    {
      id: 5,
      type: 'handover',
      patient: 'Sunita Devi',
      time: '3 hours ago',
      icon: 'Users',
      color: 'text-indigo-600',
    },
    {
      id: 6,
      type: 'patient-file',
      patient: 'Amit Kumar',
      time: '4 hours ago',
      icon: 'FileText',
      color: 'text-blue-600',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of hospital operations and patient care"
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        {kpiData.map((kpi) => (
          <Card key={kpi.title} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">
                  {kpi.title}
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {kpi.value}
                </p>
                <div className="flex items-center mt-2">
                  <Badge
                    variant={kpi.changeType === 'positive' ? 'success' : 'error'}
                    size="sm"
                  >
                    {kpi.change}
                  </Badge>
                  <span className="text-xs text-slate-500 ml-2">vs last month</span>
                </div>
              </div>
              <div className="p-3 bg-slate-100 rounded-lg">
                <Icon 
                  name={kpi.icon as keyof typeof import('../components/Icons').Icons} 
                  size={24} 
                  className="text-slate-600" 
                />
              </div>
            </div>
          </Card>
        ))}
      </div>


      {/* Quick Actions - Beside Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity - Left Side */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold font-heading text-slate-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <Icon name={activity.icon as any} size={16} className="text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {activity.patient}
                    </p>
                    <p className="text-xs text-slate-500">
                      {activity.type} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Quick Actions - Right Side */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold font-heading text-slate-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <button 
                onClick={() => window.location.href = '/admission'}
                className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left min-h-[100px]"
              >
                <Icon name="User" size={24} className="text-primary-600 mb-3" />
                <p className="text-sm font-medium text-slate-900">New Admission</p>
                <p className="text-xs text-slate-500">Register patient</p>
              </button>
              <button 
                onClick={() => window.location.href = '/doctor-slip/select'}
                className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left min-h-[100px]"
              >
                <Icon name="FileText" size={24} className="text-primary-600 mb-3" />
                <p className="text-sm font-medium text-slate-900">Doctor Slip</p>
                <p className="text-xs text-slate-500">Consultation</p>
              </button>
              <button 
                onClick={() => window.location.href = '/operation-record/select'}
                className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left min-h-[100px]"
              >
                <Icon name="Activity" size={24} className="text-primary-600 mb-3" />
                <p className="text-sm font-medium text-slate-900">Operation Record</p>
                <p className="text-xs text-slate-500">Surgery</p>
              </button>
              <button 
                onClick={() => window.location.href = '/nurse-handover/select'}
                className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left min-h-[100px]"
              >
                <Icon name="Users" size={24} className="text-primary-600 mb-3" />
                <p className="text-sm font-medium text-slate-900">Nurse Handover</p>
                <p className="text-xs text-slate-500">Shift handover</p>
              </button>
              <button 
                onClick={() => window.location.href = '/claims/select'}
                className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left min-h-[100px]"
              >
                <Icon name="BarChart3" size={24} className="text-primary-600 mb-3" />
                <p className="text-sm font-medium text-slate-900">View Claims</p>
                <p className="text-xs text-slate-500">Insurance</p>
              </button>
              <button 
                onClick={() => window.location.href = '/patient-file/select'}
                className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left min-h-[100px]"
              >
                <Icon name="FileText" size={24} className="text-primary-600 mb-3" />
                <p className="text-sm font-medium text-slate-900">Patient File</p>
                <p className="text-xs text-slate-500">12 sections</p>
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* TAT Dashboard - Full Width */}
      <TATDashboard />
    </div>
  );
}
