// Post-processing service for admission data
// Handles data transformation and validation for admission forms

export interface RawAdmissionData {
  name?: string;
  age?: number | string;
  gender?: string;
  mobile_no?: string;
  admitted_under_doctor?: string;
  attender_name?: string;
  relation?: string;
  attender_mobile_no?: string;
  aadhaar_number?: string;
  admission_date?: string;
  admission_time?: string;
  ward?: string;
  bed_number?: string;
  reason?: string;
  [key: string]: any;
}

export interface ProcessedAdmissionData {
  patient_id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  mobile_no: string;
  admitted_under_doctor: string;
  attender_name: string;
  relation: string;
  attender_mobile_no: string;
  aadhaar_number: string;
  admission_date: string;
  admission_time: string;
  ward: string;
  bed_number: string;
  reason: string;
  status: 'admitted' | 'pending' | 'discharged';
  created_at: string;
  updated_at: string;
}

// Generate unique patient ID
const generatePatientId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `PAT-${timestamp}-${random}`.toUpperCase();
};

// Normalize gender value
const normalizeGender = (gender: string | undefined): 'male' | 'female' | 'other' => {
  if (!gender) return 'other';
  
  const normalized = gender.toLowerCase().trim();
  if (normalized.includes('male') && !normalized.includes('female')) return 'male';
  if (normalized.includes('female')) return 'female';
  return 'other';
};

// Normalize age to number
const normalizeAge = (age: number | string | undefined): number => {
  if (typeof age === 'number') return age;
  if (typeof age === 'string') {
    const parsed = parseInt(age.replace(/\D/g, ''), 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// Normalize mobile number
const normalizeMobileNumber = (mobile: string | undefined): string => {
  if (!mobile) return '';
  return mobile.replace(/\D/g, '').substring(0, 10);
};

// Normalize Aadhaar number
const normalizeAadhaarNumber = (aadhaar: string | undefined): string => {
  if (!aadhaar) return '';
  const cleaned = aadhaar.replace(/\D/g, '');
  if (cleaned.length === 12) {
    return `${cleaned.substring(0, 4)} ${cleaned.substring(4, 8)} ${cleaned.substring(8, 12)}`;
  }
  return cleaned;
};

// Normalize date to YYYY-MM-DD format
const normalizeDate = (date: string | undefined): string => {
  if (!date) return new Date().toISOString().split('T')[0];
  
  // Handle various date formats
  const dateStr = date.toString().trim();
  
  // If it's already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Handle DD-MM-YYYY format
  if (/^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(dateStr)) {
    const parts = dateStr.split(/[-/]/);
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
    return `${year}-${month}-${day}`;
  }
  
  // Handle relative dates
  if (dateStr.toLowerCase().includes('today')) {
    return new Date().toISOString().split('T')[0];
  }
  
  if (dateStr.toLowerCase().includes('tomorrow')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
  
  if (dateStr.toLowerCase().includes('yesterday')) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }
  
  // Default to today if parsing fails
  return new Date().toISOString().split('T')[0];
};

// Normalize time to HH:MM format
const normalizeTime = (time: string | undefined): string => {
  if (!time) return new Date().toTimeString().substring(0, 5);
  
  const timeStr = time.toString().trim();
  
  // If it's already in HH:MM format
  if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
    const [hours, minutes] = timeStr.split(':');
    return `${hours.padStart(2, '0')}:${minutes}`;
  }
  
  // Handle AM/PM format
  if (/^\d{1,2}:\d{2}\s*(am|pm)$/i.test(timeStr)) {
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = match[2];
      const period = match[3].toLowerCase();
      
      if (period === 'pm' && hours !== 12) {
        hours += 12;
      } else if (period === 'am' && hours === 12) {
        hours = 0;
      }
      
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }
  }
  
  // Handle "now" or "current time"
  if (timeStr.toLowerCase().includes('now') || timeStr.toLowerCase().includes('current')) {
    return new Date().toTimeString().substring(0, 5);
  }
  
  // Default to current time if parsing fails
  return new Date().toTimeString().substring(0, 5);
};

// Validate processed data
const validateProcessedData = (data: ProcessedAdmissionData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Patient name is required');
  }
  
  if (data.age < 0 || data.age > 120) {
    errors.push('Age must be between 0 and 120');
  }
  
  if (data.mobile_no.length !== 10) {
    errors.push('Mobile number must be 10 digits');
  }
  
  if (data.aadhaar_number && data.aadhaar_number.replace(/\s/g, '').length !== 12) {
    errors.push('Aadhaar number must be 12 digits');
  }
  
  if (!data.admitted_under_doctor || data.admitted_under_doctor.trim().length === 0) {
    errors.push('Admitting doctor is required');
  }
  
  if (!data.ward || data.ward.trim().length === 0) {
    errors.push('Ward is required');
  }
  
  if (!data.bed_number || data.bed_number.trim().length === 0) {
    errors.push('Bed number is required');
  }
  
  if (!data.reason || data.reason.trim().length === 0) {
    errors.push('Admission reason is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Main post-processing function
export const postProcessAdmission = (rawData: RawAdmissionData): ProcessedAdmissionData => {
  const now = new Date().toISOString();
  
  const processed: ProcessedAdmissionData = {
    patient_id: generatePatientId(),
    name: rawData.name?.trim() || '',
    age: normalizeAge(rawData.age),
    gender: normalizeGender(rawData.gender),
    mobile_no: normalizeMobileNumber(rawData.mobile_no),
    admitted_under_doctor: rawData.admitted_under_doctor?.trim() || '',
    attender_name: rawData.attender_name?.trim() || '',
    relation: rawData.relation?.trim() || '',
    attender_mobile_no: normalizeMobileNumber(rawData.attender_mobile_no),
    aadhaar_number: normalizeAadhaarNumber(rawData.aadhaar_number),
    admission_date: normalizeDate(rawData.admission_date),
    admission_time: normalizeTime(rawData.admission_time),
    ward: rawData.ward?.trim() || '',
    bed_number: rawData.bed_number?.trim() || '',
    reason: rawData.reason?.trim() || '',
    status: 'admitted',
    created_at: now,
    updated_at: now,
  };
  
  // Validate the processed data
  const validation = validateProcessedData(processed);
  if (!validation.isValid) {
    console.warn('Admission data validation warnings:', validation.errors);
  }
  
  return processed;
};

// Utility function to get default admission data
export const getDefaultAdmissionData = (): Partial<RawAdmissionData> => {
  const now = new Date();
  return {
    admission_date: now.toISOString().split('T')[0],
    admission_time: now.toTimeString().substring(0, 5),
    gender: 'other',
    age: 0,
    mobile_no: '',
    aadhaar_number: '',
    ward: '',
    bed_number: '',
    reason: '',
  };
};

// Utility function to format admission data for display
export const formatAdmissionForDisplay = (data: ProcessedAdmissionData): Record<string, string> => {
  return {
    'Patient ID': data.patient_id,
    'Name': data.name,
    'Age': data.age.toString(),
    'Gender': data.gender.charAt(0).toUpperCase() + data.gender.slice(1),
    'Mobile': data.mobile_no,
    'Admitting Doctor': data.admitted_under_doctor,
    'Attender': data.attender_name,
    'Relation': data.relation,
    'Attender Mobile': data.attender_mobile_no,
    'Aadhaar': data.aadhaar_number,
    'Admission Date': data.admission_date,
    'Admission Time': data.admission_time,
    'Ward': data.ward,
    'Bed Number': data.bed_number,
    'Reason': data.reason,
    'Status': data.status.charAt(0).toUpperCase() + data.status.slice(1),
  };
};
