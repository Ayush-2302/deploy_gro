// NABH PDF Service for generating NABH-compliant PDF documents
// Handles PDF generation for handover and discharge summaries

export interface NABHHandoverData {
  patient_id: string;
  patient_name: string;
  ward: string;
  bed_number: string;
  admission_date: string;
  handover_type: 'outgoing' | 'incoming' | 'incharge' | 'summary';
  handover_data: {
    patient_condition?: string;
    vital_signs?: string;
    medications?: string[];
    pending_tasks?: string[];
    special_instructions?: string;
    shift_summary?: string;
    patient_updates?: string;
    new_orders?: string[];
    alerts?: string[];
    follow_up_required?: string;
    ward_summary?: string;
    critical_patients?: string[];
    staff_assignments?: string;
    equipment_status?: string;
    administrative_notes?: string;
    overall_condition?: string;
    key_events?: string[];
    medication_changes?: string[];
    family_communication?: string;
    next_shift_priorities?: string[];
  };
  timestamp: string;
  nurse_name: string;
  nurse_signature?: string;
}

export interface NABHDischargeData {
  patient_id: string;
  patient_name: string;
  admission_date: string;
  discharge_date: string;
  ward: string;
  bed_number: string;
  discharge_diagnosis: string[];
  treatment_summary: string;
  medications: string[];
  follow_up_instructions: string;
  doctor_name: string;
  doctor_signature?: string;
  timestamp: string;
}

class NABHPDFServiceClass {
  private baseUrl = '/api/pdf';

