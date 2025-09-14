// API service for making HTTP requests to the backend
// Provides utility functions for common API operations

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Generic error handler
const handleError = (error: any, context: string) => {
  console.error(`API Error in ${context}:`, error);
  throw new Error(`API request failed: ${error.message || 'Unknown error'}`);
};

// Generic fetch wrapper with error handling
const apiRequest = async (
  url: string,
  options: RequestInit = {},
  context: string = 'API request'
): Promise<Response> => {
  try {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    
    const response = await fetch(fullUrl, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response;
  } catch (error) {
    handleError(error, context);
    throw error;
  }
};

// GET request utility
export const getJSON = async <T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  try {
    const response = await apiRequest(url, {
      method: 'GET',
      ...options,
    }, `GET ${url}`);

    return await response.json();
  } catch (error) {
    handleError(error, `GET ${url}`);
    throw error;
  }
};

// POST request utility
export const postJSON = async <T = any>(
  url: string,
  data?: any,
  options: RequestInit = {}
): Promise<T> => {
  try {
    const response = await apiRequest(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }, `POST ${url}`);

    return await response.json();
  } catch (error) {
    handleError(error, `POST ${url}`);
    throw error;
  }
};

// PUT request utility
export const putJSON = async <T = any>(
  url: string,
  data?: any,
  options: RequestInit = {}
): Promise<T> => {
  try {
    const response = await apiRequest(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }, `PUT ${url}`);

    return await response.json();
  } catch (error) {
    handleError(error, `PUT ${url}`);
    throw error;
  }
};

// DELETE request utility
export const deleteJSON = async <T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  try {
    const response = await apiRequest(url, {
      method: 'DELETE',
      ...options,
    }, `DELETE ${url}`);

    // DELETE requests might not return JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return {} as T;
  } catch (error) {
    handleError(error, `DELETE ${url}`);
    throw error;
  }
};

// File upload utility
export const uploadFile = async (
  url: string,
  file: File,
  additionalData?: Record<string, any>,
  options: RequestInit = {}
): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const response = await apiRequest(url, {
      method: 'POST',
      body: formData,
      ...options,
    }, `UPLOAD ${url}`);

    return await response.json();
  } catch (error) {
    handleError(error, `UPLOAD ${url}`);
    throw error;
  }
};

// Health check utility
export const healthCheck = async (): Promise<boolean> => {
  try {
    await getJSON('/health');
    return true;
  } catch (error) {
    console.warn('Health check failed:', error);
    return false;
  }
};

// API endpoints configuration
export const API_ENDPOINTS = {
  // Patient endpoints
  PATIENTS: '/patients',
  PATIENT_BY_ID: (id: string) => `/patients/${id}`,
  
  // Admission endpoints
  ADMISSIONS: '/admissions',
  ADMISSION_BY_ID: (id: string) => `/admissions/${id}`,
  
  // Doctor note endpoints
  DOCTOR_NOTES: '/doctor-notes',
  DOCTOR_NOTE_BY_ID: (id: string) => `/doctor-notes/${id}`,
  
  // Nurse handover endpoints
  NURSE_HANDOVERS: '/nurse-handovers',
  NURSE_HANDOVER_BY_ID: (id: string) => `/nurse-handovers/${id}`,
  
  // Discharge endpoints
  DISCHARGES: '/discharges',
  DISCHARGE_BY_ID: (id: string) => `/discharges/${id}`,
  
  // Operation record endpoints
  OPERATION_RECORDS: '/operation-records',
  OPERATION_RECORD_BY_ID: (id: string) => `/operation-records/${id}`,
  
  // Patient file endpoints
  PATIENT_FILES: '/patient-files',
  PATIENT_FILE_BY_ID: (id: string) => `/patient-files/${id}`,
  
  // Claims endpoints
  CLAIMS: '/claims',
  CLAIM_BY_ID: (id: string) => `/claims/${id}`,
  
  // TAT endpoints
  TAT_START: '/tat/start',
  TAT_COMPLETE: (id: string) => `/tat/complete/${id}`,
  TAT_SUMMARY: '/tat/summary',
  TAT_PATIENT: (patientId: string) => `/tat/patient/${patientId}`,
  
  // Health check
  HEALTH: '/health',
} as const;

// Export the base URL for external use
export { API_BASE_URL };
