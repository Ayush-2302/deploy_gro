import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getJSON, postJSON, putJSON, deleteJSON } from "../lib/api.js";
import { Recorder } from "../components/Recorder";
import { Button, Input, Textarea, Select } from "../components/Primitives";
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Primitives';
import { Icon } from '../components/Icons';
import { postProcessAdmission } from '../lib/postProcessAdmission.js';
import { PatientJourneyTimeline } from '../components/PatientJourneyTimeline';

type AdmissionForm = {
  name: string; age: string; gender: "Male"|"Female"|"Other";
  mobile_no: string;
  aadhaar_number: string;
  admission_date: string; admission_time: string; reason: string;
};

const emptyForm: AdmissionForm = {
  name:"", age:"", gender:"Male",
  mobile_no:"", aadhaar_number:"",
  admission_date:"", admission_time:"", reason:""
};

function mergeIfPresent<T extends object>(base:T, patch:Partial<T>):T{
  const out:any = {...base};
  Object.entries(patch).forEach(([k,v])=>{
    if (v!==undefined && v!==null && `${v}`.trim()!=="") out[k]=v;
  });
  return out as T;
}

const genderOptions = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
];


export default function Admission(){
  const nav = useNavigate();
  const [form,setForm] = useState<AdmissionForm>(emptyForm);
  const [txAdmission, setTxAdmission] = useState("");
  const [patients,setPatients] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingPatient, setEditingPatient] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMapping, setIsMapping] = useState(false);

  // Pre-filled transcript for Admission
  const prefilledTranscript = "Patient name is Rajesh Kumar Sharma, 45 years old male. Contact number is 9876543210, mobile number is 7976636359. Admitted under doctor Dr. Ravikant Porwal. Attender name is Pradeep Shihani, relation is son, attender mobile number is 7976636359. Admission date is today January 9th 2025, admission time is 2:30 PM. Ward is cardiology ward, bed number 3. Reason for admission is acute myocardial infarction with chest pain and shortness of breath. Patient has history of hypertension for 5 years and diabetes for 3 years. Chief complaint is severe chest pain radiating to left arm, rated 8 out of 10. Physical examination shows blood pressure 160 over 95, heart rate 110, patient appears anxious. Diagnosis is ST elevation myocardial infarction. Treatment plan includes primary PCI, dual antiplatelet therapy, and statin therapy. Patient is stable and cooperative.";


  useEffect(()=>{
    getJSON<any[]>("/api/patients").then(setPatients).catch(()=>{});
  },[]);


  async function mapFromTranscript(){
    try {
      if (!txAdmission.trim()) {
        // Please record audio first
        return;
      }
      
      setIsMapping(true);
      setError(null);
      
      console.log("Mapping transcript:", txAdmission);
      
      // Create the UI section from current form state
      const uiSection = `Full Name: ${form.name || ''}
Age: ${form.age || 'Enter age'}
Gender: ${form.gender || ''}
Mobile Number: ${form.mobile_no || ''}
Admission Date options: ${form.admission_date || 'dd-mm-yyyy'} / Today / Tomorrow
Admission Time options: ${form.admission_time || '--:--'} / Now / 9:00 AM
Reason: ${form.reason || 'Describe the reason for admission...'}`;

      // Combine TRANSCRIPT and UI sections
      const combinedText = `TRANSCRIPT\n${txAdmission}\n\nUI\n${uiSection}`;
      
      console.log("Sending combined text:", combinedText);
      
      const raw = await postJSON<Partial<AdmissionForm>>("/api/map/admission", { 
        text: combinedText,
        language: "en"
      });
      
      console.log("Raw mapped result:", raw);
      
      // Apply post-processing to sanitize the output
      const processed = postProcessAdmission(raw);
      console.log("Processed result:", processed);
      
      setForm(prev => mergeIfPresent(prev, {
        name: processed.name,
        age: processed.age ? String(processed.age) : prev.age,
        gender: processed.gender ? (processed.gender[0].toUpperCase()+processed.gender.slice(1)) as any : prev.gender,
        mobile_no: processed.mobile_no,
        aadhaar_number: processed.aadhaar_number || "",
        admission_date: processed.admission_date,
        admission_time: processed.admission_time,
        reason: processed.reason,
      }));
      
      setIsMapping(false);
      // Fields mapped successfully
      
    } catch (error) {
      console.error("Error mapping transcript:", error);
      setError(`Failed to map transcript: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsMapping(false);
    }
  }

  function clearForm() {
    setForm(emptyForm);
    setTxAdmission("");
    setEditingPatient(null);
  }

  const handleEditPatient = (patient: any) => {
    setEditingPatient(patient);
    setForm({
      name: patient.name || '',
      age: String(patient.age || ''),
      gender: patient.gender || 'Male',
      mobile_no: patient.mobile_no || '',
      aadhaar_number: patient.aadhaar_number || '',
      admission_date: patient.admission_date || '',
      admission_time: patient.admission_time || '',
      reason: patient.reason || ''
    });
  };

  const handleUpdatePatient = async () => {
    if (!editingPatient) return;
    
    try {
      setIsSaving(true);
      await putJSON(`/api/patients/${editingPatient.id}`, {
        name: form.name,
        age: Number(form.age || 0),
        gender: form.gender,
        mobile_no: form.mobile_no,
        aadhaar_number: editingPatient.aadhaar_number,
        admission_date: form.admission_date,
        admission_time: form.admission_time,
        reason: form.reason
      });
      
      // Refresh the patients list
      const updatedPatients = await getJSON<any[]>("/api/patients");
      setPatients(updatedPatients);
      
      setEditingPatient(null);
      setForm(emptyForm);
      // Patient information updated successfully
    } catch (error) {
      console.error('Error updating patient:', error);
      // Error updating patient
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePatient = async (patient: any) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${patient.name}? This will remove all patient data including medical records, claims, and patient files. This action cannot be undone.`
    );
    
    if (!confirmDelete) return;
    
    try {
      setIsDeleting(true);
      await deleteJSON(`/api/patients/${patient.id}`);
      
      // Remove from patients list
      setPatients(prev => prev.filter(p => p.id !== patient.id));
      // Patient deleted successfully
    } catch (error) {
      console.error('Error deleting patient:', error);
      // Error deleting patient
    } finally {
      setIsDeleting(false);
    }
  };

  async function mapAdmissionFromTranscript() {
    const text = (txAdmission || "").trim();
    if (!text) return;
    
    setIsMapping(true);
    setError(null);
    
    console.log("mapAdmissionFromTranscript: starting", text);

    try {
      // Create the UI section from current form state
      const uiSection = `Full Name: ${form.name || ''}
Age: ${form.age || 'Enter age'}
Gender: ${form.gender || ''}
Mobile Number: ${form.mobile_no || ''}
Admission Date options: ${form.admission_date || 'dd-mm-yyyy'} / Today / Tomorrow
Admission Time options: ${form.admission_time || '--:--'} / Now / 9:00 AM
Reason: ${form.reason || 'Describe the reason for admission...'}`;

      // Combine TRANSCRIPT and UI sections
      const combinedText = `TRANSCRIPT\n${text}\n\nUI\n${uiSection}`;
      
      console.log("Sending combined text:", combinedText);
      
      const raw = await postJSON("/api/map/admission", { text: combinedText });
      console.log("mapAdmissionFromTranscript: API response", raw);
      
      // Apply post-processing to sanitize the output
      const processed = postProcessAdmission(raw);
      console.log("mapAdmissionFromTranscript: processed result", processed);
      
      setForm(prev => mergeIfPresent(prev, {
        name: processed.name,
        age: processed.age ? String(processed.age) : prev.age,
        gender: processed.gender ? (processed.gender[0].toUpperCase() + processed.gender.slice(1)) as "Male"|"Female"|"Other" : prev.gender,
        mobile_no: processed.mobile_no,
        aadhaar_number: processed.aadhaar_number || "",
        admission_date: processed.admission_date,
        admission_time: processed.admission_time,
        reason: processed.reason,
      }));
      
      console.log("mapAdmissionFromTranscript: form updated");
      
      setIsMapping(false);
      // Fields mapped successfully
      
    } catch (error) {
      console.error("mapAdmissionFromTranscript: error", error);
      setError(`Failed to map admission data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsMapping(false);
    }
  }

  async function saveAndProceed(){
    try {
      setIsSaving(true);
      setError(null);
      
      if (!form.name || !form.age) {
        setError("Please fill in at least name and age");
        return;
      }
      
      // Validate date format if provided
      if (form.admission_date && !/^\d{4}-\d{2}-\d{2}$/.test(form.admission_date)) {
        setError("Please enter a valid admission date");
        return;
      }
      
      // Validate time format if provided
      if (form.admission_time && !/^\d{2}:\d{2}$/.test(form.admission_time)) {
        setError("Please enter a valid admission time");
        return;
      }
      
      if (editingPatient) {
        // Update existing patient
        console.log("Updating patient with data:", {
          name: form.name,
          age: Number(form.age||0),
          gender: form.gender,
        });
        
        const updated = await putJSON<any>(`/api/patients/${editingPatient.id}`, {
          name: form.name,
          age: Number(form.age||0),
          gender: form.gender,
          mobile_no: form.mobile_no,
          aadhaar_number: editingPatient.aadhaar_number,
          admission_date: form.admission_date,
          admission_time: form.admission_time,
          reason: form.reason
        });
        
        console.log("Patient updated successfully:", updated);
        
        // Refresh the patients list
        const updatedPatients = await getJSON<any[]>("/api/patients");
        setPatients(updatedPatients);
        
        // Clear form and exit edit mode
        setEditingPatient(null);
        setForm(emptyForm);
        
        // Patient information updated successfully
      } else {
        // Create new patient
        console.log("Creating patient with data:", {
          name: form.name,
          age: Number(form.age||0),
          gender: form.gender,
          uhid: null,
          admission_date: form.admission_date || null,
        });
        
        const created = await postJSON<any>("/api/patients", {
          name: form.name,
          age: Number(form.age||0),
          gender: form.gender,
          uhid: null,
          admission_date: form.admission_date || null,
        });
        
        console.log("Patient created successfully:", created);
        
        if (created && created.id) {
          // Refresh the patients list
          const updatedPatients = await getJSON<any[]>("/api/patients");
          setPatients(updatedPatients);
          
          // Navigate to doctor slip
          nav(`/doctor-slip/${created.id}`);
        } else {
          throw new Error("Invalid response from server");
        }
      }
    } catch (error) {
      console.error("Error saving patient:", error);
      setError(`Failed to save patient: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  }


  return (
    <div className="space-y-6">
      <PageHeader
        title={editingPatient ? `Edit Patient - ${editingPatient.name}` : "Patient Admission"}
        subtitle={editingPatient ? "Modify patient information" : "Register new patients and manage admissions"}
        actions={
          <div className="flex space-x-3">
            <Button onClick={clearForm} variant="secondary" disabled={isSaving}>
              <Icon name="X" size={16} className="mr-2" />
              {editingPatient ? 'Cancel Edit' : 'Clear Form'}
            </Button>
            <Button onClick={saveAndProceed} disabled={isSaving}>
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  {editingPatient ? 'Updating...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Icon name="Check" size={16} className="mr-2" />
                  {editingPatient ? 'Update Patient' : 'Save & Proceed'}
                </>
              )}
            </Button>
          </div>
        }
      />

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <Icon name="AlertCircle" size={20} className="text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Patient Journey Timeline */}
      <PatientJourneyTimeline currentStep={1} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold font-heading text-slate-900">Existing Patients</h3>
          <div className="space-y-3">
            {patients.map(p=>(
              <div key={p.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{p.name}</div>
                    <div className="text-sm text-slate-500">{p.age} yrs, {p.gender}</div>
                    {p.admission_date && (
                      <div className="text-xs text-slate-400">Admitted: {p.admission_date}</div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Timeline indicator */}
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full" title="Admission Complete"></div>
                      <div className="w-2 h-2 bg-gray-300 rounded-full" title="Doctor Consultation"></div>
                      <div className="w-2 h-2 bg-gray-300 rounded-full" title="Nurse Handover"></div>
                      <div className="w-2 h-2 bg-gray-300 rounded-full" title="Discharge"></div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        onClick={() => handleEditPatient(p)}
                        size="sm"
                        variant="secondary"
                        className="text-blue-600 hover:text-blue-700"
                        disabled={isSaving || isDeleting}
                      >
                        <Icon name="Edit" size={14} />
                      </Button>
                      <Button
                        onClick={() => handleDeletePatient(p)}
                        size="sm"
                        variant="secondary"
                        className="text-red-600 hover:text-red-700"
                        disabled={isSaving || isDeleting}
                      >
                        <Icon name="Trash2" size={14} />
                      </Button>
                    </div>
                    <Button
                      onClick={() => nav(`/doctor-slip/${p.id}`)}
                      size="sm"
                      variant="primary"
                    >
                      <Icon name="ArrowRight" size={14} className="mr-1" />
                      Continue
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {patients.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Icon name="Users" size={48} className="mx-auto mb-2 text-slate-300" />
                <p>No patients yet. Create your first patient admission above.</p>
              </div>
            )}
          </div>
        </div>

        {/* Admission Form */}
        <Card>
          <div className="p-6 space-y-6">
            <h3 className="text-lg font-semibold font-heading text-slate-900">
              Patient Information
            </h3>

            {/* Voice Recording */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Icon name="Mic" size={20} className="text-primary-600" />
                <h4 className="text-md font-semibold font-heading text-slate-900">
                  Voice Input for Patient Details
                </h4>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  <strong>Receptionist workflow:</strong> Record complete patient information in one clear recording. The system works best in noisy environments and supports both English and Hindi.
                </p>
                
              </div>
              
              
              <Recorder
                showLanguageToggle={false}
                value={txAdmission}
                onChangeTranscript={setTxAdmission}
                onTranscript={setTxAdmission}
                onTranscribe={setTxAdmission}
                enableTranscription={true}
                maxDuration={300}
              />
              
              {txAdmission.trim() && (
                <div className="flex justify-end mt-2">
                  <Button 
                    type="button" 
                    variant="primary" 
                    onClick={mapAdmissionFromTranscript}
                    disabled={isMapping || isSaving}
                  >
                    {isMapping ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        <Icon name="Zap" size={16} className="mr-2" />
                        Auto-Map Fields
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>


            {/* Patient Details */}
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isMapping ? 'opacity-50 pointer-events-none' : ''}`}>
              <Input
                label="Full Name"
                value={form.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter patient name"
                required
                disabled={isMapping}
              />
              <Input
                label="Age"
                type="number"
                value={form.age}
                onChange={(e) => setForm(prev => ({ ...prev, age: e.target.value }))}
                placeholder="Enter age"
                required
                disabled={isMapping}
              />
              <Select
                label="Gender"
                value={form.gender}
                onChange={(e) => setForm(prev => ({ ...prev, gender: e.target.value as any }))}
                options={genderOptions}
                required
                disabled={isMapping}
              />
              <Input
                label="Mobile No"
                value={form.mobile_no}
                onChange={(e) => setForm(prev => ({ ...prev, mobile_no: e.target.value }))}
                placeholder="7976636359"
                required
                disabled={isMapping}
              />
            </div>

            {/* ID Information */}

            {/* Admission Details */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold font-heading text-slate-900">
                Admission Details
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Input
                    label="Admission Date"
                    type="date"
                    value={form.admission_date}
                    onChange={(e) => setForm(prev => ({ ...prev, admission_date: e.target.value }))}
                    required
                  />
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="subtle"
                      size="sm"
                      onClick={() => {
                        const today = new Date().toISOString().split('T')[0];
                        setForm(prev => ({ ...prev, admission_date: today }));
                      }}
                    >
                      Today
                    </Button>
                    <Button
                      type="button"
                      variant="subtle"
                      size="sm"
                      onClick={() => {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        setForm(prev => ({ ...prev, admission_date: tomorrow.toISOString().split('T')[0] }));
                      }}
                    >
                      Tomorrow
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Input
                    label="Admission Time"
                    type="time"
                    value={form.admission_time}
                    onChange={(e) => setForm(prev => ({ ...prev, admission_time: e.target.value }))}
                    required
                  />
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="subtle"
                      size="sm"
                      onClick={() => {
                        const now = new Date();
                        const timeString = now.toTimeString().slice(0, 5);
                        setForm(prev => ({ ...prev, admission_time: timeString }));
                      }}
                    >
                      Now
                    </Button>
                    <Button
                      type="button"
                      variant="subtle"
                      size="sm"
                      onClick={() => {
                        setForm(prev => ({ ...prev, admission_time: "09:00" }));
                      }}
                    >
                      9:00 AM
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Reason for Admission */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold font-heading text-slate-900">
                Reason for Admission
              </h4>
              
              <Textarea
                value={form.reason}
                onChange={(e) => setForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Describe the reason for admission..."
                rows={4}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
