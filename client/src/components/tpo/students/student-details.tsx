import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Save, X, User, Phone, Mail, Building, Briefcase } from 'lucide-react';

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
  package?: number;
  role?: string;
  batch?: string;
}

interface StudentDetailsProps {
  student: Student;
  onBack?: () => void;
  onUpdate?: (updatedStudent: Student) => void;
}

export const StudentDetails: React.FC<StudentDetailsProps> = ({ student, onBack, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(student);

  const handleInputChange = (field: keyof Student, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
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
        console.error('Failed to update student');
      }
    } catch (error) {
      console.error('Error updating student:', error);
    }
  };

  const handleCancel = () => {
    setFormData(student);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Edit Student</h2>
          <div className="flex space-x-2">
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>

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

          {student.selected && (
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}; 