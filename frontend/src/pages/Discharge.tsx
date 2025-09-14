import { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { postJSON, getJSON } from "../lib/api";
import { PageHeader } from '../components/PageHeader';
import { Button, Input, Textarea } from '../components/Primitives';
import { Section } from '../components/Section';
import { Recorder } from '../components/Recorder';
import { Icon } from '../components/Icons';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { PatientJourneyTimeline } from '../components/PatientJourneyTimeline';
import NABHPDFService, { type NABHDischargeData } from '../lib/nabhPDFService';

interface DischargeData {
  // Patient Details (fetched from records)
  patientName: string;
  age: string;
  gender: string;
  uhid: string;
  ipd: string;
  admissionDate: string;
  dischargeDate: string;
  treatingClinician: string;

  // Medical Information (voice input)
  diagnosis: string;
  chiefComplaints: string;
  pastHistory: string;
  physicalExamination: string;
  investigations: string;
  procedures: string;
  courseOfTreatment: string;
  operativeFindings: string;
  treatmentGiven: string;
  treatmentAdvised: string;
  followUpAdvice: string;
}

const initialData: DischargeData = {
  // Patient Details (will be fetched from records)
  patientName: '',
  age: '',
  gender: '',
  uhid: '',
  ipd: '',
  admissionDate: '',
  dischargeDate: '',
  treatingClinician: '',

  // Medical Information (voice input)
  diagnosis: '',
  chiefComplaints: '',
  pastHistory: '',
  physicalExamination: '',
  investigations: '',
  procedures: '',
  courseOfTreatment: '',
  operativeFindings: '',
  treatmentGiven: '',
  treatmentAdvised: '',
  followUpAdvice: '',
};

export default function Discharge() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<DischargeData>(initialData);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch patient data on component mount
  useEffect(() => {
    const loadPatientData = async () => {
      if (!patientId) return;
      
      try {
        setIsLoading(true);
        const patientData = await getJSON(`/api/patients/${patientId}`);
        
        // Set current date as discharge date
        const today = new Date().toLocaleDateString('en-IN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        
        setFormData(prev => ({
          ...prev,
          patientName: patientData.name || '',
          age: patientData.age ? `${patientData.age} years` : '',
          gender: patientData.gender || '',
          uhid: patientData.uhid || '',
          ipd: patientData.ipd || '',
          admissionDate: patientData.admission_date || '',
          dischargeDate: today,
          treatingClinician: patientData.treating_clinician || '',
        }));
      } catch (error) {
        console.error('Failed to load patient data:', error);
        toast.error('Failed to load patient data');
      } finally {
        setIsLoading(false);
      }
    };

    loadPatientData();
  }, [patientId]);

  const handleInputChange = (field: keyof DischargeData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTranscript = (field: keyof DischargeData) => (transcript: string) => {
    setFormData(prev => ({ ...prev, [field]: transcript }));
  };

  async function saveDischarge(){
    await postJSON(`/api/patients/${patientId}/discharge`, {
      treating_clinician: formData.treatingClinician, 
      diagnosis: split(formData.diagnosis),
      chief_complaints: split(formData.chiefComplaints),
      past_history: formData.pastHistory, 
      physical_exam: formData.physicalExamination, 
      investigations: split(formData.investigations),
      procedures: split(formData.procedures), 
      course: formData.courseOfTreatment, 
      operative_findings: formData.operativeFindings,
      treatment_given: formData.treatmentGiven, 
      treatment_on_discharge: formData.treatmentAdvised, 
      follow_up: formData.followUpAdvice,
    });
  }
  
  function split(s:string){ return s.split(/[,;\n]/).map(x=>x.trim()).filter(Boolean); }

  const handlePrint = () => {
    window.print();
  };

  const generatePDF = async () => {
    try {
      const nabhService = NABHPDFService;
      
      // Convert form data to NABH format
      const nabhData = nabhService.convertDischargeData(formData);
      
      // Generate PDF using NABH template
      const pdfBytes = await nabhService.generateDischargeSummary(nabhData);
      
      // Download the PDF
      const fileName = `NABH_DischargeSummary_${formData.patientName.replace(/\s+/g, '_')}_${formData.dischargeDate.replace(/\//g, '-')}.pdf`;
      // Download the PDF
      nabhService.downloadPDF(pdfBytes, fileName);
      
      toast.success('NABH Discharge Summary PDF generated successfully');
    } catch (error) {
      console.error('Error generating NABH PDF:', error);
      toast.error('Failed to generate NABH PDF. Falling back to basic PDF...');
      
      // Fallback to basic PDF generation
      generateBasicPDF();
    }
  };

  const generateBasicPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
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
      doc.text('DISCHARGE SUMMARY', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text('GrowIt Medical Center', pageWidth / 2, 25, { align: 'center' });
      
      yPosition = 40;

      // Patient Information Section
      yPosition = addSectionHeader('PATIENT INFORMATION', yPosition);
      
      yPosition = addField('Patient Name', formData.patientName, yPosition);
      yPosition = addField('Age/Gender', formData.age, yPosition);
      yPosition = addField('UHID', formData.uhid, yPosition);
      yPosition = addField('IPD Number', formData.ipd, yPosition);
      yPosition = addField('Admission Date', formData.admissionDate, yPosition);
      yPosition = addField('Discharge Date', formData.dischargeDate, yPosition);
      yPosition = addField('Treating Clinician', formData.treatingClinician, yPosition);
      
      yPosition += 10;

      // Medical Information Sections
      const medicalSections = [
        { key: 'diagnosis', title: 'FINAL DIAGNOSIS' },
        { key: 'chiefComplaints', title: 'CHIEF COMPLAINTS & HISTORY' },
        { key: 'physicalExamination', title: 'PHYSICAL EXAMINATION' },
        { key: 'investigations', title: 'INVESTIGATIONS & RADIOLOGY' },
        { key: 'procedures', title: 'PROCEDURES & SURGERY' },
        { key: 'courseOfTreatment', title: 'HOSPITAL COURSE' },
        { key: 'treatmentAdvised', title: 'DISCHARGE MEDICATIONS & INSTRUCTIONS' },
        { key: 'followUpAdvice', title: 'FOLLOW-UP INSTRUCTIONS' }
      ];

      medicalSections.forEach(section => {
        const value = formData[section.key as keyof DischargeData];
        if (value && value.trim()) {
          // Check if we need a new page
          if (yPosition > pageHeight - 50) {
            doc.addPage();
            yPosition = 20;
          }
          
          yPosition = addSectionHeader(section.title, yPosition);
          yPosition = addField('', value, yPosition);
          yPosition += 10;
        }
      });

      // Footer
      const footerY = pageHeight - 20;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Generated on: ' + new Date().toLocaleString(), 20, footerY);
      doc.text('GrowIt Medical Center - Discharge Summary', pageWidth / 2, footerY, { align: 'center' });

      // Save the PDF
      const fileName = `DischargeSummary_${formData.patientName.replace(/\s+/g, '_')}_${formData.dischargeDate.replace(/\//g, '-')}.pdf`;
      doc.save(fileName);
      
      toast.success('Basic PDF generated successfully');
    } catch (error) {
      console.error('Error generating basic PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const handleClear = () => {
    setFormData(initialData);
    toast.info('Form cleared');
  };



  // Grouped sections for better organization
  const patientInfoSection = {
    title: 'Patient Information',
    fields: [
      { key: 'patientName' as keyof DischargeData, label: 'Patient Name', type: 'input' as const, readonly: true },
      { key: 'age' as keyof DischargeData, label: 'Age/Gender', type: 'input' as const, readonly: true },
      { key: 'uhid' as keyof DischargeData, label: 'UHID', type: 'input' as const, readonly: true },
      { key: 'ipd' as keyof DischargeData, label: 'IPD Number', type: 'input' as const, readonly: true },
      { key: 'admissionDate' as keyof DischargeData, label: 'Admission Date', type: 'input' as const, readonly: true },
      { key: 'dischargeDate' as keyof DischargeData, label: 'Discharge Date', type: 'input' as const, readonly: true },
      { key: 'treatingClinician' as keyof DischargeData, label: 'Treating Clinician', type: 'input' as const, readonly: true },
    ]
  };

  const medicalSections = [
    {
      key: 'diagnosis' as keyof DischargeData,
      title: 'Final Diagnosis',
      subtitle: 'Dictate the final diagnosis and primary conditions',
      hasMic: true,
    },
    {
      key: 'chiefComplaints' as keyof DischargeData,
      title: 'Chief Complaints & History',
      subtitle: 'Dictate presenting complaints and medical history',
      hasMic: true,
    },
    {
      key: 'physicalExamination' as keyof DischargeData,
      title: 'Physical Examination',
      subtitle: 'Dictate examination findings and vital signs',
      hasMic: true,
    },
    {
      key: 'investigations' as keyof DischargeData,
      title: 'Investigations & Radiology',
      subtitle: 'Dictate lab results, imaging, and diagnostic tests',
      hasMic: true,
    },
    {
      key: 'procedures' as keyof DischargeData,
      title: 'Procedures & Surgery',
      subtitle: 'Dictate surgical procedures and therapeutic interventions',
      hasMic: true,
    },
    {
      key: 'courseOfTreatment' as keyof DischargeData,
      title: 'Hospital Course',
      subtitle: 'Dictate treatment course and patient progress',
      hasMic: true,
    },
    {
      key: 'treatmentAdvised' as keyof DischargeData,
      title: 'Discharge Medications & Instructions',
      subtitle: 'Dictate medications and care instructions for discharge',
      hasMic: true,
    },
    {
      key: 'followUpAdvice' as keyof DischargeData,
      title: 'Follow-up Instructions',
      subtitle: 'Dictate follow-up appointments and monitoring advice',
      hasMic: true,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600">Loading patient data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 print-content">
      <PageHeader
        title="Patient Discharge"
        subtitle="Create comprehensive discharge summaries"
        actions={
          <div className="flex space-x-3">
            <Button onClick={() => navigate(`/claims/${patientId}`)} variant="secondary">
              <Icon name="ArrowLeft" className="w-4 h-4 mr-2" />
              Back to Claims
            </Button>
            <Button onClick={handleClear} variant="secondary">
              <Icon name="X" size={16} className="mr-2" />
              Clear
            </Button>
            <Button onClick={generatePDF} variant="secondary">
              <Icon name="FileText" size={16} className="mr-2" />
              Generate PDF
            </Button>
            <Button onClick={handlePrint} variant="secondary">
              <Icon name="Printer" size={16} className="mr-2" />
              Print
            </Button>
            <Button onClick={saveDischarge}>
              <Icon name="Check" size={16} className="mr-2" />
              Save
            </Button>
          </div>
        }
      />

      {/* Patient Journey Timeline */}
      <PatientJourneyTimeline currentStep={6} />

      {/* Patient Information Section - Read-only, fetched from records */}
      <Section title={patientInfoSection.title} subtitle="Patient details from records">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patientInfoSection.fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <label className="text-sm font-medium text-slate-700">{field.label}</label>
              <Input
                value={formData[field.key]}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                readOnly={field.readonly}
                className={field.readonly ? "bg-slate-50" : ""}
              />
            </div>
          ))}
        </div>
      </Section>

      {/* Medical Information Sections - Voice input */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {medicalSections.map((section) => (
          <Section
            key={section.key}
            title={section.title}
            subtitle={section.subtitle}
          >
            <div className="space-y-4">
              {section.hasMic && (
                <Recorder
                  onTranscript={handleTranscript(section.key)}
                  maxDuration={120}
                  enableTranscription={true}
                />
              )}
              
              <Textarea
                value={formData[section.key]}
                onChange={(e) => handleInputChange(section.key, e.target.value)}
                placeholder={`Enter ${section.title.toLowerCase()}...`}
                rows={4}
              />
            </div>
          </Section>
        ))}
      </div>

    </div>
  );
}
