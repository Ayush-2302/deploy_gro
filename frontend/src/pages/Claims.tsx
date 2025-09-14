import { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { getJSON, postJSON } from "../lib/api";
import { PageHeader } from '../components/PageHeader';
import { Card, Button, Badge } from '../components/Primitives';
import { DataTable } from '../components/DataTable';
import { Icon } from '../components/Icons';
import { PatientJourneyTimeline } from '../components/PatientJourneyTimeline';
import { toast } from 'sonner';

interface ClaimDocument {
  id: string;
  name: string;
  status: 'missing' | 'invalid' | 'passed';
  required: boolean;
  lastUpdated: string;
}

interface GovtCheckPoint {
  id: string;
  description: string;
  status: 'pass' | 'query' | 'reject';
  govtAction: string;
  details?: string;
}

interface GovtValidationResult {
  overallStatus: 'pass' | 'query' | 'reject';
  checkPoints: GovtCheckPoint[];
  finalDecision: string;
}

interface Claim {
  id: string;
  patient_id: string;
  scheme?: string;
  docs?: any;
  readiness_score?: number;
  risk?: string;
  created_at: string;
  // Computed fields for display
  patientName?: string;
  claimNumber?: string;
  amount?: number;
  status?: 'draft' | 'ready' | 'submitted' | 'approved' | 'rejected';
  readinessScore?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  eta?: string;
  documents?: ClaimDocument[];
}

// Helper function to transform backend claim data for display
const transformClaimForDisplay = (claim: any, patientName: string): Claim => {
  const readinessScore = claim.readiness_score || 0;
  const risk = claim.risk || 'medium';
  
  // Generate mock documents based on readiness score
  const documents: ClaimDocument[] = [
    { id: '1', name: 'Discharge Summary', status: readinessScore > 80 ? 'passed' : 'missing', required: true, lastUpdated: new Date().toISOString().split('T')[0] },
    { id: '2', name: 'Lab Reports', status: readinessScore > 60 ? 'passed' : 'invalid', required: true, lastUpdated: new Date().toISOString().split('T')[0] },
    { id: '3', name: 'Prescription', status: readinessScore > 40 ? 'passed' : 'missing', required: true, lastUpdated: new Date().toISOString().split('T')[0] },
    { id: '4', name: 'Insurance Card', status: readinessScore > 20 ? 'passed' : 'invalid', required: true, lastUpdated: new Date().toISOString().split('T')[0] },
  ];

  return {
    ...claim,
    patientName,
    claimNumber: `CLM-${claim.id.slice(-6).toUpperCase()}`,
    scheme: claim.scheme || 'Unknown Insurance',
    amount: Math.floor(Math.random() * 50000) + 10000, // Mock amount
    status: readinessScore > 80 ? 'ready' : readinessScore > 50 ? 'draft' : 'draft',
    readinessScore,
    riskLevel: risk as 'low' | 'medium' | 'high',
    eta: readinessScore > 80 ? '1-2 days' : readinessScore > 50 ? '3-5 days' : '5-7 days',
    documents,
  };
};

export default function Claims() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Claim | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-fetch patient data and claims on component load
  useEffect(() => {
    const fetchData = async () => {
      if (!patientId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch patient data
        const patientData = await getJSON(`/api/patients/${patientId}`);
        setPatient(patientData);
        
        // Fetch existing claims
        const claimsData = await getJSON(`/api/patients/${patientId}/claims`);
        
        // If no claims exist, use test data
        if (claimsData.length === 0) {
          const testClaimsData = [
            {
              id: "test_claim_1",
              patient_id: patientId,
              scheme: "Star Health Insurance",
              readiness_score: 85,
              risk: "low",
              created_at: new Date().toISOString()
            },
            {
              id: "test_claim_2", 
              patient_id: patientId,
              scheme: "HDFC ERGO General Insurance",
              readiness_score: 65,
              risk: "medium",
              created_at: new Date().toISOString()
            }
          ];
          
          const transformedClaims = testClaimsData.map((claim: any) => 
            transformClaimForDisplay(claim, patientData.name)
          );
          setClaims(transformedClaims);
        } else {
          const transformedClaims = claimsData.map((claim: any) => 
            transformClaimForDisplay(claim, patientData.name)
          );
          setClaims(transformedClaims);
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load patient data');
        // Fallback to test data
        const testClaimsData = [
          {
            id: "test_claim_1",
            patient_id: patientId || "unknown",
            scheme: "Star Health Insurance",
            readiness_score: 85,
            risk: "low",
            created_at: new Date().toISOString()
          },
          {
            id: "test_claim_2", 
            patient_id: patientId || "unknown",
            scheme: "HDFC ERGO General Insurance",
            readiness_score: 65,
            risk: "medium",
            created_at: new Date().toISOString()
          }
        ];
        
        const transformedClaims = testClaimsData.map((claim: any) => 
          transformClaimForDisplay(claim, "Unknown Patient")
        );
        setClaims(transformedClaims);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [patientId]);

  const handleValidateClaim = async (claimId: string) => {
    setIsValidating(true);
    try {
      // Simulate validation process
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Claim validation completed');
    } catch (error) {
      toast.error('Validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  const handleGenerateClaim = async (claimId: string) => {
    setIsGenerating(true);
    try {
      // Simulate claim generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      toast.success('Claim generated successfully');
    } catch (error) {
      toast.error('Claim generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitClaim = async (claimId: string) => {
    setIsSubmitting(true);
    try {
      // Simulate claim submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Claim submitted successfully');
    } catch (error) {
      toast.error('Claim submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClaim = async (claimId: string) => {
    setIsDeleting(true);
    try {
      // Simulate API call to delete claim
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Remove claim from local state
      setClaims(prevClaims => prevClaims.filter(claim => claim.id !== claimId));
      setDeleteConfirm(null);
      toast.success('Claim deleted successfully');
    } catch (error) {
      toast.error('Failed to delete claim');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
    switch (status) {
      case 'ready': return 'success';
      case 'draft': return 'warning';
      case 'submitted': return 'info';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'neutral';
    }
  };

  const getRiskVariant = (risk: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
    switch (risk) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      default: return 'neutral';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Claims Management"
          subtitle="Loading claims data..."
          actions={
            <Button onClick={() => navigate(`/nurse-handover/${patientId}`)} variant="secondary">
              <Icon name="ArrowLeft" className="w-4 h-4 mr-2" />
              Back to Nurse Handover
            </Button>
          }
        />
        
        <Card className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading claims...</span>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Claims Management"
          subtitle="Error loading claims data"
          actions={
            <Button onClick={() => navigate(`/nurse-handover/${patientId}`)} variant="secondary">
              <Icon name="ArrowLeft" className="w-4 h-4 mr-2" />
              Back to Nurse Handover
            </Button>
          }
        />
        
        <Card className="p-6">
          <div className="flex items-center space-x-3 text-red-600">
            <Icon name="AlertCircle" className="w-6 h-6" />
            <div>
              <h3 className="font-semibold">Error Loading Claims</h3>
              <p className="text-sm text-gray-600 mt-1">{error}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Claims Management"
        subtitle={patient ? `Managing claims for ${patient.name}` : 'Claims Management'}
        actions={
          <Button onClick={() => navigate(`/nurse-handover/${patientId}`)} variant="secondary">
            <Icon name="ArrowLeft" className="w-4 h-4 mr-2" />
            Back to Nurse Handover
          </Button>
        }
      />

      {/* Patient Journey Timeline */}
      <PatientJourneyTimeline currentStep={6} />

      {/* Claims Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon name="FileText" className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Claims</p>
              <p className="text-2xl font-semibold text-gray-900">{claims.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Icon name="CheckCircle" className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ready to Submit</p>
              <p className="text-2xl font-semibold text-gray-900">
                {claims.filter(c => c.status === 'ready').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Icon name="Clock" className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-semibold text-gray-900">
                {claims.filter(c => c.status === 'draft').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Claims Table */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Claims List</h3>
          
          <DataTable
            data={claims}
            columns={[
              {
                key: 'claimNumber',
                label: 'Claim Number',
                render: (claim: Claim) => (
                  <span className="font-medium text-blue-600">{claim.claimNumber}</span>
                )
              },
              {
                key: 'scheme',
                label: 'Insurance Scheme',
                render: (claim: Claim) => (
                  <span className="text-gray-900">{claim.scheme}</span>
                )
              },
              {
                key: 'amount',
                label: 'Amount',
                render: (claim: Claim) => (
                  <span className="font-medium">₹{claim.amount?.toLocaleString()}</span>
                )
              },
              {
                key: 'status',
                label: 'Status',
                render: (claim: Claim) => (
                  <Badge variant={getStatusVariant(claim.status || 'draft')}>
                    {claim.status?.toUpperCase()}
                  </Badge>
                )
              },
              {
                key: 'readinessScore',
                label: 'Readiness',
                render: (claim: Claim) => (
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${claim.readinessScore || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{claim.readinessScore || 0}%</span>
                  </div>
                )
              },
              {
                key: 'riskLevel',
                label: 'Risk',
                render: (claim: Claim) => (
                  <Badge variant={getRiskVariant(claim.riskLevel || 'medium')}>
                    {claim.riskLevel?.toUpperCase()}
                  </Badge>
                )
              },
              {
                key: 'eta',
                label: 'ETA',
                render: (claim: Claim) => (
                  <span className="text-sm text-gray-600">{claim.eta}</span>
                )
              },
              {
                key: 'id' as keyof Claim,
                label: 'Actions',
                render: (claim: Claim) => (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setSelectedClaim(claim)}
                    >
                      <Icon name="Search" className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleValidateClaim(claim.id)}
                      disabled={isValidating}
                    >
                      {isValidating ? 'Validating...' : 'Validate'}
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleGenerateClaim(claim.id)}
                      disabled={isGenerating}
                    >
                      {isGenerating ? 'Generating...' : 'Generate'}
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleSubmitClaim(claim.id)}
                      disabled={isSubmitting || claim.status !== 'ready'}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit'}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setDeleteConfirm(claim)}
                      disabled={isDeleting}
                    >
                      <Icon name="Trash2" className="w-4 h-4" />
                    </Button>
                  </div>
                )
              }
            ]}
          />
        </div>
      </Card>

      {/* Claim Details Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Claim Details</h3>
                <Button
                  variant="secondary"
                  onClick={() => setSelectedClaim(null)}
                >
                  <Icon name="X" className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Claim Number:</span>
                      <span className="font-medium">{selectedClaim.claimNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Patient:</span>
                      <span className="font-medium">{selectedClaim.patientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Scheme:</span>
                      <span className="font-medium">{selectedClaim.scheme}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-medium">₹{selectedClaim.amount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge variant={getStatusVariant(selectedClaim.status || 'draft')}>
                        {selectedClaim.status?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Documents</h4>
                  <div className="space-y-2">
                    {selectedClaim.documents?.map((doc) => (
                      <div key={doc.id} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{doc.name}</span>
                        <Badge variant={
                          doc.status === 'passed' ? 'success' :
                          doc.status === 'invalid' ? 'error' :
                          'warning'
                        }>
                          {doc.status.toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  variant="secondary"
                  onClick={() => setSelectedClaim(null)}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleValidateClaim(selectedClaim.id)}
                  disabled={isValidating}
                >
                  {isValidating ? 'Validating...' : 'Validate Claim'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Icon name="AlertCircle" className="w-6 h-6 text-red-500" />
                <h3 className="text-lg font-semibold text-gray-900">Delete Claim</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete claim <strong>{deleteConfirm.claimNumber}</strong>? 
                This action cannot be undone.
              </p>
              
              <div className="flex justify-end space-x-3">
                <Button
                  variant="secondary"
                  onClick={() => setDeleteConfirm(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleDeleteClaim(deleteConfirm.id)}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}