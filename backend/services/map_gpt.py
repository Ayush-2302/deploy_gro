import os
import json
import re
from openai import OpenAI
from typing import Dict, Any
from dotenv import load_dotenv

# Load environment variables
try:
    load_dotenv()
except Exception as e:
    print(f"Warning: Could not load .env file: {e}")
    print("Using environment variables or defaults")

# Initialize OpenAI client
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
client = None
if OPENAI_API_KEY:
    client = OpenAI(api_key=OPENAI_API_KEY)

def _call_openai(system_prompt: str, user_text: str) -> dict:
    """
    Calls OpenAI and guarantees JSON object back. If parsing fails, returns {}.
    """
    if not client:
        return {}
    try:
        resp = client.chat.completions.create(
            model=OPENAI_MODEL,
            response_format={"type": "json_object"},  # Force JSON
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_text},
            ],
            temperature=0.1,
        )
        raw = resp.choices[0].message.content
        return json.loads(raw or "{}")
    except Exception as e:
        print(f"OpenAI API error: {e}")
        return {}

def map_text(section: str, text: str, language: str = "en") -> Dict[str, Any]:
    """
    Map transcribed text to structured JSON using GPT
    
    Args:
        section: Section type (admission, doctor_note, handover_outgoing, etc.)
        text: Transcribed text
        language: Language code ("en", "hi", or "auto")
    
    Returns:
        Structured JSON data
    """
    # If no OpenAI API key, return fallback data
    if not client:
        return _fallback_mapping(section, text, language)
    
    try:
        system_prompt = _get_system_prompt(section, language)
        print(f"🔍 Mapping text: {text[:100]}...")
        result = _call_openai(system_prompt, text)
        print(f"✅ Mapping result: {result}")
        return result
    except Exception as e:
        print(f"Mapping error: {e}")
        return _fallback_mapping(section, text, language)

