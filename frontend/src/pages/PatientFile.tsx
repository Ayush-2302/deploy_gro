import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/Primitives';
import { Recorder } from '../components/Recorder';
import { Section } from '../components/Section';
import { PageHeader } from '../components/PageHeader';
import { Icon } from '../components/Icons';
import { postJSON, getJSON } from '../lib/api.js';

interface PatientFileSection1Data {
  patient_name: string;
  age: number;
  sex: string;
  date_of_admission: string;
  ward: string;
  bed_number: string;
  admitted_under_doctor?: string;
  attender_name?: string;
  relation?: string;
  attender_mobile_no?: string;
  drug_hypersensitivity_allergy?: string;
  consultant?: string;
  diagnosis?: string;
  diet?: {
    type: string;
    notes?: string;
  };
  medication_orders: Array<{
    date: string;
    time: string;
    drug_name: string;
    strength: string;
    route: string;
    doctor_name_verbal_order: string;
    doctor_signature: string;
    verbal_order_taken_by: string;
    time_of_administration: string;
    administered_by: string;
    administration_witnessed_by: string;
  }>;
}

const DIET_OPTIONS = [
  'Normal',
  'Soft', 
  'Diabetic',
  'Renal',
  'Liquid',
  'Others'
];

const SEX_OPTIONS = ['Male', 'Female', 'Other'];

const PATIENT_FILE_SECTIONS = [
  { id: 1, name: 'Basic Patient Information', description: 'Patient demographics and basic details' },
  { id: 2, name: 'Initial Assessment Form', description: 'Comprehensive patient assessment' },
  { id: 3, name: 'Progress Notes & Vitals', description: 'Daily progress and vital signs monitoring' },
  { id: 4, name: 'Diagnostics', description: 'Laboratory and radiology investigations' },
  { id: 5, name: 'Patient Vitals Chart', description: 'Nursing assessment and monitoring' },
  { id: 6, name: 'Doctors Discharge Planning', description: 'Discharge planning and medications' },
  { id: 7, name: 'Follow Up Instructions', description: 'Post-discharge care instructions' },
  { id: 8, name: 'Nursing Care Plan', description: 'Nursing care plan and records' },
  { id: 9, name: 'Intake and Output Chart', description: 'Fluid balance monitoring' },
  { id: 10, name: 'Nutritional Screening', description: 'Nutritional risk assessment' },
  { id: 11, name: 'Nutrition Assessment Form', description: 'Detailed nutrition evaluation' },
  { id: 12, name: 'Diet Chart', description: 'Daily meal planning and dietary requirements' }
];

