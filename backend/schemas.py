from datetime import datetime
from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Literal
from enum import Enum

# TAT Tracking Enums
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

# TAT Tracking Schemas
class TATCreate(BaseModel):
    patient_id: str
    service_type: ServiceType
    start_time: datetime
    end_time: Optional[datetime] = None
    status: TATStatus = TATStatus.PENDING
    notes: Optional[str] = None

class TATUpdate(BaseModel):
    end_time: Optional[datetime] = None
    status: Optional[TATStatus] = None
    notes: Optional[str] = None

class TATRead(TATCreate):
    id: str
    duration_minutes: Optional[float] = None
    created_at: datetime
    updated_at: datetime

class TATSummary(BaseModel):
    service_type: ServiceType
    total_cases: int
    completed_cases: int
    average_duration_minutes: float
    min_duration_minutes: float
    max_duration_minutes: float
    pending_cases: int

# Operation Record Schemas
class OperationRecordCreate(BaseModel):
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

class OperationRecordRead(OperationRecordCreate):
    id: str
    patient_id: str
    created_at: datetime
    updated_at: datetime

# Patients
class PatientCreate(BaseModel):
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

class PatientRead(PatientCreate):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

# Handover Schemas
class Vitals(BaseModel):
    bp: str
    hr: int
    temp: str
    spo2: int

class Outgoing(BaseModel):
    status: str
    vitals: Vitals
    meds_given: List[str] = []
    meds_due: List[str] = []
    pending_investigations: List[str] = []
    signature: Optional[str] = None

class Incoming(BaseModel):
    verification: str
    meds_verification: str
    investigations_verification: str
    acknowledgement: str
    signature: Optional[str] = None

class Incharge(BaseModel):
    verification: str
    meds_investigations_confirmation: str
    audit_log: str
    signature: Optional[str] = None

class Summary(BaseModel):
    text: str

class HandoverCreate(BaseModel):
    shift_time: str
    outgoing: Optional[Outgoing] = None
    incoming: Optional[Incoming] = None
    incharge: Optional[Incharge] = None
    summary: Optional[Summary] = None

class HandoverRead(HandoverCreate):
    id: str
    patient_id: str
    locked_at: Optional[str] = None
    created_at: datetime

# Discharge Schemas
class DischargeCreate(BaseModel):
    treating_clinician: Optional[str] = None
    diagnosis: List[str] = []
    chief_complaints: List[str] = []
    past_history: Optional[str] = None
    physical_exam: Optional[str] = None
    investigations: List[str] = []
    procedures: List[str] = []
    course: Optional[str] = None
    operative_findings: Optional[str] = None
    treatment_given: Optional[str] = None
    treatment_on_discharge: Optional[str] = None
    follow_up: Optional[str] = None

class DischargeRead(DischargeCreate):
    id: str
    patient_id: str
    created_at: datetime

# Doctor Notes Schemas
class DoctorNoteCreate(BaseModel):
    chief_complaint: Optional[str] = None
    hpi: Optional[str] = None
    physical_exam: Optional[str] = None
    diagnosis: List[str] = []
    orders: List[str] = []
    prescriptions: List[str] = []
    advice: Optional[str] = None

class DoctorNoteRead(DoctorNoteCreate):
    id: str
    patient_id: str
    created_at: datetime

# Claims Schemas
class ClaimDoc(BaseModel):
    id: str
    kind: str
    status: str
    issues: List[str] = []

class ClaimValidateRequest(BaseModel):
    patient_id: str
    scheme: Optional[str] = None
    docs: List[ClaimDoc]

class ClaimValidateResponse(BaseModel):
    readiness_score: int
    risk: str
    eta: str

# ASR & Mapping Schemas
class MapRequest(BaseModel):
    text: str
    language: Literal["en", "hi", "auto"] = "auto"

class TranscribeResponse(BaseModel):
    text: str

# Timeline Schema
class TimelineResponse(BaseModel):
    patient: PatientRead
    handovers: List[HandoverRead]
    discharge: Optional[DischargeRead] = None

# Patient File Schemas
class MedicationOrder(BaseModel):
    date: str
    time: str
    drug_name: str
    strength: str
    route: str
    doctor_name_verbal_order: str
    doctor_signature: str
    verbal_order_taken_by: str
    time_of_administration: str
    administered_by: str
    administration_witnessed_by: str