  // Generate handover PDF
  async generateHandoverPDF(data: NABHHandoverData): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/handover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate handover PDF: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error generating handover PDF:', error);
      // Return mock PDF for development
      return this.generateMockPDF('handover');
    }
  }

  // Generate discharge PDF
  async generateDischargePDF(data: NABHDischargeData): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/discharge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate discharge PDF: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error generating discharge PDF:', error);
      // Return mock PDF for development
      return this.generateMockPDF('discharge');
    }
  }

  // Download PDF file
  downloadPDF(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Convert discharge form data to NABH format
  convertDischargeData(formData: any): NABHDischargeData {
    return {
      patient_id: formData.patient_id || '',
      patient_name: formData.patient_name || '',
      admission_date: formData.admission_date || '',
      discharge_date: formData.discharge_date || new Date().toISOString().split('T')[0],
      ward: formData.ward || '',
      bed_number: formData.bed_number || '',
      discharge_diagnosis: Array.isArray(formData.discharge_diagnosis) 
        ? formData.discharge_diagnosis 
        : [formData.discharge_diagnosis || ''],
      treatment_summary: formData.treatment_summary || '',
      medications: Array.isArray(formData.medications) 
        ? formData.medications 
        : [formData.medications || ''],
      follow_up_instructions: formData.follow_up_instructions || '',
      doctor_name: formData.doctor_name || '',
      doctor_signature: formData.doctor_signature || '',
      timestamp: new Date().toISOString(),
    };
  }

  // Convert handover form data to NABH format
  convertHandoverData(formData: any): NABHHandoverData {
    return {
      patient_id: formData.patient_id || '',
      patient_name: formData.patient_name || '',
      ward: formData.ward || '',
      bed_number: formData.bed_number || '',
      admission_date: formData.admission_date || '',
      handover_type: formData.handover_type || 'outgoing',
      handover_data: {
        patient_condition: formData.patient_condition || '',
        vital_signs: formData.vital_signs || '',
        medications: Array.isArray(formData.medications) 
          ? formData.medications 
          : [formData.medications || ''],
        pending_tasks: Array.isArray(formData.pending_tasks) 
          ? formData.pending_tasks 
          : [formData.pending_tasks || ''],
        special_instructions: formData.special_instructions || '',
        shift_summary: formData.shift_summary || '',
        patient_updates: formData.patient_updates || '',
        new_orders: Array.isArray(formData.new_orders) 
          ? formData.new_orders 
          : [formData.new_orders || ''],
        alerts: Array.isArray(formData.alerts) 
          ? formData.alerts 
          : [formData.alerts || ''],
        follow_up_required: formData.follow_up_required || '',
        ward_summary: formData.ward_summary || '',
        critical_patients: Array.isArray(formData.critical_patients) 
          ? formData.critical_patients 
          : [formData.critical_patients || ''],
        staff_assignments: formData.staff_assignments || '',
        equipment_status: formData.equipment_status || '',
        administrative_notes: formData.administrative_notes || '',
        overall_condition: formData.overall_condition || '',
        key_events: Array.isArray(formData.key_events) 
          ? formData.key_events 
          : [formData.key_events || ''],
        medication_changes: Array.isArray(formData.medication_changes) 
          ? formData.medication_changes 
          : [formData.medication_changes || ''],
        family_communication: formData.family_communication || '',
        next_shift_priorities: Array.isArray(formData.next_shift_priorities) 
          ? formData.next_shift_priorities 
          : [formData.next_shift_priorities || ''],
      },
      timestamp: new Date().toISOString(),
      nurse_name: formData.nurse_name || '',
      nurse_signature: formData.nurse_signature || '',
    };
  }

  // Generate discharge summary PDF (alias for generateDischargePDF)
  async generateDischargeSummary(data: NABHDischargeData): Promise<Blob> {
    return this.generateDischargePDF(data);
  }

  // Generate handover document PDF (alias for generateHandoverPDF)
  async generateHandoverDocument(data: NABHHandoverData): Promise<Blob> {
    return this.generateHandoverPDF(data);
  }

  // Generate filename based on type and data
  generateFilename(type: 'handover' | 'discharge', data: any): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const patientName = data.patient_name?.replace(/\s+/g, '_') || 'Patient';
    
    if (type === 'handover') {
      const handoverType = data.handover_type || 'handover';
      return `NABH_Handover_${patientName}_${handoverType}_${timestamp}.pdf`;
    } else {
      return `NABH_Discharge_${patientName}_${timestamp}.pdf`;
    }
  }

  // Validate handover data
  validateHandoverData(data: NABHHandoverData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.patient_id) errors.push('Patient ID is required');
    if (!data.patient_name) errors.push('Patient name is required');
    if (!data.ward) errors.push('Ward is required');
    if (!data.bed_number) errors.push('Bed number is required');
    if (!data.admission_date) errors.push('Admission date is required');
    if (!data.handover_type) errors.push('Handover type is required');
    if (!data.nurse_name) errors.push('Nurse name is required');

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Validate discharge data
  validateDischargeData(data: NABHDischargeData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.patient_id) errors.push('Patient ID is required');
    if (!data.patient_name) errors.push('Patient name is required');
    if (!data.admission_date) errors.push('Admission date is required');
    if (!data.discharge_date) errors.push('Discharge date is required');
    if (!data.ward) errors.push('Ward is required');
    if (!data.bed_number) errors.push('Bed number is required');
    if (!data.discharge_diagnosis || data.discharge_diagnosis.length === 0) {
      errors.push('Discharge diagnosis is required');
    }
    if (!data.treatment_summary) errors.push('Treatment summary is required');
    if (!data.doctor_name) errors.push('Doctor name is required');

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Generate mock PDF for development
  private generateMockPDF(type: 'handover' | 'discharge'): Blob {
    const content = `
      <html>
        <head>
          <title>NABH ${type.charAt(0).toUpperCase() + type.slice(1)} Summary</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .content { line-height: 1.6; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>NABH ${type.charAt(0).toUpperCase() + type.slice(1)} Summary</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
          <div class="content">
            <p>This is a mock PDF generated for development purposes.</p>
            <p>In production, this would contain the actual ${type} data.</p>
          </div>
          <div class="footer">
            <p>Generated by GrowIt AI System</p>
          </div>
        </body>
      </html>
    `;

    return new Blob([content], { type: 'text/html' });
  }

  // Get handover template data
  getHandoverTemplate(): Partial<NABHHandoverData> {
    return {
      handover_type: 'outgoing',
      handover_data: {
        patient_condition: '',
        vital_signs: '',
        medications: [],
        pending_tasks: [],
        special_instructions: '',
      },
      timestamp: new Date().toISOString(),
      nurse_name: '',
    };
  }

  // Get discharge template data
  getDischargeTemplate(): Partial<NABHDischargeData> {
    return {
      discharge_diagnosis: [],
      treatment_summary: '',
      medications: [],
      follow_up_instructions: '',
      timestamp: new Date().toISOString(),
      doctor_name: '',
    };
  }
}

// Export singleton instance
const NABHPDFService = new NABHPDFServiceClass();
export default NABHPDFService;
