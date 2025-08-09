import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Save, X, User, Phone, Mail, Building, Briefcase, Plus, Trash2 } from 'lucide-react';
import { DriveDetail, StudentDriveDetails } from '@/types/drive-details';

interface Student {
  id: number;
  name: string;
  rollNumber: string;
  branch: string;
  year: number;
  email?: string;
  phone?: string;
  selected?: boolean;
  companyName?: string;
  offerLetterUrl?: string;
  idCardUrl?: string;
  package?: number;
  role?: string;
  batch?: string;
  driveDetails?: string;
}

interface StudentDetailsProps {
  student: Student;
  onBack?: () => void;
  onUpdate?: (updatedStudent: Student) => void;
}

export const StudentDetails: React.FC<StudentDetailsProps> = ({ student, onBack, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(student);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [driveDetails, setDriveDetails] = useState<StudentDriveDetails>(() => {
    try {
      return student.driveDetails ? JSON.parse(student.driveDetails) : { drives: [], totalDrives: 0, totalRoundsQualified: 0 };
    } catch {
      return { drives: [], totalDrives: 0, totalRoundsQualified: 0 };
    }
  });

  const handleInputChange = (field: keyof Student, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/students/${student.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updatedStudent = await response.json();
        onUpdate?.(updatedStudent);
        setIsEditing(false);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update student');
      }
    } catch (error) {
      console.error('Error updating student:', error);
      setError('Error updating student. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(student);
    setIsEditing(false);
    setError(null);
    setDriveDetails(() => {
      try {
        return student.driveDetails ? JSON.parse(student.driveDetails) : { drives: [], totalDrives: 0, totalRoundsQualified: 0 };
      } catch {
        return { drives: [], totalDrives: 0, totalRoundsQualified: 0 };
      }
    });
  };

  const addDriveDetail = () => {
    const newDrive: DriveDetail = {
      id: Date.now().toString(),
      companyName: "",
      date: new Date().toISOString().split('T')[0],
      roundsQualified: 0,
      roundsName: "",
      failedRound: "",
      notes: "",
    };
    
    const updatedDrives = [...driveDetails.drives, newDrive];
    const updatedDetails = {
      ...driveDetails,
      drives: updatedDrives,
      totalDrives: updatedDrives.length,
      totalRoundsQualified: updatedDrives.reduce((sum, drive) => sum + drive.roundsQualified, 0),
    };
    
    setDriveDetails(updatedDetails);
    setFormData(prev => ({ ...prev, driveDetails: JSON.stringify(updatedDetails) }));
  };

  const updateDriveDetail = (id: string, field: keyof DriveDetail, value: any) => {
    const updatedDrives = driveDetails.drives.map(drive => 
      drive.id === id ? { ...drive, [field]: value } : drive
    );
    
    const updatedDetails = {
      ...driveDetails,
      drives: updatedDrives,
      totalRoundsQualified: updatedDrives.reduce((sum, drive) => sum + drive.roundsQualified, 0),
    };
    
    setDriveDetails(updatedDetails);
    setFormData(prev => ({ ...prev, driveDetails: JSON.stringify(updatedDetails) }));
  };

  const removeDriveDetail = (id: string) => {
    const updatedDrives = driveDetails.drives.filter(drive => drive.id !== id);
    const updatedDetails = {
      ...driveDetails,
      drives: updatedDrives,
      totalDrives: updatedDrives.length,
      totalRoundsQualified: updatedDrives.reduce((sum, drive) => sum + drive.roundsQualified, 0),
    };
    
    setDriveDetails(updatedDetails);
    setFormData(prev => ({ ...prev, driveDetails: JSON.stringify(updatedDetails) }));
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Edit Student</h2>
          <div className="flex space-x-2">
            <Button 
              onClick={handleSave} 
              className="bg-green-600 hover:bg-green-700"
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="rollNumber">Roll Number</Label>
              <Input
                id="rollNumber"
                value={formData.rollNumber}
                onChange={(e) => handleInputChange('rollNumber', e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="branch">Branch</Label>
              <Input
                id="branch"
                value={formData.branch}
                onChange={(e) => handleInputChange('branch', e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="batch">Batch</Label>
              <Input
                id="batch"
                value={formData.batch || ''}
                onChange={(e) => handleInputChange('batch', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="selected"
                checked={formData.selected || false}
                onCheckedChange={(checked) => handleInputChange('selected', checked)}
              />
              <Label htmlFor="selected">Placed</Label>
            </div>

            {!formData.selected && (
              <>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-medium">Drive Details</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addDriveDetail}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Drive
                    </Button>
                  </div>
                  
                  {driveDetails.drives.length === 0 ? (
                    <div className="text-center py-4 text-slate-500">
                      No drives added yet. Click "Add Drive" to start tracking.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {driveDetails.drives.map((drive, index) => (
                        <div key={drive.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">Drive #{index + 1}</h4>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeDriveDetail(drive.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor={`company-${drive.id}`}>Company Name</Label>
                              <Input
                                id={`company-${drive.id}`}
                                value={drive.companyName}
                                onChange={(e) => updateDriveDetail(drive.id, 'companyName', e.target.value)}
                                placeholder="e.g., TCS, Infosys"
                                className="mt-1"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor={`date-${drive.id}`}>Drive Date</Label>
                              <Input
                                id={`date-${drive.id}`}
                                type="date"
                                value={drive.date}
                                onChange={(e) => updateDriveDetail(drive.id, 'date', e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor={`rounds-${drive.id}`}>Rounds Qualified</Label>
                              <Input
                                id={`rounds-${drive.id}`}
                                type="number"
                                min="0"
                                value={drive.roundsQualified}
                                onChange={(e) => updateDriveDetail(drive.id, 'roundsQualified', parseInt(e.target.value) || 0)}
                                className="mt-1"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor={`roundsName-${drive.id}`}>Rounds Name</Label>
                              <Input
                                id={`roundsName-${drive.id}`}
                                value={drive.roundsName}
                                onChange={(e) => updateDriveDetail(drive.id, 'roundsName', e.target.value)}
                                placeholder="e.g., Aptitude, Technical, HR"
                                className="mt-1"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor={`failed-${drive.id}`}>Failed at Round</Label>
                              <Input
                                id={`failed-${drive.id}`}
                                value={drive.failedRound}
                                onChange={(e) => updateDriveDetail(drive.id, 'failedRound', e.target.value)}
                                placeholder="e.g., Technical Round, HR Round"
                                className="mt-1"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor={`notes-${drive.id}`}>Notes (Optional)</Label>
                            <Input
                              id={`notes-${drive.id}`}
                              value={drive.notes || ""}
                              onChange={(e) => updateDriveDetail(drive.id, 'notes', e.target.value)}
                              placeholder="Additional notes about this drive"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      ))}
                      
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Total Drives:</span> {driveDetails.totalDrives}
                          </div>
                          <div>
                            <span className="font-medium">Total Rounds Qualified:</span> {driveDetails.totalRoundsQualified}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {formData.selected && (
              <>
                <div>
                  <Label htmlFor="companyName">Company</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName || ''}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="package">Package (LPA)</Label>
                  <Input
                    id="package"
                    type="number"
                    value={formData.package || ''}
                    onChange={(e) => handleInputChange('package', parseInt(e.target.value))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={formData.role || ''}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="idCardUrl">ID Card URL</Label>
                  <Input
                    id="idCardUrl"
                    value={formData.idCardUrl || ''}
                    onChange={(e) => handleInputChange('idCardUrl', e.target.value)}
                    className="mt-1"
                    placeholder="https://example.com/id-card.pdf"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Student Details</h2>
        <div className="flex space-x-2">
          <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <User className="w-5 h-5 text-blue-600" />
            <div>
              <Label className="text-sm font-medium text-slate-500">Name</Label>
              <p className="text-lg font-semibold text-slate-800">{student.name}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Building className="w-5 h-5 text-green-600" />
            <div>
              <Label className="text-sm font-medium text-slate-500">Roll Number</Label>
              <p className="text-lg font-mono text-slate-800">{student.rollNumber}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Building className="w-5 h-5 text-purple-600" />
            <div>
              <Label className="text-sm font-medium text-slate-500">Branch</Label>
              <p className="text-lg text-slate-800">{student.branch}</p>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-slate-500">Year</Label>
            <p className="text-lg text-slate-800">{student.year}</p>
          </div>

          {student.batch && (
            <div>
              <Label className="text-sm font-medium text-slate-500">Batch</Label>
              <p className="text-lg text-slate-800">{student.batch}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {student.email && (
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-blue-600" />
              <div>
                <Label className="text-sm font-medium text-slate-500">Email</Label>
                <p className="text-lg text-slate-800">{student.email}</p>
              </div>
            </div>
          )}

          {student.phone && (
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-green-600" />
              <div>
                <Label className="text-sm font-medium text-slate-500">Phone</Label>
                <p className="text-lg text-slate-800">{student.phone}</p>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <Briefcase className="w-5 h-5 text-orange-600" />
            <div>
              <Label className="text-sm font-medium text-slate-500">Status</Label>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                student.selected 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {student.selected ? 'Placed' : 'Not Placed'}
              </span>
            </div>
          </div>

          {student.selected ? (
            <>
              {student.companyName && (
                <div>
                  <Label className="text-sm font-medium text-slate-500">Company</Label>
                  <p className="text-lg text-slate-800">{student.companyName}</p>
                </div>
              )}

              {student.package && (
                <div>
                  <Label className="text-sm font-medium text-slate-500">Package</Label>
                  <p className="text-lg text-slate-800">{student.package} LPA</p>
                </div>
              )}

              {student.role && (
                <div>
                  <Label className="text-sm font-medium text-slate-500">Role</Label>
                  <p className="text-lg text-slate-800">{student.role}</p>
                </div>
              )}

              {student.offerLetterUrl && (
                <div>
                  <Label className="text-sm font-medium text-slate-500">Offer Letter</Label>
                  <a 
                    href={student.offerLetterUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    View Offer Letter
                  </a>
                </div>
              )}

              {student.idCardUrl && (
                <div>
                  <Label className="text-sm font-medium text-slate-500">ID Card</Label>
                  <a 
                    href={student.idCardUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    View ID Card
                  </a>
                </div>
              )}
            </>
          ) : (
            <>
              {(() => {
                try {
                  const driveData = student.driveDetails ? JSON.parse(student.driveDetails) : { drives: [], totalDrives: 0, totalRoundsQualified: 0 };
                  return (
                    <>
                      {driveData.drives.length > 0 ? (
                        <div className="space-y-4">
                          <div className="bg-slate-50 p-4 rounded-lg">
                            <h4 className="font-medium text-slate-800 mb-3">Drive History</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                              <div>
                                <span className="font-medium">Total Drives:</span> {driveData.totalDrives}
                              </div>
                              <div>
                                <span className="font-medium">Total Rounds Qualified:</span> {driveData.totalRoundsQualified}
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              {driveData.drives.map((drive: any, index: number) => (
                                <div key={drive.id || index} className="border border-slate-200 rounded p-3 bg-white">
                                  <div className="flex justify-between items-start mb-2">
                                    <h5 className="font-medium text-slate-800">Drive #{index + 1}</h5>
                                    <span className="text-xs text-slate-600">{drive.date}</span>
                                  </div>
                                  <div className="space-y-1 text-sm">
                                    <p><span className="font-medium">Company:</span> {drive.companyName}</p>
                                    <p><span className="font-medium">Rounds Qualified:</span> {drive.roundsQualified}</p>
                                    <p><span className="font-medium">Rounds Name:</span> {drive.roundsName}</p>
                                    <p><span className="font-medium">Status:</span> {drive.status || (student.selected && drive.companyName === student.companyName ? 'shortlisted' : 'not shortlisted')}</p>
                                    {typeof drive.offerPackage === 'number' && (
                                      <p><span className="font-medium">Offer Package:</span> {drive.offerPackage} LPA</p>
                                    )}
                                    {drive.notes && (
                                      <p><span className="font-medium">Notes:</span> {drive.notes}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-slate-500">
                          No drive history available
                        </div>
                      )}
                    </>
                  );
                } catch {
                  return (
                    <div className="text-center py-4 text-slate-500">
                      No drive history available
                    </div>
                  );
                }
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}; 