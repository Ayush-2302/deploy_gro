import { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { postJSON, getJSON } from "../lib/api.js";
import { PageHeader } from '../components/PageHeader';
import { Button, Textarea, Input, Card } from '../components/Primitives';
import { Icon } from '../components/Icons';
import { Section } from '../components/Section';
import { Recorder } from '../components/Recorder';
import { toast } from 'sonner';
import { PatientJourneyTimeline } from '../components/PatientJourneyTimeline';
import NABHPDFService, { type NABHHandoverData } from '../lib/nabhPDFService';
import jsPDF from 'jspdf';
import TATService from '../lib/tatService';

function clamp(n: number, min: number, max: number) { 
  return Math.max(min, Math.min(max, n)); 
}

interface HandoverData {
  // Outgoing Nurse
  outgoingNurse: string;
  currentPatientStatus: string;
  vitals: {
    bp: string;
    hr: string;
    temp: string;
    spo2: string;
  };
  medsGiven: string;
  medsDue: string;
  pendingInvestigations: string;
  outgoingSignature: string;

  // Incoming Nurse
  incomingNurse: string;
  verification: string;
  medications: string;
  investigations: string;
  acknowledgement: string;
  incomingSignature: string;

  // Nursing Incharge
  inchargeVerification: string;
  inchargeMedications: string;
  inchargeAuditLog: string;
  inchargeSignature: string;

  // Summary
  summary: string;
}

const initialData: HandoverData = {
  outgoingNurse: '',
  currentPatientStatus: '',
  vitals: {
    bp: '',
    hr: '',
    temp: '',
    spo2: '',
  },
  medsGiven: '',
  medsDue: '',
  pendingInvestigations: '',
  outgoingSignature: '',

  incomingNurse: '',
  verification: '',
  medications: '',
  investigations: '',
  acknowledgement: '',
  incomingSignature: '',

  inchargeVerification: '',
  inchargeMedications: '',
  inchargeAuditLog: '',
  inchargeSignature: '',

  summary: '',
};

export default function NurseHandover() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<HandoverData>(initialData);
  const [currentHandoverId,setHandoverId]=useState<string|null>(null);
  // Individual transcript states for each section
  const [txOutgoing, setTxOutgoing] = useState("");
  const [txIncoming, setTxIncoming] = useState("");
  const [txIncharge, setTxIncharge] = useState("");
  const [txSummary, setTxSummary] = useState("");
  const [tatId, setTatId] = useState<string | null>(null);
  const [patient, setPatient] = useState<any>(null);
  const [loadingPatient, setLoadingPatient] = useState(false);
  
  // Debug state
  const [debug] = useState(false);
  const [lastOutgoingMapJson] = useState("");

  // Load patient data and start TAT tracking
  useEffect(() => {
    if (patientId) {
      loadPatientData();
      startTATTracking();
    }
  }, [patientId]);

  const loadPatientData = async () => {
    if (!patientId) return;
    
    try {
      setLoadingPatient(true);
      const patientData = await getJSON(`/api/patients/${patientId}`);
      setPatient(patientData);
    } catch (error) {
      console.error('Failed to load patient data:', error);
      toast.error('Failed to load patient details');
    } finally {
      setLoadingPatient(false);
    }
  };

  const startTATTracking = async () => {
    if (!patientId) return;
    
    try {
      const tat = await TATService.startTAT(patientId, 'nurse_handover', 'Nurse handover process started');
      setTatId(tat.id);
    } catch (error) {
      console.error('Failed to start TAT tracking:', error);
    }
  };

  // Pre-filled transcripts for each section - Realistic medical scenarios
  const prefilledTranscripts = {
    outgoing: "Patient status is stable post-procedure, conscious and oriented to person, place and time. Patient appears comfortable and cooperative. Vital signs are blood pressure 120 over 80, heart rate 72 beats per minute, temperature 98.6 degrees Fahrenheit, oxygen saturation 98 percent on room air. Medications administered during my shift include Aspirin 75 milligrams at 8 AM, Clopidogrel 75 milligrams at 8 AM, Atorvastatin 40 milligrams at 9 PM, and Metoprolol 50 milligrams at 2 PM. Medications due for next shift are Metoprolol 50 milligrams at 8 PM, Metformin 500 milligrams with dinner at 7 PM, and Atorvastatin 40 milligrams at bedtime. Pending investigations include echocardiogram scheduled for tomorrow morning at 10 AM, lipid profile results are awaited from lab, and chest X-ray is pending. Special instructions are to continue monitoring vital signs every 4 hours, maintain bed rest, and administer due medications on time. Patient is stable for discharge planning.",
    
    incoming: "Verification completed successfully. Patient status has been verified with outgoing nurse, all medications were given as prescribed during previous shift. Patient remains stable with no new issues reported. Vital signs are within normal limits, no acute distress noted. New orders received are to continue current medication regimen, monitor vital signs every 4 hours, and maintain bed rest. Medications pending verification include Metoprolol 50 milligrams needs confirmation from pharmacy, Atorvastatin 40 milligrams pending verification of dosage. Investigations pending confirmation are echocardiogram results awaited from cardiology department, lipid profile pending verification from lab, and chest X-ray report pending from radiology. Acknowledgement received from patient and family, everything is going well with patient care. Patient is cooperative and understanding of treatment plan.",
    
    incharge: "Ward summary indicates all patients are stable and ward is running smoothly. Critical patients requiring special attention include bed 1 post-operative monitoring after appendectomy, bed 3 cardiac monitoring for MI patient, and bed 5 discharge planning for stable patient. Staff assignments are complete with adequate coverage for all shifts, night shift has 3 nurses assigned, day shift has 4 nurses. Equipment status is functioning normally, all cardiac monitors working properly, IV pumps calibrated, and oxygen delivery systems operational. Administrative notes include new admission expected in evening from emergency department, family counseling completed for all patients regarding treatment plans, discharge planning in progress for 2 stable cases, and maintenance scheduled for bed 4 monitor tomorrow morning.",
    
    summary: "Overall patient condition across the ward is stable with good recovery progress. Key events during this shift include successful PCI procedure completed for MI patient in bed 3, appendectomy surgery successful for patient in bed 1, and patient in bed 5 showing excellent recovery progress. Medication changes include increased pain medications for post-operative patients, adjusted insulin doses for diabetic patients, and optimized cardiac medications for MI patient. Family communication has been completed for all patients, families updated on progress and discharge plans, and all consents obtained for procedures. Next shift priorities are discharge planning for 2 stable patients, new admissions expected from emergency department, continue monitoring critical patients in beds 1 and 3, and complete documentation for all patients."
  };


  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('vitals.')) {
      const vitalsField = field.split('.')[1] as keyof HandoverData['vitals'];
      setFormData(prev => ({
        ...prev,
        vitals: { ...prev.vitals, [vitalsField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };


  // Individual mapping functions for each section
  async function mapOutgoingFromTranscript() {
    const text = (txOutgoing || "").trim();
    if (!text) return;
    console.log("mapOutgoingFromTranscript: starting", text);

    try {
      const m = await postJSON("/api/map/handover_outgoing", { text });
      console.log("mapOutgoingFromTranscript: API response", m);
      
      // Parse vital signs from the string format or fallback to direct text parsing
      const vitalSigns = m?.vital_signs || text;
      const bpMatch = vitalSigns.match(/BP\s*(\d+)\s*\/\s*(\d+)/i) || vitalSigns.match(/blood pressure\s*(\d+)\s*\/\s*(\d+)/i) || vitalSigns.match(/(\d+)\s*by\s*(\d+)/i);
      const hrMatch = vitalSigns.match(/HR\s*(\d+)/i) || vitalSigns.match(/heart rate\s*(\d+)/i) || vitalSigns.match(/HR\s*(\d+)/i);
      const tempMatch = vitalSigns.match(/temp\s*(\d+(?:\.\d+)?)/i) || vitalSigns.match(/temperature\s*(\d+(?:\.\d+)?)/i) || vitalSigns.match(/temp\s*(\d+)/i);
      const spo2Match = vitalSigns.match(/spo2?\s*(\d+)/i) || vitalSigns.match(/oxygen\s*(\d+)/i) || vitalSigns.match(/SPO\s*(\d+)/i);

      const bp = bpMatch ? `${bpMatch[1]}/${bpMatch[2]}` : formData.vitals.bp;
      const hr = hrMatch ? String(hrMatch[1]) : formData.vitals.hr;
      const temp = tempMatch ? `${tempMatch[1]}°F` : formData.vitals.temp;
      const spo2 = spo2Match ? String(clamp(Number(spo2Match[1]), 0, 100)) : formData.vitals.spo2;

      // Fallback parsing for other fields
      const fallbackStatus = text.match(/patient status[^.]*stable[^.]*/i)?.[0] || text.match(/status[^.]*stable[^.]*/i)?.[0] || "";
      const fallbackMeds = text.match(/medications?[^.]*/i)?.[0] || "";
      const fallbackTasks = text.match(/pending[^.]*/i)?.[0] || "";

      setFormData(prev => ({
        ...prev,
        currentPatientStatus: m?.patient_condition || fallbackStatus || prev.currentPatientStatus,
        vitals: { ...prev.vitals, bp, hr, temp, spo2 },
        medsGiven: (m?.medications ?? []).join("; ") || fallbackMeds || prev.medsGiven,
        medsDue: (m?.pending_tasks ?? []).join("; ") || fallbackTasks || prev.medsDue,
        pendingInvestigations: (m?.special_instructions ?? "") || prev.pendingInvestigations
      }));

      console.log("mapOutgoingFromTranscript: state updated");
      toast.success("Outgoing mapped");
    } catch (error) {
      console.error("mapOutgoingFromTranscript: error", error);
      toast.error("Failed to map outgoing data");
    }
  }

  async function mapIncomingFromTranscript() {
    try {
      const text = (txIncoming || "").trim();
      if (!text) {
        console.log("mapIncomingFromTranscript: No transcript to map");
        return;
      }
      
      console.log("mapIncomingFromTranscript: starting", text);

      const m = await postJSON("/api/map/handover_incoming", { text });
      console.log("mapIncomingFromTranscript: API response", m);
      
      if (!m) {
        console.error("mapIncomingFromTranscript: Empty response from API");
        toast.error("Empty response from mapping service");
        return;
      }

      console.log("mapIncomingFromTranscript: shift_summary:", m?.shift_summary);
      console.log("mapIncomingFromTranscript: patient_updates:", m?.patient_updates);
      console.log("mapIncomingFromTranscript: new_orders:", m?.new_orders);
      console.log("mapIncomingFromTranscript: alerts:", m?.alerts);

      // Fallback parsing if API doesn't return expected structure
      const fallbackVerification = text.includes("verification") ? text : "";
      const fallbackMedications = text.includes("medications") || text.includes("paracetamol") ? 
        text.match(/medications?[^.]*paracetamol[^.]*/i)?.[0] || "paracetamol is pending verify" : "";
      const fallbackInvestigations = text.includes("investigations") || text.includes("pending confirm") ? 
        text.match(/investigations?[^.]*pending confirm[^.]*/i)?.[0] || "investigations pending confirm" : "";

      setFormData(prev => ({
        ...prev,
        verification: m?.shift_summary || fallbackVerification || prev.verification,
        acknowledgement: m?.patient_updates || prev.acknowledgement,
        investigations: m?.follow_up_required || fallbackInvestigations || prev.investigations,
        medications: (m?.alerts ?? []).join("; ") || fallbackMedications || prev.medications
      }));

      console.log("mapIncomingFromTranscript: state updated");
      toast.success("Incoming mapped");
    } catch (error) {
      console.error("mapIncomingFromTranscript: error", error);
      toast.error("Failed to map incoming data: " + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async function mapInchargeFromTranscript() {
    const text = (txIncharge || "").trim();
    if (!text) return;
    console.log("mapInchargeFromTranscript: starting", text);

    try {
      const m = await postJSON("/api/map/handover_incharge", { text });
      console.log("mapInchargeFromTranscript: API response", m);

      // Fallback parsing for incharge fields
      const fallbackWardSummary = text.match(/ward[^.]*/i)?.[0] || text.match(/summary[^.]*/i)?.[0] || "";
      const fallbackCritical = text.match(/critical[^.]*/i)?.[0] || text.match(/patients?[^.]*/i)?.[0] || "";
      const fallbackAdmin = text.match(/administrative[^.]*/i)?.[0] || text.match(/notes?[^.]*/i)?.[0] || "";

      setFormData(prev => ({
        ...prev,
        inchargeVerification: m?.ward_summary || fallbackWardSummary || prev.inchargeVerification,
        inchargeMedications: (m?.critical_patients ?? []).join("; ") || fallbackCritical || prev.inchargeMedications,
        inchargeAuditLog: m?.administrative_notes || fallbackAdmin || prev.inchargeAuditLog
      }));

      console.log("mapInchargeFromTranscript: state updated");
      toast.success("Incharge mapped");
    } catch (error) {
      console.error("mapInchargeFromTranscript: error", error);
      toast.error("Failed to map incharge data");
    }
  }

  async function mapSummaryFromTranscript() {
    const text = (txSummary || "").trim();
    if (!text) return;
    console.log("mapSummaryFromTranscript: starting", text);

    try {
      const m = await postJSON("/api/map/handover_summary", { text });
      console.log("mapSummaryFromTranscript: API response", m);

      // Fallback parsing for summary
      const fallbackSummary = text.match(/overall[^.]*/i)?.[0] || text.match(/condition[^.]*/i)?.[0] || text;

      setFormData(prev => ({
        ...prev,
        summary: m?.overall_condition || fallbackSummary || prev.summary
      }));

      console.log("mapSummaryFromTranscript: state updated");
      toast.success("Summary mapped");
    } catch (error) {
      console.error("mapSummaryFromTranscript: error", error);
      toast.error("Failed to map summary data");
    }
  }



  // Individual save functions for each section
  async function saveOutgoingSection() {
    try {
      if (!patientId) {
        toast.error("No patient ID available");
        return;
      }

      const payload = {
        shift_time: new Date().toISOString(),
        outgoing: { 
          status: formData.currentPatientStatus, 
          vitals: { 
            bp: formData.vitals.bp, 
            hr: Number(formData.vitals.hr||0), 
            temp: formData.vitals.temp, 
            spo2: Number(formData.vitals.spo2||0) 
          }, 
          meds_given: parseLines(formData.medsGiven), 
          meds_due: parseLines(formData.medsDue), 
          pending_investigations: parseLines(formData.pendingInvestigations), 
          signature: formData.outgoingSignature || null 
        }
      };
      
      await postJSON(`/api/patients/${patientId}/handovers`, payload);
      toast.success("Outgoing nurse section saved successfully!");
      
      // Complete TAT tracking
      if (tatId) {
        try {
          await TATService.completeTAT(tatId, 'Outgoing nurse section completed');
        } catch (error) {
          console.error('Failed to complete TAT tracking:', error);
        }
      }
    } catch (error) {
      console.error("Failed to save outgoing section:", error);
      toast.error("Failed to save outgoing section");
    }
  }

  async function saveIncomingSection() {
    try {
      if (!patientId) {
        toast.error("No patient ID available");
        return;
      }

      const payload = {
        shift_time: new Date().toISOString(),
        incoming: {
          verification: formData.verification,
          meds_verification: formData.medications,
          investigations_verification: formData.investigations,
          acknowledgement: formData.acknowledgement,
          signature: formData.incomingSignature || null
        }
      };
      
      await postJSON(`/api/patients/${patientId}/handovers`, payload);
      toast.success("Incoming nurse section saved successfully!");
      
      // Complete TAT tracking
      if (tatId) {
        try {
          await TATService.completeTAT(tatId, 'Incoming nurse section completed');
        } catch (error) {
          console.error('Failed to complete TAT tracking:', error);
        }
      }
    } catch (error) {
      console.error("Failed to save incoming section:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to save incoming section: ${errorMessage}`);
    }
  }

  async function saveInchargeSection() {
    try {
      if (!patientId) {
        toast.error("No patient ID available");
        return;
      }

      const payload = {
        shift_time: new Date().toISOString(),
        incharge: {
          verification: formData.inchargeVerification,
          meds_investigations_confirmation: formData.inchargeMedications,
          audit_log: formData.inchargeAuditLog,
          signature: formData.inchargeSignature || null
        }
      };
      
      await postJSON(`/api/patients/${patientId}/handovers`, payload);
      toast.success("Incharge section saved successfully!");
      
      // Complete TAT tracking
      if (tatId) {
        try {
          await TATService.completeTAT(tatId, 'Incharge section completed');
        } catch (error) {
          console.error('Failed to complete TAT tracking:', error);
        }
      }
    } catch (error) {
      console.error("Failed to save incharge section:", error);
      toast.error("Failed to save incharge section");
    }
  }

  async function saveSummarySection() {
    try {
      if (!patientId) {
        toast.error("No patient ID available");
        return;
      }

      const payload = {
        shift_time: new Date().toISOString(),
        summary: {
          text: formData.summary
        }
      };
      
      await postJSON(`/api/patients/${patientId}/handovers`, payload);
      toast.success("Summary section saved successfully!");
      
      // Complete TAT tracking
      if (tatId) {
        try {
          await TATService.completeTAT(tatId, 'Summary section completed');
        } catch (error) {
          console.error('Failed to complete TAT tracking:', error);
        }
      }
    } catch (error) {
      console.error("Failed to save summary section:", error);
      toast.error("Failed to save summary section");
    }
  }

  async function saveHandover(){
    const payload = {
      shift_time: new Date().toISOString(),
      outgoing: { 
        status: formData.currentPatientStatus, 
        vitals: { 
          bp: formData.vitals.bp, 
          hr: Number(formData.vitals.hr||0), 
          temp: formData.vitals.temp, 
          spo2: Number(formData.vitals.spo2||0) 
        }, 
        meds_given: parseLines(formData.medsGiven), 
        meds_due: parseLines(formData.medsDue), 
        pending_investigations: parseLines(formData.pendingInvestigations), 
        signature: formData.outgoingSignature || null 
      },
      incoming: { 
        verification: formData.verification, 
        meds_verification: formData.medications, 
        investigations_verification: formData.investigations, 
        acknowledgement: formData.acknowledgement, 
        signature: formData.incomingSignature || null 
      },
      incharge: { 
        verification: formData.inchargeVerification, 
        meds_investigations_confirmation: formData.inchargeMedications, 
        audit_log: formData.inchargeAuditLog, 
        signature: formData.inchargeSignature || null 
      },
      summary: { text: formData.summary },
    };
    const res = await postJSON(`/api/patients/${patientId}/handovers`, payload);
    setHandoverId(res.id);
  }

  async function lockHandover(){
    if(!currentHandoverId) return;
    await postJSON(`/api/handovers/${currentHandoverId}/lock`, {});
  }
  
  function parseLines(s:string){ return s.split(/[,;\n]/).map(x=>x.trim()).filter(Boolean); }

  const handleLock = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Handover locked and e-signed');
    } catch (error) {
      toast.error('Failed to lock handover');
    }
  };

  // Test functions to populate transcripts
  const populateOutgoingTranscript = () => {
    setTxOutgoing(prefilledTranscripts.outgoing);
    toast.success('Outgoing transcript populated');
  };

  const populateIncomingTranscript = () => {
    setTxIncoming(prefilledTranscripts.incoming);
    toast.success('Incoming transcript populated');
  };

  const populateInchargeTranscript = () => {
    setTxIncharge(prefilledTranscripts.incharge);
    toast.success('Incharge transcript populated');
  };

  const populateSummaryTranscript = () => {
    setTxSummary(prefilledTranscripts.summary);
    toast.success('Summary transcript populated');
  };

  const handleClear = () => {
    setFormData(initialData);
    setTxOutgoing("");
    setTxIncoming("");
    setTxIncharge("");
    setTxSummary("");
    toast.info('Form cleared');
  };

  const generateHandoverPDF = async () => {
    try {
      const nabhService = NABHPDFService;
      
      // Convert form data to NABH format
      const nabhData = nabhService.convertHandoverData({
        ...formData,
        patientName: patient?.name || 'Patient Name',
        patientId: patientId || '',
        admissionDate: patient?.admission_date || new Date().toISOString().split('T')[0],
        uhid: patient?.uhid || '',
        age: patient?.age || '',
        gender: patient?.gender || ''
      });
      
      console.log('Generated NABH data:', nabhData);
      
      // Generate PDF using NABH template
      const pdfBytes = await nabhService.generateHandoverDocument(nabhData);
      
      // Download the PDF
      const fileName = `NABH_Handover_${patientId || 'unknown'}_${new Date().toISOString().split('T')[0]}.pdf`;
      // Download the PDF
      nabhService.downloadPDF(pdfBytes, fileName);
      
      toast.success('NABH Handover PDF generated successfully');
    } catch (error) {
      console.error('Error generating NABH Handover PDF:', error);
      console.log('Falling back to basic PDF generation...');
      
      // Fallback to basic PDF generation
      generateBasicHandoverPDF();
    }
  };

  const generateBasicHandoverPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPosition = 20;

      // Helper function to add text with word wrapping
      const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        return y + (lines.length * fontSize * 0.4) + 5;
      };

      // Helper function to add section header
      const addSectionHeader = (text: string, y: number) => {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(text, 20, y);
        doc.setFont('helvetica', 'normal');
        return y + 8;
      };

      // Helper function to add field
      const addField = (label: string, value: string, y: number) => {
        if (!value.trim()) return y;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(`${label}:`, 20, y);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
        const newY = addWrappedText(value, 20, y + 5, pageWidth - 40, 10);
        return newY + 3;
      };

      // Header
      doc.setFillColor(0, 102, 204);
      doc.rect(0, 0, pageWidth, 30, 'F');
      
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('NABH NURSE HANDOVER DOCUMENT', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text('GrowIt Medical Center', pageWidth / 2, 25, { align: 'center' });
      
      yPosition = 40;

      // Patient Information
      if (patient) {
        yPosition = addSectionHeader('PATIENT INFORMATION', yPosition);
        yPosition = addField('Name', patient.name, yPosition);
        yPosition = addField('Age', `${patient.age} years`, yPosition);
        yPosition = addField('Gender', patient.gender, yPosition);
        yPosition = addField('UHID', patient.uhid || 'N/A', yPosition);
        yPosition = addField('Admission Date', patient.admission_date ? new Date(patient.admission_date).toLocaleDateString() : 'N/A', yPosition);
        yPosition += 10;
      }

      // Outgoing Nurse Section
      yPosition = addSectionHeader('OUTGOING NURSE (SHIFT FINISH)', yPosition);
      
      yPosition = addField('Patient Status', formData.currentPatientStatus, yPosition);
      yPosition = addField('Blood Pressure', formData.vitals.bp, yPosition);
      yPosition = addField('Heart Rate', formData.vitals.hr, yPosition);
      yPosition = addField('Temperature', formData.vitals.temp, yPosition);
      yPosition = addField('SpO₂', formData.vitals.spo2, yPosition);
      yPosition = addField('Medications Given', formData.medsGiven, yPosition);
      yPosition = addField('Medications Due', formData.medsDue, yPosition);
      yPosition = addField('Pending Investigations', formData.pendingInvestigations, yPosition);
      yPosition = addField('Signature', formData.outgoingSignature, yPosition);
      
      yPosition += 10;

      // Incoming Nurse Section
      yPosition = addSectionHeader('INCOMING NURSE (NEW SHIFT)', yPosition);
      
      yPosition = addField('Verification', formData.verification, yPosition);
      yPosition = addField('Medications Verification', formData.medications, yPosition);
      yPosition = addField('Investigations Verification', formData.investigations, yPosition);
      yPosition = addField('Acknowledgement', formData.acknowledgement, yPosition);
      yPosition = addField('Signature', formData.incomingSignature, yPosition);
      
      yPosition += 10;

      // Nursing Incharge Section
      yPosition = addSectionHeader('NURSING INCHARGE / SISTER', yPosition);
      
      yPosition = addField('Verification', formData.inchargeVerification, yPosition);
      yPosition = addField('Medications & Investigations Confirmation', formData.inchargeMedications, yPosition);
      yPosition = addField('Audit Log', formData.inchargeAuditLog, yPosition);
      yPosition = addField('Signature', formData.inchargeSignature, yPosition);
      
      yPosition += 10;

      // Summary Section
      yPosition = addSectionHeader('SUMMARY', yPosition);
      yPosition = addField('', formData.summary, yPosition);

      // Footer
      const footerY = doc.internal.pageSize.getHeight() - 20;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Generated on: ' + new Date().toLocaleString(), 20, footerY);
      doc.text('GrowIt Medical Center - Nurse Handover Document', pageWidth / 2, footerY, { align: 'center' });

      // Save the PDF
      const fileName = `Basic_Handover_${patientId || 'unknown'}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast.success('Basic Handover PDF generated successfully');
    } catch (error) {
      console.error('Error generating basic handover PDF:', error);
      toast.error('Failed to generate handover PDF');
    }
  };


  const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Section title={title}>
      <div className="space-y-4">{children}</div>
    </Section>
  );

  return (
    <div className="space-y-6 print-content">
      <PageHeader
        title="Nurse Handover / Takeover"
        subtitle="Complete nursing shift handover documentation"
        actions={
          <div className="flex items-center space-x-3">
            <Button onClick={() => navigate(`/operation-record/${patientId}`)} variant="secondary">
              <Icon name="ArrowLeft" className="w-4 h-4 mr-2" />
              Back to Operation Record
            </Button>
            <Button onClick={handleClear} variant="ghost">Clear</Button>
            <Button onClick={saveHandover} variant="primary">
              Save
            </Button>
            <Button onClick={lockHandover} variant="secondary">
              Lock & e-sign
            </Button>
            <Button onClick={generateHandoverPDF} variant="secondary">
              <Icon name="FileText" size={16} className="mr-2" />
              Generate PDF
            </Button>
            <Button onClick={() => navigate(`/claims/${patientId}`)} variant="primary">
              Next: Claims
              <Icon name="ArrowRight" className="w-4 h-4 ml-2" />
            </Button>
          </div>
        }
      />

      {/* Patient Journey Timeline */}
      <PatientJourneyTimeline currentStep={4} />

      {/* Patient Details */}
      {loadingPatient ? (
        <Card className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </Card>
      ) : patient ? (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-medium text-gray-900">Patient Information</h3>
              <p className="text-sm text-gray-600">Name: {patient.name}</p>
              <p className="text-sm text-gray-600">Age: {patient.age} years</p>
              <p className="text-sm text-gray-600">Gender: {patient.gender}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Admission Details</h3>
              <p className="text-sm text-gray-600">UHID: {patient.uhid || 'N/A'}</p>
              <p className="text-sm text-gray-600">Admission Date: {patient.admission_date ? new Date(patient.admission_date).toLocaleDateString() : 'N/A'}</p>
              <p className="text-sm text-gray-600">Patient ID: {patient.id}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Status</h3>
              <p className="text-sm text-gray-600">Discharge Date: {patient.discharge_date ? new Date(patient.discharge_date).toLocaleDateString() : 'Not discharged'}</p>
              <p className="text-sm text-gray-600">Created: {new Date(patient.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-4">
          <div className="text-center text-gray-500">
            <Icon name="User" size={24} className="mx-auto mb-2" />
            <p>No patient details available</p>
          </div>
        </Card>
      )}

      <div className="space-y-6">

          {/* Outgoing Nurse */}
          <Group title="Outgoing Nurse (Shift Finish)">
            <Recorder 
              showLanguageToggle={false}
              value={txOutgoing}
              onChangeTranscript={setTxOutgoing}
              onTranscript={setTxOutgoing}
              onTranscribe={(t) => { 
                console.log("NurseHandover: outgoing transcript", t); 
                setTxOutgoing(t); 
              }}
              maxDuration={300}
              enableTranscription={true}
            />

            {txOutgoing.trim() && (
              <div className="flex justify-end mt-2">
                <Button 
                  type="button" 
                  variant="primary" 
                  onClick={mapOutgoingFromTranscript}
                >
                  <Icon name="Zap" size={16} className="mr-2" />
                  Auto-Map Fields
                </Button>
              </div>
            )}

            {debug && lastOutgoingMapJson && (
              <pre className="text-xs bg-slate-50 border rounded p-2 max-h-40 overflow-auto mt-2">
                {lastOutgoingMapJson}
              </pre>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Current Patient Status</label>
                <Textarea 
                  value={formData.currentPatientStatus}
                  onChange={(e) => handleInputChange('currentPatientStatus', e.target.value)}
                  rows={3} 
                  placeholder="Conscious & oriented, stable..." 
                />
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">BP</label>
                  <Input 
                    value={formData.vitals.bp}
                    onChange={(e) => handleInputChange('vitals.bp', e.target.value)}
                    placeholder="120/80" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">HR (bpm)</label>
                  <Input 
                    type="number" 
                    value={formData.vitals.hr}
                    onChange={(e) => handleInputChange('vitals.hr', e.target.value)}
                    placeholder="72" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Temp</label>
                  <Input 
                    value={formData.vitals.temp}
                    onChange={(e) => handleInputChange('vitals.temp', e.target.value)}
                    placeholder="98.6°F" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">SpO₂ (%)</label>
                  <Input 
                    type="number" 
                    value={formData.vitals.spo2}
                    onChange={(e) => handleInputChange('vitals.spo2', e.target.value)}
                    placeholder="98" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Medications (Given)</label>
                <Textarea 
                  value={formData.medsGiven}
                  onChange={(e) => handleInputChange('medsGiven', e.target.value)}
                  rows={3} 
                  placeholder="Ceftriaxone 1g IV – given; Paracetamol 1g PO – 22:00" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Medications (Due)</label>
                <Textarea 
                  value={formData.medsDue}
                  onChange={(e) => handleInputChange('medsDue', e.target.value)}
                  rows={3} 
                  placeholder="Paracetamol 1g PO – 04:00; Ceftriaxone 1g IV – 08:00" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Pending Investigations</label>
                <Textarea 
                  value={formData.pendingInvestigations}
                  onChange={(e) => handleInputChange('pendingInvestigations', e.target.value)}
                  rows={2} 
                  placeholder="Blood culture report; Repeat CBC; Renal function" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Signature</label>
                <Input 
                  value={formData.outgoingSignature}
                  onChange={(e) => handleInputChange('outgoingSignature', e.target.value)}
                  placeholder="Sign / name" 
                />
              </div>
            </div>
            
            {/* Save Button for Outgoing Section */}
            <div className="flex justify-end mt-4">
              <Button 
                onClick={saveOutgoingSection}
                variant="secondary"
                className="flex items-center"
              >
                <Icon name="Check" size={16} className="mr-2" />
                Save Outgoing Section
              </Button>
            </div>
          </Group>

          {/* Incoming Nurse */}
          <Group title="Incoming Nurse (New Shift)">
            <Recorder 
              showLanguageToggle={false}
              value={txIncoming}
              onChangeTranscript={setTxIncoming}
              onTranscript={setTxIncoming}
              onTranscribe={(t) => { 
                console.log("NurseHandover: incoming transcript", t); 
                setTxIncoming(t); 
              }}
              maxDuration={300}
              enableTranscription={true}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Verification</label>
                <Textarea 
                  value={formData.verification}
                  onChange={(e) => handleInputChange('verification', e.target.value)}
                  rows={2} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Medications (Pending verified)</label>
                <Textarea 
                  value={formData.medications}
                  onChange={(e) => handleInputChange('medications', e.target.value)}
                  rows={2} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Investigations (Pending confirmed)</label>
                <Textarea 
                  value={formData.investigations}
                  onChange={(e) => handleInputChange('investigations', e.target.value)}
                  rows={2} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Acknowledgement</label>
                <Textarea 
                  value={formData.acknowledgement}
                  onChange={(e) => handleInputChange('acknowledgement', e.target.value)}
                  rows={2} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Signature</label>
                <Input 
                  value={formData.incomingSignature}
                  onChange={(e) => handleInputChange('incomingSignature', e.target.value)}
                  placeholder="Sign / name" 
                />
              </div>
            </div>
            
            {/* Save Button for Incoming Section */}
            <div className="flex justify-end mt-4">
              <Button 
                onClick={saveIncomingSection}
                variant="secondary"
                className="flex items-center"
              >
                <Icon name="Check" size={16} className="mr-2" />
                Save Incoming Section
              </Button>
            </div>
          </Group>

          {/* Nursing Incharge / Sister */}
          <Group title="Nursing Incharge / Sister">
            <Recorder 
              showLanguageToggle={false}
              value={txIncharge}
              onChangeTranscript={setTxIncharge}
              onTranscript={setTxIncharge}
              onTranscribe={(t) => { 
                console.log("NurseHandover: incharge transcript", t); 
                setTxIncharge(t); 
              }}
              maxDuration={300}
              enableTranscription={true}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Verification</label>
                <Textarea 
                  value={formData.inchargeVerification}
                  onChange={(e) => handleInputChange('inchargeVerification', e.target.value)}
                  rows={2} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Investigations & Medications (Confirmation)</label>
                <Textarea 
                  value={formData.inchargeMedications}
                  onChange={(e) => handleInputChange('inchargeMedications', e.target.value)}
                  rows={2} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Audit Log</label>
                <Textarea 
                  value={formData.inchargeAuditLog}
                  onChange={(e) => handleInputChange('inchargeAuditLog', e.target.value)}
                  rows={2} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Signature</label>
                <Input 
                  value={formData.inchargeSignature}
                  onChange={(e) => handleInputChange('inchargeSignature', e.target.value)}
                  placeholder="Sign / name" 
                />
              </div>
            </div>
            
            {/* Save Button for Incharge Section */}
            <div className="flex justify-end mt-4">
              <Button 
                onClick={saveInchargeSection}
                variant="secondary"
                className="flex items-center"
              >
                <Icon name="Check" size={16} className="mr-2" />
                Save Incharge Section
              </Button>
            </div>
          </Group>

          {/* Summary */}
          <Group title="Summary">
            <Recorder 
              showLanguageToggle={false}
              value={txSummary}
              onChangeTranscript={setTxSummary}
              onTranscript={setTxSummary}
              onTranscribe={(t) => { 
                console.log("NurseHandover: summary transcript", t); 
                setTxSummary(t); 
              }}
              maxDuration={300}
              enableTranscription={true}
            />
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Summary</label>
              <Textarea 
                value={formData.summary}
                onChange={(e) => handleInputChange('summary', e.target.value)}
                rows={4} 
                placeholder="Patient stable, under nephrology care..." 
              />
            </div>
            
            {/* Save Button for Summary Section */}
            <div className="flex justify-end mt-4">
              <Button 
                onClick={saveSummarySection}
                variant="secondary"
                className="flex items-center"
              >
                <Icon name="Check" size={16} className="mr-2" />
                Save Summary Section
              </Button>
            </div>
          </Group>

      </div>
    </div>
  );
}
