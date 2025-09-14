import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { PatientJourneyTimeline } from '../components/PatientJourneyTimeline';
import { Card } from '../components/Primitives';
import { Button } from '../components/Primitives';
import { Icon } from '../components/Icons';
import { Recorder } from '../components/Recorder';
import { getJSON, postJSON } from '../lib/api';
import TATService from '../lib/tatService';

interface OperationRecordData {
  hospitalName: string;
  patientName: string;
  patientId: string;
  uhid: string;
  age: string;
  gender: string;
  ward: string;
  bedNo: string;
  dateOfSurgery: string;
  timeOfSurgery: string;
  preOperativeDiagnosis: string;
  postOperativeDiagnosis: string;
  plannedProcedure: string;
  procedurePerformed: string;
  surgeons: string;
  assistants: string;
  anaesthesiologist: string;
  typeOfAnaesthesia: string;
  anaesthesiaMedications: string;
  preOperativeAssessmentCompleted: boolean;
  informedConsentObtained: boolean;
  operativeFindings: string;
  specimensRemoved: string;
  estimatedBloodLoss: string;
  bloodIvFluidsGiven: string;
  intraOperativeEvents: string;
  instrumentCountVerified: boolean;
  postOperativePlan: string;
  patientConditionOnTransfer: string;
  transferredTo: string;
  surgeonSignature: string;
  anaesthesiologistSignature: string;
  nursingStaffSignature: string;
}