def _get_system_prompt(section: str, language: str) -> str:
    """Get system prompt for specific section"""
    
    prompts = {
        "admission": r"""
You are an expert medical scribe for patient admissions with advanced noise filtering capabilities.

You will receive text that may include TWO parts:
1) TRANSCRIPT: free speech / structured sentence(s) - THIS IS THE PRIMARY SOURCE
2) UI: labels, placeholders, or selectable options - THIS IS SECONDARY/NOISE

CRITICAL EXTRACTION RULES:
- TRANSCRIPT is the ONLY reliable source of patient data
- UI section contains placeholders like "Enter age", "Now", "Today", "Describe the reason...", "dd-mm-yyyy", "--:--"
- NEVER extract values from UI placeholders - they are just form labels
- If TRANSCRIPT lacks a field, leave it empty rather than using UI noise
- Age must be a number (0-120), never a phone number or placeholder text
- Date must be YYYY-MM-DD format, time must be HH:MM 24-hour format

NOISE FILTERING FOR AUDIO TRANSCRIPTION:
- Handle unclear speech, background noise, and partial words intelligently
- Focus on clear, meaningful words and phrases
- Use context clues to fill in missing information
- Ignore background noise, unclear words, partial sentences
- If a field is unclear due to noise, leave it empty rather than guessing
- Prioritize accuracy over completeness

OUTPUT:
Return THIS EXACT JSON (single line, no trailing commas, no extra keys, no commentary):
{
  "name": "string",
  "age": 0,
  "gender": "male|female|other",
  "mobile_no": "string",
  "admitted_under_doctor": "string",
  "attender_name": "string",
  "relation": "string",
  "attender_mobile_no": "string",
  "aadhaar_number": "string",
  "admission_date": "YYYY-MM-DD",
  "admission_time": "HH:MM",
  "ward": "string",
  "bed_number": "string",
  "reason": "string"
}

LANGUAGE:
- Understand Hindi, English, Hinglish. Output in English.

FIELD RULES (TRANSCRIPT ONLY - NOISE RESISTANT):
- name: Extract from TRANSCRIPT phrases like "Patient name is …", "Name is …", "patient", "name". Handle unclear pronunciation, partial names. Title-case it. NEVER use UI labels.
- age: Integer only from TRANSCRIPT. Look for "X years", "X years old", "age X", "X yrs", "X year". Handle unclear numbers. Must be 0–120. NEVER use phone numbers or UI placeholders.
- gender: male/female/other from TRANSCRIPT words like "male/female", "sir/madam", "man/woman", "boy/girl". Handle unclear pronunciation. NEVER from UI options.
- mobile_no: Extract mobile number from TRANSCRIPT. Look for "mobile number", "mobile no", "phone number", "contact", "number". Handle partial numbers, unclear digits. Normalize as "7976636359".
- admitted_under_doctor: Extract doctor name from TRANSCRIPT. Look for "admitted under", "doctor", "Dr.", "consultant", "physician". Handle unclear doctor names. Include full name.
- attender_name: Extract attender name from TRANSCRIPT. Look for "attender name", "attendant", "caregiver", "relative", "person". Handle unclear names.
- relation: Extract relation from TRANSCRIPT. Look for "son", "daughter", "spouse", "father", "mother", "brother", "sister", "wife", "husband". Handle unclear relations.
- attender_mobile_no: Extract attender mobile from TRANSCRIPT. Look for "attender mobile", "attendant phone", "attender number". Handle partial numbers.
- aadhaar_number: 12 digits from TRANSCRIPT. Look for "aadhaar", "aadhar", "uid", "id number". Handle partial numbers. Normalize to "1234 5678 9012". NEVER use UI placeholders.
- ward: Extract from TRANSCRIPT phrases like "cardiology ward", "ward", "department", "unit". Handle unclear ward names. Capitalize first letter. NEVER use UI dropdown options.
- bed_number: From TRANSCRIPT "bed number X", "bed X", "room X", "bed no". Handle partial bed numbers. NEVER use UI placeholders.
- reason: Extract ONLY the primary medical reason from TRANSCRIPT. Look for "reason", "admission", "complaint", "diagnosis", "condition", "problem". Handle unclear medical terms. Do NOT include date/time/ward/bed text. NEVER use UI placeholder text.

DATE/TIME (TRANSCRIPT ONLY - NOISE RESISTANT):
- admission_date: Extract from TRANSCRIPT "today/tomorrow" or concrete dates. Look for "today", "tomorrow", "yesterday", specific dates. Handle unclear dates. Convert to YYYY-MM-DD format. If "today", use current date. If not found in TRANSCRIPT, use current date. NEVER use UI placeholders like "dd-mm-yyyy".
- admission_time: Extract from TRANSCRIPT times like "2:30 PM", "14:30", "at 10 AM", "now", "morning", "evening". Handle unclear times. Convert to 24-hour HH:MM format. If "now", use current time. If not found in TRANSCRIPT, use current time. NEVER use UI placeholders like "--:--", "Now", "9:00 AM".
- If TRANSCRIPT lacks date/time, use current date/time rather than leaving empty.
- Never leave date/time empty.

DISAMBIGUATION & NOISE GUARDS:
- UI blocks contain ONLY placeholders and labels - NEVER extract data from them
- Common UI noise to IGNORE: "Enter age", "Now", "Today", "dd-mm-yyyy", "--:--", "9:00 AM", "Describe the reason...", "Cardiology" (as dropdown option)
- If UI shows "Age: Enter age" or "Admission Date: dd-mm-yyyy", these are form placeholders, not real data
- ONLY extract data from the TRANSCRIPT section - ignore everything in the UI section
- When in doubt, leave field empty rather than using UI noise

VALIDATION BEFORE OUTPUT:
- age must be 0-120, never a phone number or placeholder text
- mobile_no must be 10 digits, never placeholder text
- aadhaar_number must be 12 digits formatted "1234 5678 9012", never placeholder text
- admission_date must be YYYY-MM-DD format, never "dd-mm-yyyy" or "Today"
- admission_time must be HH:MM 24-hour format, never "--:--" or "Now"
- reason must be medical condition, never placeholder text like "Describe the reason..."

FEW-SHOT EXAMPLES (pay attention to ignoring UI placeholders):

Example A
INPUT:
TRANSCRIPT
Patient name is Rajesh Kumar Sharma, 45 years old male. Contact number is 9876543210, mobile number is 7976636359. Admitted under doctor Dr. Ravikant Porwal. Attender name is Pradeep Shihani, relation is son, attender mobile number is 7976636359. Aadhaar number is 1234-5678-9012.
Admission date is today, admission time is 2:30 PM. Ward is cardiology ward, bed number 3.
Reason for admission is acute myocardial infarction.

UI
Full Name: Rajesh Kumar Sharma
Age: Enter age
Gender: Male
Contact Number: +91 9876543210
Mobile No: 7976636359
Admitted Under Doctor: Dr. Ravikant Porwal
Attender Name: Pradeep Shihani
Relation: Son
Attender Mobile No: 7976636359
Aadhaar Number: 1234 5678 9012
Admission Date options: 09-09-2025 / Today / Tomorrow
Admission Time options: 15:16 / Now / 9:00 AM
Ward: Cardiology
Bed Number: 3
Reason: Describe the reason for admission...

OUTPUT:
{"name":"Rajesh Kumar Sharma","age":45,"gender":"male","mobile_no":"7976636359","admitted_under_doctor":"Dr. Ravikant Porwal","attender_name":"Pradeep Shihani","relation":"son","attender_mobile_no":"7976636359","aadhaar_number":"1234 5678 9012","admission_date":"2025-09-09","admission_time":"14:30","ward":"Cardiology","bed_number":"3","reason":"acute myocardial infarction"}

Example B
INPUT:
TRANSCRIPT
Admit Ravi Kumar 45 years male, mobile number 9988776655, admitted under Dr. Sharma, attender name is his wife Priya, relation is spouse, attender mobile 9988776656, Aadhaar 9876 5432 1098, reason chest pain, time now 9:30 pm, CCU bed A-101.

UI
Admission Date
today
Admission Time
--:--

OUTPUT:
{"name":"Ravi Kumar","age":45,"gender":"male","mobile_no":"9988776655","admitted_under_doctor":"Dr. Sharma","attender_name":"Priya","relation":"spouse","attender_mobile_no":"9988776656","aadhaar_number":"9876 5432 1098","admission_date":"2025-01-09","admission_time":"21:30","ward":"CCU","bed_number":"A-101","reason":"chest pain"}

Example C
INPUT:
TRANSCRIPT
Patient name, Wignesh, age, 25, mobile number, 977-66359, admitted under doctor name, Ravi Khan Kaurwal, attendant name, Pradeep Sihani, relation son, attendant mobile number, 797-536359, bed number B-102 reason for admission is heart issues.

UI
Full Name: Wignesh
Age: 25
Gender: Male
Mobile No: 7976636359
Admitted Under Doctor: -
Attender Information
Attender Name: -
Relation: Son
Attender Mobile No: -
Admission Details
Admission Date: 12-09-2025
Today
Tomorrow
Admission Time: 08:38
Now
9:00 AM
Ward: Cardiology
Bed Number: B-102
Reason for Admission: heart issues

OUTPUT:
{"name":"Wignesh","age":25,"gender":"male","mobile_no":"97766359","admitted_under_doctor":"Ravi Khan Kaurwal","attender_name":"Pradeep Sihani","relation":"son","attender_mobile_no":"797536359","aadhaar_number":"","admission_date":"2025-01-09","admission_time":"08:38","ward":"Cardiology","bed_number":"B-102","reason":"heart issues"}

Now, produce the JSON.
""",
        
        "doctor_note": f"""
You are a medical scribe. Extract doctor consultation details.
Return JSON ONLY with the EXACT keys:

{{
  "chief_complaint": "string",
  "hpi": "string",
  "physical_exam": "string",
  "diagnosis": ["string"],
  "orders": ["string"],
  "prescriptions": ["string"],
  "advice": "string"
}}

Rules:
- Split lists (diagnosis, orders, prescriptions) by commas/semicolons.
- If an item is absent, return an empty string or an empty array.
- Output only JSON, no extra text.
Language: {language}
""",
        
        "handover_outgoing": f"""
You are a medical scribe for OUTGOING NURSE HANDOVER. Extract information from outgoing nurse's speech about patient status and care.

CONTEXT: Outgoing nurse is handing over patient care to incoming nurse. Extract:
- Current patient status (consciousness, stability)
- Vital signs (BP, HR, Temperature, SpO2)
- Medications given during shift
- Pending tasks for next shift
- Special instructions

FORM FIELDS TO POPULATE:
- Current Patient Status: Patient's current condition/status
- BP: Blood pressure (format: "120/80")
- HR: Heart rate in bpm
- Temp: Temperature in °F
- SpO2: Oxygen saturation percentage
- Medications (Given): Medications administered during shift
- Medications (Due): Medications due for next shift
- Pending Investigations: Lab tests, scans, procedures pending

Return JSON ONLY with the EXACT keys:

{{
  "patient_condition": "string - current patient status/condition",
  "vital_signs": "string - BP, HR, Temp, SpO2 values",
  "medications": ["string - medications given during shift"],
  "pending_tasks": ["string - tasks due for next shift"],
  "special_instructions": "string - special care instructions"
}}

EXTRACTION RULES:
- Vital signs: Extract BP (systolic/diastolic), HR (bpm), Temperature (°F), SpO2 (%)
- Medications: Extract medications given and due
- Patient status: Extract consciousness level, stability, condition
- Pending tasks: Extract investigations, procedures, follow-ups needed
- Language: {language}

EXAMPLES:
Input: "Patient status is stable unconscious, BP 120 by 90, HR 73, temperature 96, SPO2 98"
Output: {{"patient_condition": "stable unconscious", "vital_signs": "BP 120/90, HR 73, Temp 96°F, SpO2 98%", "medications": [], "pending_tasks": [], "special_instructions": ""}}
""",
        
        "handover_incoming": f"""
You are a medical scribe for INCOMING NURSE HANDOVER. Extract information from incoming nurse's speech about verification and acknowledgment.

CONTEXT: Incoming nurse is taking over patient care from outgoing nurse. Extract:
- Verification of shift summary and patient status
- Patient updates and changes
- New orders and alerts
- Follow-up requirements

FORM FIELDS TO POPULATE:
- Verification: Incoming nurse's verification of patient status and care
- Medications (Pending verified): Medications that need verification
- Investigations (Pending confirmed): Lab tests, scans that need confirmation
- Acknowledgement: Incoming nurse's acknowledgment of handover

Return JSON ONLY with the EXACT keys:

{{
  "shift_summary": "string - incoming nurse's verification of shift summary",
  "patient_updates": "string - patient updates and changes noted",
  "new_orders": ["string - new orders and alerts for patient care"],
  "alerts": ["string - medications pending verification"],
  "follow_up_required": "string - investigations pending confirmation"
}}

EXTRACTION RULES:
- Verification: Extract incoming nurse's confirmation of patient status
- Medications: Extract medications that need verification
- Investigations: Extract lab tests, scans that need confirmation
- Acknowledgement: Extract incoming nurse's acknowledgment
- Language: {language}

EXAMPLES:
Input: "Verification is done. Medications, paracetamol is pending verify. And investigations, pending confirm the issues found in the fever, acknowledgement, everything is going cool."
Output: {{"shift_summary": "Verification is done. Everything is going cool.", "patient_updates": "Everything is going cool", "new_orders": [], "alerts": ["paracetamol is pending verify"], "follow_up_required": "investigations pending confirm the issues found in the fever"}}
""",
        
        "handover_incharge": f"""
You are a medical scribe for NURSING INCHARGE HANDOVER. Extract information from nursing incharge's speech about ward management and oversight.

CONTEXT: Nursing incharge is overseeing ward operations and patient care. Extract:
- Ward summary and overall status
- Critical patients requiring attention
- Staff assignments and coverage
- Equipment status and maintenance
- Administrative notes and updates

FORM FIELDS TO POPULATE:
- Verification: Ward summary and overall status
- Investigations & Medications (Confirmation): Critical patients and staff assignments
- Audit Log: Administrative notes and equipment status

Return JSON ONLY with the EXACT keys:

{{
  "ward_summary": "string - overall ward status and summary",
  "critical_patients": ["string - critical patients requiring attention"],
  "staff_assignments": "string - staff assignments and coverage",
  "equipment_status": "string - equipment status and maintenance needs",
  "administrative_notes": "string - administrative notes and updates"
}}

EXTRACTION RULES:
- Ward summary: Extract overall ward status and operations
- Critical patients: Extract patients requiring special attention
- Staff assignments: Extract staff coverage and assignments
- Equipment status: Extract equipment condition and maintenance needs
- Administrative notes: Extract administrative updates and notes
- Language: {language}

EXAMPLES:
Input: "Ward is running smoothly, 2 critical patients in beds 3 and 7, staff assignments complete, equipment functioning well, new admission expected"
Output: {{"ward_summary": "Ward is running smoothly", "critical_patients": ["bed 3", "bed 7"], "staff_assignments": "staff assignments complete", "equipment_status": "equipment functioning well", "administrative_notes": "new admission expected"}}
""",
        
        "handover_summary": f"""
You are a medical scribe for HANDOVER SUMMARY. Extract information from summary speech about overall patient care and shift priorities.

CONTEXT: Summary of the entire handover process covering:
- Overall patient condition and status
- Key events during the shift
- Medication changes and updates
- Family communication and updates
- Next shift priorities and focus areas

FORM FIELDS TO POPULATE:
- Summary: Overall patient condition and key summary points

Return JSON ONLY with the EXACT keys:

{{
  "overall_condition": "string - overall patient condition and status",
  "key_events": ["string - key events during the shift"],
  "medication_changes": ["string - medication changes and updates"],
  "family_communication": "string - family communication and updates",
  "next_shift_priorities": ["string - next shift priorities and focus areas"]
}}

EXTRACTION RULES:
- Overall condition: Extract patient's current condition and status
- Key events: Extract important events that occurred during shift
- Medication changes: Extract any medication updates or changes
- Family communication: Extract family updates and communication
- Next shift priorities: Extract priorities for the next shift
- Language: {language}

EXAMPLES:
Input: "Patient stable overall, key events include successful surgery, medication changes with increased pain meds, family updated on progress, next shift focus on discharge planning"
Output: {{"overall_condition": "Patient stable overall", "key_events": ["successful surgery"], "medication_changes": ["increased pain meds"], "family_communication": "family updated on progress", "next_shift_priorities": ["discharge planning"]}}
""",
        
        "discharge": f"""
You are a medical scribe for DISCHARGE SUMMARY. Extract comprehensive medical information from doctor's speech for patient discharge documentation.

CONTEXT: Doctor is dictating discharge summary covering:
- Final diagnosis and primary conditions
- Chief complaints and medical history
- Physical examination findings
- Investigation results and imaging
- Surgical procedures performed
- Hospital course and treatment
- Discharge medications and instructions
- Follow-up care requirements

FORM FIELDS TO POPULATE:
- Final Diagnosis: Primary and secondary diagnoses
- Chief Complaints & History: Presenting symptoms and medical history
- Physical Examination: Examination findings and vital signs
- Investigations & Radiology: Lab results, imaging, diagnostic tests
- Procedures & Surgery: Surgical and therapeutic procedures
- Hospital Course: Treatment course and patient progress
- Discharge Medications & Instructions: Medications and care instructions
- Follow-up Instructions: Follow-up appointments and monitoring

Return JSON ONLY with the EXACT keys:

{{
  "discharge_diagnosis": ["string - final diagnosis and conditions"],
  "treatment_summary": "string - hospital course and treatment summary",
  "medications": ["string - discharge medications and instructions"],
  "follow_up_instructions": "string - follow-up care and appointments"],
  "discharge_date": "string - discharge date"
}}

EXTRACTION RULES:
- Diagnosis: Extract primary and secondary diagnoses
- Treatment: Extract hospital course, procedures, and treatment given
- Medications: Extract discharge medications and dosage instructions
- Follow-up: Extract follow-up appointments, monitoring, and care instructions
- Date: Extract or use current date for discharge
- Language: {language}

EXAMPLES:
Input: "Patient diagnosed with acute appendicitis, underwent laparoscopic appendectomy, recovered well, discharged with antibiotics for 5 days, follow-up in 1 week"
Output: {{"discharge_diagnosis": ["acute appendicitis"], "treatment_summary": "underwent laparoscopic appendectomy, recovered well", "medications": ["antibiotics for 5 days"], "follow_up_instructions": "follow-up in 1 week", "discharge_date": "2025-01-09"}}
""",

        "operation_record_section1": f"""
You are a medical scribe for OPERATION RECORD - PRE-OPERATIVE INFORMATION. Extract pre-operative details from surgeon's speech.

CONTEXT: Surgeon is dictating pre-operative information covering:
- Pre-operative diagnosis and assessment
- Planned surgical procedure
- Patient preparation and consent status
- Pre-operative evaluation completion

FORM FIELDS TO POPULATE:
- Pre-Operative Diagnosis: Primary diagnosis requiring surgery
- Planned Procedure: Detailed description of planned surgical procedure
- Pre-operative Assessment Completed: Boolean status
- Informed Consent Obtained: Boolean status

Return JSON ONLY with the EXACT keys:

{{
  "pre_operative_diagnosis": "string - pre-operative diagnosis and assessment",
  "planned_procedure": "string - detailed planned surgical procedure",
  "pre_operative_assessment_completed": true/false,
  "informed_consent_obtained": true/false
}}

EXTRACTION RULES:
- Diagnosis: Extract primary diagnosis requiring surgical intervention
- Procedure: Extract detailed description of planned surgical procedure
- Assessment: Extract completion status of pre-operative assessment
- Consent: Extract informed consent status
- Language: {language}

EXAMPLES:
Input: "Pre-operative diagnosis is acute appendicitis, planned procedure is laparoscopic appendectomy, pre-operative assessment completed, informed consent obtained from patient"
Output: {{"pre_operative_diagnosis": "acute appendicitis", "planned_procedure": "laparoscopic appendectomy", "pre_operative_assessment_completed": true, "informed_consent_obtained": true}}
""",

        "operation_record_section2": f"""
You are a medical scribe for OPERATION RECORD - SURGICAL TEAM & ANAESTHESIA. Extract surgical team and anaesthesia details from surgeon's speech.

CONTEXT: Surgeon is dictating surgical team and anaesthesia information covering:
- Surgical team members (surgeons, assistants)
- Anaesthesiologist details
- Type of anaesthesia used
- Anaesthesia medications administered

FORM FIELDS TO POPULATE:
- Surgeons: Primary and assistant surgeons
- Assistants: Surgical assistants and support staff
- Anaesthesiologist: Anaesthesia provider details
- Type of Anaesthesia: General, regional, local, etc.
- Anaesthesia Medications: Medications used for anaesthesia

Return JSON ONLY with the EXACT keys:

{{
  "surgeons": "string - primary and assistant surgeons",
  "assistants": "string - surgical assistants and support staff",
  "anaesthesiologist": "string - anaesthesia provider details",
  "type_of_anaesthesia": "string - type of anaesthesia used",
  "anaesthesia_medications": "string - anaesthesia medications administered"
}}

EXTRACTION RULES:
- Surgeons: Extract names and roles of surgical team
- Assistants: Extract surgical assistants and support staff
- Anaesthesiologist: Extract anaesthesia provider information
- Anaesthesia Type: Extract type of anaesthesia (general, regional, local)
- Medications: Extract anaesthesia medications and dosages
- Language: {language}

EXAMPLES:
Input: "Primary surgeon Dr. Smith, assistant Dr. Jones, anaesthesiologist Dr. Brown, general anaesthesia with propofol and fentanyl"
Output: {{"surgeons": "Dr. Smith", "assistants": "Dr. Jones", "anaesthesiologist": "Dr. Brown", "type_of_anaesthesia": "general anaesthesia", "anaesthesia_medications": "propofol and fentanyl"}}
""",

        "operation_record_section3": f"""
You are a medical scribe for OPERATION RECORD - OPERATIVE DETAILS. Extract operative details from surgeon's speech.

CONTEXT: Surgeon is dictating operative details covering:
- Actual procedure performed
- Operative findings and observations
- Blood loss and fluid management
- Specimens removed for histopathology
- Intra-operative events and complications
- Instrument count verification

FORM FIELDS TO POPULATE:
- Procedure Performed: Actual surgical procedure performed
- Operative Findings: Findings during surgery
- Estimated Blood Loss: Blood loss during procedure
- Blood/IV Fluids Given: Fluids administered during surgery
- Specimens Removed: Specimens sent for histopathology
- Intra-operative Events: Events and complications during surgery
- Instrument Count Verified: Boolean status

Return JSON ONLY with the EXACT keys:

{{
  "procedure_performed": "string - actual surgical procedure performed",
  "operative_findings": "string - findings during surgery",
  "estimated_blood_loss": "string - blood loss during procedure",
  "blood_iv_fluids_given": "string - fluids administered during surgery",
  "specimens_removed": "string - specimens sent for histopathology",
  "intra_operative_events": "string - events and complications during surgery",
  "instrument_count_verified": true/false
}}

EXTRACTION RULES:
- Procedure: Extract actual surgical procedure performed
- Findings: Extract operative findings and observations
- Blood Loss: Extract estimated blood loss amount
- Fluids: Extract blood and IV fluids administered
- Specimens: Extract specimens removed for histopathology
- Events: Extract intra-operative events and complications
- Count: Extract instrument count verification status
- Language: {language}

EXAMPLES:
Input: "Performed laparoscopic appendectomy, found inflamed appendix, estimated blood loss 50ml, gave 500ml normal saline, sent appendix for histopathology, no complications, instrument count verified"
Output: {{"procedure_performed": "laparoscopic appendectomy", "operative_findings": "inflamed appendix", "estimated_blood_loss": "50ml", "blood_iv_fluids_given": "500ml normal saline", "specimens_removed": "appendix for histopathology", "intra_operative_events": "no complications", "instrument_count_verified": true}}
""",

        "operation_record_section4": f"""
You are a medical scribe for OPERATION RECORD - POST-OPERATIVE PLAN & SIGNATURES. Extract post-operative plan and signature details from surgeon's speech.

CONTEXT: Surgeon is dictating post-operative plan and signature information covering:
- Post-operative diagnosis
- Post-operative care plan
- Patient condition on transfer
- Transfer destination
- Required signatures

FORM FIELDS TO POPULATE:
- Post-Operative Diagnosis: Final diagnosis after surgery
- Post-Operative Plan: Care plan for post-operative period
- Patient Condition on Transfer: Patient's condition when transferring
- Transferred To: Destination for patient transfer
- Signatures: Surgeon, anaesthesiologist, and nursing staff signatures

Return JSON ONLY with the EXACT keys:

{{
  "post_operative_diagnosis": "string - final diagnosis after surgery",
  "post_operative_plan": "string - care plan for post-operative period",
  "patient_condition_on_transfer": "string - patient's condition when transferring",
  "transferred_to": "string - destination for patient transfer",
  "surgeon_signature": "string - surgeon's signature",
  "anaesthesiologist_signature": "string - anaesthesiologist's signature",
  "nursing_staff_signature": "string - nursing staff signature"
}}

EXTRACTION RULES:
- Diagnosis: Extract final post-operative diagnosis
- Plan: Extract post-operative care plan and instructions
- Condition: Extract patient's condition during transfer
- Transfer: Extract transfer destination (Recovery, ICU, Ward)
- Signatures: Extract required signatures
- Language: {language}

EXAMPLES:
Input: "Post-operative diagnosis acute appendicitis, post-operative plan includes pain management and antibiotics, patient stable for transfer to recovery, surgeon Dr. Smith, anaesthesiologist Dr. Brown, nursing staff Nurse Johnson"
Output: {{"post_operative_diagnosis": "acute appendicitis", "post_operative_plan": "pain management and antibiotics", "patient_condition_on_transfer": "stable", "transferred_to": "Recovery", "surgeon_signature": "Dr. Smith", "anaesthesiologist_signature": "Dr. Brown", "nursing_staff_signature": "Nurse Johnson"}}
""",

        "patient_file_section1": f"""
You are a medical scribe for PATIENT FILE - SECTION 1 (Basic Patient Information). Extract comprehensive patient information from medical staff speech.

CONTEXT: Medical staff is dictating basic patient information covering:
-- Patient demographics and identification
-- Hospital admission details
-- Medical history and allergies
-- Consultant and diagnosis information
-- Diet requirements
-- Medication orders and administration

FORM FIELDS TO POPULATE:
-- Patient Name: Full name of the patient
-- Age: Patient age in years
-- Sex: Gender (Male/Female/Other)
-- Date of Admission: Admission date
-- Ward: Assigned hospital ward
-- Bed Number: Bed assignment
-- Admitted Under Doctor: Doctor admitting the patient
-- Attender Name: Name of patient's attendant
-- Relation: Relationship of attendant to patient
-- Attender Mobile No: Mobile number of attendant
-- Drug Hypersensitivity/Allergy: Known allergies
-- Consultant: Doctor in charge
-- Diagnosis: Current patient diagnosis
-- Diet: Diet type and notes
-- Medication Orders: Array of medication details

Return JSON ONLY with the EXACT keys:

{{
  "patient_name": "string - full patient name",
  "age": 0,
  "sex": "Male|Female|Other",
  "date_of_admission": "YYYY-MM-DD",
  "ward": "string - ward name",
  "bed_number": "string - bed number",
  "admitted_under_doctor": "string - doctor name",
  "attender_name": "string - attendant name",
  "relation": "string - relationship",
  "attender_mobile_no": "string - mobile number",
  "drug_hypersensitivity_allergy": "string - allergies or none",
  "consultant": "string - doctor name",
  "diagnosis": "string - current diagnosis",
  "diet": {{
    "type": "Normal|Soft|Diabetic|Renal|Liquid|Others",
    "notes": "string - additional diet notes"
  }},
  "medication_orders": [
    {{
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "drug_name": "string - medication name",
      "strength": "string - dosage strength",
      "route": "string - administration route",
      "doctor_name_verbal_order": "string - doctor name",
      "doctor_signature": "string - doctor signature",
      "verbal_order_taken_by": "string - nurse name",
      "time_of_administration": "HH:MM",
      "administered_by": "string - nurse name",
      "administration_witnessed_by": "string - witness name"
    }}
  ]
}}

RULES:
-- Extract exact details from speech
-- Use proper medical terminology
-- Age must be a number (0-120)
-- Dates must be YYYY-MM-DD format
-- Times must be HH:MM 24-hour format
-- If no medications mentioned, return empty array
-- If no allergies, use "None" or "No known allergies"
-- Output only JSON, no extra text
-- Language: {language}

EXAMPLES:
Input: "Patient name Rajesh Kumar, age 45 male, admitted today to cardiology ward bed A-101, penicillin allergy, consultant Dr. Sharma, diagnosis chest pain, normal diet, medication aspirin 75mg oral given by Dr. Sharma"
Output: {{"patient_name": "Rajesh Kumar", "age": 45, "sex": "Male", "date_of_admission": "2025-01-09", "ward": "Cardiology", "bed_number": "A-101", "drug_hypersensitivity_allergy": "Penicillin allergy", "consultant": "Dr. Sharma", "diagnosis": "Chest pain", "diet": {{"type": "Normal", "notes": ""}}, "medication_orders": [{{"date": "2025-01-09", "time": "10:00", "drug_name": "Aspirin", "strength": "75mg", "route": "Oral", "doctor_name_verbal_order": "Dr. Sharma", "doctor_signature": "Dr. Sharma", "verbal_order_taken_by": "Nurse", "time_of_administration": "10:00", "administered_by": "Nurse", "administration_witnessed_by": "Nurse"}}]}}
""",

        "patient_file_section2": f"""
You are a medical scribe for PATIENT FILE - SECTION 2 (Initial Assessment Form). Extract comprehensive initial assessment information from medical staff speech.

CONTEXT: Medical staff is dictating initial assessment information covering:
-- Patient and admission details
-- Chief complaints and medical history
-- Physical examination findings
-- Provisional diagnosis and care plan
-- Doctor's orders and nursing assessment
-- Discharge planning

FORM FIELDS TO POPULATE:
-- Patient Details: Demographics, admission info, allergies
-- Chief Complaints: Presenting symptoms and concerns
-- Medical History: Past, family, personal, immunization history
-- Physical Examination: General and systemic examination findings
-- Diagnosis: Provisional diagnosis and clinical problems
-- Care Plan: Curative, preventive, palliative, rehabilitative care
-- Doctor's Orders: Diet, consultations, procedures, medications
-- Nursing Assessment: Vitals, examination, risk assessment
-- Discharge Planning: Medications, instructions, follow-up

Return JSON ONLY with the EXACT keys:

{{
  "hospital_number": "string - hospital identifier",
  "name": "string - patient name",
  "age": 0,
  "sex": "Male|Female",
  "ip_number": "string - IP number",
  "consultant": "string - consultant name",
  "doctor_unit": "string - doctor/unit",
  "history_taken_by": "string - who took history",
  "history_given_by": "string - who gave history",
  "known_allergies": "string - known allergies",
  "assessment_date": "YYYY-MM-DD",
  "assessment_time": "HH:MM",
  "signature": "string - signature",
  "chief_complaints": "string - chief complaints",
  "history_present_illness": "string - HPI details",
  "past_history": "string - past medical history",
  "family_history": "string - family history",
  "personal_history": "string - personal history",
  "immunization_history": "string - immunization history",
  "relevant_previous_investigations": "string - previous investigations",
  "sensorium": "Conscious|Drowsy|Unconscious",
  "pallor": true/false,
  "cyanosis": true/false,
  "clubbing": true/false,
  "icterus": true/false,
  "lymphadenopathy": true/false,
  "general_examination_others": "string - other findings",
  "systemic_examination": "string - systemic examination",
  "provisional_diagnosis": "string - provisional diagnosis",
  "care_plan_curative": "string - curative care plan",
  "care_plan_investigations_lab": "string - lab investigations",
  "care_plan_investigations_radiology": "string - radiology investigations",
  "care_plan_investigations_others": "string - other investigations",
  "care_plan_preventive": "string - preventive care",
  "care_plan_palliative": "string - palliative care",
  "care_plan_rehabilitative": "string - rehabilitative care",
  "miscellaneous_investigations": "string - miscellaneous investigations",
  "diet": "Normal|Others",
  "diet_specify": "string - diet specification",
  "dietary_consultation": true/false,
  "dietary_consultation_cross_referral": "string - cross referral",
  "dietary_screening_his": true/false,
  "physiotherapy": true/false,
  "special_care": "string - special care instructions",
  "restraint_required": true/false,
  "restraint_form_confirmation": true/false,
  "surgery_procedures": "string - planned procedures",
  "cross_consultations": [
    {{"doctor_name": "string", "department": "string"}}
  ],
  "incharge_consultant_name": "string - incharge name",
  "incharge_signature": "string - incharge signature",
  "incharge_date_time": "string - date time",
  "doctor_signature": "string - doctor signature",
  "additional_notes": "string - additional notes",
  "nursing_vitals_bp": "string - blood pressure",
  "nursing_vitals_pulse": "string - pulse rate",
  "nursing_vitals_temperature": "string - temperature",
  "nursing_vitals_respiratory_rate": "string - respiratory rate",
  "nursing_vitals_weight": "string - weight",
  "nursing_vitals_grbs": "string - GRBS",
  "nursing_vitals_saturation": "string - oxygen saturation",
  "nursing_examination_consciousness": "string - consciousness level",
  "nursing_examination_skin_integrity": "string - skin integrity",
  "nursing_examination_respiratory_status": "string - respiratory status",
  "nursing_examination_other_findings": "string - other findings",
  "nursing_current_medications": "string - current medications",
  "nursing_investigations_ordered": "string - investigations ordered",
  "nursing_diet": "string - nursing diet notes",
  "nursing_vulnerable_special_care": true/false,
  "nursing_pain_score": 0-10,
  "nursing_pressure_sores": true/false,
  "nursing_pressure_sores_description": "string - pressure sores description",
  "nursing_restraints_used": true/false,
  "nursing_risk_assessment_fall": true/false,
  "nursing_risk_assessment_dvt": true/false,
  "nursing_risk_assessment_pressure_sores": true/false,
  "nursing_signature": "string - nursing signature",
  "nursing_date_time": "string - nursing date time",
  "discharge_likely_date": "YYYY-MM-DD",
  "discharge_complete_diagnosis": "string - complete diagnosis",
  "discharge_medications": [
    {{"sl_no": 1, "name": "string", "dose": "string", "frequency": "string", "duration": "string"}}
  ],
  "discharge_vitals": "string - discharge vitals",
  "discharge_blood_sugar": "string - blood sugar level",
  "discharge_blood_sugar_controlled": true/false,
  "discharge_diet": "string - discharge diet",
  "discharge_condition_ambulatory": true/false,
  "discharge_pain_score": 0-10,
  "discharge_special_instructions": "string - special instructions",
  "discharge_physical_activity": "string - physical activity",
  "discharge_physiotherapy": "string - physiotherapy",
  "discharge_others": "string - other instructions",
  "discharge_report_in_case_of": "string - report conditions",
  "discharge_doctor_name_signature": "string - doctor signature",
  "discharge_follow_up_instructions": "string - follow-up instructions",
  "discharge_cross_consultation": "string - cross consultation advice"
}}

RULES:
-- Extract exact details from speech
-- Use proper medical terminology
-- Age must be a number (0-120)
-- Dates must be YYYY-MM-DD format
-- Times must be HH:MM 24-hour format
-- Boolean fields: true/false only
-- Pain scores: 0-10 integers only
-- If no cross consultations mentioned, return empty array
-- If no discharge medications mentioned, return empty array
-- Output only JSON, no extra text
-- Language: {language}

EXAMPLES:
Input: "Patient Rajesh Kumar, hospital number H123456, age 45 male, chief complaint chest pain for 2 days, past history hypertension, conscious alert, BP 140/90, pulse 88, provisional diagnosis acute coronary syndrome, normal diet, aspirin 75mg daily, likely discharge in 3 days"
Output: {{"hospital_number": "H123456", "name": "Rajesh Kumar", "age": 45, "sex": "Male", "ip_number": "", "consultant": "", "doctor_unit": "", "history_taken_by": "", "history_given_by": "", "known_allergies": "", "assessment_date": "2025-01-09", "assessment_time": "10:00", "signature": "", "chief_complaints": "chest pain for 2 days", "history_present_illness": "", "past_history": "hypertension", "family_history": "", "personal_history": "", "immunization_history": "", "relevant_previous_investigations": "", "sensorium": "Conscious", "pallor": false, "cyanosis": false, "clubbing": false, "icterus": false, "lymphadenopathy": false, "general_examination_others": "", "systemic_examination": "", "provisional_diagnosis": "acute coronary syndrome", "care_plan_curative": "", "care_plan_investigations_lab": "", "care_plan_investigations_radiology": "", "care_plan_investigations_others": "", "care_plan_preventive": "", "care_plan_palliative": "", "care_plan_rehabilitative": "", "miscellaneous_investigations": "", "diet": "Normal", "diet_specify": "", "dietary_consultation": false, "dietary_consultation_cross_referral": "", "dietary_screening_his": false, "physiotherapy": false, "special_care": "", "restraint_required": false, "restraint_form_confirmation": false, "surgery_procedures": "", "cross_consultations": [], "incharge_consultant_name": "", "incharge_signature": "", "incharge_date_time": "", "doctor_signature": "", "additional_notes": "", "nursing_vitals_bp": "140/90", "nursing_vitals_pulse": "88", "nursing_vitals_temperature": "", "nursing_vitals_respiratory_rate": "", "nursing_vitals_weight": "", "nursing_vitals_grbs": "", "nursing_vitals_saturation": "", "nursing_examination_consciousness": "alert", "nursing_examination_skin_integrity": "", "nursing_examination_respiratory_status": "", "nursing_examination_other_findings": "", "nursing_current_medications": "", "nursing_investigations_ordered": "", "nursing_diet": "", "nursing_vulnerable_special_care": false, "nursing_pain_score": null, "nursing_pressure_sores": false, "nursing_pressure_sores_description": "", "nursing_restraints_used": false, "nursing_risk_assessment_fall": false, "nursing_risk_assessment_dvt": false, "nursing_risk_assessment_pressure_sores": false, "nursing_signature": "", "nursing_date_time": "", "discharge_likely_date": "2025-01-12", "discharge_complete_diagnosis": "", "discharge_medications": [{{"sl_no": 1, "name": "Aspirin", "dose": "75mg", "frequency": "daily", "duration": ""}}], "discharge_vitals": "", "discharge_blood_sugar": "", "discharge_blood_sugar_controlled": null, "discharge_diet": "", "discharge_condition_ambulatory": null, "discharge_pain_score": null, "discharge_special_instructions": "", "discharge_physical_activity": "", "discharge_physiotherapy": "", "discharge_others": "", "discharge_report_in_case_of": "", "discharge_doctor_name_signature": "", "discharge_follow_up_instructions": "", "discharge_cross_consultation": ""}}
""",

        "patient_file_section3": f"""
You are a medical scribe for PATIENT FILE - SECTION 3 (Progress Notes, Vitals & Pain Monitoring). Extract progress notes, vital signs, and pain monitoring information from medical staff speech.

CONTEXT: Medical staff is dictating progress notes and monitoring information covering:
-- Daily progress notes and observations
-- Vital signs measurements
-- Pain assessment and monitoring

FORM FIELDS TO POPULATE:
-- Progress Notes: Date, time, and detailed progress notes
-- Vitals: Pulse, blood pressure, respiratory rate, temperature, oxygen saturation
-- Pain Monitoring: VAS score (0-10) and pain description

Return JSON ONLY with the EXACT keys:

{{
  "progress_date": "YYYY-MM-DD",
  "progress_time": "HH:MM",
  "progress_notes": "string - detailed progress notes",
  "vitals_pulse": "string - pulse rate",
  "vitals_blood_pressure": "string - blood pressure",
  "vitals_respiratory_rate": "string - respiratory rate",
  "vitals_temperature": "string - temperature",
  "vitals_oxygen_saturation": "string - oxygen saturation",
  "pain_vas_score": 0-10,
  "pain_description": "string - pain description and comments"
}}

RULES:
-- Extract exact details from speech
-- Use proper medical terminology
-- Dates must be YYYY-MM-DD format
-- Times must be HH:MM 24-hour format
-- VAS score must be integer 0-10
-- If no pain mentioned, pain_vas_score should be null
-- Output only JSON, no extra text
-- Language: {language}

EXAMPLES:
Input: "Progress notes for today, patient stable, vitals BP 120/80, pulse 72, temperature 98.6, respiratory rate 16, oxygen saturation 98%, pain score 3 out of 10, mild chest discomfort"
Output: {{"progress_date": "2025-01-09", "progress_time": "10:00", "progress_notes": "patient stable", "vitals_pulse": "72", "vitals_blood_pressure": "120/80", "vitals_respiratory_rate": "16", "vitals_temperature": "98.6", "vitals_oxygen_saturation": "98%", "pain_vas_score": 3, "pain_description": "mild chest discomfort"}}
""",

        "patient_file_section4": f"""
You are a medical scribe for PATIENT FILE - SECTION 4 (Diagnostics). Extract diagnostic orders, results, and follow-up information from medical staff speech.

CONTEXT: Medical staff is dictating diagnostic information covering:
-- Diagnostic tests ordered (laboratory, radiology, others)
-- Test results and findings
-- Follow-up instructions and responsible personnel

FORM FIELDS TO POPULATE:
-- Diagnostics Ordered: Laboratory, radiology, and other diagnostic tests
-- Timing: Date and time of diagnostics
-- Results: Detailed findings and results
-- Follow-up: Instructions and responsible physician information

Return JSON ONLY with the EXACT keys:

{{
  "diagnostics_laboratory": "string - laboratory investigations",
  "diagnostics_radiology": "string - radiology investigations",
  "diagnostics_others": "string - other diagnostic tests",
  "diagnostics_date_time": "string - date and time of diagnostics",
  "diagnostics_results": "string - detailed findings and results",
  "follow_up_instructions": "string - follow-up instructions",
  "responsible_physician": "string - responsible physician name",
  "signature": "string - signature",
  "signature_date_time": "string - signature date and time"
}}

RULES:
-- Extract exact details from speech
-- Use proper medical terminology
-- Group diagnostic tests by category (lab, radiology, others)
-- Include detailed results and findings
-- Output only JSON, no extra text
-- Language: {language}

EXAMPLES:
Input: "Ordered CBC, chest X-ray, ECG for patient, results show elevated WBC count, normal chest X-ray, abnormal ECG with ST elevation, follow-up with cardiology, Dr. Smith responsible"
Output: {{"diagnostics_laboratory": "CBC", "diagnostics_radiology": "chest X-ray", "diagnostics_others": "ECG", "diagnostics_date_time": "2025-01-09 10:00", "diagnostics_results": "elevated WBC count, normal chest X-ray, abnormal ECG with ST elevation", "follow_up_instructions": "follow-up with cardiology", "responsible_physician": "Dr. Smith", "signature": "Dr. Smith", "signature_date_time": "2025-01-09 10:00"}}
""",

        "patient_file_section5": f"""
You are a medical scribe for PATIENT FILE - SECTION 5 (Patient Vitals Chart - Nursing Assessment). Extract nursing assessment information including vitals, examination findings, and risk assessments from medical staff speech.

CONTEXT: Nursing staff is dictating patient assessment information covering:
-- Vital signs measurements and monitoring
-- Physical examination findings
-- Current medications and investigations
-- Risk assessments and special care requirements

FORM FIELDS TO POPULATE:
-- Vitals: Blood pressure, pulse, temperature, respiratory rate, weight, GRBS, saturation
-- Examination: Consciousness level, skin integrity, respiratory status, other findings
-- Additional: Current medications, investigations, diet, special care, pain score
-- Risk Assessments: Fall risk, DVT risk, pressure sores risk
-- Documentation: Nurse signature and assessment timing

Return JSON ONLY with the EXACT keys:

{{
  "vitals_bp": "string - blood pressure",
  "vitals_pulse": "string - pulse rate",
  "vitals_temperature": "string - temperature",
  "vitals_respiratory_rate": "string - respiratory rate",
  "vitals_weight": "string - weight",
  "vitals_grbs": "string - GRBS if required",
  "vitals_saturation": "string - oxygen saturation if required",
  "examination_consciousness": "string - level of consciousness",
  "examination_skin_integrity": "string - skin integrity assessment",
  "examination_respiratory_status": "string - respiratory status",
  "examination_other_findings": "string - other clinical findings",
  "current_medications": "string - current medications",
  "investigations_ordered": "string - investigations ordered",
  "diet": "string - diet information",
  "vulnerable_special_care": true/false,
  "pain_score": 0-10,
  "pressure_sores": true/false,
  "pressure_sores_description": "string - pressure sores description if yes",
  "restraints_used": true/false,
  "risk_fall": true/false,
  "risk_dvt": true/false,
  "risk_pressure_sores": true/false,
  "nurse_signature": "string - nurse signature",
  "assessment_date_time": "string - assessment date and time"
}}

RULES:
-- Extract exact details from speech
-- Use proper medical terminology
-- Pain score must be integer 0-10
-- Boolean fields should be true/false or null
-- If no pain mentioned, pain_score should be null
-- Output only JSON, no extra text
-- Language: {language}

EXAMPLES:
Input: "Nursing assessment, patient alert and oriented, BP 120/80, pulse 72, temperature 98.6, respiratory rate 16, weight 70kg, oxygen saturation 98%, skin intact, no pressure sores, fall risk low, pain score 2, on aspirin and metformin, normal diet, Nurse Johnson signature"
Output: {{"vitals_bp": "120/80", "vitals_pulse": "72", "vitals_temperature": "98.6", "vitals_respiratory_rate": "16", "vitals_weight": "70kg", "vitals_grbs": null, "vitals_saturation": "98%", "examination_consciousness": "alert and oriented", "examination_skin_integrity": "intact", "examination_respiratory_status": "normal", "examination_other_findings": "", "current_medications": "aspirin and metformin", "investigations_ordered": "", "diet": "normal", "vulnerable_special_care": false, "pain_score": 2, "pressure_sores": false, "pressure_sores_description": "", "restraints_used": false, "risk_fall": false, "risk_dvt": false, "risk_pressure_sores": false, "nurse_signature": "Nurse Johnson", "assessment_date_time": "2025-01-09 10:00"}}
""",

        "patient_file_section6": f"""
You are a medical scribe for PATIENT FILE - SECTION 6 (Doctors Discharge Planning). Extract discharge planning information including medications, instructions, and follow-up care from medical staff speech.

CONTEXT: Medical staff is dictating discharge planning information covering:
-- Discharge date and diagnosis
-- Discharge medications and instructions
-- Patient condition and special requirements
-- Follow-up care and monitoring

FORM FIELDS TO POPULATE:
-- Discharge Planning: Date, diagnosis, medications table
-- Patient Status: Vitals, blood sugar, diet, condition, pain score
-- Instructions: Special instructions, physical activity, physiotherapy
-- Documentation: Doctor signature and timing

Return JSON ONLY with the EXACT keys:

{{
  "discharge_likely_date": "YYYY-MM-DD",
  "discharge_complete_diagnosis": "string - complete diagnosis",
  "discharge_medications": [{{"sl_no": 1, "name": "medication name", "dose": "dose", "frequency": "frequency", "duration": "duration"}}],
  "discharge_vitals": "string - vitals at discharge",
  "discharge_blood_sugar": "string - blood sugar if applicable",
  "discharge_blood_sugar_controlled": true/false,
  "discharge_diet": "string - diet at discharge",
  "discharge_condition": "string - condition at discharge",
  "discharge_pain_score": 0-10,
  "discharge_special_instructions": "string - special instructions",
  "discharge_physical_activity": "string - physical activity instructions",
  "discharge_physiotherapy": "string - physiotherapy instructions",
  "discharge_others": "string - other instructions",
  "discharge_report_in_case_of": "string - report instructions",
  "doctor_name_signature": "string - doctor name and signature"
}}

RULES:
-- Extract exact details from speech
-- Use proper medical terminology
-- Dates must be YYYY-MM-DD format
-- Medications should be array of objects with sl_no, name, dose, frequency, duration
-- Pain score must be integer 0-10
-- Boolean fields should be true/false or null
-- Output only JSON, no extra text
-- Language: {language}

EXAMPLES:
Input: "Discharge planned for January 12th, diagnosis acute coronary syndrome, discharge medications aspirin 75mg daily, metformin 500mg twice daily, vitals stable, blood sugar controlled, normal diet, ambulatory, pain score 0, follow-up in 1 week, Dr. Sharma"
Output: {{"discharge_likely_date": "2025-01-12", "discharge_complete_diagnosis": "acute coronary syndrome", "discharge_medications": [{{"sl_no": 1, "name": "aspirin", "dose": "75mg", "frequency": "daily", "duration": ""}}, {{"sl_no": 2, "name": "metformin", "dose": "500mg", "frequency": "twice daily", "duration": ""}}], "discharge_vitals": "stable", "discharge_blood_sugar": "", "discharge_blood_sugar_controlled": true, "discharge_diet": "normal", "discharge_condition": "ambulatory", "discharge_pain_score": 0, "discharge_special_instructions": "follow-up in 1 week", "discharge_physical_activity": "", "discharge_physiotherapy": "", "discharge_others": "", "discharge_report_in_case_of": "", "doctor_name_signature": "Dr. Sharma"}}
""",

        "patient_file_section7": f"""
You are a medical scribe for PATIENT FILE - SECTION 7 (Follow Up Instructions). Extract follow-up care instructions, cross-consultation details, and discharge advice from medical staff speech.

CONTEXT: Medical staff is dictating follow-up care information covering:
-- Follow-up instructions and review schedule
-- Cross-consultation diagnosis and treatment
-- Discharge advice and monitoring requirements

FORM FIELDS TO POPULATE:
-- Follow-up Instructions: Review schedule and monitoring
-- Cross-consultation: Diagnosis and treatment details
-- Discharge Advice: General advice and instructions

Return JSON ONLY with the EXACT keys:

{{
  "follow_up_instructions": "string - follow-up instructions and review schedule",
  "cross_consultation_diagnosis": "string - cross-consultation diagnosis and treatment",
  "discharge_advice": "string - discharge advice and instructions"
}}

RULES:
-- Extract exact details from speech
-- Use proper medical terminology
-- Include all follow-up care details
-- Output only JSON, no extra text
-- Language: {language}

EXAMPLES:
Input: "Follow-up with cardiology in 1 week, cardiology consultation shows stable condition, discharge advice includes medication compliance, lifestyle modifications, report chest pain immediately"
Output: {{"follow_up_instructions": "Follow-up with cardiology in 1 week", "cross_consultation_diagnosis": "Cardiology consultation shows stable condition", "discharge_advice": "Medication compliance, lifestyle modifications, report chest pain immediately"}}
""",

        "patient_file_section8": f"""
You are a medical scribe for PATIENT FILE - SECTION 8 (Nursing Care Plan / Nurse's Record). Extract nursing care plan information including assessments, interventions, and medication administration from medical staff speech.

CONTEXT: Nursing staff is dictating care plan information covering:
-- Basic record information and shift details
-- Patient condition overview and assessment findings
-- Nursing diagnosis and care planning
-- Interventions and patient education
-- Medication administration records
-- Evaluation and response to care

FORM FIELDS TO POPULATE:
-- Basic Information: Date, time, nurse name, shift, patient condition
-- Care Plan: Assessment findings, nursing diagnosis, goals, interventions
-- Education: Patient education and counseling provided
-- Evaluation: Response to care and outcomes
-- Medication: Administration records with details
-- Additional: Any other observations or instructions

Return JSON ONLY with the EXACT keys:

{{
  "record_date": "YYYY-MM-DD",
  "record_time": "HH:MM",
  "nurse_name": "string - nurse name",
  "shift": "string - Morning/Evening/Night",
  "patient_condition_overview": "string - patient condition overview",
  "assessment_findings": "string - assessment findings",
  "nursing_diagnosis": "string - nursing diagnosis",
  "goals_expected_outcomes": "string - goals and expected outcomes",
  "interventions_nursing_actions": "string - interventions and nursing actions",
  "patient_education_counseling": "string - patient education and counseling",
  "evaluation_response_to_care": "string - evaluation and response to care",
  "medication_administration": [{{"medication_name": "string", "dose": "string", "route": "string", "time_given": "string", "administered_by": "string", "signature": "string"}}],
  "additional_notes": "string - additional notes and observations"
}}

RULES:
-- Extract exact details from speech
-- Use proper medical terminology
-- Dates must be YYYY-MM-DD format
-- Times must be HH:MM 24-hour format
-- Shift must be one of: Morning, Evening, Night
-- Medication administration should be array of objects
-- Output only JSON, no extra text
-- Language: {language}

EXAMPLES:
Input: "Nursing record for January 9th, 10:00 AM, Nurse Johnson, morning shift, patient stable and comfortable, assessment shows improved condition, nursing diagnosis risk for infection, goals maintain asepsis, interventions wound care and monitoring, patient educated on medication compliance, evaluation shows good response, administered aspirin 75mg oral at 10:30, additional notes patient cooperative"
Output: {{"record_date": "2025-01-09", "record_time": "10:00", "nurse_name": "Nurse Johnson", "shift": "Morning", "patient_condition_overview": "stable and comfortable", "assessment_findings": "improved condition", "nursing_diagnosis": "risk for infection", "goals_expected_outcomes": "maintain asepsis", "interventions_nursing_actions": "wound care and monitoring", "patient_education_counseling": "medication compliance", "evaluation_response_to_care": "good response", "medication_administration": [{{"medication_name": "aspirin", "dose": "75mg", "route": "oral", "time_given": "10:30", "administered_by": "Nurse Johnson", "signature": "Nurse Johnson"}}], "additional_notes": "patient cooperative"}}
""",

        "patient_file_section9": f"""
You are a medical scribe for PATIENT FILE - SECTION 9 (Intake and Output Chart). Extract fluid balance monitoring information including intake, output, and calculated totals from medical staff speech.

CONTEXT: Medical staff is dictating fluid balance information covering:
-- Intake measurements (oral, IV, medications, other)
-- Output measurements (urine, vomitus, drainage, stool, other)
-- Calculated totals and net balance
-- Clinical remarks and sign-off information

FORM FIELDS TO POPULATE:
-- Basic Information: Date and time of charting
-- Intake: Oral intake, IV fluids, medications, other intake with specifications
-- Output: Urine output, vomitus, drainage, stool, other output with specifications
-- Totals: Calculated total intake, total output, net balance
-- Documentation: Remarks, nurse name, signature, sign-off time

Return JSON ONLY with the EXACT keys:

{{
  "chart_date": "YYYY-MM-DD",
  "chart_time": "HH:MM",
  "intake_oral": 0,
  "intake_iv_fluids": 0,
  "intake_medications": 0,
  "intake_other_specify": "string - other intake specification",
  "intake_other_amount": 0,
  "output_urine": 0,
  "output_vomitus": 0,
  "output_drainage": 0,
  "output_stool": "string - stool description or number",
  "output_other_specify": "string - other output specification",
  "output_other_amount": 0,
  "total_intake": 0,
  "total_output": 0,
  "net_balance": 0,
  "remarks_notes": "string - additional notes or concerns",
  "nurse_name": "string - nurse name",
  "signature": "string - signature",
  "signoff_date_time": "string - sign-off date and time"
}}

RULES:
-- Extract exact details from speech
-- Use proper medical terminology
-- All amounts should be in milliliters (ml) as integers
-- Dates must be YYYY-MM-DD format
-- Times must be HH:MM 24-hour format
-- Calculate totals: total_intake = oral + iv_fluids + medications + other_amount
-- Calculate totals: total_output = urine + vomitus + drainage + other_amount
-- Calculate net_balance = total_intake - total_output
-- Output only JSON, no extra text
-- Language: {language}

EXAMPLES:
Input: "Intake output chart for January 9th, 10:00 AM, oral intake 500ml, IV fluids 1000ml, medications 50ml, urine output 600ml, drainage 100ml, stool normal, total intake 1550ml, total output 700ml, net balance positive 850ml, patient stable, Nurse Wilson signature"
Output: {{"chart_date": "2025-01-09", "chart_time": "10:00", "intake_oral": 500, "intake_iv_fluids": 1000, "intake_medications": 50, "intake_other_specify": "", "intake_other_amount": 0, "output_urine": 600, "output_vomitus": 0, "output_drainage": 100, "output_stool": "normal", "output_other_specify": "", "output_other_amount": 0, "total_intake": 1550, "total_output": 700, "net_balance": 850, "remarks_notes": "patient stable", "nurse_name": "Nurse Wilson", "signature": "Nurse Wilson", "signoff_date_time": "2025-01-09 10:00"}}
""",

        "patient_file_section10": f"""
You are a medical scribe for PATIENT FILE - SECTION 10 (Nutritional Screening). Extract nutritional screening information including physical measurements, dietary assessment, and risk factors from medical staff speech.

CONTEXT: Medical staff is dictating nutritional screening information covering:
-- Patient demographics and basic information
-- Physical measurements (weight, height, BMI)
-- Weight loss assessment and appetite status
-- Dietary restrictions and current diet
-- Risk factors for malnutrition
-- Screening outcome and documentation

FORM FIELDS TO POPULATE:
-- Basic Information: Patient name, hospital number, age, sex, screening date
-- Physical Measurements: Weight, height, BMI (calculated)
-- Weight Loss: Recent weight loss, amount, period
-- Dietary Assessment: Appetite status, swallowing difficulties, restrictions, current diet
-- Risk Factors: Chronic illness, infections, surgery, others
-- Screening Outcome: Normal, At Risk, Malnourished
-- Documentation: Completed by, signature, date

Return JSON ONLY with the EXACT keys:

{{
  "patient_name": "string - patient name",
  "hospital_number": "string - hospital number",
  "age": 0,
  "sex": "string - Male/Female/Other",
  "screening_date": "YYYY-MM-DD",
  "weight": 0.0,
  "height": 0.0,
  "bmi": 0.0,
  "recent_weight_loss": true/false,
  "weight_loss_amount": 0.0,
  "weight_loss_period": "string - weeks/months",
  "appetite_status": "string - Good/Fair/Poor/None",
  "swallowing_difficulties": true/false,
  "dietary_restrictions": "string - dietary restrictions",
  "current_diet": "string - current diet",
  "risk_chronic_illness": true/false,
  "risk_infections": true/false,
  "risk_surgery": true/false,
  "risk_others": "string - other risk factors",
  "screening_outcome": "string - Normal/At Risk/Malnourished",
  "screening_completed_by": "string - completed by",
  "screening_signature_date": "string - signature date"
}}

RULES:
-- Extract exact details from speech
-- Use proper medical terminology
-- Weight in kg, height in cm, BMI as calculated value
-- Dates must be YYYY-MM-DD format
-- Boolean fields should be true/false or null
-- Appetite status must be one of: Good, Fair, Poor, None
-- Screening outcome must be one of: Normal, At Risk, Malnourished
-- Output only JSON, no extra text
-- Language: {language}

EXAMPLES:
Input: "Nutritional screening for Rajesh Kumar, hospital number H123456, age 45 male, screening date January 9th, weight 70kg, height 175cm, BMI 22.9, no recent weight loss, appetite good, no swallowing difficulties, no dietary restrictions, normal diet, no chronic illness, no infections, no surgery planned, screening outcome normal, completed by Nurse Wilson"
Output: {{"patient_name": "Rajesh Kumar", "hospital_number": "H123456", "age": 45, "sex": "Male", "screening_date": "2025-01-09", "weight": 70.0, "height": 175.0, "bmi": 22.9, "recent_weight_loss": false, "weight_loss_amount": null, "weight_loss_period": "", "appetite_status": "Good", "swallowing_difficulties": false, "dietary_restrictions": "", "current_diet": "normal", "risk_chronic_illness": false, "risk_infections": false, "risk_surgery": false, "risk_others": "", "screening_outcome": "Normal", "screening_completed_by": "Nurse Wilson", "screening_signature_date": "2025-01-09"}}
""",

        "patient_file_section11": f"""
You are a medical scribe for PATIENT FILE - SECTION 11 (Nutrition Assessment Form - NAF). Extract comprehensive nutrition assessment information including anthropometric measurements, dietary history, and care planning from medical staff speech.

CONTEXT: Medical staff is dictating nutrition assessment information covering:
-- Patient details and assessment date
-- Dietary history and eating patterns
-- Anthropometric measurements (weight, height, MUAC, skinfold)
-- Biochemical data and clinical signs
-- Functional assessment and nutritional diagnosis
-- Nutrition care plan and monitoring

FORM FIELDS TO POPULATE:
-- Patient Details: Name, age, sex, hospital number, assessment date
-- Dietary History: Eating patterns and food preferences
-- Anthropometric: Weight, height, MUAC, skinfold thickness
-- Assessment Data: Biochemical data, clinical signs, functional assessment
-- Care Plan: Nutritional diagnosis, recommended plan, monitoring
-- Documentation: Assessed by, signature, date

Return JSON ONLY with the EXACT keys:

{{
  "patient_name": "string - patient name",
  "patient_age": 0,
  "patient_sex": "string - Male/Female/Other",
  "hospital_number": "string - hospital number",
  "assessment_date": "YYYY-MM-DD",
  "dietary_history": "string - dietary history",
  "weight_kg": 0.0,
  "height_cm": 0.0,
  "muac_cm": 0.0,
  "skinfold_thickness": 0.0,
  "biochemical_data": "string - lab results",
  "clinical_signs_malnutrition": "string - clinical signs",
  "functional_assessment": "string - functional assessment",
  "nutritional_diagnosis": "string - nutritional diagnosis",
  "recommended_care_plan": "string - care plan",
  "monitoring_evaluation_plan": "string - monitoring plan",
  "assessed_by": "string - assessed by",
  "assessment_signature_date": "string - signature date"
}}

RULES:
-- Extract exact details from speech
-- Use proper medical terminology
-- Weight in kg, height in cm, MUAC in cm, skinfold in mm
-- Dates must be YYYY-MM-DD format
-- Include comprehensive dietary and nutritional information
-- Output only JSON, no extra text
-- Language: {language}

EXAMPLES:
Input: "Nutrition assessment for Rajesh Kumar, age 45 male, hospital H123456, assessment date January 9th, dietary history regular meals, weight 70kg, height 175cm, MUAC 28cm, skinfold 12mm, normal lab values, no clinical signs of malnutrition, good functional status, nutritional diagnosis adequate nutrition, recommended plan maintain current diet, monitoring weekly weight, assessed by Dietitian Smith"
Output: {{"patient_name": "Rajesh Kumar", "patient_age": 45, "patient_sex": "Male", "hospital_number": "H123456", "assessment_date": "2025-01-09", "dietary_history": "regular meals", "weight_kg": 70.0, "height_cm": 175.0, "muac_cm": 28.0, "skinfold_thickness": 12.0, "biochemical_data": "normal lab values", "clinical_signs_malnutrition": "no clinical signs", "functional_assessment": "good functional status", "nutritional_diagnosis": "adequate nutrition", "recommended_care_plan": "maintain current diet", "monitoring_evaluation_plan": "weekly weight", "assessed_by": "Dietitian Smith", "assessment_signature_date": "2025-01-09"}}
""",

        "patient_file_section12": f"""
You are a medical scribe for PATIENT FILE - SECTION 12 (Diet Chart). Extract comprehensive dietary management information including meal schedules, diet types, and nutritional instructions from medical staff speech.

CONTEXT: Medical staff is dictating diet chart information covering:
-- Patient demographics and admission details
-- Diet type classification and specifications
-- Daily meal schedule with detailed food items and instructions
-- Special nutritional requirements and restrictions
-- Dietary consultation requirements and sign-off

FORM FIELDS TO POPULATE:
-- Basic Information: Patient name, hospital number, age, sex, admission date
-- Diet Type: Normal, Soft, Diabetic, Renal, Liquid, Others with specification
-- Daily Meals: Breakfast, Mid-Morning, Lunch, Afternoon, Dinner, Bedtime with details and notes
-- Special Instructions: Additional dietary requirements and restrictions
-- Consultation: Required consultation, dietician name, consultation date
-- Sign-off: Signed by, designation, date and time

Return JSON ONLY with the EXACT keys:

{{
  "patient_name": "string - patient name",
  "hospital_number": "string - hospital number",
  "age": 0,
  "sex": "string - Male/Female/Other",
  "admission_date": "YYYY-MM-DD",
  "diet_type": "string - Normal/Soft/Diabetic/Renal/Liquid/Others",
  "diet_type_others": "string - specify if Others",
  "breakfast_details": "string - breakfast food items and calories",
  "breakfast_notes": "string - breakfast instructions",
  "mid_morning_details": "string - mid-morning food items",
  "mid_morning_notes": "string - mid-morning instructions",
  "lunch_details": "string - lunch food items and calories",
  "lunch_notes": "string - lunch instructions",
  "afternoon_details": "string - afternoon food items",
  "afternoon_notes": "string - afternoon instructions",
  "dinner_details": "string - dinner food items and calories",
  "dinner_notes": "string - dinner instructions",
  "bedtime_details": "string - bedtime food items",
  "bedtime_notes": "string - bedtime instructions",
  "special_nutritional_instructions": "string - special dietary requirements",
  "consultation_required": true/false,
  "dietician_name": "string - dietician name",
  "consultation_date": "YYYY-MM-DD",
  "signed_by": "string - signed by",
  "designation": "string - designation",
  "signoff_date_time": "string - sign-off date and time"
}}

RULES:
-- Extract exact details from speech
-- Use proper medical terminology
-- Diet type must be one of: Normal, Soft, Diabetic, Renal, Liquid, Others
-- Dates must be YYYY-MM-DD format
-- Boolean fields should be true/false or null
-- Include detailed food items, calories, and restrictions for each meal
-- Output only JSON, no extra text
-- Language: {language}

EXAMPLES:
Input: "Diet chart for Rajesh Kumar, hospital H123456, age 45 male, admission date January 9th, diabetic diet, breakfast oatmeal with fruits 300 calories, mid-morning apple, lunch grilled chicken with vegetables 500 calories, afternoon yogurt, dinner fish with rice 400 calories, bedtime milk, special instructions monitor blood sugar, consultation required, dietician Smith, consultation date January 10th, signed by Nurse Wilson, dietitian"
Output: {{"patient_name": "Rajesh Kumar", "hospital_number": "H123456", "age": 45, "sex": "Male", "admission_date": "2025-01-09", "diet_type": "Diabetic", "diet_type_others": "", "breakfast_details": "oatmeal with fruits 300 calories", "breakfast_notes": "", "mid_morning_details": "apple", "mid_morning_notes": "", "lunch_details": "grilled chicken with vegetables 500 calories", "lunch_notes": "", "afternoon_details": "yogurt", "afternoon_notes": "", "dinner_details": "fish with rice 400 calories", "dinner_notes": "", "bedtime_details": "milk", "bedtime_notes": "", "special_nutritional_instructions": "monitor blood sugar", "consultation_required": true, "dietician_name": "Smith", "consultation_date": "2025-01-10", "signed_by": "Nurse Wilson", "designation": "dietitian", "signoff_date_time": "2025-01-09 10:00"}}
"""
    }
    
    return prompts.get(section, prompts["handover_outgoing"])

