import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getJSON } from "../lib/api";
import { Button, Card } from "../components/Primitives";
import { PageHeader } from '../components/PageHeader';
import { Icon } from '../components/Icons';

interface PatientSelectorProps {
  section: string;
}

export default function PatientSelector({ section }: PatientSelectorProps) {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const patientsData = await getJSON('/api/patients');
        setPatients(patientsData);
        setError(null);
      } catch (err: any) {
        console.error("Error loading patients:", err);
        setError(err.message || "Failed to load patients");
      } finally {
        setIsLoading(false);
      }
    };

    loadPatients();
  }, []);

  const getSectionTitle = (section: string) => {
    switch (section) {
      case 'doctor-slip': return 'Doctor Slip';
      case 'operation-record': return 'Operation Record';
      case 'nurse-handover': return 'Nurse Handover';
      case 'patient-file': return 'Patient File';
      case 'discharge': return 'Discharge Summary';
      case 'claims': return 'Claims Management';
      default: return 'Patient Selection';
    }
  };

  const getSectionDescription = (section: string) => {
    switch (section) {
      case 'doctor-slip': return 'Select a patient to create consultation notes';
      case 'operation-record': return 'Select a patient to create operation record';
      case 'nurse-handover': return 'Select a patient for nurse handover';
      case 'patient-file': return 'Select a patient to manage patient file documentation';
      case 'discharge': return 'Select a patient to create discharge summary';
      case 'claims': return 'Select a patient for claims management';
      default: return 'Select a patient to continue';
    }
  };

  const handlePatientSelect = (patientId: string) => {
    navigate(`/${section}/${patientId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600">Loading patients...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 mb-16">
        <PageHeader
          title={getSectionTitle(section)}
          subtitle="Error loading patients"
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
              <h3 className="font-semibold">Error Loading Patients</h3>
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

  return (
    <div className="space-y-6 mb-16">
      <PageHeader
        title={getSectionTitle(section)}
        subtitle={getSectionDescription(section)}
        actions={
          <Button onClick={() => navigate('/admission')} variant="secondary">
            <Icon name="ArrowLeft" className="w-4 h-4 mr-2" />
            Back to Admission
          </Button>
        }
      />

      {patients.length === 0 ? (
        <Card className="p-6">
          <div className="text-center">
            <Icon name="User" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Patients Found</h3>
            <p className="text-gray-600 mb-4">You need to admit a patient first before accessing this section.</p>
            <Button onClick={() => navigate('/admission')}>
              Go to Admission
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Select Patient</h3>
          <div className="grid gap-4">
            {patients.map((patient) => (
              <Card key={patient.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handlePatientSelect(patient.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">{patient.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span>{patient.age} years, {patient.gender}</span>
                      <span>Admitted: {patient.admission_date}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-gray-500">Admitted</span>
                    </div>
                    <Icon name="ChevronRight" className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
