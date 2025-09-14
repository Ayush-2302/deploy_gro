interface PatientJourneyTimelineProps {
  currentStep: number; // 1-7
  className?: string;
}

export function PatientJourneyTimeline({ currentStep, className = "" }: PatientJourneyTimelineProps) {
  const steps = [
    { id: 1, name: "Admission" },
    { id: 2, name: "Doctor Slip" },
    { id: 3, name: "Operation Record" },
    { id: 4, name: "Nurse Handover" },
    { id: 5, name: "Patient File" },
    { id: 6, name: "Claims" },
    { id: 7, name: "Discharge" }
  ];

  const getStepStatus = (stepId: number) => {
    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep) return 'current';
    return 'pending';
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const isLast = index === steps.length - 1;
          
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  status === 'completed' ? 'bg-green-500 text-white' :
                  status === 'current' ? 'bg-blue-600 text-white' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {step.id}
                </div>
                <span className={`text-xs mt-1 font-medium ${
                  status === 'current' ? 'text-blue-600' : 
                  status === 'completed' ? 'text-green-600' : 
                  'text-gray-500'
                }`}>
                  {step.name}
                </span>
              </div>
              {!isLast && (
                <div className={`w-8 h-0.5 mx-2 ${
                  status === 'completed' ? 'bg-green-300' :
                  'bg-gray-200'
                }`}></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