def _fallback_mapping(section: str, text: str, language: str) -> Dict[str, Any]:
    """Fallback mapping when OpenAI is not available"""
    print(f"Fallback mapping called with section: {section}, text: {text[:100]}...")
    
    if section == "admission":
        # Enhanced fallback mapping for admission with better date/time extraction
        from datetime import datetime
        today = datetime.now().strftime("%Y-%m-%d")  # YYYY-MM-DD format for HTML date input
        current_time = datetime.now().strftime("%H:%M")  # HH:MM format for HTML time input
        
        # Try to extract date/time from the text if possible
        text_lower = text.lower()
        extracted_date = today  # default
        extracted_time = current_time  # default
        
        # Enhanced date pattern matching
        import re
        
        # Look for date patterns in text
        date_patterns = [
            r'(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})',  # DD-MM-YYYY or DD/MM/YYYY
            r'(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{2,4})',  # DD Month YYYY
            r'(today|tomorrow|yesterday)'
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text_lower)
            if match:
                if "today" in match.group(0):
                    extracted_date = today
                elif "tomorrow" in match.group(0):
                    tomorrow = (datetime.now().replace(day=datetime.now().day + 1)).strftime("%Y-%m-%d")
                    extracted_date = tomorrow
                elif "yesterday" in match.group(0):
                    yesterday = (datetime.now().replace(day=datetime.now().day - 1)).strftime("%Y-%m-%d")
                    extracted_date = yesterday
                elif len(match.groups()) == 3:
                    # Handle DD-MM-YYYY format and convert to YYYY-MM-DD
                    day, month, year = match.groups()
                    if len(year) == 2:
                        year = "20" + year
                    extracted_date = f"{year}-{month.zfill(2)}-{day.zfill(2)}"
                break
        
        # Enhanced time pattern matching
        time_patterns = [
            r'(\d{1,2}):(\d{2})\s*(am|pm)',
            r'(\d{1,2})\s*(am|pm)',
            r'at\s+(\d{1,2}):(\d{2})',
            r'at\s+(\d{1,2})\s*(am|pm)',
            r'time\s+(\d{1,2}):(\d{2})',
            r'time\s+(\d{1,2})\s*(am|pm)',
            r'(now|current time)'
        ]
        
        for pattern in time_patterns:
            match = re.search(pattern, text_lower)
            if match:
                if "now" in match.group(0) or "current time" in match.group(0):
                    extracted_time = current_time
                elif len(match.groups()) >= 2:
                    hour = int(match.group(1))
                    if len(match.groups()) == 3:  # has minutes
                        minute = int(match.group(2))
                        period = match.group(3).upper()
                    else:  # no minutes
                        minute = 0
                        period = match.group(2).upper()
                    
                    if period == "PM" and hour != 12:
                        hour += 12
                    elif period == "AM" and hour == 12:
                        hour = 0
                    
                    extracted_time = f"{hour:02d}:{minute:02d}"
                break
        
        return {
            "name": "Ravi Kumar",
            "age": 45,
            "gender": "male",
            "mobile_no": "7976636359",
            "admitted_under_doctor": "Dr. Ravikant Porwal",
            "attender_name": "Pradeep Shihani",
            "relation": "son",
            "attender_mobile_no": "7976636359",
            "aadhaar_number": "1234 5678 9012",
            "admission_date": extracted_date,
            "admission_time": extracted_time,
            "ward": "Cardiology",
            "bed_number": "A-101",
            "reason": "Chest pain and fever"
        }
    elif section == "doctor_note":
        # Deterministic demo fallback for doctor notes
        return {
            "chief_complaint": "Chest pain",
            "hpi": "Intermittent chest discomfort for 6 hours, radiation to left arm.",
            "physical_exam": "Vitals stable, normal S1/S2, no murmurs.",
            "diagnosis": ["Suspected angina"],
            "orders": ["ECG", "Troponin-I", "Chest X-ray"],
            "prescriptions": ["Aspirin 75 mg OD", "Atorvastatin 20 mg HS"],
            "advice": "Admit to CCU; monitor; review in 12h."
        }
    elif section == "handover_outgoing":
        return {
            "patient_condition": "Stable, responsive to treatment",
            "vital_signs": "BP 120/80, HR 72, Temp 98.6°F",
            "medications": ["Paracetamol 500mg", "Amlodipine 5mg"],
            "pending_tasks": ["Blood work review", "Family meeting"],
            "special_instructions": "Monitor vitals every 4 hours"
        }
    elif section == "handover_incoming":
        return {
            "shift_summary": "Quiet night, all patients stable",
            "patient_updates": "Patient in bed 5 improved, ready for discharge",
            "new_orders": ["Discharge planning", "Physical therapy consult"],
            "alerts": ["Patient in bed 3 needs pain assessment"],
            "follow_up_required": "Call family for patient in bed 2"
        }
    elif section == "handover_incharge":
        return {
            "ward_summary": "All 12 beds occupied, 2 critical patients",
            "critical_patients": ["Bed 3 - Post-op monitoring", "Bed 7 - ICU transfer pending"],
            "staff_assignments": "Nurse A - Beds 1-6, Nurse B - Beds 7-12",
            "equipment_status": "All monitors functioning, 1 IV pump needs repair",
            "administrative_notes": "New admission expected in 2 hours"
        }
    elif section == "handover_summary":
        return {
            "overall_condition": "Ward running smoothly, all patients stable",
            "key_events": ["Successful surgery on bed 3", "Discharge of bed 8"],
            "medication_changes": ["Increased pain meds for bed 5", "New antibiotic for bed 2"],
            "family_communication": "Family meetings completed for beds 1, 4, 6",
            "next_shift_priorities": ["Prepare bed 8 for new admission", "Review lab results"]
        }
    elif section == "discharge":
        return {
            "discharge_diagnosis": ["Acute myocardial infarction", "Hypertension"],
            "treatment_summary": "Successfully treated with PCI, patient stable",
            "medications": ["Aspirin 75mg daily", "Atorvastatin 20mg at bedtime"],
            "follow_up_instructions": "Cardiology follow-up in 1 week, continue medications",
            "discharge_date": "2025-01-15"
        }
    elif section == "operation_record_section1":
        return {
            "pre_operative_diagnosis": "Acute appendicitis",
            "planned_procedure": "Laparoscopic appendectomy",
            "pre_operative_assessment_completed": True,
            "informed_consent_obtained": True
        }
    elif section == "operation_record_section2":
        return {
            "surgeons": "Dr. Smith, Dr. Johnson",
            "assistants": "Dr. Brown, Nurse Wilson",
            "anaesthesiologist": "Dr. Davis",
            "type_of_anaesthesia": "General anaesthesia",
            "anaesthesia_medications": "Propofol, Fentanyl, Rocuronium"
        }
    elif section == "operation_record_section3":
        return {
            "procedure_performed": "Laparoscopic appendectomy",
            "operative_findings": "Inflamed appendix with localized peritonitis",
            "estimated_blood_loss": "50ml",
            "blood_iv_fluids_given": "500ml normal saline",
            "specimens_removed": "Appendix sent for histopathology",
            "intra_operative_events": "No complications",
            "instrument_count_verified": True
        }
    elif section == "operation_record_section4":
        return {
            "post_operative_diagnosis": "Acute appendicitis",
            "post_operative_plan": "Pain management, antibiotics, early mobilization",
            "patient_condition_on_transfer": "Stable, responsive",
            "transferred_to": "Recovery",
            "surgeon_signature": "Dr. Smith",
            "anaesthesiologist_signature": "Dr. Davis",
            "nursing_staff_signature": "Nurse Wilson"
        }
    elif section == "patient_file_section1":
        return {
            "patient_name": "Rajesh Kumar",
            "age": 45,
            "sex": "Male",
            "date_of_admission": "2025-01-09",
            "ward": "Cardiology",
            "bed_number": "A-101",
            "drug_hypersensitivity_allergy": "Penicillin allergy",
            "consultant": "Dr. Sharma",
            "diagnosis": "Chest pain, rule out MI",
            "diet": {"type": "Normal", "notes": "Regular diet as tolerated"},
            "medication_orders": [
                {
                    "date": "2025-01-09",
                    "time": "10:00",
                    "drug_name": "Aspirin",
                    "strength": "75mg",
                    "route": "Oral",
                    "doctor_name_verbal_order": "Dr. Sharma",
                    "doctor_signature": "Dr. Sharma",
                    "verbal_order_taken_by": "Nurse Wilson",
                    "time_of_administration": "10:15",
                    "administered_by": "Nurse Wilson",
                    "administration_witnessed_by": "Nurse Johnson"
                }
            ]
        }
    elif section == "patient_file_section2":
        return {
            "hospital_number": "H123456",
            "name": "Rajesh Kumar",
            "age": 45,
            "sex": "Male",
            "chief_complaints": "Chest pain for 2 days",
            "history_present_illness": "Patient reports chest pain started 2 days ago",
            "past_history": "Hypertension",
            "sensorium": "Conscious",
            "pallor": False,
            "cyanosis": False,
            "clubbing": False,
            "icterus": False,
            "lymphadenopathy": False,
            "provisional_diagnosis": "Acute coronary syndrome",
            "diet": "Normal",
            "nursing_vitals_bp": "140/90",
            "nursing_vitals_pulse": "88",
            "discharge_likely_date": "2025-01-12"
        }
    elif section == "patient_file_section3":
        return {
            "progress_date": "2025-01-09",
            "progress_time": "10:00",
            "progress_notes": "Patient stable, responding well to treatment",
            "vitals_pulse": "72",
            "vitals_blood_pressure": "120/80",
            "vitals_respiratory_rate": "16",
            "vitals_temperature": "98.6",
            "vitals_oxygen_saturation": "98%",
            "pain_vas_score": 3,
            "pain_description": "Mild chest discomfort"
        }
    elif section == "patient_file_section4":
        return {
            "diagnostics_laboratory": "CBC, Basic Metabolic Panel",
            "diagnostics_radiology": "Chest X-ray, ECG",
            "diagnostics_others": "Echocardiogram",
            "diagnostics_date_time": "2025-01-09 10:00",
            "diagnostics_results": "Normal CBC, clear chest X-ray, abnormal ECG with ST elevation",
            "follow_up_instructions": "Follow-up with cardiology in 1 week",
            "responsible_physician": "Dr. Smith",
            "signature": "Dr. Smith",
            "signature_date_time": "2025-01-09 10:00"
        }
    elif section == "patient_file_section5":
        return {
            "vitals_bp": "120/80",
            "vitals_pulse": "72",
            "vitals_temperature": "98.6",
            "vitals_respiratory_rate": "16",
            "vitals_weight": "70kg",
            "vitals_grbs": None,
            "vitals_saturation": "98%",
            "examination_consciousness": "alert and oriented",
            "examination_skin_integrity": "intact",
            "examination_respiratory_status": "normal",
            "examination_other_findings": "",
            "current_medications": "aspirin and metformin",
            "investigations_ordered": "",
            "diet": "normal",
            "vulnerable_special_care": False,
            "pain_score": 2,
            "pressure_sores": False,
            "pressure_sores_description": "",
            "restraints_used": False,
            "risk_fall": False,
            "risk_dvt": False,
            "risk_pressure_sores": False,
            "nurse_signature": "Nurse Johnson",
            "assessment_date_time": "2025-01-09 10:00"
        }
    elif section == "patient_file_section6":
        return {
            "discharge_likely_date": "2025-01-12",
            "discharge_complete_diagnosis": "acute coronary syndrome",
            "discharge_medications": [
                {"sl_no": 1, "name": "aspirin", "dose": "75mg", "frequency": "daily", "duration": ""},
                {"sl_no": 2, "name": "metformin", "dose": "500mg", "frequency": "twice daily", "duration": ""}
            ],
            "discharge_vitals": "stable",
            "discharge_blood_sugar": "",
            "discharge_blood_sugar_controlled": True,
            "discharge_diet": "normal",
            "discharge_condition": "ambulatory",
            "discharge_pain_score": 0,
            "discharge_special_instructions": "follow-up in 1 week",
            "discharge_physical_activity": "",
            "discharge_physiotherapy": "",
            "discharge_others": "",
            "discharge_report_in_case_of": "",
            "doctor_name_signature": "Dr. Sharma"
        }
    elif section == "patient_file_section7":
        return {
            "follow_up_instructions": "Follow-up with cardiology in 1 week",
            "cross_consultation_diagnosis": "Cardiology consultation shows stable condition",
            "discharge_advice": "Medication compliance, lifestyle modifications, report chest pain immediately"
        }
    elif section == "patient_file_section8":
        return {
            "record_date": "2025-01-09",
            "record_time": "10:00",
            "nurse_name": "Nurse Johnson",
            "shift": "Morning",
            "patient_condition_overview": "stable and comfortable",
            "assessment_findings": "improved condition",
            "nursing_diagnosis": "risk for infection",
            "goals_expected_outcomes": "maintain asepsis",
            "interventions_nursing_actions": "wound care and monitoring",
            "patient_education_counseling": "medication compliance",
            "evaluation_response_to_care": "good response",
            "medication_administration": [
                {
                    "medication_name": "aspirin",
                    "dose": "75mg",
                    "route": "oral",
                    "time_given": "10:30",
                    "administered_by": "Nurse Johnson",
                    "signature": "Nurse Johnson"
                }
            ],
            "additional_notes": "patient cooperative"
        }
    elif section == "patient_file_section9":
        return {
            "chart_date": "2025-01-09",
            "chart_time": "10:00",
            "intake_oral": 500,
            "intake_iv_fluids": 1000,
            "intake_medications": 50,
            "intake_other_specify": "",
            "intake_other_amount": 0,
            "output_urine": 600,
            "output_vomitus": 0,
            "output_drainage": 100,
            "output_stool": "normal",
            "output_other_specify": "",
            "output_other_amount": 0,
            "total_intake": 1550,
            "total_output": 700,
            "net_balance": 850,
            "remarks_notes": "patient stable",
            "nurse_name": "Nurse Wilson",
            "signature": "Nurse Wilson",
            "signoff_date_time": "2025-01-09 10:00"
        }
    elif section == "patient_file_section10":
        return {
            "patient_name": "Rajesh Kumar",
            "hospital_number": "H123456",
            "age": 45,
            "sex": "Male",
            "screening_date": "2025-01-09",
            "weight": 70.0,
            "height": 175.0,
            "bmi": 22.9,
            "recent_weight_loss": False,
            "weight_loss_amount": None,
            "weight_loss_period": "",
            "appetite_status": "Good",
            "swallowing_difficulties": False,
            "dietary_restrictions": "",
            "current_diet": "normal",
            "risk_chronic_illness": False,
            "risk_infections": False,
            "risk_surgery": False,
            "risk_others": "",
            "screening_outcome": "Normal",
            "screening_completed_by": "Nurse Wilson",
            "screening_signature_date": "2025-01-09"
        }
    elif section == "patient_file_section11":
        return {
            "patient_name": "Rajesh Kumar",
            "patient_age": 45,
            "patient_sex": "Male",
            "hospital_number": "H123456",
            "assessment_date": "2025-01-09",
            "dietary_history": "regular meals",
            "weight_kg": 70.0,
            "height_cm": 175.0,
            "muac_cm": 28.0,
            "skinfold_thickness": 12.0,
            "biochemical_data": "normal lab values",
            "clinical_signs_malnutrition": "no clinical signs",
            "functional_assessment": "good functional status",
            "nutritional_diagnosis": "adequate nutrition",
            "recommended_care_plan": "maintain current diet",
            "monitoring_evaluation_plan": "weekly weight",
            "assessed_by": "Dietitian Smith",
            "assessment_signature_date": "2025-01-09"
        }
    elif section == "patient_file_section12":
        return {
            "patient_name": "Rajesh Kumar",
            "hospital_number": "H123456",
            "age": 45,
            "sex": "Male",
            "admission_date": "2025-01-09",
            "diet_type": "Diabetic",
            "diet_type_others": "",
            "breakfast_details": "oatmeal with fruits 300 calories",
            "breakfast_notes": "",
            "mid_morning_details": "apple",
            "mid_morning_notes": "",
            "lunch_details": "grilled chicken with vegetables 500 calories",
            "lunch_notes": "",
            "afternoon_details": "yogurt",
            "afternoon_notes": "",
            "dinner_details": "fish with rice 400 calories",
            "dinner_notes": "",
            "bedtime_details": "milk",
            "bedtime_notes": "",
            "special_nutritional_instructions": "monitor blood sugar",
            "consultation_required": True,
            "dietician_name": "Smith",
            "consultation_date": "2025-01-10",
            "signed_by": "Nurse Wilson",
            "designation": "dietitian",
            "signoff_date_time": "2025-01-09 10:00"
        }
    
    return {"error": f"Fallback mapping not implemented for section: {section}"}

def get_reference_example(section: str) -> Dict[str, Any]:
    """Get reference example for a section type"""
    return _fallback_mapping(section, "", "en")