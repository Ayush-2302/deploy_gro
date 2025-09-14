import os
import json
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from dotenv import load_dotenv

from db import create_db_and_tables, get_session, Session, engine
from models import Patient, NurseHandover, DischargeSummary, Claim, DoctorNote, OperationRecord, TAT, ServiceType, TATStatus, PatientFile, PatientFileSection1, PatientFileSection2, PatientFileSection3, PatientFileSection4, PatientFileSection5, PatientFileSection6, PatientFileSection7, PatientFileSection8, PatientFileSection9, PatientFileSection10, PatientFileSection11, PatientFileSection12
from schemas import (
    PatientCreate, PatientRead, HandoverCreate, HandoverRead,
    DischargeCreate, DischargeRead, ClaimValidateRequest, ClaimValidateResponse,
    DoctorNoteCreate, DoctorNoteRead, MapRequest, TranscribeResponse, TimelineResponse,
    OperationRecordCreate, OperationRecordRead,
    TATCreate, TATUpdate, TATRead, TATSummary,
    PatientFileCreate, PatientFileRead, PatientFileSection1Create, PatientFileSection1Read, PatientFileSection2Create, PatientFileSection2Read, PatientFileSection3Create, PatientFileSection3Read, PatientFileSection4Create, PatientFileSection4Read, PatientFileSection5Create, PatientFileSection5Read, PatientFileSection6Create, PatientFileSection6Read, PatientFileSection7Create, PatientFileSection7Read, PatientFileSection8Create, PatientFileSection8Read, PatientFileSection9Create, PatientFileSection9Read, PatientFileSection10Create, PatientFileSection10Read, PatientFileSection11Create, PatientFileSection11Read, PatientFileSection12Create, PatientFileSection12Read
)
from services.asr_whisper import transcribe_bytes
from services.map_gpt import map_text, get_reference_example
# Removed ports utility - using Railway PORT environment variable

# Load environment variables
try:
    load_dotenv()
except Exception as e:
    print(f"Warning: Could not load .env file: {e}")
    print("Using environment variables or defaults")

# Allowed sections for mapping
ALLOWED_SECTIONS = {
    "admission",
    "doctor_note",
    "handover_outgoing", "handover_incoming", "handover_incharge", "handover_summary",
    "discharge",
    "patient_file_section1", "patient_file_section2", "patient_file_section3", "patient_file_section4",
    "patient_file_section5", "patient_file_section6", "patient_file_section7", "patient_file_section8",
    "patient_file_section9", "patient_file_section10", "patient_file_section11", "patient_file_section12"
}

# Startup event
from contextlib import asynccontextmanager

def create_dummy_patient_data(session: Session):
    """Create comprehensive dummy patient data for testing"""
    # Check if dummy patient already exists
    existing_patient = session.exec(select(Patient).where(Patient.name == "Rajesh Kumar Sharma")).first()
    if existing_patient:
        return existing_patient.id
    
    # Create dummy patient
    dummy_patient = Patient(
        name="Rajesh Kumar Sharma",
        age=45,
        gender="Male",
        mobile_no="7976636359",
        admitted_under_doctor="Dr. Ravikant Porwal",
        attender_name="Pradeep Shihani",
        relation="Son",
        attender_mobile_no="7976636359",
        aadhaar_number="1234 5678 9012",
        admission_date="2025-01-09",
        admission_time="14:30",
        ward="Cardiology",
        bed_number="A-101",
        reason="Acute myocardial infarction"
    )
    session.add(dummy_patient)
    session.commit()
    session.refresh(dummy_patient)
    
    # Create comprehensive patient file data
    patient_id = dummy_patient.id
    
    # Section 1 - Basic Patient Information
    section1 = PatientFileSection1(
        patient_id=patient_id,
        patient_name="Rajesh Kumar Sharma",
        age=45,
        sex="Male",
        date_of_admission="2025-01-09",
        ward="Cardiology",
        bed_number="A-101",
        drug_hypersensitivity_allergy="Penicillin allergy",
        consultant="Dr. Ravikant Porwal",
        diagnosis="Acute myocardial infarction",
        diet={"type": "Cardiac", "notes": "Low sodium, low fat diet"},
        medication_orders=[
            {
                "date": "2025-01-09",
                "time": "10:00",
                "drug_name": "Aspirin",
                "strength": "75mg",
                "route": "Oral",
                "doctor_name_verbal_order": "Dr. Ravikant Porwal",
                "doctor_signature": "Dr. Ravikant Porwal",
                "verbal_order_taken_by": "Nurse Wilson",
                "time_of_administration": "10:15",
                "administered_by": "Nurse Wilson",
                "administration_witnessed_by": "Nurse Johnson"
            }
        ]
    )
    session.add(section1)
    
    # Add more sections with basic data (simplified to avoid field mismatches)
    # Section 2 - Initial Assessment (basic fields only)
    section2 = PatientFileSection2(
        patient_id=patient_id,
        hospital_number="H123456",
        name="Rajesh Kumar Sharma",
        age=45,
        sex="Male",
        ip_number="IP001234",
        consultant="Dr. Ravikant Porwal",
        chief_complaints="Chest pain for 2 days",
        history_present_illness="Patient reports severe chest pain started 2 days ago",
        past_history="Hypertension for 5 years",
        family_history="Father had heart attack at age 60",
        personal_history="Non-smoker, occasional alcohol",
        immunization_history="Up to date",
        relevant_previous_investigations="ECG shows ST elevation",
        sensorium="Conscious",
        pallor=False,
        cyanosis=False,
        clubbing=False,
        icterus=False,
        lymphadenopathy=False,
        general_examination_others="No other significant findings",
        systemic_examination="Cardiovascular: S3 gallop, no murmurs",
        provisional_diagnosis="Acute ST-elevation myocardial infarction",
        care_plan_curative="Primary PCI, dual antiplatelet therapy",
        care_plan_investigations_lab="Troponin I, CK-MB, CBC, LFT, RFT",
        care_plan_investigations_radiology="Echocardiogram, Chest X-ray",
        care_plan_investigations_others="Coronary angiography",
        care_plan_preventive="Cardiac rehabilitation, lifestyle modification",
        care_plan_palliative="Pain management",
        care_plan_rehabilitative="Cardiac rehabilitation program",
        miscellaneous_investigations="None",
        diet="Cardiac",
        diet_specify="Low sodium, low fat, high fiber",
        dietary_consultation=True,
        dietary_consultation_cross_referral="Nutritionist",
        dietary_screening_his=True,
        physiotherapy=True,
        special_care="Cardiac monitoring",
        restraint_required=False,
        restraint_form_confirmation=False,
        surgery_procedures="Primary PCI planned",
        cross_consultations=[],
        nursing_vitals_bp="140/90",
        nursing_vitals_pulse="88",
        nursing_vitals_temp="98.6",
        nursing_vitals_rr="18",
        nursing_vitals_spo2="98%",
        nursing_vitals_pain_score="6/10",
        nursing_vitals_consciousness="Alert and oriented",
        nursing_vitals_skin_color="Normal",
        nursing_vitals_skin_condition="Intact",
        nursing_vitals_mobility="Bed rest",
        nursing_vitals_elimination="Normal",
        nursing_vitals_sleep_pattern="Disturbed due to pain",
        nursing_vitals_appetite="Poor",
        nursing_vitals_fluid_intake="Adequate",
        nursing_vitals_fluid_output="Normal",
        nursing_vitals_medication_compliance="Good",
        nursing_vitals_side_effects="None",
        nursing_vitals_psychosocial_status="Anxious",
        nursing_vitals_support_system="Family present",
        nursing_vitals_education_needs="Disease process, medication",
        nursing_vitals_discharge_planning="Cardiac rehabilitation",
        discharge_likely_date="2025-01-12",
        discharge_likely_time="10:00",
        discharge_planning_medications="Aspirin 75mg, Clopidogrel 75mg, Atorvastatin 40mg",
        discharge_planning_instructions="Follow up in 1 week, cardiac rehabilitation",
        discharge_planning_diet="Cardiac diet",
        discharge_planning_activity="Gradual increase in activity",
        discharge_planning_warning_signs="Chest pain, shortness of breath",
        discharge_planning_emergency_contact="Cardiology OPD: 9876543210"
    )
    session.add(section2)
    
    # Add more sections...
    # (I'll add a few more key sections for brevity)
    
    session.commit()
    return patient_id

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    create_db_and_tables()
    # Ensure uploads directory exists
    os.makedirs("data/uploads", exist_ok=True)
    
    # Create dummy patient data
    session = Session(engine)
    try:
        create_dummy_patient_data(session)
    finally:
        session.close()
    
    yield
    # Shutdown
    pass

