import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getJSON, postJSON } from "../lib/api";
import { Recorder } from "../components/Recorder";
import { Button, Textarea, Card } from "../components/Primitives";
import { PageHeader } from '../components/PageHeader';
import { Icon } from '../components/Icons';
import { PatientJourneyTimeline } from '../components/PatientJourneyTimeline';

type NoteForm = {
  chief_complaint: string; 
  hpi: string; 
  physical_exam: string;
  diagnosis: string | string[];
  orders: string | string[];
  prescriptions: string | string[];
  advice: string;
};

export default function DoctorSlip(){
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [transcript, setTranscript] = useState("");
  const [form, setForm] = useState<NoteForm>({
    chief_complaint: "",
    hpi: "",
    physical_exam: "",
    diagnosis: "",
    orders: "",
    prescriptions: "",
    advice: ""
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-filled transcript for Doctor Slip
  const prefilledTranscript = "Chief complaint is chest pain and shortness of breath. Patient is a 45-year-old male with crushing chest pain radiating to left arm, rated 8 out of 10 on pain scale. History of hypertension for 5 years, diabetes mellitus type 2 for 3 years, and smoking history of 20 pack-years. Physical exam shows blood pressure 160 over 95, heart rate 110 beats per minute, temperature 98.6 degrees Fahrenheit, oxygen saturation 94 percent on room air. Patient appears anxious and diaphoretic. Cardiovascular exam reveals regular rhythm, no murmurs, no gallops. Lungs are clear bilaterally. Diagnosis is acute myocardial infarction with ST elevation, hypertension, and diabetes mellitus type 2. Orders include 12-lead ECG, cardiac enzymes including troponin I, complete blood count, basic metabolic panel, lipid profile, and chest X-ray. Prescriptions are aspirin 325 milligrams daily, atorvastatin 40 milligrams at bedtime, metoprolol 25 milligrams twice daily, and clopidogrel 75 milligrams daily. Advice is to avoid physical exertion, follow low-sodium diet, quit smoking, and follow up with cardiology in one week.";


  // Load patient data with proper cleanup
  useEffect(() => {
    let alive = true;
    
    if (!patientId) {
      setError("No patient ID provided");
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        console.log("Loading patient data for ID:", patientId);
        
        // Load patient data
        const patientData = await getJSON(`/api/patients/${patientId}`);
        if (!alive) return;
        
        console.log("Patient data loaded:", patientData);
        
        // If patient data is null or undefined, use fallback data
        if (!patientData) {
          console.log("No patient data found, using fallback data");
          setPatient({
            id: patientId,
            name: "Test Patient",
            age: 45,
            gender: "Male",
            uhid: "UHID001234567",
            ipd: "IPD2025001"
          });
        } else {
          setPatient(patientData);
        }

        // Try to load notes (might not exist for new patients)
        try {
          const notesData = await getJSON(`/api/patients/${patientId}/notes`);
          if (!alive) return;
          console.log("Notes loaded:", notesData);
          setNotes(notesData);
        } catch (notesError) {
          if (!alive) return;
          console.log("No notes found (this is normal for new patients):", notesError);
          setNotes([]);
        }

        if (alive) setError(null);
      } catch (err: any) {
        if (!alive) return;
        console.error("Error loading data:", err);
        setError(err.message || "Failed to load patient data");
      } finally {
        if (alive) setIsLoading(false);
      }
    };

    loadData();
    
    return () => { 
      alive = false; 
    };
  }, [patientId]);

  const mapNote = async () => {
    try {
      const text = transcript.trim();
      if (!text) {
        console.log("🟡 DoctorSlip: No transcript to map");
        setError("Please record audio or enter text first");
        return;
      }
      
      console.log("🟢 DoctorSlip: Mapping transcript to fields:", text);
      console.log("🟢 DoctorSlip: Transcript length:", text.length);
      setError(null); // Clear any previous errors
      
      const m = await postJSON("/api/map/doctor_note", { text });
      console.log("DoctorSlip: map response", m);

      setForm(prev => ({
        ...prev,
        chief_complaint: m?.chief_complaint ?? prev.chief_complaint,
        hpi: m?.hpi ?? prev.hpi,
        physical_exam: m?.physical_exam ?? prev.physical_exam,
        diagnosis: m?.diagnosis ?? prev.diagnosis,
        orders: m?.orders ?? prev.orders,
        prescriptions: m?.prescriptions ?? prev.prescriptions,
        advice: m?.advice ?? prev.advice,
      }));
    } catch (e) {
      console.error("DoctorSlip: mapNote failed", e);
      setError("Failed to map transcript to fields: " + (e instanceof Error ? e.message : 'Unknown error'));
    }
  };

  const saveNote = async () => {
    if (!patientId) return;
    
    setIsSaving(true);
    try {
      // Helper function to convert string or array to array
      const toArray = (value: string | string[]): string[] => {
        if (Array.isArray(value)) {
          return value.filter(Boolean);
        }
        return value.split(',').map(s => s.trim()).filter(Boolean);
      };

      const noteData = {
        patient_id: patientId,
        chief_complaint: form.chief_complaint,
        hpi: form.hpi,
        physical_exam: form.physical_exam,
        diagnosis: toArray(form.diagnosis),
        orders: toArray(form.orders),
        prescriptions: toArray(form.prescriptions),
        advice: form.advice
      };

      console.log("Saving note:", noteData);
      await postJSON(`/api/patients/${patientId}/notes`, noteData);
      
      // Clear form and transcript
      setForm({
        chief_complaint: "",
        hpi: "",
        physical_exam: "",
        diagnosis: "",
        orders: "",
        prescriptions: "",
        advice: ""
      });
      setTranscript("");
      
      // Reload notes
      try {
        const notesData = await getJSON(`/api/patients/${patientId}/notes`);
        setNotes(notesData);
      } catch (e) {
        console.log("Could not reload notes:", e);
      }
      
    } catch (err: any) {
      console.error("Error saving note:", err);
      setError(err.message || "Failed to save note");
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600">Loading patient data...</p>
          <p className="text-sm text-slate-500 mt-2">Patient ID: {patientId}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Doctor Slip"
          subtitle="Error loading patient data"
          actions={
            <Button onClick={() => navigate('/admission')} variant="secondary">
              <Icon name="ArrowLeft" className="w-4 h-4 mr-2" />
              Back to Admission
            </Button>
          }
        />
        
        <Card className="p-6">
          <div className="flex items-center space-x-3 text-red-600">
            <Icon name="AlertCircle" className="w-6 h-6" />
            <div>
              <h3 className="font-semibold">Error Loading Patient</h3>
              <p className="text-sm text-gray-600 mt-1">{error}</p>
            </div>
          </div>
          <div className="mt-4 flex space-x-3">
            <Button onClick={() => window.location.reload()} variant="secondary">
              Retry
            </Button>
            <Button onClick={() => navigate('/admission')}>
              Go to Admission
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // No patient data
  if (!patient) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Doctor Slip"
          subtitle="Patient not found"
          actions={
            <Button onClick={() => navigate('/admission')} variant="secondary">
              <Icon name="ArrowLeft" className="w-4 h-4 mr-2" />
              Back to Admission
            </Button>
          }
        />
        
        <Card className="p-6">
          <div className="text-center">
            <Icon name="User" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Patient Not Found</h3>
            <p className="text-gray-600 mb-4">The patient with ID {patientId} could not be found.</p>
            <Button onClick={() => navigate('/admission')}>
              Go to Admission
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Main form
  return (
    <div className="space-y-6">
      <PageHeader
        title="Doctor Slip"
        subtitle={`Consultation notes for ${patient.name}`}
        actions={
          <div className="flex space-x-3">
            <Button onClick={() => navigate('/admission')} variant="secondary">
              <Icon name="ArrowLeft" className="w-4 h-4 mr-2" />
              Back to Admission
            </Button>
            <Button 
              onClick={() => navigate(`/operation-record/${patientId}`)} 
              variant="primary"
            >
              Next: Operation Record
              <Icon name="ArrowRight" className="w-4 h-4 ml-2" />
            </Button>
          </div>
        }
      />

      {/* Patient Journey Timeline */}
      <PatientJourneyTimeline currentStep={2} />

      {/* Patient Information */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Patient Information</h3>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Admitted</span>
            <div className="w-3 h-3 bg-blue-500 rounded-full ml-4"></div>
            <span className="text-sm text-gray-600">Doctor Consultation</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Name</label>
            <p className="text-slate-900">{patient.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Age</label>
            <p className="text-slate-900">{patient.age} years</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Gender</label>
            <p className="text-slate-900">{patient.gender}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Admission Date</label>
            <p className="text-slate-900">{patient.admission_date}</p>
          </div>
        </div>
      </Card>

      {/* Voice Recording */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Voice Recording</h3>
        <Recorder 
          value={transcript}
          onChangeTranscript={setTranscript}
          onTranscribe={setTranscript}
          onTranscript={setTranscript}
          showLanguageToggle={false}
          maxDuration={300}
          enableTranscription={true}
        />
        
        {transcript.trim() && (
          <div className="flex justify-end mt-2">
            <Button 
              type="button" 
              variant="primary" 
              onClick={mapNote}
            >
              <Icon name="Zap" size={16} className="mr-2" />
              Auto-Map Fields
            </Button>
          </div>
        )}
      </Card>

      {/* Consultation Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Consultation Notes</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chief Complaint</label>
            <Textarea
              value={form.chief_complaint}
              onChange={(e) => setForm(prev => ({ ...prev, chief_complaint: e.target.value }))}
              placeholder="Enter chief complaint..."
              rows={2}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">History of Present Illness</label>
            <Textarea
              value={form.hpi}
              onChange={(e) => setForm(prev => ({ ...prev, hpi: e.target.value }))}
              placeholder="Enter history of present illness..."
              rows={3}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Physical Examination</label>
            <Textarea
              value={form.physical_exam}
              onChange={(e) => setForm(prev => ({ ...prev, physical_exam: e.target.value }))}
              placeholder="Enter physical examination findings..."
              rows={3}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis (comma-separated)</label>
            <Textarea
              value={Array.isArray(form.diagnosis) ? form.diagnosis.join(', ') : form.diagnosis}
              onChange={(e) => setForm(prev => ({ ...prev, diagnosis: e.target.value }))}
              placeholder="Enter diagnosis..."
              rows={2}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Orders (comma-separated)</label>
            <Textarea
              value={Array.isArray(form.orders) ? form.orders.join(', ') : form.orders}
              onChange={(e) => setForm(prev => ({ ...prev, orders: e.target.value }))}
              placeholder="Enter orders..."
              rows={2}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Prescriptions (comma-separated)</label>
            <Textarea
              value={Array.isArray(form.prescriptions) ? form.prescriptions.join(', ') : form.prescriptions}
              onChange={(e) => setForm(prev => ({ ...prev, prescriptions: e.target.value }))}
              placeholder="Enter prescriptions..."
              rows={2}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Advice</label>
            <Textarea
              value={form.advice}
              onChange={(e) => setForm(prev => ({ ...prev, advice: e.target.value }))}
              placeholder="Enter advice..."
              rows={2}
            />
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button 
            onClick={saveNote} 
            disabled={isSaving}
            className="min-w-32"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Saving...
              </>
            ) : (
              'Save Note'
            )}
          </Button>
        </div>
      </Card>

      {/* Previous Notes */}
      {notes.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Previous Notes</h3>
          <div className="space-y-4">
            {notes.map((note, index) => (
              <div key={index} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-slate-900">Note #{index + 1}</h4>
                  <span className="text-sm text-gray-500">
                    {new Date(note.created_at).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Chief Complaint:</span>
                    <p className="text-gray-700">{note.chief_complaint}</p>
                  </div>
                  <div>
                    <span className="font-medium">Diagnosis:</span>
                    <p className="text-gray-700">{Array.isArray(note.diagnosis) ? note.diagnosis.join(', ') : note.diagnosis}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}