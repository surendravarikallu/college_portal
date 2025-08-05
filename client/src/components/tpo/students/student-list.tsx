import React from 'react';
import { Button } from '@/components/ui/button';
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
  batch?: string;
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
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-slate-200">
      <thead className="bg-slate-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
            Roll Number
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
            Name
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
            Branch
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
            Batch
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
            Year
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
            Email
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
            Phone
          </th>
          <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
            Status
          </th>
          <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
            Company
          </th>
          <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
            Package
          </th>
          <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-slate-200">
        {students.map((student) => (
          <tr key={student.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-6 py-4 whitespace-nowrap">
              <button
                onClick={() => onSelect(student)}
                className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer hover:underline"
              >
                {student.rollNumber}
              </button>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <button
                onClick={() => onSelect(student)}
                className="text-slate-900 hover:text-blue-600 font-medium cursor-pointer hover:underline"
              >
                {student.name}
              </button>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-slate-600">
              {student.branch}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-slate-600">
              {student.batch || 'N/A'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-slate-600">
              {student.year}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-slate-600">
              {student.email || 'N/A'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-slate-600">
              {student.phone || 'N/A'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-center">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                student.selected 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {student.selected ? 'Placed' : 'Not Placed'}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-center text-slate-600">
              {student.selected ? (student.companyName || 'N/A') : 'N/A'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-center text-slate-600">
              {student.selected && student.package ? `${student.package} LPA` : 'N/A'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
              <div className="flex space-x-2 justify-center">
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
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
); 