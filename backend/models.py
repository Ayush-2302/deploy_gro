from datetime import datetime
from uuid import uuid4
from sqlmodel import SQLModel, Field, Column, JSON
from typing import Optional, List, Dict, Any
from enum import Enum

class ServiceType(str, Enum):
    ADMISSION = "admission"
    DOCTOR_SLIP = "doctor_slip"
    OPERATION_RECORD = "operation_record"
    NURSE_HANDOVER = "nurse_handover"
    DISCHARGE = "discharge"
    CLAIMS = "claims"
    PATIENT_FILE = "patient_file"

class TATStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class OperationRecord(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    patient_id: str = Field(foreign_key="patient.id")
    hospital_name: str
    patient_name: str
    uhid: str
    age: str
    gender: str
    ward: str
    bed_no: str
    date_of_surgery: str
    time_of_surgery: str
    pre_operative_diagnosis: str
    post_operative_diagnosis: str
    planned_procedure: str
    procedure_performed: str
    surgeons: str
    assistants: str
    anaesthesiologist: str
    type_of_anaesthesia: str
    anaesthesia_medications: str
    pre_operative_assessment_completed: bool
    informed_consent_obtained: bool
    operative_findings: str
    specimens_removed: str
    estimated_blood_loss: str
    blood_iv_fluids_given: str
    intra_operative_events: str
    instrument_count_verified: bool
    post_operative_plan: str
    patient_condition_on_transfer: str
    transferred_to: str
    surgeon_signature: str
    anaesthesiologist_signature: str
    nursing_staff_signature: str
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

class TAT(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    patient_id: str = Field(foreign_key="patient.id")
    service_type: ServiceType
    start_time: datetime
    end_time: Optional[datetime] = None
    status: TATStatus = TATStatus.PENDING
    duration_minutes: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

class Patient(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    name: str
    age: int
    gender: str
    uhid: Optional[str] = None
    ward: Optional[str] = None
    bed_no: Optional[str] = None
    admission_date: Optional[str] = None
    discharge_date: Optional[str] = None
    mobile_no: Optional[str] = None
    admitted_under_doctor: Optional[str] = None
    attender_name: Optional[str] = None
    relation: Optional[str] = None
    attender_mobile_no: Optional[str] = None
    aadhaar_number: Optional[str] = None
    admission_time: Optional[str] = None
    bed_number: Optional[str] = None
    reason: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = None

class NurseHandover(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    patient_id: str = Field(foreign_key="patient.id")
    shift_time: str
    outgoing: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    incoming: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    incharge: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    summary: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    locked_at: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)

class DischargeSummary(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    patient_id: str = Field(foreign_key="patient.id")
    treating_clinician: Optional[str] = None
    diagnosis: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    chief_complaints: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    past_history: Optional[str] = None
    physical_exam: Optional[str] = None
    investigations: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    procedures: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    course: Optional[str] = None
    operative_findings: Optional[str] = None
    treatment_given: Optional[str] = None
    treatment_on_discharge: Optional[str] = None
    follow_up: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)

class DoctorNote(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    patient_id: str = Field(index=True, foreign_key="patient.id")
    # flat, non-SOAP fields (you asked to remove SOAP)
    chief_complaint: Optional[str] = None
    hpi: Optional[str] = None
    physical_exam: Optional[str] = None
    diagnosis: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    orders: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    prescriptions: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    advice: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)

class Claim(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    patient_id: str = Field(foreign_key="patient.id")
    scheme: Optional[str] = None
    docs: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    readiness_score: Optional[int] = None
    risk: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)

# Patient File Models
class PatientFile(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    patient_id: str = Field(foreign_key="patient.id")
    section: str  # Section 1, 2, 3, etc.
    data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

# Patient File Section 1 - Basic Patient Information
class PatientFileSection1(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    patient_id: str = Field(foreign_key="patient.id")
    patient_name: str
    age: int
    sex: str
    date_of_admission: str
    ward: str
    bed_number: str
    admitted_under_doctor: Optional[str] = None
    attender_name: Optional[str] = None
    relation: Optional[str] = None
    attender_mobile_no: Optional[str] = None
    drug_hypersensitivity_allergy: Optional[str] = None
    consultant: Optional[str] = None
    diagnosis: Optional[str] = None
    diet: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))  # {"type": "Normal", "notes": ""}
    medication_orders: Optional[List[Dict[str, Any]]] = Field(default_factory=list, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

# Patient File Section 2 - Initial Assessment Form
class PatientFileSection2(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    patient_id: str = Field(foreign_key="patient.id")
    
    # Patient and Admission Details
    hospital_number: str
    name: str
    age: int
    sex: str
    ip_number: Optional[str] = None
    consultant: Optional[str] = None
    doctor_unit: Optional[str] = None
    history_taken_by: Optional[str] = None
    history_given_by: Optional[str] = None
    known_allergies: Optional[str] = None
    assessment_date: Optional[str] = None
    assessment_time: Optional[str] = None
    signature: Optional[str] = None
    
    # Chief Complaints and History
    chief_complaints: Optional[str] = None
    history_present_illness: Optional[str] = None
    past_history: Optional[str] = None
    family_history: Optional[str] = None
    personal_history: Optional[str] = None
    immunization_history: Optional[str] = None
    relevant_previous_investigations: Optional[str] = None
    
    # General Physical Examination
    sensorium: Optional[str] = None  # Conscious, Drowsy, Unconscious
    pallor: Optional[bool] = None
    cyanosis: Optional[bool] = None
    clubbing: Optional[bool] = None
    icterus: Optional[bool] = None
    lymphadenopathy: Optional[bool] = None
    general_examination_others: Optional[str] = None
    
    # Systemic Examination
    systemic_examination: Optional[str] = None
    
    # Provisional Diagnosis
    provisional_diagnosis: Optional[str] = None
    
    # Care Plan
    care_plan_curative: Optional[str] = None
    care_plan_investigations_lab: Optional[str] = None
    care_plan_investigations_radiology: Optional[str] = None
    care_plan_investigations_others: Optional[str] = None
    care_plan_preventive: Optional[str] = None
    care_plan_palliative: Optional[str] = None
    care_plan_rehabilitative: Optional[str] = None
    miscellaneous_investigations: Optional[str] = None
    
    # Doctor's Orders
    diet: Optional[str] = None
    diet_specify: Optional[str] = None
    dietary_consultation: Optional[bool] = None
    dietary_consultation_cross_referral: Optional[str] = None
    dietary_screening_his: Optional[bool] = None
    physiotherapy: Optional[bool] = None
    special_care: Optional[str] = None
    restraint_required: Optional[bool] = None
    restraint_form_confirmation: Optional[bool] = None
    surgery_procedures: Optional[str] = None
    cross_consultations: Optional[List[Dict[str, Any]]] = Field(default_factory=list, sa_column=Column(JSON))
    
    # Sign-off
    incharge_consultant_name: Optional[str] = None
    incharge_signature: Optional[str] = None
    incharge_date_time: Optional[str] = None
    doctor_signature: Optional[str] = None
    additional_notes: Optional[str] = None
    
    # Nursing Initial Assessment
    nursing_vitals_bp: Optional[str] = None
    nursing_vitals_pulse: Optional[str] = None
    nursing_vitals_temperature: Optional[str] = None
    nursing_vitals_respiratory_rate: Optional[str] = None
    nursing_vitals_weight: Optional[str] = None
    nursing_vitals_grbs: Optional[str] = None
    nursing_vitals_saturation: Optional[str] = None
    nursing_examination_consciousness: Optional[str] = None
    nursing_examination_skin_integrity: Optional[str] = None
    nursing_examination_respiratory_status: Optional[str] = None
    nursing_examination_other_findings: Optional[str] = None
    nursing_current_medications: Optional[str] = None
    nursing_investigations_ordered: Optional[str] = None
    nursing_diet: Optional[str] = None
    nursing_vulnerable_special_care: Optional[bool] = None
    nursing_pain_score: Optional[int] = None
    nursing_pressure_sores: Optional[bool] = None
    nursing_pressure_sores_description: Optional[str] = None
    nursing_restraints_used: Optional[bool] = None
    nursing_risk_assessment_fall: Optional[bool] = None
    nursing_risk_assessment_dvt: Optional[bool] = None
    nursing_risk_assessment_pressure_sores: Optional[bool] = None
    nursing_signature: Optional[str] = None
    nursing_date_time: Optional[str] = None
    
    # Doctor's Discharge Planning
    discharge_likely_date: Optional[str] = None
    discharge_complete_diagnosis: Optional[str] = None
    discharge_medications: Optional[List[Dict[str, Any]]] = Field(default_factory=list, sa_column=Column(JSON))
    discharge_vitals: Optional[str] = None
    discharge_blood_sugar: Optional[str] = None
    discharge_blood_sugar_controlled: Optional[bool] = None
    discharge_diet: Optional[str] = None
    discharge_condition_ambulatory: Optional[bool] = None
    discharge_pain_score: Optional[int] = None
    discharge_special_instructions: Optional[str] = None
    discharge_physical_activity: Optional[str] = None
    discharge_physiotherapy: Optional[str] = None
    discharge_others: Optional[str] = None
    discharge_report_in_case_of: Optional[str] = None
    discharge_doctor_name_signature: Optional[str] = None
    discharge_follow_up_instructions: Optional[str] = None
    discharge_cross_consultation: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

# Patient File Section 3 - Progress Notes, Vitals & Pain Monitoring
class PatientFileSection3(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    patient_id: str = Field(foreign_key="patient.id")
    
    # Progress Notes
    progress_date: Optional[str] = None
    progress_time: Optional[str] = None
    progress_notes: Optional[str] = None
    
    # Vitals
    vitals_pulse: Optional[str] = None
    vitals_blood_pressure: Optional[str] = None
    vitals_respiratory_rate: Optional[str] = None
    vitals_temperature: Optional[str] = None
    vitals_oxygen_saturation: Optional[str] = None
    
    # Pain Monitoring
    pain_vas_score: Optional[int] = None  # 0-10
    pain_description: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

# Patient File Section 4 - Diagnostics
class PatientFileSection4(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    patient_id: str = Field(foreign_key="patient.id")
    
    # Diagnostics Ordered
    diagnostics_laboratory: Optional[str] = None
    diagnostics_radiology: Optional[str] = None
    diagnostics_others: Optional[str] = None
    
    # Timing and Results
    diagnostics_date_time: Optional[str] = None
    diagnostics_results: Optional[str] = None
    follow_up_instructions: Optional[str] = None
    
    # Responsible Personnel
    responsible_physician: Optional[str] = None
    signature: Optional[str] = None
    signature_date_time: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

# Patient File Section 5 - Patient Vitals Chart (Nursing Assessment)
class PatientFileSection5(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    patient_id: str = Field(foreign_key="patient.id")
    
    # Vitals
    vitals_bp: Optional[str] = None
    vitals_pulse: Optional[str] = None
    vitals_temperature: Optional[str] = None
    vitals_respiratory_rate: Optional[str] = None
    vitals_weight: Optional[str] = None
    vitals_grbs: Optional[str] = None
    vitals_saturation: Optional[str] = None
    
    # Examination
    examination_consciousness: Optional[str] = None
    examination_skin_integrity: Optional[str] = None
    examination_respiratory_status: Optional[str] = None
    examination_other_findings: Optional[str] = None
    
    # Additional Information
    current_medications: Optional[str] = None
    investigations_ordered: Optional[str] = None
    diet: Optional[str] = None
    vulnerable_special_care: Optional[bool] = None
    pain_score: Optional[int] = None  # 0-10
    pressure_sores: Optional[bool] = None
    pressure_sores_description: Optional[str] = None
    restraints_used: Optional[bool] = None
    
    # Risk Assessments
    risk_fall: Optional[bool] = None
    risk_dvt: Optional[bool] = None
    risk_pressure_sores: Optional[bool] = None
    
    # Signature and Timing
    nurse_signature: Optional[str] = None
    assessment_date_time: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

# Patient File Section 6 - Doctors Discharge Planning
class PatientFileSection6(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    patient_id: str = Field(foreign_key="patient.id")
    
    # Discharge Planning
    discharge_likely_date: Optional[str] = None
    discharge_complete_diagnosis: Optional[str] = None
    discharge_medications: Optional[str] = None  # JSON string for table data
    discharge_vitals: Optional[str] = None
    discharge_blood_sugar: Optional[str] = None
    discharge_blood_sugar_controlled: Optional[bool] = None
    discharge_diet: Optional[str] = None
    discharge_condition: Optional[str] = None
    discharge_pain_score: Optional[int] = None
    discharge_special_instructions: Optional[str] = None
    discharge_physical_activity: Optional[str] = None
    discharge_physiotherapy: Optional[str] = None
    discharge_others: Optional[str] = None
    discharge_report_in_case_of: Optional[str] = None
    doctor_name_signature: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

# Patient File Section 7 - Follow Up Instructions
class PatientFileSection7(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    patient_id: str = Field(foreign_key="patient.id")
    
    # Follow Up Information
    follow_up_instructions: Optional[str] = None
    cross_consultation_diagnosis: Optional[str] = None
    discharge_advice: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

# Patient File Section 8 - Nursing Care Plan / Nurse's Record
class PatientFileSection8(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    patient_id: str = Field(foreign_key="patient.id")
    
    # Basic Information
    record_date: Optional[str] = None
    record_time: Optional[str] = None
    nurse_name: Optional[str] = None
    shift: Optional[str] = None  # Morning, Evening, Night
    patient_condition_overview: Optional[str] = None
    
    # Nursing Care Plan Details
    assessment_findings: Optional[str] = None
    nursing_diagnosis: Optional[str] = None
    goals_expected_outcomes: Optional[str] = None
    interventions_nursing_actions: Optional[str] = None
    patient_education_counseling: Optional[str] = None
    evaluation_response_to_care: Optional[str] = None
    
    # Medication Administration Record
    medication_administration: Optional[str] = None  # JSON string for table data
    
    # Additional Notes
    additional_notes: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

# Patient File Section 9 - Intake and Output Chart
class PatientFileSection9(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    patient_id: str = Field(foreign_key="patient.id")
    
    # Basic Information
    chart_date: Optional[str] = None
    chart_time: Optional[str] = None
    
    # Intake (Fluids Consumed)
    intake_oral: Optional[int] = None  # ml
    intake_iv_fluids: Optional[int] = None  # ml
    intake_medications: Optional[int] = None  # ml
    intake_other_specify: Optional[str] = None
    intake_other_amount: Optional[int] = None  # ml
    
    # Output (Fluids Excreted)
    output_urine: Optional[int] = None  # ml
    output_vomitus: Optional[int] = None  # ml
    output_drainage: Optional[int] = None  # ml
    output_stool: Optional[str] = None  # number or description
    output_other_specify: Optional[str] = None
    output_other_amount: Optional[int] = None  # ml
    
    # Calculated Totals
    total_intake: Optional[int] = None  # calculated
    total_output: Optional[int] = None  # calculated
    net_balance: Optional[int] = None  # calculated: Intake - Output
    
    # Remarks and Sign-off
    remarks_notes: Optional[str] = None
    nurse_name: Optional[str] = None
    signature: Optional[str] = None
    signoff_date_time: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

# Patient File Section 10 - Nutritional Screening
class PatientFileSection10(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    patient_id: str = Field(foreign_key="patient.id")
    
    # Basic Information
    patient_name: Optional[str] = None
    hospital_number: Optional[str] = None
    age: Optional[int] = None
    sex: Optional[str] = None  # Male, Female, Other
    screening_date: Optional[str] = None
    
    # Physical Measurements
    weight: Optional[float] = None  # kg
    height: Optional[float] = None  # cm
    bmi: Optional[float] = None  # calculated
    
    # Weight Loss Assessment
    recent_weight_loss: Optional[bool] = None
    weight_loss_amount: Optional[float] = None  # kg
    weight_loss_period: Optional[str] = None  # weeks/months
    
    # Appetite and Dietary Assessment
    appetite_status: Optional[str] = None  # Good, Fair, Poor, None
    swallowing_difficulties: Optional[bool] = None
    dietary_restrictions: Optional[str] = None
    current_diet: Optional[str] = None
    
    # Risk Factors
    risk_chronic_illness: Optional[bool] = None
    risk_infections: Optional[bool] = None
    risk_surgery: Optional[bool] = None
    risk_others: Optional[str] = None
    
    # Screening Outcome
    screening_outcome: Optional[str] = None  # Normal, At Risk, Malnourished
    screening_completed_by: Optional[str] = None
    screening_signature_date: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

# Patient File Section 11 - Nutrition Assessment Form (NAF)
class PatientFileSection11(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    patient_id: str = Field(foreign_key="patient.id")
    
    # Patient Details
    patient_name: Optional[str] = None
    patient_age: Optional[int] = None
    patient_sex: Optional[str] = None
    hospital_number: Optional[str] = None
    assessment_date: Optional[str] = None
    
    # Dietary History
    dietary_history: Optional[str] = None
    
    # Anthropometric Measurements
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    muac_cm: Optional[float] = None  # Mid-Upper Arm Circumference
    skinfold_thickness: Optional[float] = None  # mm
    
    # Assessment Data
    biochemical_data: Optional[str] = None
    clinical_signs_malnutrition: Optional[str] = None
    functional_assessment: Optional[str] = None
    
    # Nutrition Care Plan
    nutritional_diagnosis: Optional[str] = None
    recommended_care_plan: Optional[str] = None
    monitoring_evaluation_plan: Optional[str] = None
    
    # Documentation
    assessed_by: Optional[str] = None
    assessment_signature_date: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

# Patient File Section 12 - Diet Chart
class PatientFileSection12(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    patient_id: str = Field(foreign_key="patient.id")
    
    # Basic Information
    patient_name: Optional[str] = None
    hospital_number: Optional[str] = None
    age: Optional[int] = None
    sex: Optional[str] = None  # Male, Female, Other
    admission_date: Optional[str] = None
    
    # Diet Type
    diet_type: Optional[str] = None  # Normal, Soft, Diabetic, Renal, Liquid, Others
    diet_type_others: Optional[str] = None  # specify if Others
    
    # Daily Meal Schedule
    breakfast_details: Optional[str] = None
    breakfast_notes: Optional[str] = None
    mid_morning_details: Optional[str] = None
    mid_morning_notes: Optional[str] = None
    lunch_details: Optional[str] = None
    lunch_notes: Optional[str] = None
    afternoon_details: Optional[str] = None
    afternoon_notes: Optional[str] = None
    dinner_details: Optional[str] = None
    dinner_notes: Optional[str] = None
    bedtime_details: Optional[str] = None
    bedtime_notes: Optional[str] = None
    
    # Special Nutritional Instructions
    special_nutritional_instructions: Optional[str] = None
    
    # Dietary Consultation
    consultation_required: Optional[bool] = None
    dietician_name: Optional[str] = None
    consultation_date: Optional[str] = None
    
    # Sign-off
    signed_by: Optional[str] = None
    designation: Optional[str] = None
    signoff_date_time: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
