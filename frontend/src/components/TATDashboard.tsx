import React, { useState, useEffect } from 'react';
import { Card } from './Primitives';
import { Icon } from './Icons';
import TATService, { type TATSummary, type TATRecord } from '../lib/tatService';

interface TATDashboardProps {
  patientId?: string;
  showPatientSpecific?: boolean;
}

export const TATDashboard: React.FC<TATDashboardProps> = ({ 
  patientId, 
  showPatientSpecific = false 
}) => {
  const [summary, setSummary] = useState<TATSummary[]>([]);
  const [patientTAT, setPatientTAT] = useState<TATRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTATData();
  }, [patientId]);

  const loadTATData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load summary data
      const summaryData = await TATService.getTATSummary();
      setSummary(summaryData);

      // Load patient-specific data if needed
      if (showPatientSpecific && patientId) {
        const patientData = await TATService.getPatientTAT(patientId);
        setPatientTAT(patientData);
      }
    } catch (err) {
      setError('Failed to load TAT data');
      console.error('TAT loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">TAT Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">TAT Dashboard</h2>
        <Card className="p-4 text-center text-red-600">
          {error}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          {showPatientSpecific ? 'Patient TAT Overview' : 'Hospital TAT Dashboard'}
        </h2>
        <button
          onClick={loadTATData}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
        >
          Refresh
        </button>
      </div>

      {/* Overall Performance Summary */}
      {!showPatientSpecific && summary.length > 0 && (
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {summary.reduce((sum, item) => sum + item.total_cases, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Cases</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {summary.reduce((sum, item) => sum + item.completed_cases, 0)}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {summary.reduce((sum, item) => sum + item.pending_cases, 0)}
              </div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {summary.length > 0 ? 
                  Math.round(summary.reduce((sum, item) => sum + item.average_duration_minutes, 0) / summary.length) : 0
                }m
              </div>
              <div className="text-sm text-gray-600">Avg Duration</div>
            </div>
          </div>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {summary.map((item) => (
          <Card key={item.service_type} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 text-sm">
                {TATService.getServiceDisplayName(item.service_type as any)}
              </h3>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                item.completed_cases === item.total_cases && item.total_cases > 0 
                  ? 'bg-green-100 text-green-800' 
                  : item.pending_cases > 0 
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-gray-100 text-gray-800'
              }`}>
                {item.completed_cases}/{item.total_cases}
              </div>
            </div>
            
            {/* Progress Bar */}
            {item.total_cases > 0 && (
              <div className="mb-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(item.completed_cases / item.total_cases) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Avg:</span>
                <span className="font-semibold text-blue-600">
                  {TATService.formatDuration(item.average_duration_minutes)}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Min:</span>
                <span className="font-medium text-green-600">
                  {TATService.formatDuration(item.min_duration_minutes)}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Max:</span>
                <span className="font-medium text-red-600">
                  {TATService.formatDuration(item.max_duration_minutes)}
                </span>
              </div>
              
              {item.pending_cases > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pending:</span>
                    <span className="font-semibold text-orange-600">
                      {item.pending_cases}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Performance Insights */}
      {!showPatientSpecific && summary.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Fastest Service</h4>
                  <p className="text-sm text-gray-600">
                    {summary
                      .filter(item => item.completed_cases > 0)
                      .sort((a, b) => a.average_duration_minutes - b.average_duration_minutes)[0]?.service_type 
                      ? TATService.getServiceDisplayName(summary
                          .filter(item => item.completed_cases > 0)
                          .sort((a, b) => a.average_duration_minutes - b.average_duration_minutes)[0].service_type as any)
                      : 'No data'
                    }
                  </p>
                </div>
                <Icon name="Zap" size={24} className="text-green-600" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Most Active</h4>
                  <p className="text-sm text-gray-600">
                    {summary
                      .sort((a, b) => b.total_cases - a.total_cases)[0]?.service_type
                      ? TATService.getServiceDisplayName(summary
                          .sort((a, b) => b.total_cases - a.total_cases)[0].service_type as any)
                      : 'No data'
                    }
                  </p>
                </div>
                <Icon name="Activity" size={24} className="text-blue-600" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Needs Attention</h4>
                  <p className="text-sm text-gray-600">
                    {summary
                      .filter(item => item.pending_cases > 0)
                      .sort((a, b) => b.pending_cases - a.pending_cases)[0]?.service_type
                      ? TATService.getServiceDisplayName(summary
                          .filter(item => item.pending_cases > 0)
                          .sort((a, b) => b.pending_cases - a.pending_cases)[0].service_type as any)
                      : 'All clear'
                    }
                  </p>
                </div>
                <Icon name="AlertCircle" size={24} className="text-orange-600" />
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Patient-specific TAT Timeline */}
      {showPatientSpecific && patientTAT.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Patient TAT Timeline</h3>
          <div className="space-y-3">
            {patientTAT.map((tat) => (
              <Card key={tat.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${TATService.getStatusColor(tat.status)}`}>
                      {tat.status.replace('_', ' ').toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {TATService.getServiceDisplayName(tat.service_type as any)}
                      </h4>
                      <p className="text-sm text-gray-500">
                        Started: {new Date(tat.start_time).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      {TATService.formatDuration(tat.duration_minutes)}
                    </div>
                    {tat.end_time && (
                      <div className="text-sm text-gray-500">
                        Completed: {new Date(tat.end_time).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
                
                {tat.notes && (
                  <div className="mt-2 text-sm text-gray-600">
                    <strong>Notes:</strong> {tat.notes}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TATDashboard;
