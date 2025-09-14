import { Toaster } from 'sonner';
import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import AppShell from './components/AppShell';
import Dashboard from './pages/Dashboard';
import Admission from './pages/Admission';
import DoctorSlip from './pages/DoctorSlip';
import OperationRecord from './pages/OperationRecord';
import PatientSelector from './pages/PatientSelector';
import NurseHandover from './pages/NurseHandover';
import TestRecorder from './pages/TestRecorder';
import SimpleTest from './pages/SimpleTest';
import Discharge from './pages/Discharge';
import Claims from './pages/Claims';
import PatientFile from './pages/PatientFile';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  useEffect(() => {
    // Global error handlers
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('🔴 Unhandled Promise Rejection:', event.reason);
      event.preventDefault(); // Prevent the default browser behavior
    };

    const handleError = (event: ErrorEvent) => {
      console.error('🔴 Global Error:', event.error);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="admission" element={<Admission />} />
          <Route path="test-recorder" element={<TestRecorder />} />
          <Route path="simple-test" element={<SimpleTest />} />
          <Route path="doctor-slip/select" element={<PatientSelector section="doctor-slip" />} />
          <Route path="doctor-slip/:patientId" element={<DoctorSlip />} />
          <Route path="operation-record/select" element={<PatientSelector section="operation-record" />} />
          <Route path="operation-record/:patientId" element={<OperationRecord />} />
          <Route path="nurse-handover/select" element={<PatientSelector section="nurse-handover" />} />
          <Route path="nurse-handover/:patientId" element={<NurseHandover />} />
          <Route path="discharge/select" element={<PatientSelector section="discharge" />} />
          <Route path="discharge/:patientId" element={<Discharge />} />
          <Route path="claims/select" element={<PatientSelector section="claims" />} />
          <Route path="claims/:patientId" element={<Claims />} />
          <Route path="patient-file/select" element={<PatientSelector section="patient-file" />} />
          <Route path="patient-file/:patientId" element={<PatientFile />} />
        </Route>
      </Routes>
      <Toaster position="top-right" />
    </ErrorBoundary>
  );
}

export default App;
