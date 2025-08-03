import React from 'react';

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

interface StudentDetailsProps {
  student: Student;
  onBack?: () => void;
}

export const StudentDetails: React.FC<StudentDetailsProps> = ({ student, onBack }) => (
  <div className="bg-white rounded shadow p-6">
    {onBack && (
      <button className="mb-4 px-4 py-2 bg-slate-200 rounded" onClick={onBack}>Back</button>
    )}
    <h2 className="text-xl font-bold mb-2">{student.name}</h2>
    <div className="mb-2">Roll Number: <span className="font-mono">{student.rollNumber}</span></div>
    <div className="mb-2">Branch: {student.branch}</div>
    <div className="mb-2">Year: {student.year}</div>
    {student.email && <div className="mb-2">Email: {student.email}</div>}
    {student.phone && <div className="mb-2">Phone: {student.phone}</div>}
    {student.selected && (
      <>
        <div className="mb-2">Company: {student.companyName}</div>
        <div className="mb-2">Package: ₹{student.package} LPA</div>
        <div className="mb-2">Role: {student.role}</div>
      </>
    )}
  </div>
); 