# Create FastAPI app
app = FastAPI(
    title="GrowIt Medical API",
    description="Backend API for GrowIt Medical Healthcare Management System",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("ALLOWED_ORIGIN", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ASR Routes
@app.post("/api/transcribe", response_model=TranscribeResponse)
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = Form("auto")
):
    """Transcribe audio file using Whisper with auto language detection (English/Hindi only)"""
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Validate language parameter (only English/Hindi supported)
        if language not in ["auto", "en", "hi"]:
            raise HTTPException(status_code=400, detail="Only English (en) and Hindi (hi) languages are supported")
        
        # Check file size (limit to 25MB)
        audio_bytes = await file.read()
        if len(audio_bytes) > 25 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 25MB")
        
        if len(audio_bytes) < 100:
            raise HTTPException(status_code=400, detail="File too small or corrupted")
        
        # Transcribe
        text = transcribe_bytes(audio_bytes, language)
        return TranscribeResponse(text=text)
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        print(f"Transcription API error: {error_msg}")
        print(f"Audio file size: {len(audio_bytes) if 'audio_bytes' in locals() else 'unknown'}")
        print(f"Language: {language}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {error_msg}")

# Mapping Routes
@app.post("/api/map/{section}")
async def map_text_to_section(section: str, request: MapRequest):
    """Map transcribed text to structured JSON"""
    try:
        if section not in ALLOWED_SECTIONS:
            raise HTTPException(status_code=400, detail=f"Section '{section}' not allowed. Allowed sections: {list(ALLOWED_SECTIONS)}")
        result = map_text(section, request.text, request.language)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mapping failed: {str(e)}")

@app.post("/api/map/patient-admission")
async def map_patient_admission(request: MapRequest):
    """Map transcribed text to patient admission fields"""
    try:
        result = map_text("patient_admission", request.text, request.language)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Patient mapping failed: {str(e)}")

@app.post("/api/map/admission")
async def map_admission(request: MapRequest):
    """Map transcribed text to admission fields with proper schema"""
    try:
        result = map_text("admission", request.text, request.language)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Admission mapping failed: {str(e)}")

@app.get("/api/reference/{section}")
async def get_reference(section: str):
    """Get reference example for a section type"""
    try:
        result = get_reference_example(section)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reference not found: {str(e)}")

# Patient Routes
@app.post("/api/patients", response_model=PatientRead)
async def create_patient(patient: PatientCreate, session: Session = Depends(get_session)):
    """Create a new patient"""
    db_patient = Patient(**patient.dict())
    session.add(db_patient)
    session.commit()
    session.refresh(db_patient)
    return db_patient

@app.get("/api/patients", response_model=List[PatientRead])
async def get_patients(session: Session = Depends(get_session)):
    """Get all patients"""
    statement = select(Patient)
    patients = session.exec(statement).all()
    return patients

@app.get("/api/patients/{patient_id}", response_model=PatientRead)
async def get_patient(patient_id: str, session: Session = Depends(get_session)):
    """Get a specific patient"""
    statement = select(Patient).where(Patient.id == patient_id)
    patient = session.exec(statement).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@app.put("/api/patients/{patient_id}", response_model=PatientRead)
async def update_patient(patient_id: str, patient_data: PatientCreate, session: Session = Depends(get_session)):
    """Update a patient's information"""
    patient = session.exec(select(Patient).where(Patient.id == patient_id)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Update patient fields
    for key, value in patient_data.dict().items():
        setattr(patient, key, value)
    
    patient.updated_at = datetime.now()
    session.add(patient)
    session.commit()
    session.refresh(patient)
    return patient

# Handover Routes
@app.post("/api/patients/{patient_id}/handovers", response_model=HandoverRead)
async def create_handover(
    patient_id: str,
    handover: HandoverCreate,
    session: Session = Depends(get_session)
):
    """Create or update a handover for a patient"""
    # Check if patient exists
    patient = session.exec(select(Patient).where(Patient.id == patient_id)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check if handover exists for this shift_time
    statement = select(NurseHandover).where(
        NurseHandover.patient_id == patient_id,
        NurseHandover.shift_time == handover.shift_time
    )
    existing_handover = session.exec(statement).first()
    
    if existing_handover:
        # Update existing handover
        for key, value in handover.dict(exclude_unset=True).items():
            setattr(existing_handover, key, value)
        session.add(existing_handover)
        session.commit()
        session.refresh(existing_handover)
        return existing_handover
    else:
        # Create new handover
        db_handover = NurseHandover(
            patient_id=patient_id,
            **handover.dict()
        )
        session.add(db_handover)
        session.commit()
        session.refresh(db_handover)
        return db_handover

@app.get("/api/patients/{patient_id}/handovers", response_model=List[HandoverRead])
async def get_handovers(patient_id: str, session: Session = Depends(get_session)):
    """Get all handovers for a patient"""
    statement = select(NurseHandover).where(NurseHandover.patient_id == patient_id)
    handovers = session.exec(statement).all()
    return handovers

@app.post("/api/handovers/{handover_id}/lock", response_model=HandoverRead)
async def lock_handover(handover_id: str, session: Session = Depends(get_session)):
    """Lock a handover (set locked_at timestamp)"""
    handover = session.get(NurseHandover, handover_id)
    if not handover:
        raise HTTPException(status_code=404, detail="Handover not found")
    
    handover.locked_at = datetime.utcnow().isoformat()
    session.add(handover)
    session.commit()
    session.refresh(handover)
    return handover

# Discharge Routes
@app.post("/api/patients/{patient_id}/discharge", response_model=DischargeRead)
async def create_discharge(
    patient_id: str,
    discharge: DischargeCreate,
    session: Session = Depends(get_session)
):
    """Create or update discharge summary for a patient"""
    # Check if patient exists
    patient = session.exec(select(Patient).where(Patient.id == patient_id)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check if discharge exists
    statement = select(DischargeSummary).where(DischargeSummary.patient_id == patient_id)
    existing_discharge = session.exec(statement).first()
    
    if existing_discharge:
        # Update existing discharge
        for key, value in discharge.dict(exclude_unset=True).items():
            setattr(existing_discharge, key, value)
        session.add(existing_discharge)
        session.commit()
        session.refresh(existing_discharge)
        return existing_discharge
    else:
        # Create new discharge
        db_discharge = DischargeSummary(
            patient_id=patient_id,
            **discharge.dict()
        )
        session.add(db_discharge)
        session.commit()
        session.refresh(db_discharge)
        return db_discharge

@app.get("/api/patients/{patient_id}/discharge", response_model=DischargeRead)
async def get_discharge(patient_id: str, session: Session = Depends(get_session)):
    """Get discharge summary for a patient"""
    statement = select(DischargeSummary).where(DischargeSummary.patient_id == patient_id)
    discharge = session.exec(statement).first()
    if not discharge:
        raise HTTPException(status_code=404, detail="Discharge summary not found")
    return discharge

# Doctor Notes Routes
@app.post("/api/patients/{patient_id}/notes", response_model=DoctorNoteRead)
async def create_note(patient_id: str, body: DoctorNoteCreate, session: Session = Depends(get_session)):
    """Create a new doctor note for a patient"""
    # ensure patient exists
    patient = session.exec(select(Patient).where(Patient.id == patient_id)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    note = DoctorNote(patient_id=patient_id, **body.model_dump())
    session.add(note)
    session.commit()
    session.refresh(note)
    return note

@app.get("/api/patients/{patient_id}/notes", response_model=List[DoctorNoteRead])
async def list_notes(patient_id: str, session: Session = Depends(get_session)):
    """Get all doctor notes for a patient"""
    return session.exec(select(DoctorNote).where(DoctorNote.patient_id == patient_id).order_by(DoctorNote.created_at.desc())).all()

# Operation Record Routes
@app.post("/api/patients/{patient_id}/operation-records", response_model=OperationRecordRead)
async def create_operation_record(patient_id: str, operation_record: OperationRecordCreate, session: Session = Depends(get_session)):
    """Create a new operation record for a patient"""
    patient = session.exec(select(Patient).where(Patient.id == patient_id)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    db_operation_record = OperationRecord(
        patient_id=patient_id,
        **operation_record.dict()
    )
    session.add(db_operation_record)
    session.commit()
    session.refresh(db_operation_record)
    return db_operation_record

@app.get("/api/patients/{patient_id}/operation-records", response_model=List[OperationRecordRead])
async def list_operation_records(patient_id: str, session: Session = Depends(get_session)):
    """Get all operation records for a patient"""
    return session.exec(select(OperationRecord).where(OperationRecord.patient_id == patient_id).order_by(OperationRecord.created_at.desc())).all()

@app.get("/api/patients/{patient_id}/operation-records/{record_id}", response_model=OperationRecordRead)
async def get_operation_record(patient_id: str, record_id: str, session: Session = Depends(get_session)):
    """Get a specific operation record"""
    operation_record = session.exec(select(OperationRecord).where(OperationRecord.id == record_id, OperationRecord.patient_id == patient_id)).first()
    if not operation_record:
        raise HTTPException(status_code=404, detail="Operation record not found")
    return operation_record

# Claims Routes
@app.post("/api/claims/validate", response_model=ClaimValidateResponse)
async def validate_claim(request: ClaimValidateRequest):
    """Validate claim and calculate readiness score"""
    missing = sum(1 for doc in request.docs if doc.status == "missing")
    invalid = sum(1 for doc in request.docs if doc.status == "invalid")
    
    readiness_score = max(0, 100 - 15 * missing - 10 * invalid)
    
    if readiness_score > 80:
        risk = "low"
    elif readiness_score > 60:
        risk = "medium"
    else:
        risk = "high"
    
    eta = f"{max(1, 5 - readiness_score // 20)}d"
    
    return ClaimValidateResponse(
        readiness_score=readiness_score,
        risk=risk,
        eta=eta
    )

# Claims CRUD Routes
@app.post("/api/patients/{patient_id}/claims")
async def upsert_claim(patient_id: str, body: ClaimValidateRequest, session: Session = Depends(get_session)):
    """Create or update a claim for a patient"""
    patient = session.exec(select(Patient).where(Patient.id == patient_id)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Calculate readiness score
    missing = sum(1 for doc in body.docs if doc.status == "missing")
    invalid = sum(1 for doc in body.docs if doc.status == "invalid")
    readiness_score = max(0, 100 - 15 * missing - 10 * invalid)
    
    if readiness_score > 80:
        risk = "low"
    elif readiness_score > 60:
        risk = "medium"
    else:
        risk = "high"
    
    claim = Claim(
        patient_id=patient_id, 
        scheme=body.scheme, 
        docs=[c.model_dump() for c in body.docs],
        readiness_score=readiness_score,
        risk=risk
    )
    session.add(claim)
    session.commit()
    session.refresh(claim)
    return claim

@app.get("/api/patients/{patient_id}/claims")
async def list_claims(patient_id: str, session: Session = Depends(get_session)):
    """Get all claims for a patient"""
    return session.exec(select(Claim).where(Claim.patient_id == patient_id).order_by(Claim.created_at.desc())).all()

# Timeline Route
@app.get("/api/timeline/{patient_id}", response_model=TimelineResponse)
async def get_timeline(patient_id: str, session: Session = Depends(get_session)):
    """Get complete timeline for a patient"""
    # Get patient
    patient = session.exec(select(Patient).where(Patient.id == patient_id)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Get handovers
    handover_statement = select(NurseHandover).where(NurseHandover.patient_id == patient_id)
    handovers = session.exec(handover_statement).all()
    
    # Get discharge
    discharge_statement = select(DischargeSummary).where(DischargeSummary.patient_id == patient_id)
    discharge = session.exec(discharge_statement).first()
    
    return TimelineResponse(
        patient=patient,
        handovers=handovers,
        discharge=discharge
    )

# TAT Tracking Endpoints
@app.post("/api/tat", response_model=TATRead)
async def create_tat(tat_data: TATCreate, session: Session = Depends(get_session)):
    """Start tracking TAT for a service"""
    tat = TAT(**tat_data.dict())
    session.add(tat)
    session.commit()
    session.refresh(tat)
    return tat

@app.put("/api/tat/{tat_id}", response_model=TATRead)
async def update_tat(tat_id: str, tat_update: TATUpdate, session: Session = Depends(get_session)):
    """Update TAT status and calculate duration"""
    tat = session.get(TAT, tat_id)
    if not tat:
        raise HTTPException(status_code=404, detail="TAT record not found")
    
    # Update fields
    for field, value in tat_update.dict(exclude_unset=True).items():
        setattr(tat, field, value)
    
    # Calculate duration if end_time is set
    if tat.end_time and tat.start_time:
        duration = (tat.end_time - tat.start_time).total_seconds() / 60
        tat.duration_minutes = round(duration, 2)
    
    tat.updated_at = datetime.utcnow()
    session.commit()
    session.refresh(tat)
    return tat

@app.get("/api/tat/patient/{patient_id}", response_model=List[TATRead])
async def get_patient_tat(patient_id: str, session: Session = Depends(get_session)):
    """Get all TAT records for a patient"""
    statement = select(TAT).where(TAT.patient_id == patient_id).order_by(TAT.created_at.desc())
    tats = session.exec(statement).all()
    return tats

@app.get("/api/tat/summary", response_model=List[TATSummary])
async def get_tat_summary(session: Session = Depends(get_session)):
    """Get TAT summary statistics for all services"""
    summaries = []
    
    for service_type in ServiceType:
        # Get all TAT records for this service
        statement = select(TAT).where(TAT.service_type == service_type)
        tats = session.exec(statement).all()
        
        if not tats:
            summaries.append(TATSummary(
                service_type=service_type,
                total_cases=0,
                completed_cases=0,
                average_duration_minutes=0.0,
                min_duration_minutes=0.0,
                max_duration_minutes=0.0,
                pending_cases=0
            ))
            continue
        
        completed_tats = [t for t in tats if t.status == TATStatus.COMPLETED and t.duration_minutes]
        pending_tats = [t for t in tats if t.status in [TATStatus.PENDING, TATStatus.IN_PROGRESS]]
        
        if completed_tats:
            durations = [t.duration_minutes for t in completed_tats]
            avg_duration = sum(durations) / len(durations)
            min_duration = min(durations)
            max_duration = max(durations)
        else:
            avg_duration = min_duration = max_duration = 0.0
        
        summaries.append(TATSummary(
            service_type=service_type,
            total_cases=len(tats),
            completed_cases=len(completed_tats),
            average_duration_minutes=round(avg_duration, 2),
            min_duration_minutes=round(min_duration, 2),
            max_duration_minutes=round(max_duration, 2),
            pending_cases=len(pending_tats)
        ))
    
    return summaries

@app.get("/api/tat/service/{service_type}", response_model=List[TATRead])
async def get_service_tat(service_type: ServiceType, session: Session = Depends(get_session)):
    """Get all TAT records for a specific service type"""
    statement = select(TAT).where(TAT.service_type == service_type).order_by(TAT.created_at.desc())
    tats = session.exec(statement).all()
    return tats

# Health check
# Patient File Endpoints
@app.post("/api/patients/{patient_id}/patient-file/section1", response_model=PatientFileSection1Read)
async def create_patient_file_section1(patient_id: str, data: PatientFileSection1Create, session: Session = Depends(get_session)):
    """Create or update Patient File Section 1 - Basic Patient Information"""
    # Check if patient exists
    patient = session.exec(select(Patient).where(Patient.id == patient_id)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check if section 1 already exists
    existing = session.exec(select(PatientFileSection1).where(PatientFileSection1.patient_id == patient_id)).first()
    
    if existing:
        # Update existing
        for key, value in data.dict().items():
            setattr(existing, key, value)
        existing.updated_at = datetime.now()
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing
    else:
        # Create new
        section1 = PatientFileSection1(
            patient_id=patient_id,
            **data.dict()
        )
        session.add(section1)
        session.commit()
        session.refresh(section1)
        return section1

@app.get("/api/patients/{patient_id}/patient-file/section1", response_model=PatientFileSection1Read)
async def get_patient_file_section1(patient_id: str, session: Session = Depends(get_session)):
    """Get Patient File Section 1 for a patient"""
    section1 = session.exec(select(PatientFileSection1).where(PatientFileSection1.patient_id == patient_id)).first()
    if not section1:
        raise HTTPException(status_code=404, detail="Patient File Section 1 not found")
    return section1

@app.post("/api/patients/{patient_id}/patient-file", response_model=PatientFileRead)
async def create_patient_file(patient_id: str, data: PatientFileCreate, session: Session = Depends(get_session)):
    """Create or update a Patient File section"""
    # Check if patient exists
    patient = session.exec(select(Patient).where(Patient.id == patient_id)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check if section already exists
    existing = session.exec(select(PatientFile).where(
        PatientFile.patient_id == patient_id,
        PatientFile.section == data.section
    )).first()
    
    if existing:
        # Update existing
        existing.data = data.data
        existing.updated_at = datetime.now()
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing
    else:
        # Create new
        patient_file = PatientFile(
            patient_id=patient_id,
            **data.dict()
        )
        session.add(patient_file)
        session.commit()
        session.refresh(patient_file)
        return patient_file

@app.get("/api/patients/{patient_id}/patient-file", response_model=List[PatientFileRead])
async def get_patient_files(patient_id: str, session: Session = Depends(get_session)):
    """Get all Patient File sections for a patient"""
    patient_files = session.exec(select(PatientFile).where(PatientFile.patient_id == patient_id)).all()
    return patient_files

@app.get("/api/patients/{patient_id}/patient-file/{section}", response_model=PatientFileRead)
async def get_patient_file_section(patient_id: str, section: str, session: Session = Depends(get_session)):
    """Get a specific Patient File section for a patient"""
    patient_file = session.exec(select(PatientFile).where(
        PatientFile.patient_id == patient_id,
        PatientFile.section == section
    )).first()
    if not patient_file:
        raise HTTPException(status_code=404, detail="Patient File section not found")
    return patient_file

# Patient File Section 2 - Initial Assessment Form
@app.post("/api/patients/{patient_id}/patient-file/section2", response_model=PatientFileSection2Read)
async def create_patient_file_section2(patient_id: str, data: PatientFileSection2Create, session: Session = Depends(get_session)):
    """Create or update Patient File Section 2 - Initial Assessment Form"""
    # Check if patient exists
    patient = session.exec(select(Patient).where(Patient.id == patient_id)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check if section 2 already exists
    existing = session.exec(select(PatientFileSection2).where(PatientFileSection2.patient_id == patient_id)).first()
    
    if existing:
        # Update existing
        for key, value in data.dict().items():
            setattr(existing, key, value)
        existing.updated_at = datetime.now()
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing
    else:
        # Create new
        section2 = PatientFileSection2(
            patient_id=patient_id,
            **data.dict()
        )
        session.add(section2)
        session.commit()
        session.refresh(section2)
        return section2

@app.get("/api/patients/{patient_id}/patient-file/section2", response_model=PatientFileSection2Read)
async def get_patient_file_section2(patient_id: str, session: Session = Depends(get_session)):
    """Get Patient File Section 2 for a patient"""
    section2 = session.exec(select(PatientFileSection2).where(PatientFileSection2.patient_id == patient_id)).first()
    if not section2:
        raise HTTPException(status_code=404, detail="Patient File Section 2 not found")
    return section2

# Patient File Section 3 - Progress Notes, Vitals & Pain Monitoring
@app.post("/api/patients/{patient_id}/patient-file/section3", response_model=PatientFileSection3Read)
async def create_patient_file_section3(patient_id: str, data: PatientFileSection3Create, session: Session = Depends(get_session)):
    """Create or update Patient File Section 3 - Progress Notes, Vitals & Pain Monitoring"""
    # Check if patient exists
    patient = session.exec(select(Patient).where(Patient.id == patient_id)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check if section 3 already exists
    existing = session.exec(select(PatientFileSection3).where(PatientFileSection3.patient_id == patient_id)).first()
    
    if existing:
        # Update existing
        for key, value in data.dict().items():
            setattr(existing, key, value)
        existing.updated_at = datetime.now()
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing
    else:
        # Create new
        section3 = PatientFileSection3(
            patient_id=patient_id,
            **data.dict()
        )
        session.add(section3)
        session.commit()
        session.refresh(section3)
        return section3

@app.get("/api/patients/{patient_id}/patient-file/section3", response_model=PatientFileSection3Read)
async def get_patient_file_section3(patient_id: str, session: Session = Depends(get_session)):
    """Get Patient File Section 3 for a patient"""
    section3 = session.exec(select(PatientFileSection3).where(PatientFileSection3.patient_id == patient_id)).first()
    if not section3:
        raise HTTPException(status_code=404, detail="Patient File Section 3 not found")
    return section3

# Patient File Section 4 - Diagnostics
@app.post("/api/patients/{patient_id}/patient-file/section4", response_model=PatientFileSection4Read)
async def create_patient_file_section4(patient_id: str, data: PatientFileSection4Create, session: Session = Depends(get_session)):
    """Create or update Patient File Section 4 - Diagnostics"""
    # Check if patient exists
    patient = session.exec(select(Patient).where(Patient.id == patient_id)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check if section 4 already exists
    existing = session.exec(select(PatientFileSection4).where(PatientFileSection4.patient_id == patient_id)).first()
    
    if existing:
        # Update existing
        for key, value in data.dict().items():
            setattr(existing, key, value)
        existing.updated_at = datetime.now()
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing
    else:
        # Create new
        section4 = PatientFileSection4(
            patient_id=patient_id,
            **data.dict()
        )
        session.add(section4)
        session.commit()
        session.refresh(section4)
        return section4

@app.get("/api/patients/{patient_id}/patient-file/section4", response_model=PatientFileSection4Read)
async def get_patient_file_section4(patient_id: str, session: Session = Depends(get_session)):
    """Get Patient File Section 4 for a patient"""
    section4 = session.exec(select(PatientFileSection4).where(PatientFileSection4.patient_id == patient_id)).first()
    if not section4:
        raise HTTPException(status_code=404, detail="Patient File Section 4 not found")
    return section4

# Patient File Section 5 - Patient Vitals Chart (Nursing Assessment)
@app.post("/api/patients/{patient_id}/patient-file/section5", response_model=PatientFileSection5Read)
async def create_patient_file_section5(patient_id: str, data: PatientFileSection5Create, session: Session = Depends(get_session)):
    """Create or update Patient File Section 5 - Patient Vitals Chart (Nursing Assessment)"""
    # Check if patient exists
    patient = session.exec(select(Patient).where(Patient.id == patient_id)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check if section 5 already exists
    existing = session.exec(select(PatientFileSection5).where(PatientFileSection5.patient_id == patient_id)).first()
    
    if existing:
        # Update existing
        for key, value in data.dict().items():
            setattr(existing, key, value)
        existing.updated_at = datetime.now()
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing
    else:
        # Create new
        section5 = PatientFileSection5(
            patient_id=patient_id,
            **data.dict()
        )
        session.add(section5)
        session.commit()
        session.refresh(section5)
        return section5

@app.get("/api/patients/{patient_id}/patient-file/section5", response_model=PatientFileSection5Read)
async def get_patient_file_section5(patient_id: str, session: Session = Depends(get_session)):
    """Get Patient File Section 5 for a patient"""
    section5 = session.exec(select(PatientFileSection5).where(PatientFileSection5.patient_id == patient_id)).first()
    if not section5:
        raise HTTPException(status_code=404, detail="Patient File Section 5 not found")
    return section5

# Patient File Section 6 - Doctors Discharge Planning
@app.post("/api/patients/{patient_id}/patient-file/section6", response_model=PatientFileSection6Read)
async def create_patient_file_section6(patient_id: str, data: PatientFileSection6Create, session: Session = Depends(get_session)):
    """Create or update Patient File Section 6 - Doctors Discharge Planning"""
    # Check if patient exists
    patient = session.exec(select(Patient).where(Patient.id == patient_id)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check if section 6 already exists
    existing = session.exec(select(PatientFileSection6).where(PatientFileSection6.patient_id == patient_id)).first()
    
    if existing:
        # Update existing
        for key, value in data.dict().items():
            setattr(existing, key, value)
        existing.updated_at = datetime.now()
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing
    else:
        # Create new
        section6 = PatientFileSection6(
            patient_id=patient_id,
            **data.dict()
        )
        session.add(section6)
        session.commit()
        session.refresh(section6)
        return section6

@app.get("/api/patients/{patient_id}/patient-file/section6", response_model=PatientFileSection6Read)
async def get_patient_file_section6(patient_id: str, session: Session = Depends(get_session)):
    """Get Patient File Section 6 for a patient"""
    section6 = session.exec(select(PatientFileSection6).where(PatientFileSection6.patient_id == patient_id)).first()
    if not section6:
        raise HTTPException(status_code=404, detail="Patient File Section 6 not found")
    return section6

# Patient File Section 7 - Follow Up Instructions
@app.post("/api/patients/{patient_id}/patient-file/section7", response_model=PatientFileSection7Read)
async def create_patient_file_section7(patient_id: str, data: PatientFileSection7Create, session: Session = Depends(get_session)):
    """Create or update Patient File Section 7 - Follow Up Instructions"""
    # Check if patient exists
    patient = session.exec(select(Patient).where(Patient.id == patient_id)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check if section 7 already exists
    existing = session.exec(select(PatientFileSection7).where(PatientFileSection7.patient_id == patient_id)).first()
    
    if existing:
        # Update existing
        for key, value in data.dict().items():
            setattr(existing, key, value)
        existing.updated_at = datetime.now()
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing
    else:
        # Create new
        section7 = PatientFileSection7(
            patient_id=patient_id,
            **data.dict()
        )
        session.add(section7)
        session.commit()
        session.refresh(section7)
        return section7

@app.get("/api/patients/{patient_id}/patient-file/section7", response_model=PatientFileSection7Read)
async def get_patient_file_section7(patient_id: str, session: Session = Depends(get_session)):
    """Get Patient File Section 7 for a patient"""
    section7 = session.exec(select(PatientFileSection7).where(PatientFileSection7.patient_id == patient_id)).first()
    if not section7:
        raise HTTPException(status_code=404, detail="Patient File Section 7 not found")
    return section7

# Patient File Section 8 - Nursing Care Plan / Nurse's Record
@app.post("/api/patients/{patient_id}/patient-file/section8", response_model=PatientFileSection8Read)
async def create_patient_file_section8(patient_id: str, data: PatientFileSection8Create, session: Session = Depends(get_session)):
    """Create or update Patient File Section 8 - Nursing Care Plan / Nurse's Record"""
    # Check if patient exists
    patient = session.exec(select(Patient).where(Patient.id == patient_id)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check if section 8 already exists
    existing = session.exec(select(PatientFileSection8).where(PatientFileSection8.patient_id == patient_id)).first()
    
    if existing:
        # Update existing
        for key, value in data.dict().items():
            setattr(existing, key, value)
        existing.updated_at = datetime.now()
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing
    else:
        # Create new
        section8 = PatientFileSection8(
            patient_id=patient_id,
            **data.dict()
        )
        session.add(section8)
        session.commit()
        session.refresh(section8)
        return section8

@app.get("/api/patients/{patient_id}/patient-file/section8", response_model=PatientFileSection8Read)
async def get_patient_file_section8(patient_id: str, session: Session = Depends(get_session)):
    """Get Patient File Section 8 for a patient"""
    section8 = session.exec(select(PatientFileSection8).where(PatientFileSection8.patient_id == patient_id)).first()
    if not section8:
        raise HTTPException(status_code=404, detail="Patient File Section 8 not found")
    return section8

# Patient File Section 9 - Intake and Output Chart
@app.post("/api/patients/{patient_id}/patient-file/section9", response_model=PatientFileSection9Read)
async def create_patient_file_section9(patient_id: str, data: PatientFileSection9Create, session: Session = Depends(get_session)):
    """Create or update Patient File Section 9 - Intake and Output Chart"""
    # Check if patient exists
    patient = session.exec(select(Patient).where(Patient.id == patient_id)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check if section 9 already exists
    existing = session.exec(select(PatientFileSection9).where(PatientFileSection9.patient_id == patient_id)).first()
    
    if existing:
        # Update existing
        for key, value in data.dict().items():
            setattr(existing, key, value)
        existing.updated_at = datetime.now()
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing
    else:
        # Create new
        section9 = PatientFileSection9(
            patient_id=patient_id,
            **data.dict()
        )
        session.add(section9)
        session.commit()
        session.refresh(section9)
        return section9

@app.get("/api/patients/{patient_id}/patient-file/section9", response_model=PatientFileSection9Read)
async def get_patient_file_section9(patient_id: str, session: Session = Depends(get_session)):
    """Get Patient File Section 9 for a patient"""
    section9 = session.exec(select(PatientFileSection9).where(PatientFileSection9.patient_id == patient_id)).first()
    if not section9:
        raise HTTPException(status_code=404, detail="Patient File Section 9 not found")
    return section9

# Patient File Section 10 - Nutritional Screening
@app.post("/api/patients/{patient_id}/patient-file/section10", response_model=PatientFileSection10Read)
async def create_patient_file_section10(patient_id: str, data: PatientFileSection10Create, session: Session = Depends(get_session)):
    """Create or update Patient File Section 10 - Nutritional Screening"""
    # Check if patient exists
    patient = session.exec(select(Patient).where(Patient.id == patient_id)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check if section 10 already exists
    existing = session.exec(select(PatientFileSection10).where(PatientFileSection10.patient_id == patient_id)).first()
    
    if existing:
        # Update existing
        for key, value in data.dict().items():
            setattr(existing, key, value)
        existing.updated_at = datetime.now()
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing
    else:
        # Create new
        section10 = PatientFileSection10(
            patient_id=patient_id,
            **data.dict()
        )
        session.add(section10)
        session.commit()
        session.refresh(section10)
        return section10

@app.get("/api/patients/{patient_id}/patient-file/section10", response_model=PatientFileSection10Read)
async def get_patient_file_section10(patient_id: str, session: Session = Depends(get_session)):
    """Get Patient File Section 10 for a patient"""
    section10 = session.exec(select(PatientFileSection10).where(PatientFileSection10.patient_id == patient_id)).first()
    if not section10:
        raise HTTPException(status_code=404, detail="Patient File Section 10 not found")
    return section10

# Patient File Section 11 - Nutrition Assessment Form (NAF)
@app.post("/api/patients/{patient_id}/patient-file/section11", response_model=PatientFileSection11Read)
async def create_patient_file_section11(patient_id: str, data: PatientFileSection11Create, session: Session = Depends(get_session)):
    """Create or update Patient File Section 11 - Nutrition Assessment Form (NAF)"""
    # Check if patient exists
    patient = session.exec(select(Patient).where(Patient.id == patient_id)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check if section 11 already exists
    existing = session.exec(select(PatientFileSection11).where(PatientFileSection11.patient_id == patient_id)).first()
    
    if existing:
        # Update existing
        for key, value in data.dict().items():
            setattr(existing, key, value)
        existing.updated_at = datetime.now()
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing
    else:
        # Create new
        section11 = PatientFileSection11(
            patient_id=patient_id,
            **data.dict()
        )
        session.add(section11)
        session.commit()
        session.refresh(section11)
        return section11

@app.get("/api/patients/{patient_id}/patient-file/section11", response_model=PatientFileSection11Read)
async def get_patient_file_section11(patient_id: str, session: Session = Depends(get_session)):
    """Get Patient File Section 11 for a patient"""
    section11 = session.exec(select(PatientFileSection11).where(PatientFileSection11.patient_id == patient_id)).first()
    if not section11:
        raise HTTPException(status_code=404, detail="Patient File Section 11 not found")
    return section11

# Patient File Section 12 - Diet Chart
@app.post("/api/patients/{patient_id}/patient-file/section12", response_model=PatientFileSection12Read)
async def create_patient_file_section12(patient_id: str, data: PatientFileSection12Create, session: Session = Depends(get_session)):
    """Create or update Patient File Section 12 - Diet Chart"""
    # Check if patient exists
    patient = session.exec(select(Patient).where(Patient.id == patient_id)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check if section 12 already exists
    existing = session.exec(select(PatientFileSection12).where(PatientFileSection12.patient_id == patient_id)).first()
    
    if existing:
        # Update existing
        for key, value in data.dict().items():
            setattr(existing, key, value)
        existing.updated_at = datetime.now()
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing
    else:
        # Create new
        section12 = PatientFileSection12(
            patient_id=patient_id,
            **data.dict()
        )
        session.add(section12)
        session.commit()
        session.refresh(section12)
        return section12

@app.get("/api/patients/{patient_id}/patient-file/section12", response_model=PatientFileSection12Read)
async def get_patient_file_section12(patient_id: str, session: Session = Depends(get_session)):
    """Get Patient File Section 12 for a patient"""
    section12 = session.exec(select(PatientFileSection12).where(PatientFileSection12.patient_id == patient_id)).first()
    if not section12:
        raise HTTPException(status_code=404, detail="Patient File Section 12 not found")
    return section12

# DELETE Endpoints for Patient Files
@app.delete("/api/patients/{patient_id}/patient-file/section1")
async def delete_patient_file_section1(patient_id: str, session: Session = Depends(get_session)):
    """Delete Patient File Section 1 for a patient"""
    section1 = session.exec(select(PatientFileSection1).where(PatientFileSection1.patient_id == patient_id)).first()
    if not section1:
        raise HTTPException(status_code=404, detail="Patient File Section 1 not found")
    
    session.delete(section1)
    session.commit()
    return {"message": "Patient File Section 1 deleted successfully"}

@app.delete("/api/patients/{patient_id}/patient-file/section2")
async def delete_patient_file_section2(patient_id: str, session: Session = Depends(get_session)):
    """Delete Patient File Section 2 for a patient"""
    section2 = session.exec(select(PatientFileSection2).where(PatientFileSection2.patient_id == patient_id)).first()
    if not section2:
        raise HTTPException(status_code=404, detail="Patient File Section 2 not found")
    
    session.delete(section2)
    session.commit()
    return {"message": "Patient File Section 2 deleted successfully"}

@app.delete("/api/patients/{patient_id}/patient-file/section3")
async def delete_patient_file_section3(patient_id: str, session: Session = Depends(get_session)):
    """Delete Patient File Section 3 for a patient"""
    section3 = session.exec(select(PatientFileSection3).where(PatientFileSection3.patient_id == patient_id)).first()
    if not section3:
        raise HTTPException(status_code=404, detail="Patient File Section 3 not found")
    
    session.delete(section3)
    session.commit()
    return {"message": "Patient File Section 3 deleted successfully"}

@app.delete("/api/patients/{patient_id}/patient-file/section4")
async def delete_patient_file_section4(patient_id: str, session: Session = Depends(get_session)):
    """Delete Patient File Section 4 for a patient"""
    section4 = session.exec(select(PatientFileSection4).where(PatientFileSection4.patient_id == patient_id)).first()
    if not section4:
        raise HTTPException(status_code=404, detail="Patient File Section 4 not found")
    
    session.delete(section4)
    session.commit()
    return {"message": "Patient File Section 4 deleted successfully"}

@app.delete("/api/patients/{patient_id}/patient-file/section5")
async def delete_patient_file_section5(patient_id: str, session: Session = Depends(get_session)):
    """Delete Patient File Section 5 for a patient"""
    section5 = session.exec(select(PatientFileSection5).where(PatientFileSection5.patient_id == patient_id)).first()
    if not section5:
        raise HTTPException(status_code=404, detail="Patient File Section 5 not found")
    
    session.delete(section5)
    session.commit()
    return {"message": "Patient File Section 5 deleted successfully"}

@app.delete("/api/patients/{patient_id}/patient-file/section6")
async def delete_patient_file_section6(patient_id: str, session: Session = Depends(get_session)):
    """Delete Patient File Section 6 for a patient"""
    section6 = session.exec(select(PatientFileSection6).where(PatientFileSection6.patient_id == patient_id)).first()
    if not section6:
        raise HTTPException(status_code=404, detail="Patient File Section 6 not found")
    
    session.delete(section6)
    session.commit()
    return {"message": "Patient File Section 6 deleted successfully"}

@app.delete("/api/patients/{patient_id}/patient-file/section7")
async def delete_patient_file_section7(patient_id: str, session: Session = Depends(get_session)):
    """Delete Patient File Section 7 for a patient"""
    section7 = session.exec(select(PatientFileSection7).where(PatientFileSection7.patient_id == patient_id)).first()
    if not section7:
        raise HTTPException(status_code=404, detail="Patient File Section 7 not found")
    
    session.delete(section7)
    session.commit()
    return {"message": "Patient File Section 7 deleted successfully"}

@app.delete("/api/patients/{patient_id}/patient-file/section8")
async def delete_patient_file_section8(patient_id: str, session: Session = Depends(get_session)):
    """Delete Patient File Section 8 for a patient"""
    section8 = session.exec(select(PatientFileSection8).where(PatientFileSection8.patient_id == patient_id)).first()
    if not section8:
        raise HTTPException(status_code=404, detail="Patient File Section 8 not found")
    
    session.delete(section8)
    session.commit()
    return {"message": "Patient File Section 8 deleted successfully"}

@app.delete("/api/patients/{patient_id}/patient-file/section9")
async def delete_patient_file_section9(patient_id: str, session: Session = Depends(get_session)):
    """Delete Patient File Section 9 for a patient"""
    section9 = session.exec(select(PatientFileSection9).where(PatientFileSection9.patient_id == patient_id)).first()
    if not section9:
        raise HTTPException(status_code=404, detail="Patient File Section 9 not found")
    
    session.delete(section9)
    session.commit()
    return {"message": "Patient File Section 9 deleted successfully"}

@app.delete("/api/patients/{patient_id}/patient-file/section10")
async def delete_patient_file_section10(patient_id: str, session: Session = Depends(get_session)):
    """Delete Patient File Section 10 for a patient"""
    section10 = session.exec(select(PatientFileSection10).where(PatientFileSection10.patient_id == patient_id)).first()
    if not section10:
        raise HTTPException(status_code=404, detail="Patient File Section 10 not found")
    
    session.delete(section10)
    session.commit()
    return {"message": "Patient File Section 10 deleted successfully"}

@app.delete("/api/patients/{patient_id}/patient-file/section11")
async def delete_patient_file_section11(patient_id: str, session: Session = Depends(get_session)):
    """Delete Patient File Section 11 for a patient"""
    section11 = session.exec(select(PatientFileSection11).where(PatientFileSection11.patient_id == patient_id)).first()
    if not section11:
        raise HTTPException(status_code=404, detail="Patient File Section 11 not found")
    
    session.delete(section11)
    session.commit()
    return {"message": "Patient File Section 11 deleted successfully"}

@app.delete("/api/patients/{patient_id}/patient-file/section12")
async def delete_patient_file_section12(patient_id: str, session: Session = Depends(get_session)):
    """Delete Patient File Section 12 for a patient"""
    section12 = session.exec(select(PatientFileSection12).where(PatientFileSection12.patient_id == patient_id)).first()
    if not section12:
        raise HTTPException(status_code=404, detail="Patient File Section 12 not found")
    
    session.delete(section12)
    session.commit()
    return {"message": "Patient File Section 12 deleted successfully"}

@app.delete("/api/patients/{patient_id}/patient-file/all")
async def delete_all_patient_files(patient_id: str, session: Session = Depends(get_session)):
    """Delete all Patient File sections for a patient"""
    # Delete all sections
    sections = [PatientFileSection1, PatientFileSection2, PatientFileSection3, PatientFileSection4,
                PatientFileSection5, PatientFileSection6, PatientFileSection7, PatientFileSection8,
                PatientFileSection9, PatientFileSection10, PatientFileSection11, PatientFileSection12]
    
    deleted_count = 0
    for section_class in sections:
        section = session.exec(select(section_class).where(section_class.patient_id == patient_id)).first()
        if section:
            session.delete(section)
            deleted_count += 1
    
    session.commit()
    return {"message": f"Deleted {deleted_count} patient file sections successfully"}

@app.delete("/api/patients/{patient_id}")
async def delete_patient(patient_id: str, session: Session = Depends(get_session)):
    """Delete entire patient record and all associated data"""
    # Check if patient exists
    patient = session.exec(select(Patient).where(Patient.id == patient_id)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Delete all associated data
    # 1. Delete all patient file sections
    sections = [PatientFileSection1, PatientFileSection2, PatientFileSection3, PatientFileSection4,
                PatientFileSection5, PatientFileSection6, PatientFileSection7, PatientFileSection8,
                PatientFileSection9, PatientFileSection10, PatientFileSection11, PatientFileSection12]
    
    for section_class in sections:
        records = session.exec(select(section_class).where(section_class.patient_id == patient_id)).all()
        for record in records:
            session.delete(record)
    
    # 2. Delete other associated records
    nurse_handovers = session.exec(select(NurseHandover).where(NurseHandover.patient_id == patient_id)).all()
    for record in nurse_handovers:
        session.delete(record)
    
    discharge_summaries = session.exec(select(DischargeSummary).where(DischargeSummary.patient_id == patient_id)).all()
    for record in discharge_summaries:
        session.delete(record)
    
    claims = session.exec(select(Claim).where(Claim.patient_id == patient_id)).all()
    for record in claims:
        session.delete(record)
    
    doctor_notes = session.exec(select(DoctorNote).where(DoctorNote.patient_id == patient_id)).all()
    for record in doctor_notes:
        session.delete(record)
    
    operation_records = session.exec(select(OperationRecord).where(OperationRecord.patient_id == patient_id)).all()
    for record in operation_records:
        session.delete(record)
    
    tats = session.exec(select(TAT).where(TAT.patient_id == patient_id)).all()
    for record in tats:
        session.delete(record)
    
    # 3. Delete the patient
    session.delete(patient)
    session.commit()
    
    return {"message": "Patient and all associated data deleted successfully"}

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    try:
        return {
            "status": "healthy", 
            "timestamp": datetime.utcnow().isoformat(),
            "version": "1.0.0"
        }
    except Exception as e:
        print(f"Health check error: {e}")
        return {"status": "unhealthy", "error": str(e)}

@app.get("/api/health/voice")
async def voice_health_check():
    """Health check for voice input functionality"""
    try:
        import subprocess
        import shutil
        
        # Check if ffmpeg is available
        ffmpeg_path = shutil.which("ffmpeg")
        if not ffmpeg_path:
            return {
                "status": "unhealthy",
                "error": "FFmpeg not found",
                "fix_instructions": [
                    "Run: .\\install-ffmpeg.ps1 (PowerShell)",
                    "Or run: install-ffmpeg.bat (Command Prompt)",
                    "Or install manually: https://ffmpeg.org/download.html"
                ]
            }
        
        # Check if Whisper model can be loaded
        try:
            from services.asr_whisper import get_model
            model = get_model()
            return {
                "status": "healthy",
                "ffmpeg_path": ffmpeg_path,
                "whisper_model": "loaded",
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "ffmpeg_path": ffmpeg_path,
                "error": f"Whisper model failed to load: {str(e)}"
            }
            
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": f"Voice health check failed: {str(e)}"
        }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
