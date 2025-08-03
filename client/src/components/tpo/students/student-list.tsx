import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Trash2, User, Phone, Mail, Building } from 'lucide-react';

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
}

interface StudentListProps {
  students: Student[];
  onSelect: (student: Student) => void;
  onEdit?: (student: Student) => void;
  onDelete?: (studentId: number) => void;
}

export const StudentList: React.FC<StudentListProps> = ({ 
  students, 
  onSelect, 
  onEdit, 
  onDelete 
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {students.map((student) => (
      <Card key={student.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">{student.name}</h3>
                <p className="text-sm text-slate-600">{student.rollNumber}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(student);
                  }}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(student.id);
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center text-slate-600">
              <Building className="w-4 h-4 mr-2" />
              <span>{student.branch} - Year {student.year}</span>
            </div>
            {student.email && (
              <div className="flex items-center text-slate-600">
                <Mail className="w-4 h-4 mr-2" />
                <span className="truncate">{student.email}</span>
              </div>
            )}
            {student.phone && (
              <div className="flex items-center text-slate-600">
                <Phone className="w-4 h-4 mr-2" />
                <span>{student.phone}</span>
              </div>
            )}
            {student.selected && student.companyName && (
              <div className="mt-2 p-2 bg-green-50 rounded">
                <p className="text-green-700 font-medium text-xs">PLACED</p>
                <p className="text-green-600 text-xs">{student.companyName}</p>
                {student.package && (
                  <p className="text-green-600 text-xs">₹{student.package} LPA</p>
                )}
              </div>
            )}
          </div>
          
          <Button
            variant="ghost"
            className="w-full mt-3 text-xs"
            onClick={() => onSelect(student)}
          >
            View Details
          </Button>
        </CardContent>
      </Card>
    ))}
  </div>
); 