class DietInfo(BaseModel):
    type: str  # Normal, Soft, Diabetic, Renal, Liquid, Others
    notes: Optional[str] = None

class PatientFileSection1Create(BaseModel):
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
    diet: Optional[DietInfo] = None
    medication_orders: List[MedicationOrder] = []

class PatientFileSection1Read(PatientFileSection1Create):
    id: str
    patient_id: str
    created_at: datetime
    updated_at: datetime

class PatientFileCreate(BaseModel):
    section: str
    data: Dict[str, Any]

class PatientFileRead(PatientFileCreate):
    id: str
    patient_id: str
    created_at: datetime
    updated_at: datetime

# Patient File Section 2 - Initial Assessment Form Schemas
class CrossConsultation(BaseModel):
    doctor_name: str
    department: str

class DischargeMedication(BaseModel):
    sl_no: int
    name: str
    dose: str
    frequency: str
    duration: str

class PatientFileSection2Create(BaseModel):
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
    sensorium: Optional[str] = None
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
    cross_consultations: List[CrossConsultation] = []
    
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
    discharge_medications: List[DischargeMedication] = []
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

class PatientFileSection2Read(PatientFileSection2Create):
    id: str
    patient_id: str
    created_at: datetime
    updated_at: datetime

# Patient File Section 3 - Progress Notes, Vitals & Pain Monitoring Schemas
class PatientFileSection3Create(BaseModel):
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

class PatientFileSection3Read(PatientFileSection3Create):
    id: str
    patient_id: str
    created_at: datetime
    updated_at: datetime

# Patient File Section 4 - Diagnostics Schemas
class PatientFileSection4Create(BaseModel):
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

class PatientFileSection4Read(PatientFileSection4Create):
    id: str
    patient_id: str
    created_at: datetime
    updated_at: datetime

# Patient File Section 5 - Patient Vitals Chart (Nursing Assessment) Schemas
class PatientFileSection5Create(BaseModel):
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

class PatientFileSection5Read(PatientFileSection5Create):
    id: str
    patient_id: str
    created_at: datetime
    updated_at: datetime

# Patient File Section 6 - Doctors Discharge Planning Schemas
class DischargeMedication(BaseModel):
    sl_no: Optional[int] = None
    name: Optional[str] = None
    dose: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None

class PatientFileSection6Create(BaseModel):
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

class PatientFileSection6Read(PatientFileSection6Create):
    id: str
    patient_id: str
    created_at: datetime
    updated_at: datetime

# Patient File Section 7 - Follow Up Instructions Schemas
class PatientFileSection7Create(BaseModel):
    # Follow Up Information
    follow_up_instructions: Optional[str] = None
    cross_consultation_diagnosis: Optional[str] = None
    discharge_advice: Optional[str] = None

class PatientFileSection7Read(PatientFileSection7Create):
    id: str
    patient_id: str
    created_at: datetime
    updated_at: datetime

# Patient File Section 8 - Nursing Care Plan / Nurse's Record Schemas
class MedicationAdministration(BaseModel):
    medication_name: Optional[str] = None
    dose: Optional[str] = None
    route: Optional[str] = None
    time_given: Optional[str] = None
    administered_by: Optional[str] = None
    signature: Optional[str] = None

class PatientFileSection8Create(BaseModel):
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

class PatientFileSection8Read(PatientFileSection8Create):
    id: str
    patient_id: str
    created_at: datetime
    updated_at: datetime

# Patient File Section 9 - Intake and Output Chart Schemas
class PatientFileSection9Create(BaseModel):
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

class PatientFileSection9Read(PatientFileSection9Create):
    id: str
    patient_id: str
    created_at: datetime
    updated_at: datetime

# Patient File Section 10 - Nutritional Screening Schemas
class PatientFileSection10Create(BaseModel):
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

class PatientFileSection10Read(PatientFileSection10Create):
    id: str
    patient_id: str
    created_at: datetime
    updated_at: datetime

# Patient File Section 11 - Nutrition Assessment Form (NAF) Schemas
class PatientFileSection11Create(BaseModel):
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

class PatientFileSection11Read(PatientFileSection11Create):
    id: str
    patient_id: str
    created_at: datetime
    updated_at: datetime

# Patient File Section 12 - Diet Chart Schemas
class PatientFileSection12Create(BaseModel):
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

class PatientFileSection12Read(PatientFileSection12Create):
    id: str
    patient_id: str
    created_at: datetime
    updated_at: datetime