export default function PatientFile() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [patientData, setPatientData] = useState<any>(null);

  // Get current section info
  const currentSectionInfo = PATIENT_FILE_SECTIONS.find(section => section.id === currentSection);

  // Fetch patient data and prefill all sections
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientId) return;
      
      try {
        setIsLoading(true);
        
        // Fetch basic patient data
        const patient = await getJSON(`/api/patients/${patientId}`);
        setPatientData(patient);
        
        // Prefill Section 1 with patient data
        setSection1Data(prev => ({
          ...prev,
          patient_name: patient.name || '',
          age: patient.age || 0,
          sex: patient.gender || 'Male',
          date_of_admission: patient.admission_date || '',
          ward: patient.ward || '',
          bed_number: patient.bed_number || '',
          consultant: patient.admitted_under_doctor || '',
          diagnosis: patient.reason || ''
        }));
        
        // Fetch and prefill all patient file sections
        const sections = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        for (const section of sections) {
          try {
            const sectionData = await getJSON(`/api/patients/${patientId}/patient-file/section${section}`);
            updateSectionData(section, sectionData);
          } catch (error) {
            console.log(`Section ${section} not found, will use defaults`);
          }
        }
        
      } catch (error) {
        console.error('Error fetching patient data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPatientData();
  }, [patientId]);

  const updateSectionData = (section: number, data: any) => {
    switch (section) {
      case 1:
        setSection1Data(prev => ({ ...prev, ...data }));
        break;
      case 2:
        setSection2Data(prev => ({ ...prev, ...data }));
        break;
      case 3:
        setSection3Data(prev => ({ ...prev, ...data }));
        break;
      case 4:
        setSection4Data(prev => ({ ...prev, ...data }));
        break;
      case 5:
        setSection5Data(prev => ({ ...prev, ...data }));
        break;
      case 6:
        setSection6Data(prev => ({ ...prev, ...data }));
        break;
      case 7:
        setSection7Data(prev => ({ ...prev, ...data }));
        break;
      case 8:
        setSection8Data(prev => ({ ...prev, ...data }));
        break;
      case 9:
        setSection9Data(prev => ({ ...prev, ...data }));
        break;
      case 10:
        setSection10Data(prev => ({ ...prev, ...data }));
        break;
      case 11:
        setSection11Data(prev => ({ ...prev, ...data }));
        break;
      case 12:
        setSection12Data(prev => ({ ...prev, ...data }));
        break;
    }
  };

  // Section 1 - Basic Patient Information
  const [section1Data, setSection1Data] = useState<PatientFileSection1Data>({
    patient_name: '',
    age: 0,
    sex: 'Male',
    date_of_admission: '',
    ward: '',
    bed_number: '',
    admitted_under_doctor: '',
    attender_name: '',
    relation: '',
    attender_mobile_no: '',
    drug_hypersensitivity_allergy: '',
    consultant: '',
    diagnosis: '',
    diet: { type: 'Normal', notes: '' },
    medication_orders: []
  });

  // Section 2 - Initial Assessment Form
  const [section2Data, setSection2Data] = useState({
    // Patient and Admission Details
    hospital_number: '',
    name: '',
    age: 0,
    sex: 'Male',
    ip_number: '',
    consultant: '',
    doctor_unit: '',
    history_taken_by: '',
    history_given_by: '',
    known_allergies: '',
    assessment_date: '',
    assessment_time: '',
    signature: '',
    
    // Chief Complaints
    chief_complaints: '',
    
    // History
    history_present_illness: '',
    past_history: '',
    family_history: '',
    personal_history: '',
    immunization_history: '',
    relevant_previous_investigations: '',
    
    // General Physical Examination
    sensorium: 'Conscious',
    pallor: false,
    cyanosis: false,
    clubbing: false,
    icterus: false,
    lymphadenopathy: false,
    general_examination_others: '',
    
    // Systemic Examination
    systemic_examination: '',
    
    // Provisional Diagnosis
    provisional_diagnosis: '',
    
    // Care Plan
    care_plan_curative: '',
    care_plan_investigations_lab: '',
    care_plan_investigations_radiology: '',
    care_plan_investigations_others: '',
    care_plan_preventive: '',
    care_plan_palliative: '',
    care_plan_rehabilitative: '',
    miscellaneous_investigations: '',
    
    // Doctor's Orders
    diet: 'Normal',
    diet_specify: '',
    dietary_consultation: false,
    dietary_consultation_cross_referral: '',
    dietary_screening_his: false,
    physiotherapy: false,
    special_care: '',
    restraint_required: false,
    restraint_form_confirmation: false,
    surgery_procedures: '',
    cross_consultations: [],
    
    // Sign-off
    incharge_consultant_name: '',
    incharge_signature: '',
    incharge_date_time: '',
    doctor_signature: '',
    additional_notes: '',
    
    // Nursing Initial Assessment
    nursing_vitals_bp: '',
    nursing_vitals_pulse: '',
    nursing_vitals_temperature: '',
    nursing_vitals_respiratory_rate: '',
    nursing_vitals_weight: '',
    nursing_vitals_grbs: '',
    nursing_vitals_saturation: '',
    nursing_examination_consciousness: '',
    nursing_examination_skin_integrity: '',
    nursing_examination_respiratory_status: '',
    nursing_examination_other_findings: '',
    nursing_current_medications: '',
    nursing_investigations_ordered: '',
    nursing_diet: '',
    nursing_vulnerable_special_care: false,
    nursing_pain_score: 0,
    nursing_pressure_sores: false,
    nursing_pressure_sores_description: '',
    nursing_restraints_used: false,
    nursing_risk_assessment_fall: false,
    nursing_risk_assessment_dvt: false,
    nursing_risk_assessment_pressure_sores: false,
    nursing_signature: '',
    nursing_date_time: '',
    
    // Doctor's Discharge Planning
    discharge_likely_date: '',
    discharge_complete_diagnosis: '',
    discharge_medications: [],
    discharge_vitals: '',
    discharge_blood_sugar: '',
    discharge_blood_sugar_controlled: false,
    discharge_diet: '',
    discharge_condition_ambulatory: false,
    discharge_pain_score: 0,
    discharge_special_instructions: '',
    discharge_physical_activity: '',
    discharge_physiotherapy: '',
    discharge_others: '',
    discharge_report_in_case_of: '',
    discharge_doctor_name_signature: '',
    discharge_follow_up_instructions: '',
    discharge_cross_consultation: ''
  });

  // Section 3 - Progress Notes, Vitals & Pain Monitoring
  const [section3Data, setSection3Data] = useState({
    progress_date: '',
    progress_time: '',
    progress_notes: '',
    vitals_pulse: '',
    vitals_blood_pressure: '',
    vitals_respiratory_rate: '',
    vitals_temperature: '',
    vitals_oxygen_saturation: '',
    pain_vas_score: 0,
    pain_description: ''
  });

  // Section 4 - Diagnostics
  const [section4Data, setSection4Data] = useState({
    diagnostics_laboratory: '',
    diagnostics_radiology: '',
    diagnostics_others: '',
    diagnostics_date_time: '',
    diagnostics_results: '',
    follow_up_instructions: '',
    responsible_physician: '',
    signature: '',
    signature_date_time: ''
  });

  // Section 5 - Patient Vitals Chart (Nursing Assessment)
  const [section5Data, setSection5Data] = useState({
    vitals_bp: '',
    vitals_pulse: '',
    vitals_temperature: '',
    vitals_respiratory_rate: '',
    vitals_weight: '',
    vitals_grbs: '',
    vitals_saturation: '',
    examination_consciousness: '',
    examination_skin_integrity: '',
    examination_respiratory_status: '',
    examination_other_findings: '',
    current_medications: '',
    investigations_ordered: '',
    diet: '',
    vulnerable_special_care: false,
    pain_score: 0,
    pressure_sores: false,
    pressure_sores_description: '',
    restraints_used: false,
    risk_fall: false,
    risk_dvt: false,
    risk_pressure_sores: false,
    nurse_signature: '',
    assessment_date_time: '',
    nurse_name: '',
    shift: 'Morning',
    examination_general_appearance: '',
    examination_vital_signs: '',
    examination_pain_assessment: '',
    examination_skin_condition: '',
    examination_mobility: '',
    examination_nutrition: '',
    examination_elimination: '',
    examination_sleep: '',
    examination_psychosocial: '',
    examination_safety: '',
    assessment_nursing_diagnosis: '',
    assessment_interventions: '',
    assessment_evaluation: '',
    assessment_signature: ''
  });

  // Section 6 - Doctors Discharge Planning
  const [section6Data, setSection6Data] = useState({
    discharge_likely_date: '',
    discharge_complete_diagnosis: '',
    discharge_medications: '',
    discharge_vitals: '',
    discharge_blood_sugar: '',
    discharge_blood_sugar_controlled: false,
    discharge_diet: '',
    discharge_condition: '',
    discharge_pain_score: 0,
    discharge_special_instructions: '',
    discharge_physical_activity: '',
    discharge_physiotherapy: '',
    discharge_others: '',
    discharge_report_in_case_of: '',
    doctor_name_signature: '',
    discharge_follow_up_instructions: '',
    discharge_cross_consultation: ''
  });

  // Section 7 - Follow Up Instructions
  const [section7Data, setSection7Data] = useState({
    follow_up_instructions: '',
    cross_consultation_diagnosis: '',
    discharge_advice: '',
    medications_to_continue: '',
    lifestyle_modifications: '',
    warning_signs: '',
    emergency_contact: '',
    next_appointment: '',
    doctor_name: '',
    signature: '',
    date_time: ''
  });

  // Section 8 - Nursing Care Plan / Nurse's Record
  const [section8Data, setSection8Data] = useState({
    record_date: '',
    record_time: '',
    nurse_name: '',
    shift: 'Morning',
    patient_condition_overview: '',
    assessment_findings: '',
    nursing_diagnosis: '',
    goals_expected_outcomes: '',
    interventions_nursing_actions: '',
    patient_education_counseling: '',
    evaluation_response_to_care: '',
    medication_administration: '',
    additional_notes: ''
  });

  // Section 9 - Intake and Output Chart
  const [section9Data, setSection9Data] = useState({
    chart_date: '',
    chart_time: '',
    intake_oral: 0,
    intake_iv_fluids: 0,
    intake_medications: 0,
    intake_other_specify: '',
    intake_other_amount: 0,
    output_urine: 0,
    output_vomitus: 0,
    output_drainage: 0,
    output_stool: '',
    output_other_specify: '',
    output_other_amount: 0,
    total_intake: 0,
    total_output: 0,
    net_balance: 0,
    remarks_notes: '',
    nurse_name: '',
    signature: '',
    signoff_date_time: '',
    shift: 'Morning',
    intake_iv: 0
  });

  // Section 10 - Nutritional Screening
  const [section10Data, setSection10Data] = useState({
    patient_name: '',
    hospital_number: '',
    age: 0,
    sex: 'Male',
    screening_date: '',
    weight: 0,
    height: 0,
    bmi: 0,
    recent_weight_loss: false,
    weight_loss_amount: 0,
    weight_loss_period: '',
    appetite_status: 'Good',
    swallowing_difficulties: false,
    dietary_restrictions: '',
    current_diet: '',
    risk_chronic_illness: false,
    risk_infections: false,
    risk_surgery: false,
    risk_others: '',
    screening_outcome: 'Normal',
    screening_completed_by: '',
    screening_signature_date: ''
  });

  // Section 11 - Nutrition Assessment Form (NAF)
  const [section11Data, setSection11Data] = useState({
    patient_name: '',
    patient_age: 0,
    patient_sex: 'Male',
    hospital_number: '',
    assessment_date: '',
    dietary_history: '',
    weight_kg: 0,
    height_cm: 0,
    muac_cm: 0,
    skinfold_thickness: 0,
    biochemical_data: '',
    clinical_signs_malnutrition: '',
    functional_assessment: '',
    nutritional_diagnosis: '',
    recommended_care_plan: '',
    monitoring_evaluation_plan: '',
    assessed_by: '',
    assessment_signature_date: ''
  });

  // Section 12 - Diet Chart
  const [section12Data, setSection12Data] = useState({
    patient_name: '',
    hospital_number: '',
    age: 0,
    sex: 'Male',
    admission_date: '',
    diet_type: 'Normal',
    diet_type_others: '',
    breakfast_details: '',
    breakfast_notes: '',
    mid_morning_details: '',
    mid_morning_notes: '',
    lunch_details: '',
    lunch_notes: '',
    afternoon_details: '',
    afternoon_notes: '',
    dinner_details: '',
    dinner_notes: '',
    bedtime_details: '',
    bedtime_notes: '',
    special_nutritional_instructions: '',
    consultation_required: false,
    dietician_name: '',
    consultation_date: '',
    signed_by: '',
    designation: '',
    signoff_date_time: ''
  });

  const [newMedication, setNewMedication] = useState({
    date: '',
    time: '',
    drug_name: '',
    strength: '',
    route: '',
    doctor_name_verbal_order: '',
    doctor_signature: '',
    verbal_order_taken_by: '',
    time_of_administration: '',
    administered_by: '',
    administration_witnessed_by: ''
  });

  // Load existing data
  useEffect(() => {
    if (patientId) {
      loadSection1Data();
    }
  }, [patientId]);

  const loadSection1Data = async () => {
    try {
      setIsLoading(true);
      const data = await getJSON(`/api/patients/${patientId}/patient-file/section1`);
      setSection1Data(data);
    } catch (error) {
      console.log('No existing section 1 data found');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranscribe = async (text: string) => {
    setTranscript(text);
  };

  const handleMapFields = async () => {
    if (!transcript.trim()) {
      // Please record audio first
      return;
    }


    try {
      setIsLoading(true);
      const sectionKey = getSectionMappingKey(currentSection);
      const mappedData = await postJSON(`/api/map/${sectionKey}`, {
        text: transcript,
        language: 'en'
      });
      
      if (mappedData && Object.keys(mappedData).length > 0) {
        updateCurrentSectionData(mappedData);
      }
    } catch (error) {
      console.error('Error mapping text:', error);
      // Error mapping fields
    } finally {
      setIsLoading(false);
    }
  };

  const getSectionMappingKey = (section: number): string => {
    const mappingKeys = {
      1: 'patient_file_section1',
      2: 'patient_file_section2',
      3: 'patient_file_section3',
      4: 'patient_file_section4',
      5: 'patient_file_section5',
      6: 'patient_file_section6',
      7: 'patient_file_section7',
      8: 'patient_file_section8',
      9: 'patient_file_section9',
      10: 'patient_file_section10',
      11: 'patient_file_section11',
      12: 'patient_file_section12'
    };
    return mappingKeys[section as keyof typeof mappingKeys] || 'patient_file_section1';
  };

  const updateCurrentSectionData = (mappedData: any) => {
    switch (currentSection) {
      case 1:
        setSection1Data(prev => ({ ...prev, ...mappedData }));
        break;
      case 2:
        setSection2Data(prev => ({ ...prev, ...mappedData }));
        break;
      case 3:
        setSection3Data(prev => ({ ...prev, ...mappedData }));
        break;
      case 4:
        setSection4Data(prev => ({ ...prev, ...mappedData }));
        break;
      case 5:
        setSection5Data(prev => ({ ...prev, ...mappedData }));
        break;
      case 6:
        setSection6Data(prev => ({ ...prev, ...mappedData }));
        break;
      case 7:
        setSection7Data(prev => ({ ...prev, ...mappedData }));
        break;
      case 8:
        setSection8Data(prev => ({ ...prev, ...mappedData }));
        break;
      case 9:
        setSection9Data(prev => ({ ...prev, ...mappedData }));
        break;
      case 10:
        setSection10Data(prev => ({ ...prev, ...mappedData }));
        break;
      case 11:
        setSection11Data(prev => ({ ...prev, ...mappedData }));
        break;
      case 12:
        setSection12Data(prev => ({ ...prev, ...mappedData }));
        break;
      default:
        console.warn('Unknown section:', currentSection);
    }
  };


  const handleSave = async () => {
    try {
      setIsSaving(true);
      const currentData = getCurrentSectionData();
      const endpoint = getCurrentSectionEndpoint();
      
      console.log('Saving Section', currentSection, 'Data:', currentData);
      console.log('Endpoint:', endpoint);
      
      const savedData = await postJSON(endpoint, currentData);
      console.log('Section', currentSection, 'saved successfully:', savedData);
      
      // Update the current section data with the saved data
      updateCurrentSectionData(savedData);
      
      // Show success message
      console.log(`✅ Section ${currentSection} saved successfully!`);
    } catch (error) {
      console.error('Error saving Section', currentSection, ':', error);
      // Error saving data
    } finally {
      setIsSaving(false);
    }
  };

  const getCurrentSectionData = () => {
    switch (currentSection) {
      case 1: return section1Data;
      case 2: return section2Data;
      case 3: return section3Data;
      case 4: return section4Data;
      case 5: return section5Data;
      case 6: return section6Data;
      case 7: return section7Data;
      case 8: return section8Data;
      case 9: return section9Data;
      case 10: return section10Data;
      case 11: return section11Data;
      case 12: return section12Data;
      default: return section1Data;
    }
  };

  const getCurrentSectionEndpoint = () => {
    return `/api/patients/${patientId}/patient-file/section${currentSection}`;
  };


  const handleClearCurrentSection = () => {
    // Clear the current section data to empty state
    switch (currentSection) {
      case 1:
        setSection1Data({
          patient_name: '',
          age: 0,
          sex: 'Male',
          date_of_admission: '',
          ward: '',
          bed_number: '',
          admitted_under_doctor: '',
          attender_name: '',
          relation: '',
          attender_mobile_no: '',
          drug_hypersensitivity_allergy: '',
          consultant: '',
          diagnosis: '',
          diet: { type: 'Normal', notes: '' },
          medication_orders: []
        });
        break;
      case 2:
        setSection2Data({} as any);
        break;
      case 3:
        setSection3Data({} as any);
        break;
      case 4:
        setSection4Data({
          diagnostics_laboratory: '',
          diagnostics_radiology: '',
          diagnostics_others: '',
          diagnostics_date_time: '',
          diagnostics_results: '',
          follow_up_instructions: '',
          responsible_physician: '',
          signature: '',
          signature_date_time: ''
        });
        break;
      case 5:
        setSection5Data({
          vitals_bp: '',
          vitals_pulse: '',
          vitals_temperature: '',
          vitals_respiratory_rate: '',
          vitals_weight: '',
          vitals_grbs: '',
          vitals_saturation: '',
          examination_consciousness: '',
          examination_skin_integrity: '',
          examination_respiratory_status: '',
          examination_other_findings: '',
          current_medications: '',
          investigations_ordered: '',
          diet: '',
          vulnerable_special_care: false,
          pain_score: 0,
          pressure_sores: false,
          pressure_sores_description: '',
          restraints_used: false,
          risk_fall: false,
          risk_dvt: false,
          risk_pressure_sores: false,
          nurse_signature: '',
          assessment_date_time: '',
          nurse_name: '',
          shift: 'Morning',
          examination_general_appearance: '',
          examination_vital_signs: '',
          examination_pain_assessment: '',
          examination_skin_condition: '',
          examination_mobility: '',
          examination_nutrition: '',
          examination_elimination: '',
          examination_sleep: '',
          examination_psychosocial: '',
          examination_safety: '',
          assessment_nursing_diagnosis: '',
          assessment_interventions: '',
          assessment_evaluation: '',
          assessment_signature: ''
        });
        break;
      case 6:
        setSection6Data({
          discharge_likely_date: '',
          discharge_complete_diagnosis: '',
          discharge_medications: '',
          discharge_vitals: '',
          discharge_blood_sugar: '',
          discharge_blood_sugar_controlled: false,
          discharge_diet: '',
          discharge_condition: '',
          discharge_pain_score: 0,
          discharge_special_instructions: '',
          discharge_physical_activity: '',
          discharge_physiotherapy: '',
          discharge_others: '',
          discharge_report_in_case_of: '',
          doctor_name_signature: '',
          discharge_follow_up_instructions: '',
          discharge_cross_consultation: ''
        });
        break;
      case 7:
        setSection7Data({
          follow_up_instructions: '',
          cross_consultation_diagnosis: '',
          discharge_advice: '',
          medications_to_continue: '',
          lifestyle_modifications: '',
          warning_signs: '',
          emergency_contact: '',
          next_appointment: '',
          doctor_name: '',
          signature: '',
          date_time: ''
        });
        break;
      case 8:
        setSection8Data({
          record_date: '',
          record_time: '',
          nurse_name: '',
          shift: 'Morning',
          patient_condition_overview: '',
          assessment_findings: '',
          nursing_diagnosis: '',
          goals_expected_outcomes: '',
          interventions_nursing_actions: '',
          patient_education_counseling: '',
          evaluation_response_to_care: '',
          medication_administration: '',
          additional_notes: ''
        });
        break;
      case 9:
        setSection9Data({
          chart_date: '',
          chart_time: '',
          intake_oral: 0,
          intake_iv_fluids: 0,
          intake_medications: 0,
          intake_other_specify: '',
          intake_other_amount: 0,
          output_urine: 0,
          output_vomitus: 0,
          output_drainage: 0,
          output_stool: '',
          output_other_specify: '',
          output_other_amount: 0,
          total_intake: 0,
          total_output: 0,
          net_balance: 0,
          remarks_notes: '',
          nurse_name: '',
          signature: '',
          signoff_date_time: '',
          shift: 'Morning',
          intake_iv: 0
        });
        break;
      case 10:
        setSection10Data({
          patient_name: '',
          hospital_number: '',
          age: 0,
          sex: 'Male',
          screening_date: '',
          weight: 0,
          height: 0,
          bmi: 0,
          recent_weight_loss: false,
          weight_loss_amount: 0,
          weight_loss_period: '',
          appetite_status: 'Good',
          swallowing_difficulties: false,
          dietary_restrictions: '',
          current_diet: '',
          risk_chronic_illness: false,
          risk_infections: false,
          risk_surgery: false,
          risk_others: '',
          screening_outcome: 'Normal',
          screening_completed_by: '',
          screening_signature_date: ''
        });
        break;
      case 11:
        setSection11Data({
          patient_name: '',
          patient_age: 0,
          patient_sex: 'Male',
          hospital_number: '',
          assessment_date: '',
          dietary_history: '',
          weight_kg: 0,
          height_cm: 0,
          muac_cm: 0,
          skinfold_thickness: 0,
          biochemical_data: '',
          clinical_signs_malnutrition: '',
          functional_assessment: '',
          nutritional_diagnosis: '',
          recommended_care_plan: '',
          monitoring_evaluation_plan: '',
          assessed_by: '',
          assessment_signature_date: ''
        });
        break;
      case 12:
        setSection12Data({
          patient_name: '',
          hospital_number: '',
          age: 0,
          sex: 'Male',
          admission_date: '',
          diet_type: 'Normal',
          diet_type_others: '',
          breakfast_details: '',
          breakfast_notes: '',
          mid_morning_details: '',
          mid_morning_notes: '',
          lunch_details: '',
          lunch_notes: '',
          afternoon_details: '',
          afternoon_notes: '',
          dinner_details: '',
          dinner_notes: '',
          bedtime_details: '',
          bedtime_notes: '',
          special_nutritional_instructions: '',
          consultation_required: false,
          dietician_name: '',
          consultation_date: '',
          signed_by: '',
          designation: '',
          signoff_date_time: ''
        });
        break;
      default:
        console.warn('Unknown section for clear:', currentSection);
    }
  };

  const handleClearAllSections = () => {
    // Reset Section 1 to empty state
    setSection1Data({
      patient_name: '',
      age: 0,
      sex: 'Male',
      date_of_admission: '',
      ward: '',
      bed_number: '',
      admitted_under_doctor: '',
      attender_name: '',
      relation: '',
      attender_mobile_no: '',
      drug_hypersensitivity_allergy: '',
      consultant: '',
      diagnosis: '',
      diet: { type: 'Normal', notes: '' },
      medication_orders: []
    });
    
    // Clear all other sections to empty state
    setSection2Data({
      hospital_number: '',
      name: '',
      age: 0,
      sex: 'Male',
      ip_number: '',
      consultant: '',
      doctor_unit: '',
      history_taken_by: '',
      history_given_by: '',
      known_allergies: '',
      assessment_date: '',
      assessment_time: '',
      signature: '',
      chief_complaints: '',
      history_present_illness: '',
      past_history: '',
      family_history: '',
      personal_history: '',
      immunization_history: '',
      relevant_previous_investigations: '',
      sensorium: 'Conscious',
      pallor: false,
      cyanosis: false,
      clubbing: false,
      icterus: false,
      lymphadenopathy: false,
      general_examination_others: '',
      systemic_examination: '',
      provisional_diagnosis: '',
      care_plan_curative: '',
      care_plan_investigations_lab: '',
      care_plan_investigations_radiology: '',
      care_plan_investigations_others: '',
      care_plan_preventive: '',
      care_plan_palliative: '',
      care_plan_rehabilitative: '',
      miscellaneous_investigations: '',
      diet: 'Normal',
      diet_specify: '',
      dietary_consultation: false,
      dietary_consultation_cross_referral: '',
      dietary_screening_his: false,
      physiotherapy: false,
      special_care: '',
      restraint_required: false,
      restraint_form_confirmation: false,
      surgery_procedures: '',
      cross_consultations: [],
      incharge_consultant_name: '',
      incharge_signature: '',
      incharge_date_time: '',
      doctor_signature: '',
      additional_notes: '',
      nursing_vitals_bp: '',
      nursing_vitals_pulse: '',
      nursing_vitals_temperature: '',
      nursing_vitals_respiratory_rate: '',
      nursing_vitals_weight: '',
      nursing_vitals_grbs: '',
      nursing_vitals_saturation: '',
      nursing_examination_consciousness: '',
      nursing_examination_skin_integrity: '',
      nursing_examination_respiratory_status: '',
      nursing_examination_other_findings: '',
      nursing_current_medications: '',
      nursing_investigations_ordered: '',
      nursing_diet: '',
      nursing_vulnerable_special_care: false,
      nursing_pain_score: 0,
      nursing_pressure_sores: false,
      nursing_pressure_sores_description: '',
      nursing_restraints_used: false,
      nursing_risk_assessment_fall: false,
      nursing_risk_assessment_dvt: false,
      nursing_risk_assessment_pressure_sores: false,
      nursing_signature: '',
      nursing_date_time: '',
      discharge_likely_date: '',
      discharge_complete_diagnosis: '',
      discharge_medications: [],
      discharge_vitals: '',
      discharge_blood_sugar: '',
      discharge_blood_sugar_controlled: false,
      discharge_diet: '',
      discharge_condition_ambulatory: false,
      discharge_pain_score: 0,
      discharge_special_instructions: '',
      discharge_physical_activity: '',
      discharge_physiotherapy: '',
      discharge_others: '',
      discharge_report_in_case_of: '',
      discharge_doctor_name_signature: '',
      discharge_follow_up_instructions: '',
      discharge_cross_consultation: ''
    });
    setSection3Data({
      progress_date: '',
      progress_time: '',
      progress_notes: '',
      vitals_pulse: '',
      vitals_blood_pressure: '',
      vitals_respiratory_rate: '',
      vitals_temperature: '',
      vitals_oxygen_saturation: '',
      pain_vas_score: 0,
      pain_description: ''
    });
    setSection4Data({
      diagnostics_laboratory: '',
      diagnostics_radiology: '',
      diagnostics_others: '',
      diagnostics_date_time: '',
      diagnostics_results: '',
      follow_up_instructions: '',
      responsible_physician: '',
      signature: '',
      signature_date_time: ''
    });
    setSection5Data({
      vitals_bp: '',
      vitals_pulse: '',
      vitals_temperature: '',
      vitals_respiratory_rate: '',
      vitals_weight: '',
      vitals_grbs: '',
      vitals_saturation: '',
      examination_consciousness: '',
      examination_skin_integrity: '',
      examination_respiratory_status: '',
      examination_other_findings: '',
      current_medications: '',
      investigations_ordered: '',
      diet: '',
      vulnerable_special_care: false,
      pain_score: 0,
      pressure_sores: false,
      pressure_sores_description: '',
      restraints_used: false,
      risk_fall: false,
      risk_dvt: false,
      risk_pressure_sores: false,
      nurse_signature: '',
      assessment_date_time: '',
      nurse_name: '',
      shift: 'Morning',
      examination_general_appearance: '',
      examination_vital_signs: '',
      examination_pain_assessment: '',
      examination_skin_condition: '',
      examination_mobility: '',
      examination_nutrition: '',
      examination_elimination: '',
      examination_sleep: '',
      examination_psychosocial: '',
      examination_safety: '',
      assessment_nursing_diagnosis: '',
      assessment_interventions: '',
      assessment_evaluation: '',
      assessment_signature: ''
    });
    setSection6Data({
      discharge_likely_date: '',
      discharge_complete_diagnosis: '',
      discharge_medications: '',
      discharge_vitals: '',
      discharge_blood_sugar: '',
      discharge_blood_sugar_controlled: false,
      discharge_diet: '',
      discharge_condition: '',
      discharge_pain_score: 0,
      discharge_special_instructions: '',
      discharge_physical_activity: '',
      discharge_physiotherapy: '',
      discharge_others: '',
      discharge_report_in_case_of: '',
      doctor_name_signature: '',
      discharge_follow_up_instructions: '',
      discharge_cross_consultation: ''
    });
    setSection7Data({
      follow_up_instructions: '',
      cross_consultation_diagnosis: '',
      discharge_advice: '',
      medications_to_continue: '',
      lifestyle_modifications: '',
      warning_signs: '',
      emergency_contact: '',
      next_appointment: '',
      doctor_name: '',
      signature: '',
      date_time: ''
    });
    setSection8Data({
      record_date: '',
      record_time: '',
      nurse_name: '',
      shift: 'Morning',
      patient_condition_overview: '',
      assessment_findings: '',
      nursing_diagnosis: '',
      goals_expected_outcomes: '',
      interventions_nursing_actions: '',
      patient_education_counseling: '',
      evaluation_response_to_care: '',
      medication_administration: '',
      additional_notes: ''
    });
    setSection9Data({
      chart_date: '',
      chart_time: '',
      intake_oral: 0,
      intake_iv_fluids: 0,
      intake_medications: 0,
      intake_other_specify: '',
      intake_other_amount: 0,
      output_urine: 0,
      output_vomitus: 0,
      output_drainage: 0,
      output_stool: '',
      output_other_specify: '',
      output_other_amount: 0,
      total_intake: 0,
      total_output: 0,
      net_balance: 0,
      remarks_notes: '',
      nurse_name: '',
      signature: '',
      signoff_date_time: '',
      shift: 'Morning',
      intake_iv: 0
    });
    setSection10Data({
      patient_name: '',
      hospital_number: '',
      age: 0,
      sex: 'Male',
      screening_date: '',
      weight: 0,
      height: 0,
      bmi: 0,
      recent_weight_loss: false,
      weight_loss_amount: 0,
      weight_loss_period: '',
      appetite_status: 'Good',
      swallowing_difficulties: false,
      dietary_restrictions: '',
      current_diet: '',
      risk_chronic_illness: false,
      risk_infections: false,
      risk_surgery: false,
      risk_others: '',
      screening_outcome: 'Normal',
      screening_completed_by: '',
      screening_signature_date: ''
    });
    setSection11Data({
      patient_name: '',
      patient_age: 0,
      patient_sex: 'Male',
      hospital_number: '',
      assessment_date: '',
      dietary_history: '',
      weight_kg: 0,
      height_cm: 0,
      muac_cm: 0,
      skinfold_thickness: 0,
      biochemical_data: '',
      clinical_signs_malnutrition: '',
      functional_assessment: '',
      nutritional_diagnosis: '',
      recommended_care_plan: '',
      monitoring_evaluation_plan: '',
      assessed_by: '',
      assessment_signature_date: ''
    });
    setSection12Data({
      patient_name: '',
      hospital_number: '',
      age: 0,
      sex: 'Male',
      admission_date: '',
      diet_type: 'Normal',
      diet_type_others: '',
      breakfast_details: '',
      breakfast_notes: '',
      mid_morning_details: '',
      mid_morning_notes: '',
      lunch_details: '',
      lunch_notes: '',
      afternoon_details: '',
      afternoon_notes: '',
      dinner_details: '',
      dinner_notes: '',
      bedtime_details: '',
      bedtime_notes: '',
      special_nutritional_instructions: '',
      consultation_required: false,
      dietician_name: '',
      consultation_date: '',
      signed_by: '',
      designation: '',
      signoff_date_time: ''
    });
  };

  const addMedication = () => {
    if (newMedication.drug_name) {
      setSection1Data(prev => ({
        ...prev,
        medication_orders: [...prev.medication_orders, { ...newMedication }]
      }));
      setNewMedication({
        date: '',
        time: '',
        drug_name: '',
        strength: '',
        route: '',
        doctor_name_verbal_order: '',
        doctor_signature: '',
        verbal_order_taken_by: '',
        time_of_administration: '',
        administered_by: '',
        administration_witnessed_by: ''
      });
    }
  };

  const removeMedication = (index: number) => {
    setSection1Data(prev => ({
      ...prev,
      medication_orders: prev.medication_orders.filter((_, i) => i !== index)
    }));
  };

  const renderSectionNavigation = () => (
    <div className="bg-white border-b border-gray-200 mb-6">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-6 gap-3 py-4">
          {PATIENT_FILE_SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => setCurrentSection(section.id)}
              className={`px-3 py-3 text-xs font-medium rounded-lg transition-all duration-200 border ${
                currentSection === section.id
                  ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="font-semibold leading-tight">{section.name}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSection1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Patient Name *
          </label>
          <input
            type="text"
            value={section1Data.patient_name}
            onChange={(e) => setSection1Data(prev => ({ ...prev, patient_name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter patient name"
          />
        </div>


        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Age *
          </label>
          <input
            type="number"
            value={section1Data.age || ''}
            onChange={(e) => setSection1Data(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter age"
            min="0"
            max="120"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sex *
          </label>
          <select
            value={section1Data.sex}
            onChange={(e) => setSection1Data(prev => ({ ...prev, sex: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {SEX_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date of Admission *
          </label>
          <input
            type="date"
            value={section1Data.date_of_admission}
            onChange={(e) => setSection1Data(prev => ({ ...prev, date_of_admission: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ward *
          </label>
          <input
            type="text"
            value={section1Data.ward}
            onChange={(e) => setSection1Data(prev => ({ ...prev, ward: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter ward"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bed Number *
          </label>
          <input
            type="text"
            value={section1Data.bed_number}
            onChange={(e) => setSection1Data(prev => ({ ...prev, bed_number: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter bed number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Admitted Under Doctor
          </label>
          <input
            type="text"
            value={section1Data.admitted_under_doctor || ''}
            onChange={(e) => setSection1Data(prev => ({ ...prev, admitted_under_doctor: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter doctor name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Attender Name
          </label>
          <input
            type="text"
            value={section1Data.attender_name || ''}
            onChange={(e) => setSection1Data(prev => ({ ...prev, attender_name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter attender name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Relation
          </label>
          <select
            value={section1Data.relation || ''}
            onChange={(e) => setSection1Data(prev => ({ ...prev, relation: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select relation</option>
            <option value="Son">Son</option>
            <option value="Daughter">Daughter</option>
            <option value="Spouse">Spouse</option>
            <option value="Father">Father</option>
            <option value="Mother">Mother</option>
            <option value="Brother">Brother</option>
            <option value="Sister">Sister</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Attender Mobile No
          </label>
          <input
            type="tel"
            value={section1Data.attender_mobile_no || ''}
            onChange={(e) => setSection1Data(prev => ({ ...prev, attender_mobile_no: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter mobile number"
          />
        </div>

      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Drug Hypersensitivity/Allergy
        </label>
        <textarea
          value={section1Data.drug_hypersensitivity_allergy || ''}
          onChange={(e) => setSection1Data(prev => ({ ...prev, drug_hypersensitivity_allergy: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          placeholder="List any known allergies or drug hypersensitivities"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Consultant
          </label>
          <input
            type="text"
            value={section1Data.consultant || ''}
            onChange={(e) => setSection1Data(prev => ({ ...prev, consultant: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter consultant name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Diagnosis
          </label>
          <input
            type="text"
            value={section1Data.diagnosis || ''}
            onChange={(e) => setSection1Data(prev => ({ ...prev, diagnosis: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter diagnosis"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Diet
        </label>
        <div className="flex gap-4 items-center">
          <select
            value={section1Data.diet?.type || 'Normal'}
            onChange={(e) => setSection1Data(prev => ({ 
              ...prev, 
              diet: { ...prev.diet!, type: e.target.value }
            }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {DIET_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <input
            type="text"
            value={section1Data.diet?.notes || ''}
            onChange={(e) => setSection1Data(prev => ({ 
              ...prev, 
              diet: { ...prev.diet!, notes: e.target.value }
            }))}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Additional diet notes"
          />
        </div>
      </div>

      {/* Medication Orders */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Medication Orders</h3>
          <Button
            onClick={() => setNewMedication(prev => ({ ...prev, drug_name: 'New Medication' }))}
            variant="secondary"
            size="sm"
          >
            <Icon name="Plus" className="w-4 h-4 mr-2" />
            Add Medication
          </Button>
        </div>

        {/* Add New Medication Form */}
        {newMedication.drug_name && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 className="font-medium text-gray-900 mb-3">Add New Medication</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="date"
                value={newMedication.date}
                onChange={(e) => setNewMedication(prev => ({ ...prev, date: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Date"
              />
              <input
                type="time"
                value={newMedication.time}
                onChange={(e) => setNewMedication(prev => ({ ...prev, time: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Time"
              />
              <input
                type="text"
                value={newMedication.drug_name}
                onChange={(e) => setNewMedication(prev => ({ ...prev, drug_name: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Drug Name"
              />
              <input
                type="text"
                value={newMedication.strength}
                onChange={(e) => setNewMedication(prev => ({ ...prev, strength: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Strength"
              />
              <input
                type="text"
                value={newMedication.route}
                onChange={(e) => setNewMedication(prev => ({ ...prev, route: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Route"
              />
              <input
                type="text"
                value={newMedication.doctor_name_verbal_order}
                onChange={(e) => setNewMedication(prev => ({ ...prev, doctor_name_verbal_order: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Doctor Name"
              />
              <input
                type="text"
                value={newMedication.doctor_signature}
                onChange={(e) => setNewMedication(prev => ({ ...prev, doctor_signature: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Doctor Signature"
              />
              <input
                type="text"
                value={newMedication.verbal_order_taken_by}
                onChange={(e) => setNewMedication(prev => ({ ...prev, verbal_order_taken_by: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Taken By"
              />
              <input
                type="time"
                value={newMedication.time_of_administration}
                onChange={(e) => setNewMedication(prev => ({ ...prev, time_of_administration: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Admin Time"
              />
              <input
                type="text"
                value={newMedication.administered_by}
                onChange={(e) => setNewMedication(prev => ({ ...prev, administered_by: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Administered By"
              />
              <input
                type="text"
                value={newMedication.administration_witnessed_by}
                onChange={(e) => setNewMedication(prev => ({ ...prev, administration_witnessed_by: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Witnessed By"
              />
            </div>
            <div className="flex gap-2 mt-3">
              <Button onClick={addMedication} size="sm">
                Add Medication
              </Button>
              <Button 
                onClick={() => setNewMedication({
                  date: '', time: '', drug_name: '', strength: '', route: '',
                  doctor_name_verbal_order: '', doctor_signature: '', verbal_order_taken_by: '',
                  time_of_administration: '', administered_by: '', administration_witnessed_by: ''
                })}
                variant="secondary" 
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Medication Orders List */}
        <div className="space-y-3">
          {section1Data.medication_orders.map((med, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900">{med.drug_name} {med.strength}</h4>
                <Button
                  onClick={() => removeMedication(index)}
                  variant="danger"
                  size="sm"
                >
                  <Icon name="Trash2" className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                <div><strong>Date:</strong> {med.date}</div>
                <div><strong>Time:</strong> {med.time}</div>
                <div><strong>Route:</strong> {med.route}</div>
                <div><strong>Doctor:</strong> {med.doctor_name_verbal_order}</div>
                <div><strong>Admin Time:</strong> {med.time_of_administration}</div>
                <div><strong>Admin By:</strong> {med.administered_by}</div>
                <div><strong>Taken By:</strong> {med.verbal_order_taken_by}</div>
                <div><strong>Witnessed By:</strong> {med.administration_witnessed_by}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSection2 = () => (
    <div className="space-y-8">
      {/* Patient and Admission Details */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient and Admission Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Number *</label>
            <input
              type="text"
              value={section2Data.hospital_number}
              onChange={(e) => setSection2Data({...section2Data, hospital_number: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter hospital number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={section2Data.name}
              onChange={(e) => setSection2Data({...section2Data, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter patient name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
            <input
              type="number"
              value={section2Data.age}
              onChange={(e) => setSection2Data({...section2Data, age: parseInt(e.target.value) || 0})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter age"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sex *</label>
            <select
              value={section2Data.sex}
              onChange={(e) => setSection2Data({...section2Data, sex: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IP Number</label>
            <input
              type="text"
              value={section2Data.ip_number}
              onChange={(e) => setSection2Data({...section2Data, ip_number: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter IP number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Consultant</label>
            <input
              type="text"
              value={section2Data.consultant}
              onChange={(e) => setSection2Data({...section2Data, consultant: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter consultant name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor/Unit</label>
            <input
              type="text"
              value={section2Data.doctor_unit}
              onChange={(e) => setSection2Data({...section2Data, doctor_unit: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter doctor/unit"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">History taken by</label>
            <input
              type="text"
              value={section2Data.history_taken_by}
              onChange={(e) => setSection2Data({...section2Data, history_taken_by: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">History given by</label>
            <input
              type="text"
              value={section2Data.history_given_by}
              onChange={(e) => setSection2Data({...section2Data, history_given_by: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter name"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Known Allergies</label>
            <textarea
              value={section2Data.known_allergies}
              onChange={(e) => setSection2Data({...section2Data, known_allergies: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="List any known allergies"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={section2Data.assessment_date}
              onChange={(e) => setSection2Data({...section2Data, assessment_date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <input
              type="time"
              value={section2Data.assessment_time}
              onChange={(e) => setSection2Data({...section2Data, assessment_time: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Signature</label>
            <input
              type="text"
              value={section2Data.signature}
              onChange={(e) => setSection2Data({...section2Data, signature: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter signature"
            />
          </div>
        </div>
      </div>

      {/* Chief Complaints */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Chief Complaints</h3>
        <textarea
          value={section2Data.chief_complaints}
          onChange={(e) => setSection2Data({...section2Data, chief_complaints: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="Enter chief complaints"
        />
      </div>

      {/* History */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">History</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">History of Present Illness</label>
            <textarea
              value={section2Data.history_present_illness}
              onChange={(e) => setSection2Data({...section2Data, history_present_illness: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Enter history of present illness"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Past History</label>
            <textarea
              value={section2Data.past_history}
              onChange={(e) => setSection2Data({...section2Data, past_history: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Enter past medical history including present medications"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Family History</label>
            <textarea
              value={section2Data.family_history}
              onChange={(e) => setSection2Data({...section2Data, family_history: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Enter family history"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Personal History</label>
            <textarea
              value={section2Data.personal_history}
              onChange={(e) => setSection2Data({...section2Data, personal_history: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Enter personal history"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Immunization History</label>
            <textarea
              value={section2Data.immunization_history}
              onChange={(e) => setSection2Data({...section2Data, immunization_history: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Enter immunization history"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Relevant Previous Investigations / Reports</label>
            <textarea
              value={section2Data.relevant_previous_investigations}
              onChange={(e) => setSection2Data({...section2Data, relevant_previous_investigations: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Enter relevant previous investigations"
            />
          </div>
        </div>
      </div>

      {/* General Physical Examination */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">General Physical Examination</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sensorium</label>
            <div className="flex space-x-4">
              {['Conscious', 'Drowsy', 'Unconscious'].map((option) => (
                <label key={option} className="flex items-center">
                  <input
                    type="radio"
                    name="sensorium"
                    value={option}
                    checked={section2Data.sensorium === option}
                    onChange={(e) => setSection2Data({...section2Data, sensorium: e.target.value})}
                    className="mr-2"
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { key: 'pallor', label: 'Pallor' },
              { key: 'cyanosis', label: 'Cyanosis' },
              { key: 'clubbing', label: 'Clubbing' },
              { key: 'icterus', label: 'Icterus' },
              { key: 'lymphadenopathy', label: 'Lymphadenopathy' }
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={section2Data[key as keyof typeof section2Data] as boolean}
                  onChange={(e) => setSection2Data({...section2Data, [key]: e.target.checked})}
                  className="mr-2"
                />
                {label}
              </label>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Others</label>
            <textarea
              value={section2Data.general_examination_others}
              onChange={(e) => setSection2Data({...section2Data, general_examination_others: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Enter other findings"
            />
          </div>
        </div>
      </div>

      {/* Systemic Examination */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Systemic Examination</h3>
        <textarea
          value={section2Data.systemic_examination}
          onChange={(e) => setSection2Data({...section2Data, systemic_examination: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="Enter systemic examination findings (CVS / RS / CNS / Abdomen / Local Examination if applicable)"
        />
      </div>

      {/* Provisional Diagnosis */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Provisional Diagnosis / Clinical Problems</h3>
        <textarea
          value={section2Data.provisional_diagnosis}
          onChange={(e) => setSection2Data({...section2Data, provisional_diagnosis: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="Enter provisional diagnosis and clinical problems"
        />
      </div>

      {/* Care Plan */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Care Plan</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Curative</label>
            <textarea
              value={section2Data.care_plan_curative}
              onChange={(e) => setSection2Data({...section2Data, care_plan_curative: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Enter curative care plan"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Investigations:</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lab</label>
                <textarea
                  value={section2Data.care_plan_investigations_lab}
                  onChange={(e) => setSection2Data({...section2Data, care_plan_investigations_lab: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Lab investigations"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Radiology</label>
                <textarea
                  value={section2Data.care_plan_investigations_radiology}
                  onChange={(e) => setSection2Data({...section2Data, care_plan_investigations_radiology: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Radiology investigations"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Others</label>
                <textarea
                  value={section2Data.care_plan_investigations_others}
                  onChange={(e) => setSection2Data({...section2Data, care_plan_investigations_others: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Other investigations"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preventive</label>
              <textarea
                value={section2Data.care_plan_preventive}
                onChange={(e) => setSection2Data({...section2Data, care_plan_preventive: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Preventive care"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Palliative</label>
              <textarea
                value={section2Data.care_plan_palliative}
                onChange={(e) => setSection2Data({...section2Data, care_plan_palliative: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Palliative care"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rehabilitative</label>
              <textarea
                value={section2Data.care_plan_rehabilitative}
                onChange={(e) => setSection2Data({...section2Data, care_plan_rehabilitative: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Rehabilitative care"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Miscellaneous Investigations</label>
            <textarea
              value={section2Data.miscellaneous_investigations}
              onChange={(e) => setSection2Data({...section2Data, miscellaneous_investigations: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Enter miscellaneous investigations"
            />
          </div>
        </div>
      </div>

      {/* Doctor's Orders */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Doctor's Orders</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diet</label>
              <select
                value={section2Data.diet}
                onChange={(e) => setSection2Data({...section2Data, diet: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Normal">Normal</option>
                <option value="Others">Others</option>
              </select>
            </div>
            {section2Data.diet === 'Others' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specify</label>
                <input
                  type="text"
                  value={section2Data.diet_specify}
                  onChange={(e) => setSection2Data({...section2Data, diet_specify: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Specify diet type"
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={section2Data.dietary_consultation}
                onChange={(e) => setSection2Data({...section2Data, dietary_consultation: e.target.checked})}
                className="mr-2"
              />
              <label className="text-sm font-medium text-gray-700">Dietary consultation</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={section2Data.dietary_screening_his}
                onChange={(e) => setSection2Data({...section2Data, dietary_screening_his: e.target.checked})}
                className="mr-2"
              />
              <label className="text-sm font-medium text-gray-700">Dietary screening by dietician entered into HIS</label>
            </div>
          </div>
          {section2Data.dietary_consultation && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cross referral</label>
              <input
                type="text"
                value={section2Data.dietary_consultation_cross_referral}
                onChange={(e) => setSection2Data({...section2Data, dietary_consultation_cross_referral: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter cross referral details"
              />
            </div>
          )}
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={section2Data.physiotherapy}
              onChange={(e) => setSection2Data({...section2Data, physiotherapy: e.target.checked})}
              className="mr-2"
            />
            <label className="text-sm font-medium text-gray-700">Physiotherapy</label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Others / Any special care</label>
            <textarea
              value={section2Data.special_care}
              onChange={(e) => setSection2Data({...section2Data, special_care: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Enter special care instructions"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={section2Data.restraint_required}
                onChange={(e) => setSection2Data({...section2Data, restraint_required: e.target.checked})}
                className="mr-2"
              />
              <label className="text-sm font-medium text-gray-700">Restraint required</label>
            </div>
            {section2Data.restraint_required && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={section2Data.restraint_form_confirmation}
                  onChange={(e) => setSection2Data({...section2Data, restraint_form_confirmation: e.target.checked})}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">Fill restraint form confirmation</label>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Surgery / Procedures planned and special orders</label>
            <textarea
              value={section2Data.surgery_procedures}
              onChange={(e) => setSection2Data({...section2Data, surgery_procedures: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Enter surgery/procedures and special orders"
            />
          </div>
        </div>
      </div>

      {/* Sign-off */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sign-off</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name of the In-charge Consultant</label>
            <input
              type="text"
              value={section2Data.incharge_consultant_name}
              onChange={(e) => setSection2Data({...section2Data, incharge_consultant_name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter consultant name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Signature</label>
            <input
              type="text"
              value={section2Data.incharge_signature}
              onChange={(e) => setSection2Data({...section2Data, incharge_signature: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter signature"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date and Time</label>
            <input
              type="datetime-local"
              value={section2Data.incharge_date_time}
              onChange={(e) => setSection2Data({...section2Data, incharge_date_time: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Signature of Doctor doing Initial Assessment</label>
            <input
              type="text"
              value={section2Data.doctor_signature}
              onChange={(e) => setSection2Data({...section2Data, doctor_signature: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter doctor signature"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
          <textarea
            value={section2Data.additional_notes}
            onChange={(e) => setSection2Data({...section2Data, additional_notes: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Enter additional notes"
          />
        </div>
      </div>
    </div>
  );

  const renderSection3 = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Notes, Vitals & Pain Monitoring</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={section3Data.progress_date}
              onChange={(e) => setSection3Data({...section3Data, progress_date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <input
              type="time"
              value={section3Data.progress_time}
              onChange={(e) => setSection3Data({...section3Data, progress_time: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Progress Notes</label>
          <textarea
            value={section3Data.progress_notes}
            onChange={(e) => setSection3Data({...section3Data, progress_notes: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Enter progress notes"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pulse</label>
            <input
              type="text"
              value={section3Data.vitals_pulse}
              onChange={(e) => setSection3Data({...section3Data, vitals_pulse: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 72 bpm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure</label>
            <input
              type="text"
              value={section3Data.vitals_blood_pressure}
              onChange={(e) => setSection3Data({...section3Data, vitals_blood_pressure: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 120/80"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Respiratory Rate</label>
            <input
              type="text"
              value={section3Data.vitals_respiratory_rate}
              onChange={(e) => setSection3Data({...section3Data, vitals_respiratory_rate: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 16/min"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
            <input
              type="text"
              value={section3Data.vitals_temperature}
              onChange={(e) => setSection3Data({...section3Data, vitals_temperature: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 98.6°F"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Oxygen Saturation</label>
            <input
              type="text"
              value={section3Data.vitals_oxygen_saturation}
              onChange={(e) => setSection3Data({...section3Data, vitals_oxygen_saturation: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 98%"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pain Score (VAS 0-10)</label>
            <input
              type="range"
              min="0"
              max="10"
              value={section3Data.pain_vas_score}
              onChange={(e) => setSection3Data({...section3Data, pain_vas_score: parseInt(e.target.value)})}
              className="w-full"
            />
            <div className="text-center text-sm text-gray-600 mt-1">Score: {section3Data.pain_vas_score}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pain Description</label>
            <textarea
              value={section3Data.pain_description}
              onChange={(e) => setSection3Data({...section3Data, pain_description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Describe pain characteristics"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSection4 = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Diagnostics</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Diagnostics Ordered</label>
            <textarea
              value={section4Data.diagnostics_laboratory}
              onChange={(e) => setSection4Data({...section4Data, diagnostics_laboratory: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="List all diagnostics ordered"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Laboratory Investigations</label>
              <textarea
                value={section4Data.diagnostics_radiology}
                onChange={(e) => setSection4Data({...section4Data, diagnostics_radiology: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Lab investigations"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Radiology</label>
              <textarea
                value={section4Data.diagnostics_others}
                onChange={(e) => setSection4Data({...section4Data, diagnostics_others: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Radiology investigations"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Other Diagnostics</label>
            <textarea
              value={section4Data.diagnostics_others}
              onChange={(e) => setSection4Data({...section4Data, diagnostics_others: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Other diagnostic procedures"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date and Time of Diagnostics</label>
              <input
                type="datetime-local"
                value={section4Data.diagnostics_date_time}
                onChange={(e) => setSection4Data({...section4Data, diagnostics_date_time: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Responsible Physician</label>
              <input
                type="text"
                value={section4Data.responsible_physician}
                onChange={(e) => setSection4Data({...section4Data, responsible_physician: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter physician name"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Results</label>
            <textarea
              value={section4Data.diagnostics_results}
              onChange={(e) => setSection4Data({...section4Data, diagnostics_results: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Enter detailed findings and results"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Instructions</label>
            <textarea
              value={section4Data.follow_up_instructions}
              onChange={(e) => setSection4Data({...section4Data, follow_up_instructions: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Enter follow-up instructions"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Signature</label>
              <input
                type="text"
                value={section4Data.signature}
                onChange={(e) => setSection4Data({...section4Data, signature: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter signature"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date and Time of Signature</label>
              <input
                type="datetime-local"
                value={section4Data.signature_date_time}
                onChange={(e) => setSection4Data({...section4Data, signature_date_time: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSection5 = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Vitals Chart - Nursing Assessment</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Date</label>
            <input
              type="date"
              value={section5Data.assessment_date_time}
              onChange={(e) => setSection5Data({...section5Data, assessment_date_time: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Time</label>
            <input
              type="time"
              value={section5Data.assessment_date_time}
              onChange={(e) => setSection5Data({...section5Data, assessment_date_time: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nurse Name</label>
            <input
              type="text"
              value={section5Data.nurse_name}
              onChange={(e) => setSection5Data({...section5Data, nurse_name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter nurse name"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
            <select
              value={section5Data.shift}
              onChange={(e) => setSection5Data({...section5Data, shift: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Morning">Morning</option>
              <option value="Evening">Evening</option>
              <option value="Night">Night</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient Condition</label>
            <input
              type="text"
                value={section5Data.examination_consciousness}
                onChange={(e) => setSection5Data({...section5Data, examination_consciousness: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Overall patient condition"
            />
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nursing Assessment</label>
            <textarea
              value={section5Data.examination_general_appearance}
              onChange={(e) => setSection5Data({...section5Data, examination_general_appearance: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Comprehensive nursing assessment"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vital Signs</label>
              <textarea
              value={section5Data.examination_vital_signs}
              onChange={(e) => setSection5Data({...section5Data, examination_vital_signs: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="BP, Pulse, Temp, RR, O2 Sat"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pain Assessment</label>
              <textarea
                value={section5Data.examination_pain_assessment}
                onChange={(e) => setSection5Data({...section5Data, examination_pain_assessment: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Pain score and characteristics"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skin Condition</label>
              <textarea
                value={section5Data.examination_skin_condition}
                onChange={(e) => setSection5Data({...section5Data, examination_skin_condition: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Skin integrity, color, temperature"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobility Status</label>
              <textarea
                value={section5Data.examination_mobility}
                onChange={(e) => setSection5Data({...section5Data, examination_mobility: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Movement, ambulation, assistance needed"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nutrition Status</label>
              <textarea
                value={section5Data.examination_nutrition}
                onChange={(e) => setSection5Data({...section5Data, examination_nutrition: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Appetite, intake, weight changes"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Elimination Status</label>
              <textarea
                value={section5Data.examination_elimination}
                onChange={(e) => setSection5Data({...section5Data, examination_elimination: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Bowel and bladder function"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sleep Pattern</label>
              <textarea
                value={section5Data.examination_sleep}
                onChange={(e) => setSection5Data({...section5Data, examination_sleep: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Sleep quality, duration, disturbances"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Psychosocial Status</label>
              <textarea
                value={section5Data.examination_psychosocial}
                onChange={(e) => setSection5Data({...section5Data, examination_psychosocial: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Mood, anxiety, family support"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Safety Concerns</label>
            <textarea
              value={section5Data.examination_safety}
              onChange={(e) => setSection5Data({...section5Data, examination_safety: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Fall risk, restraints, other safety issues"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Care Plan</label>
            <textarea
              value={section5Data.assessment_nursing_diagnosis}
              onChange={(e) => setSection5Data({...section5Data, assessment_nursing_diagnosis: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Nursing care plan and goals"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Interventions</label>
            <textarea
              value={section5Data.assessment_interventions}
              onChange={(e) => setSection5Data({...section5Data, assessment_interventions: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Nursing interventions performed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Evaluation</label>
            <textarea
              value={section5Data.assessment_evaluation}
              onChange={(e) => setSection5Data({...section5Data, assessment_evaluation: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Response to care and outcomes"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Signature</label>
              <input
                type="text"
                value={section5Data.assessment_signature}
                onChange={(e) => setSection5Data({...section5Data, assessment_signature: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nurse signature"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
              <input
                type="datetime-local"
                value={section5Data.assessment_date_time}
                onChange={(e) => setSection5Data({...section5Data, assessment_date_time: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSection6 = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Doctors Discharge Planning</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Likely Date of Discharge</label>
              <input
                type="date"
                value={section6Data.discharge_likely_date}
                onChange={(e) => setSection6Data({...section6Data, discharge_likely_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blood Sugar Level (if applicable)</label>
              <input
                type="text"
                value={section6Data.discharge_blood_sugar}
                onChange={(e) => setSection6Data({...section6Data, discharge_blood_sugar: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 120 mg/dL"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Complete Diagnosis / Clinical Problems</label>
            <textarea
              value={section6Data.discharge_complete_diagnosis}
              onChange={(e) => setSection6Data({...section6Data, discharge_complete_diagnosis: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Enter complete diagnosis and clinical problems"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discharge Medications</label>
            <textarea
              value={section6Data.discharge_medications}
              onChange={(e) => setSection6Data({...section6Data, discharge_medications: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="List all discharge medications with dosage and frequency"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vitals</label>
            <textarea
              value={section6Data.discharge_vitals}
              onChange={(e) => setSection6Data({...section6Data, discharge_vitals: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Final vital signs at discharge"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={section6Data.discharge_blood_sugar_controlled}
                onChange={(e) => setSection6Data({...section6Data, discharge_blood_sugar_controlled: e.target.checked})}
                className="mr-2"
              />
              <label className="text-sm font-medium text-gray-700">Blood Sugar Controlled</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={section6Data.discharge_condition === 'ambulatory'}
                onChange={(e) => setSection6Data({...section6Data, discharge_condition: e.target.checked ? 'ambulatory' : ''})}
                className="mr-2"
              />
              <label className="text-sm font-medium text-gray-700">Condition Ambulatory</label>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diet</label>
              <input
                type="text"
                value={section6Data.discharge_diet}
                onChange={(e) => setSection6Data({...section6Data, discharge_diet: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Discharge diet instructions"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pain Score (0-10)</label>
              <input
                type="range"
                min="0"
                max="10"
                value={section6Data.discharge_pain_score}
                onChange={(e) => setSection6Data({...section6Data, discharge_pain_score: parseInt(e.target.value)})}
                className="w-full"
              />
              <div className="text-center text-sm text-gray-600 mt-1">Score: {section6Data.discharge_pain_score}</div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions at Discharge</label>
            <textarea
              value={section6Data.discharge_special_instructions}
              onChange={(e) => setSection6Data({...section6Data, discharge_special_instructions: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Special instructions for patient and family"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Physical Activity</label>
              <textarea
                value={section6Data.discharge_physical_activity}
                onChange={(e) => setSection6Data({...section6Data, discharge_physical_activity: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Physical activity recommendations"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Physiotherapy</label>
              <textarea
                value={section6Data.discharge_physiotherapy}
                onChange={(e) => setSection6Data({...section6Data, discharge_physiotherapy: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Physiotherapy instructions"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Others (e.g., self-monitoring instructions)</label>
            <textarea
              value={section6Data.discharge_others}
              onChange={(e) => setSection6Data({...section6Data, discharge_others: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Other discharge instructions"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report in case of</label>
            <textarea
              value={section6Data.discharge_report_in_case_of}
              onChange={(e) => setSection6Data({...section6Data, discharge_report_in_case_of: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Warning signs to report"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name & Signature of Doctor</label>
            <input
              type="text"
              value={section6Data.doctor_name_signature}
              onChange={(e) => setSection6Data({...section6Data, doctor_name_signature: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Doctor name and signature"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Instructions</label>
            <textarea
              value={section6Data.discharge_follow_up_instructions}
              onChange={(e) => setSection6Data({...section6Data, discharge_follow_up_instructions: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Follow-up appointment and care instructions"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cross Consultation Diagnosis / Treatment and Discharge Advice</label>
            <textarea
              value={section6Data.discharge_cross_consultation}
              onChange={(e) => setSection6Data({...section6Data, discharge_cross_consultation: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Cross consultation details and advice"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSection7 = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Follow Up Instructions</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
              <input
                type="date"
                value={section7Data.follow_up_instructions}
                onChange={(e) => setSection7Data({...section7Data, follow_up_instructions: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Location</label>
              <input
                type="text"
                value={section7Data.cross_consultation_diagnosis}
                onChange={(e) => setSection7Data({...section7Data, cross_consultation_diagnosis: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Outpatient Clinic, Room 101"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Instructions</label>
            <textarea
              value={section7Data.follow_up_instructions}
              onChange={(e) => setSection7Data({...section7Data, follow_up_instructions: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Detailed follow-up care instructions"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medications to Continue</label>
            <textarea
              value={section7Data.medications_to_continue}
              onChange={(e) => setSection7Data({...section7Data, medications_to_continue: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="List medications to continue taking"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lifestyle Modifications</label>
            <textarea
              value={section7Data.lifestyle_modifications}
              onChange={(e) => setSection7Data({...section7Data, lifestyle_modifications: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Diet, exercise, and lifestyle recommendations"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Warning Signs to Watch For</label>
            <textarea
              value={section7Data.warning_signs}
              onChange={(e) => setSection7Data({...section7Data, warning_signs: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Signs and symptoms that require immediate medical attention"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
            <input
              type="text"
              value={section7Data.emergency_contact}
              onChange={(e) => setSection7Data({...section7Data, emergency_contact: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Emergency contact number or instructions"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Next Appointment</label>
            <input
              type="text"
              value={section7Data.next_appointment}
              onChange={(e) => setSection7Data({...section7Data, next_appointment: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Next appointment details"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Name</label>
              <input
                type="text"
                value={section7Data.doctor_name}
                onChange={(e) => setSection7Data({...section7Data, doctor_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Doctor name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Signature</label>
              <input
                type="text"
                value={section7Data.signature}
                onChange={(e) => setSection7Data({...section7Data, signature: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Doctor signature"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
            <input
              type="datetime-local"
              value={section7Data.date_time}
              onChange={(e) => setSection7Data({...section7Data, date_time: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSection8 = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Nursing Care Plan / Nurse's Record</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={section8Data.record_date} onChange={(e) => setSection8Data({...section8Data, record_date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input type="time" value={section8Data.record_time} onChange={(e) => setSection8Data({...section8Data, record_time: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nurse Name</label>
              <input type="text" value={section8Data.nurse_name} onChange={(e) => setSection8Data({...section8Data, nurse_name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter nurse name" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
            <select value={section8Data.shift} onChange={(e) => setSection8Data({...section8Data, shift: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="Morning">Morning</option>
              <option value="Evening">Evening</option>
              <option value="Night">Night</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient Condition Overview</label>
            <textarea value={section8Data.patient_condition_overview} onChange={(e) => setSection8Data({...section8Data, patient_condition_overview: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} placeholder="Overall patient condition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Findings</label>
            <textarea value={section8Data.assessment_findings} onChange={(e) => setSection8Data({...section8Data, assessment_findings: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} placeholder="Nursing assessment findings" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nursing Diagnosis</label>
            <textarea value={section8Data.nursing_diagnosis} onChange={(e) => setSection8Data({...section8Data, nursing_diagnosis: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} placeholder="Nursing diagnosis" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Goals / Expected Outcomes</label>
            <textarea value={section8Data.goals_expected_outcomes} onChange={(e) => setSection8Data({...section8Data, goals_expected_outcomes: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} placeholder="Nursing goals and expected outcomes" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Interventions / Nursing Actions</label>
            <textarea value={section8Data.interventions_nursing_actions} onChange={(e) => setSection8Data({...section8Data, interventions_nursing_actions: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} placeholder="Nursing interventions and actions" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient Education / Counseling Provided</label>
            <textarea value={section8Data.patient_education_counseling} onChange={(e) => setSection8Data({...section8Data, patient_education_counseling: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} placeholder="Patient education and counseling provided" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Evaluation / Response to Care</label>
            <textarea value={section8Data.evaluation_response_to_care} onChange={(e) => setSection8Data({...section8Data, evaluation_response_to_care: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} placeholder="Evaluation of patient response to care" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medication Administration Record</label>
            <textarea value={section8Data.medication_administration} onChange={(e) => setSection8Data({...section8Data, medication_administration: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows={4} placeholder="Medication administration details" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
            <textarea value={section8Data.additional_notes} onChange={(e) => setSection8Data({...section8Data, additional_notes: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} placeholder="Additional observations or instructions" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSection9 = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Intake and Output Chart</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chart Date</label>
              <input type="date" value={section9Data.chart_date} onChange={(e) => setSection9Data({...section9Data, chart_date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
              <select value={section9Data.shift} onChange={(e) => setSection9Data({...section9Data, shift: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
                <option value="Night">Night</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nurse Name</label>
              <input type="text" value={section9Data.nurse_name} onChange={(e) => setSection9Data({...section9Data, nurse_name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter nurse name" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Intake - Oral (ml)</label>
              <input type="number" value={section9Data.intake_oral} onChange={(e) => setSection9Data({...section9Data, intake_oral: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Oral intake" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Intake - IV (ml)</label>
              <input type="number" value={section9Data.intake_iv_fluids} onChange={(e) => setSection9Data({...section9Data, intake_iv_fluids: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="IV intake" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Intake - Other (ml)</label>
              <input type="text" value={section9Data.intake_other_specify} onChange={(e) => setSection9Data({...section9Data, intake_other_specify: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Other intake" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Output - Urine (ml)</label>
              <input type="number" value={section9Data.output_urine} onChange={(e) => setSection9Data({...section9Data, output_urine: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Urine output" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Output - Other (ml)</label>
              <input type="text" value={section9Data.output_other_specify} onChange={(e) => setSection9Data({...section9Data, output_other_specify: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Other output" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Intake (ml)</label>
              <input type="number" value={section9Data.total_intake} onChange={(e) => setSection9Data({...section9Data, total_intake: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Total intake" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Output (ml)</label>
              <input type="number" value={section9Data.total_output} onChange={(e) => setSection9Data({...section9Data, total_output: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Total output" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Balance (ml)</label>
              <input type="number" value={section9Data.net_balance} onChange={(e) => setSection9Data({...section9Data, net_balance: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Fluid balance" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
            <textarea value={section9Data.remarks_notes} onChange={(e) => setSection9Data({...section9Data, remarks_notes: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} placeholder="Additional comments or observations" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Signature</label>
              <input type="text" value={section9Data.signature} onChange={(e) => setSection9Data({...section9Data, signature: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nurse signature" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
              <input type="datetime-local" value={section9Data.signoff_date_time} onChange={(e) => setSection9Data({...section9Data, signoff_date_time: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSection10 = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Nutritional Screening</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
              <input type="text" value={section10Data.patient_name} onChange={(e) => setSection10Data({...section10Data, patient_name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter patient name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Number</label>
              <input type="text" value={section10Data.hospital_number} onChange={(e) => setSection10Data({...section10Data, hospital_number: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter hospital number" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input type="number" value={section10Data.age} onChange={(e) => setSection10Data({...section10Data, age: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter age" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
              <select value={section10Data.sex} onChange={(e) => setSection10Data({...section10Data, sex: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Screening</label>
              <input type="date" value={section10Data.screening_date} onChange={(e) => setSection10Data({...section10Data, screening_date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
              <input type="number" value={section10Data.weight} onChange={(e) => setSection10Data({...section10Data, weight: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter weight" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
              <input type="number" value={section10Data.height} onChange={(e) => setSection10Data({...section10Data, height: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter height" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BMI (Body Mass Index)</label>
              <input type="number" value={section10Data.bmi} onChange={(e) => setSection10Data({...section10Data, bmi: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Calculated BMI" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input type="checkbox" checked={section10Data.recent_weight_loss} onChange={(e) => setSection10Data({...section10Data, recent_weight_loss: e.target.checked})} className="mr-2" />
              <label className="text-sm font-medium text-gray-700">Recent Weight Loss</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" checked={section10Data.swallowing_difficulties} onChange={(e) => setSection10Data({...section10Data, swallowing_difficulties: e.target.checked})} className="mr-2" />
              <label className="text-sm font-medium text-gray-700">Swallowing Difficulties</label>
            </div>
          </div>
          {section10Data.recent_weight_loss && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight Loss Amount (kg)</label>
                <input type="number" value={section10Data.weight_loss_amount} onChange={(e) => setSection10Data({...section10Data, weight_loss_amount: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Amount lost" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Over how many weeks/months</label>
                <input type="text" value={section10Data.weight_loss_period} onChange={(e) => setSection10Data({...section10Data, weight_loss_period: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Time period" />
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Appetite Status</label>
            <select value={section10Data.appetite_status} onChange={(e) => setSection10Data({...section10Data, appetite_status: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
              <option value="None">None</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Restrictions</label>
            <textarea value={section10Data.dietary_restrictions} onChange={(e) => setSection10Data({...section10Data, dietary_restrictions: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} placeholder="List any dietary restrictions" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Diet</label>
            <textarea value={section10Data.current_diet} onChange={(e) => setSection10Data({...section10Data, current_diet: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} placeholder="Describe current diet" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Risk Factors</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input type="checkbox" checked={section10Data.risk_chronic_illness} onChange={(e) => setSection10Data({...section10Data, risk_chronic_illness: e.target.checked})} className="mr-2" />
                <label className="text-sm font-medium text-gray-700">Chronic illness</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" checked={section10Data.risk_infections} onChange={(e) => setSection10Data({...section10Data, risk_infections: e.target.checked})} className="mr-2" />
                <label className="text-sm font-medium text-gray-700">Infections</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" checked={section10Data.risk_surgery} onChange={(e) => setSection10Data({...section10Data, risk_surgery: e.target.checked})} className="mr-2" />
                <label className="text-sm font-medium text-gray-700">Surgery planned or recent</label>
              </div>
            </div>
            <div className="mt-2">
              <input type="text" value={section10Data.risk_others} onChange={(e) => setSection10Data({...section10Data, risk_others: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Others (specify)" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Screening Outcome</label>
              <select value={section10Data.screening_outcome} onChange={(e) => setSection10Data({...section10Data, screening_outcome: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Normal">Normal</option>
                <option value="At Risk">At Risk</option>
                <option value="Malnourished">Malnourished</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Screening Completed By</label>
              <input type="text" value={section10Data.screening_completed_by} onChange={(e) => setSection10Data({...section10Data, screening_completed_by: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter name" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date and Signature</label>
            <input type="datetime-local" value={section10Data.screening_signature_date} onChange={(e) => setSection10Data({...section10Data, screening_signature_date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSection11 = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Nutrition Assessment Form (NAF)</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
              <input type="text" value={section11Data.patient_name} onChange={(e) => setSection11Data({...section11Data, patient_name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter patient name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input type="number" value={section11Data.patient_age} onChange={(e) => setSection11Data({...section11Data, patient_age: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter age" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
              <select value={section11Data.patient_sex} onChange={(e) => setSection11Data({...section11Data, patient_sex: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Number</label>
              <input type="text" value={section11Data.hospital_number} onChange={(e) => setSection11Data({...section11Data, hospital_number: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter hospital number" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Date</label>
            <input type="date" value={section11Data.assessment_date} onChange={(e) => setSection11Data({...section11Data, assessment_date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dietary History</label>
            <textarea value={section11Data.dietary_history} onChange={(e) => setSection11Data({...section11Data, dietary_history: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} placeholder="Detailed dietary history" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
              <input type="number" value={section11Data.weight_kg} onChange={(e) => setSection11Data({...section11Data, weight_kg: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Weight" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
              <input type="number" value={section11Data.height_cm} onChange={(e) => setSection11Data({...section11Data, height_cm: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Height" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">MUAC (cm)</label>
              <input type="number" value={section11Data.muac_cm} onChange={(e) => setSection11Data({...section11Data, muac_cm: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="MUAC" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skinfold Thickness (mm)</label>
              <input type="number" value={section11Data.skinfold_thickness} onChange={(e) => setSection11Data({...section11Data, skinfold_thickness: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Skinfold" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Biochemical Data</label>
            <textarea value={section11Data.biochemical_data} onChange={(e) => setSection11Data({...section11Data, biochemical_data: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} placeholder="Lab results and biochemical markers" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Signs of Malnutrition</label>
            <textarea value={section11Data.clinical_signs_malnutrition} onChange={(e) => setSection11Data({...section11Data, clinical_signs_malnutrition: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} placeholder="Clinical signs observed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Functional Assessment</label>
            <input type="text" value={section11Data.functional_assessment} onChange={(e) => setSection11Data({...section11Data, functional_assessment: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., hand grip strength" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nutritional Diagnosis</label>
            <textarea value={section11Data.nutritional_diagnosis} onChange={(e) => setSection11Data({...section11Data, nutritional_diagnosis: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} placeholder="Nutritional diagnosis" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recommended Nutrition Care Plan</label>
            <textarea value={section11Data.recommended_care_plan} onChange={(e) => setSection11Data({...section11Data, recommended_care_plan: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} placeholder="Recommended care plan" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monitoring & Evaluation Plan</label>
            <textarea value={section11Data.monitoring_evaluation_plan} onChange={(e) => setSection11Data({...section11Data, monitoring_evaluation_plan: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} placeholder="Monitoring and evaluation plan" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assessed by</label>
              <input type="text" value={section11Data.assessed_by} onChange={(e) => setSection11Data({...section11Data, assessed_by: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Assessor name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date and Signature</label>
              <input type="datetime-local" value={section11Data.assessment_signature_date} onChange={(e) => setSection11Data({...section11Data, assessment_signature_date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSection12 = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Diet Chart</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
              <input type="text" value={section12Data.patient_name} onChange={(e) => setSection12Data({...section12Data, patient_name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter patient name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Number</label>
              <input type="text" value={section12Data.hospital_number} onChange={(e) => setSection12Data({...section12Data, hospital_number: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter hospital number" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input type="number" value={section12Data.age} onChange={(e) => setSection12Data({...section12Data, age: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter age" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
              <select value={section12Data.sex} onChange={(e) => setSection12Data({...section12Data, sex: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admission Date</label>
              <input type="date" value={section12Data.admission_date} onChange={(e) => setSection12Data({...section12Data, admission_date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diet Type</label>
              <select value={section12Data.diet_type} onChange={(e) => setSection12Data({...section12Data, diet_type: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Normal">Normal</option>
                <option value="Soft">Soft</option>
                <option value="Diabetic">Diabetic</option>
                <option value="Renal">Renal</option>
                <option value="Liquid">Liquid</option>
                <option value="Others">Others</option>
              </select>
            </div>
          </div>
          {section12Data.diet_type === 'Others' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specify Diet Type</label>
              <input type="text" value={section12Data.diet_type_others} onChange={(e) => setSection12Data({...section12Data, diet_type_others: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Specify diet type" />
            </div>
          )}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-800">Daily Meal Schedule</h4>
            {[
              { key: 'breakfast', label: 'Breakfast' },
              { key: 'mid_morning', label: 'Mid-Morning' },
              { key: 'lunch', label: 'Lunch' },
              { key: 'afternoon', label: 'Afternoon' },
              { key: 'dinner', label: 'Dinner' },
              { key: 'bedtime', label: 'Bedtime' }
            ].map((meal) => (
              <div key={meal.key} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gray-200 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{meal.label} Details</label>
                  <textarea value={section12Data[`${meal.key}_details` as keyof typeof section12Data] as string} onChange={(e) => setSection12Data({...section12Data, [`${meal.key}_details`]: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} placeholder="Food items, calories, restrictions" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes/Instructions</label>
                  <textarea value={section12Data[`${meal.key}_notes` as keyof typeof section12Data] as string} onChange={(e) => setSection12Data({...section12Data, [`${meal.key}_notes`]: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} placeholder="Special notes or instructions" />
                </div>
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Special Nutritional Instructions</label>
            <textarea value={section12Data.special_nutritional_instructions} onChange={(e) => setSection12Data({...section12Data, special_nutritional_instructions: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} placeholder="Additional dietary requirements, supplements, or restrictions" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input type="checkbox" checked={section12Data.consultation_required} onChange={(e) => setSection12Data({...section12Data, consultation_required: e.target.checked})} className="mr-2" />
              <label className="text-sm font-medium text-gray-700">Dietary Consultation Required</label>
            </div>
            {section12Data.consultation_required && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dietician Name</label>
                <input type="text" value={section12Data.dietician_name} onChange={(e) => setSection12Data({...section12Data, dietician_name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter dietician name" />
              </div>
            )}
          </div>
          {section12Data.consultation_required && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Date</label>
              <input type="date" value={section12Data.consultation_date} onChange={(e) => setSection12Data({...section12Data, consultation_date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Signed By</label>
              <input type="text" value={section12Data.signed_by} onChange={(e) => setSection12Data({...section12Data, signed_by: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
              <input type="text" value={section12Data.designation} onChange={(e) => setSection12Data({...section12Data, designation: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter designation" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date and Time</label>
              <input type="datetime-local" value={section12Data.signoff_date_time} onChange={(e) => setSection12Data({...section12Data, signoff_date_time: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 1:
        return renderSection1();
      case 2:
        return renderSection2();
      case 3:
        return renderSection3();
      case 4:
        return renderSection4();
      case 5:
        return renderSection5();
      case 6:
        return renderSection6();
      case 7:
        return renderSection7();
      case 8:
        return renderSection8();
      case 9:
        return renderSection9();
      case 10:
        return renderSection10();
      case 11:
        return renderSection11();
      case 12:
        return renderSection12();
      default:
        return renderSection1();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Patient File"
        subtitle={currentSectionInfo?.name || 'Basic Patient Information'}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Patient File', href: '#' }
        ]}
      />

      {/* Section Navigation */}
      {renderSectionNavigation()}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Voice Recording Section */}
          <div className="lg:col-span-1">
            <Section title="Voice Input" className="sticky top-4">
              <Recorder
                onTranscribe={handleTranscribe}
                disabled={isLoading}
                loading={isLoading}
                enableTranscription={true}
                showLanguageToggle={true}
                className="mb-4"
              />
              
              {transcript && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Transcript:</h4>
                  <div className="bg-gray-100 p-3 rounded-lg text-sm mb-3">
                    {transcript}
                  </div>
                  <Button
                    onClick={handleMapFields}
                    disabled={isLoading}
                    className="w-full"
                    variant="primary"
                  >
                    <Icon name="Zap" size={16} className="mr-2" />
                    {isLoading ? 'Mapping...' : 'Map Fields'}
                  </Button>
                </div>
              )}
            </Section>
          </div>

          {/* Form Section */}
          <div className="lg:col-span-2">
            <Section title={`Patient File - ${currentSectionInfo?.name || 'Basic Patient Information'}`}>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Processing...</span>
                </div>
              ) : (
                <>
                  {renderCurrentSection()}
                  
                  <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                    {/* Clear Buttons - Left Side */}
                    <div className="flex gap-2">
                      <Button
                        onClick={handleClearCurrentSection}
                        disabled={isLoading || isSaving}
                        variant="secondary"
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      >
                        <Icon name="Eraser" size={16} className="mr-2" />
                        Clear Section {currentSection}
                      </Button>
                      <Button
                        onClick={handleClearAllSections}
                        disabled={isLoading || isSaving}
                        variant="secondary"
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      >
                        <Icon name="Eraser" size={16} className="mr-2" />
                        Clear All Sections
                      </Button>
                    </div>
                    
                    {/* Action Buttons - Right Side */}
                    <div className="flex gap-4">
                    <Button
                      onClick={() => navigate('/')}
                      variant="secondary"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : `Save Section ${currentSection}`}
                    </Button>
                    </div>
                  </div>
                </>
              )}
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
