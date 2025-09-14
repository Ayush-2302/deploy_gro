// TAT (Turnaround Time) Service for tracking medical service durations
// This service manages TAT records for various medical services

export interface TATRecord {
  id: string;
  patient_id: string;
  service_type: ServiceType;
  start_time: string;
  end_time?: string;
  duration_minutes: number;
  status: TATStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TATSummary {
  service_type: ServiceType;
  total_cases: number;
  completed_cases: number;
  pending_cases: number;
  average_duration_minutes: number;
  min_duration_minutes: number;
  max_duration_minutes: number;
}

export type ServiceType = 
  | 'admission'
  | 'doctor_note'
  | 'nurse_handover'
  | 'discharge'
  | 'operation_record'
  | 'patient_file'
  | 'claims';

export type TATStatus = 
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'paused';

class TATServiceClass {
  private baseUrl = '/api/tat';

  // Start tracking TAT for a service
  async startTAT(patientId: string, serviceType: ServiceType, notes?: string): Promise<TATRecord> {
    try {
      const response = await fetch(`${this.baseUrl}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: patientId,
          service_type: serviceType,
          notes: notes || '',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to start TAT: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error starting TAT:', error);
      throw error;
    }
  }

  // Complete TAT tracking
  async completeTAT(tatId: string, notes?: string): Promise<TATRecord> {
    try {
      const response = await fetch(`${this.baseUrl}/complete/${tatId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: notes || '',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to complete TAT: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error completing TAT:', error);
      throw error;
    }
  }

  // Get TAT summary for all services
  async getTATSummary(): Promise<TATSummary[]> {
    try {
      const response = await fetch(`${this.baseUrl}/summary`);

      if (!response.ok) {
        throw new Error(`Failed to fetch TAT summary: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching TAT summary:', error);
      // Return mock data for development
      return this.getMockSummary();
    }
  }

  // Get TAT records for a specific patient
  async getPatientTAT(patientId: string): Promise<TATRecord[]> {
    try {
      const response = await fetch(`${this.baseUrl}/patient/${patientId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch patient TAT: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching patient TAT:', error);
      // Return mock data for development
      return this.getMockPatientTAT(patientId);
    }
  }

  // Get service display name
  getServiceDisplayName(serviceType: ServiceType): string {
    const displayNames: Record<ServiceType, string> = {
      admission: 'Admission',
      doctor_note: 'Doctor Note',
      nurse_handover: 'Nurse Handover',
      discharge: 'Discharge',
      operation_record: 'Operation Record',
      patient_file: 'Patient File',
      claims: 'Claims Processing',
    };

    return displayNames[serviceType] || serviceType;
  }

  // Format duration in minutes to human readable format
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours}h`;
    }

    return `${hours}h ${remainingMinutes}m`;
  }

  // Get status color for UI
  getStatusColor(status: TATStatus): string {
    const colors: Record<TATStatus, string> = {
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      paused: 'bg-yellow-100 text-yellow-800',
    };

    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  // Mock data for development
  private getMockSummary(): TATSummary[] {
    return [
      {
        service_type: 'admission',
        total_cases: 25,
        completed_cases: 23,
        pending_cases: 2,
        average_duration_minutes: 45,
        min_duration_minutes: 20,
        max_duration_minutes: 90,
      },
      {
        service_type: 'doctor_note',
        total_cases: 18,
        completed_cases: 15,
        pending_cases: 3,
        average_duration_minutes: 30,
        min_duration_minutes: 15,
        max_duration_minutes: 60,
      },
      {
        service_type: 'nurse_handover',
        total_cases: 12,
        completed_cases: 12,
        pending_cases: 0,
        average_duration_minutes: 25,
        min_duration_minutes: 10,
        max_duration_minutes: 45,
      },
      {
        service_type: 'discharge',
        total_cases: 8,
        completed_cases: 6,
        pending_cases: 2,
        average_duration_minutes: 60,
        min_duration_minutes: 30,
        max_duration_minutes: 120,
      },
      {
        service_type: 'operation_record',
        total_cases: 5,
        completed_cases: 4,
        pending_cases: 1,
        average_duration_minutes: 90,
        min_duration_minutes: 45,
        max_duration_minutes: 180,
      },
    ];
  }

  private getMockPatientTAT(patientId: string): TATRecord[] {
    const now = new Date();
    const startTime = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
    const endTime = new Date(now.getTime() - 1 * 60 * 60 * 1000); // 1 hour ago

    return [
      {
        id: 'tat-1',
        patient_id: patientId,
        service_type: 'admission',
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: 60,
        status: 'completed',
        notes: 'Patient admission completed successfully',
        created_at: startTime.toISOString(),
        updated_at: endTime.toISOString(),
      },
      {
        id: 'tat-2',
        patient_id: patientId,
        service_type: 'doctor_note',
        start_time: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        duration_minutes: 30,
        status: 'in_progress',
        notes: 'Doctor consultation in progress',
        created_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        updated_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      },
    ];
  }
}

// Export singleton instance
const TATService = new TATServiceClass();
export default TATService;