export default function OperationRecord() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [tatId, setTatId] = useState<string | null>(null);
  const [patient, setPatient] = useState<any>(null);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [saving, setSaving] = useState(false);
  const [transcripts, setTranscripts] = useState({
    section1: '',
    section2: '',
    section3: '',
    section4: ''
  });
  const [formData, setFormData] = useState<OperationRecordData>({
    hospitalName: 'GrowIt Hospital',
    patientName: '',
    patientId: patientId || '',
    uhid: '',
    age: '',
    gender: '',
    ward: '',
    bedNo: '',
    dateOfSurgery: new Date().toISOString().split('T')[0],
    timeOfSurgery: new Date().toTimeString().split(' ')[0].substring(0, 5),
    preOperativeDiagnosis: '',
    postOperativeDiagnosis: '',
    plannedProcedure: '',
    procedurePerformed: '',
    surgeons: '',
    assistants: '',
    anaesthesiologist: '',
    typeOfAnaesthesia: '',
    anaesthesiaMedications: '',
    preOperativeAssessmentCompleted: false,
    informedConsentObtained: false,
    operativeFindings: '',
    specimensRemoved: '',
    estimatedBloodLoss: '',
    bloodIvFluidsGiven: '',
    intraOperativeEvents: '',
    instrumentCountVerified: false,
    postOperativePlan: '',
    patientConditionOnTransfer: '',
    transferredTo: '',
    surgeonSignature: '',
    anaesthesiologistSignature: '',
    nursingStaffSignature: '',
  });

  const loadPatientData = async () => {
    if (!patientId) return;

    setLoadingPatient(true);
    try {
      const patientData = await getJSON(`/api/patients/${patientId}`);
      setPatient(patientData);
      setFormData(prev => ({
        ...prev,
        patientName: patientData.name || '',
        uhid: patientData.uhid || '',
        age: patientData.age?.toString() || '',
        gender: patientData.gender || '',
        ward: patientData.ward || '',
        bedNo: patientData.bed_no || '',
      }));
    } catch (error) {
      console.error('Failed to load patient data:', error);
      // Set default patient data if API fails
      setPatient({
        id: patientId,
        name: 'Sample Patient',
        age: 45,
        gender: 'Male',
        uhid: 'UHID001',
        ward: 'Ward A',
        bed_no: 'Bed 101'
      });
      setFormData(prev => ({
        ...prev,
        patientName: 'Sample Patient',
        uhid: 'UHID001',
        age: '45',
        gender: 'Male',
        ward: 'Ward A',
        bedNo: 'Bed 101',
      }));
    } finally {
      setLoadingPatient(false);
    }
  };

  const startTATTracking = async () => {
    if (!patientId) return;

    try {
      const tat = await TATService.startTAT(patientId, 'operation_record');
      setTatId(tat.id);
    } catch (error) {
      console.error('Failed to start TAT tracking:', error);
      // Continue without TAT tracking if it fails
    }
  };

  useEffect(() => {
    if (patientId) {
      loadPatientData();
      startTATTracking();
    }
  }, [patientId]);

  const handleInputChange = (field: keyof OperationRecordData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTranscriptChange = (section: keyof typeof transcripts, transcript: string) => {
    setTranscripts(prev => ({
      ...prev,
      [section]: transcript
    }));
  };

  const saveOperationRecord = async () => {
    if (!patientId) {
      // Patient ID is required
      return;
    }

    setSaving(true);
    try {
      await postJSON(`/api/patients/${patientId}/operation-records`, {
        ...formData,
        created_at: new Date().toISOString()
      });

      if (tatId) {
        try {
          await TATService.completeTAT(tatId);
        } catch (tatError) {
          console.error('Failed to complete TAT tracking:', tatError);
          // Continue even if TAT tracking fails
        }
      }

      // Operation Record saved successfully
    } catch (error) {
      console.error('Failed to save operation record:', error);
      // Failed to save operation record
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(`/doctor-slip/${patientId}`);
  };

  const handleNext = () => {
    navigate(`/nurse-handover/${patientId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        title="Operation Record"
        subtitle="Document surgical procedure details and outcomes"
        actions={[
          <Button
            key="back"
            variant="secondary"
            onClick={handleBack}
            className="flex items-center space-x-2"
          >
            <Icon name="ArrowLeft" size={16} />
            <span>Back to Doctor Slip</span>
          </Button>,
          <Button
            key="save"
            variant="secondary"
            onClick={saveOperationRecord}
            disabled={saving}
            className="flex items-center space-x-2"
          >
            <Icon name="Check" size={16} />
            <span>{saving ? 'Saving...' : 'Save & Proceed'}</span>
          </Button>,
          <Button
            key="next"
            variant="primary"
            onClick={handleNext}
            className="flex items-center space-x-2"
          >
            <span>Next: Nurse Handover</span>
            <Icon name="ArrowRight" size={16} />
          </Button>,
        ]}
      />

      <PatientJourneyTimeline currentStep={3} />

      {/* Patient Details */}
      {loadingPatient ? (
        <Card className="p-4 mt-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </Card>
      ) : patient ? (
        <Card className="p-4 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Patient Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-700">
            <p><strong>Name:</strong> {patient.name}</p>
            <p><strong>Age:</strong> {patient.age}</p>
            <p><strong>Gender:</strong> {patient.gender}</p>
            <p><strong>UHID:</strong> {patient.uhid}</p>
            <p><strong>Ward:</strong> {patient.ward}</p>
            <p><strong>Bed No:</strong> {patient.bed_no}</p>
            <p><strong>Admission Date:</strong> {patient.admission_date ? new Date(patient.admission_date).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Patient ID:</strong> {patient.id}</p>
          </div>
        </Card>
      ) : (
        <Card className="p-4 mt-6 text-center text-gray-500">
          <p>No patient data available. Using default sample data.</p>
        </Card>
      )}

      {/* Operation Record Form - 4 Sections */}
      <div className="space-y-6 mt-6">
        {/* Section 1: Pre-Operative Information */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Section 1: Pre-Operative Information</h3>
            
            <div className="mb-4">
              <Recorder
                showLanguageToggle={false}
                value={transcripts.section1}
                onChangeTranscript={(transcript) => handleTranscriptChange('section1', transcript)}
                onTranscript={(transcript) => handleTranscriptChange('section1', transcript)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pre-Operative Diagnosis</label>
                <textarea
                  value={formData.preOperativeDiagnosis}
                  onChange={(e) => handleInputChange('preOperativeDiagnosis', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Planned Procedure</label>
                <textarea
                  value={formData.plannedProcedure}
                  onChange={(e) => handleInputChange('plannedProcedure', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.preOperativeAssessmentCompleted}
                  onChange={(e) => handleInputChange('preOperativeAssessmentCompleted', e.target.checked)}
                  className="form-checkbox h-4 w-4 text-primary-600 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">Pre-operative Assessment Completed</label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.informedConsentObtained}
                  onChange={(e) => handleInputChange('informedConsentObtained', e.target.checked)}
                  className="form-checkbox h-4 w-4 text-primary-600 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">Informed Consent Obtained</label>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 2: Surgical Team & Anaesthesia */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Section 2: Surgical Team & Anaesthesia</h3>
            
            <div className="mb-4">
              <Recorder
                showLanguageToggle={false}
                value={transcripts.section2}
                onChangeTranscript={(transcript) => handleTranscriptChange('section2', transcript)}
                onTranscript={(transcript) => handleTranscriptChange('section2', transcript)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Surgeon(s)</label>
                <input
                  type="text"
                  value={formData.surgeons}
                  onChange={(e) => handleInputChange('surgeons', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assistant(s)</label>
                <input
                  type="text"
                  value={formData.assistants}
                  onChange={(e) => handleInputChange('assistants', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Anaesthesiologist</label>
                <input
                  type="text"
                  value={formData.anaesthesiologist}
                  onChange={(e) => handleInputChange('anaesthesiologist', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type of Anaesthesia</label>
                <input
                  type="text"
                  value={formData.typeOfAnaesthesia}
                  onChange={(e) => handleInputChange('typeOfAnaesthesia', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Anaesthesia Medications Used</label>
                <textarea
                  value={formData.anaesthesiaMedications}
                  onChange={(e) => handleInputChange('anaesthesiaMedications', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Section 3: Operative Details */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Section 3: Operative Details</h3>
            
            <div className="mb-4">
              <Recorder
                showLanguageToggle={false}
                value={transcripts.section3}
                onChangeTranscript={(transcript) => handleTranscriptChange('section3', transcript)}
                onTranscript={(transcript) => handleTranscriptChange('section3', transcript)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Procedure Performed</label>
                <textarea
                  value={formData.procedurePerformed}
                  onChange={(e) => handleInputChange('procedurePerformed', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Operative Findings</label>
                <textarea
                  value={formData.operativeFindings}
                  onChange={(e) => handleInputChange('operativeFindings', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Blood Loss</label>
                <input
                  type="text"
                  value={formData.estimatedBloodLoss}
                  onChange={(e) => handleInputChange('estimatedBloodLoss', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Blood / IV Fluids Given</label>
                <input
                  type="text"
                  value={formData.bloodIvFluidsGiven}
                  onChange={(e) => handleInputChange('bloodIvFluidsGiven', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Specimens Removed / Sent for Histopathology</label>
                <textarea
                  value={formData.specimensRemoved}
                  onChange={(e) => handleInputChange('specimensRemoved', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Intra-operative Events / Complications</label>
                <textarea
                  value={formData.intraOperativeEvents}
                  onChange={(e) => handleInputChange('intraOperativeEvents', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div className="flex items-center md:col-span-2">
                <input
                  type="checkbox"
                  checked={formData.instrumentCountVerified}
                  onChange={(e) => handleInputChange('instrumentCountVerified', e.target.checked)}
                  className="form-checkbox h-4 w-4 text-primary-600 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">Instrument / Sponge / Needle Count Verified</label>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 4: Post-Operative Plan & Signatures */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Section 4: Post-Operative Plan & Signatures</h3>
            
            <div className="mb-4">
              <Recorder
                showLanguageToggle={false}
                value={transcripts.section4}
                onChangeTranscript={(transcript) => handleTranscriptChange('section4', transcript)}
                onTranscript={(transcript) => handleTranscriptChange('section4', transcript)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Post-Operative Diagnosis</label>
                <textarea
                  value={formData.postOperativeDiagnosis}
                  onChange={(e) => handleInputChange('postOperativeDiagnosis', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Post-Operative Plan</label>
                <textarea
                  value={formData.postOperativePlan}
                  onChange={(e) => handleInputChange('postOperativePlan', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Patient Condition on Transfer</label>
                <input
                  type="text"
                  value={formData.patientConditionOnTransfer}
                  onChange={(e) => handleInputChange('patientConditionOnTransfer', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Transferred To</label>
                <select
                  value={formData.transferredTo}
                  onChange={(e) => handleInputChange('transferredTo', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select...</option>
                  <option value="Recovery">Recovery</option>
                  <option value="ICU">ICU</option>
                  <option value="Ward">Ward</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Surgeon's Signature</label>
                <input
                  type="text"
                  value={formData.surgeonSignature}
                  onChange={(e) => handleInputChange('surgeonSignature', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Anaesthesiologist's Signature</label>
                <input
                  type="text"
                  value={formData.anaesthesiologistSignature}
                  onChange={(e) => handleInputChange('anaesthesiologistSignature', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nursing Staff Signature</label>
                <input
                  type="text"
                  value={formData.nursingStaffSignature}
                  onChange={(e) => handleInputChange('nursingStaffSignature', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-end space-x-3">
        <Button
          variant="secondary"
          onClick={handleBack}
          className="flex items-center space-x-2"
        >
          <Icon name="ArrowLeft" size={16} />
          <span>Back to Doctor Slip</span>
        </Button>
        <Button
          variant="secondary"
          onClick={saveOperationRecord}
          disabled={saving}
          className="flex items-center space-x-2"
        >
          <Icon name="Check" size={16} />
          <span>{saving ? 'Saving...' : 'Save & Proceed'}</span>
        </Button>
        <Button
          variant="primary"
          onClick={handleNext}
          className="flex items-center space-x-2"
        >
          <span>Next: Nurse Handover</span>
          <Icon name="ArrowRight" size={16} />
        </Button>
      </div>
    </div>
  );
}
