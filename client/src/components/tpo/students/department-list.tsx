import React from 'react';

interface DepartmentListProps {
  departments: string[];
  onSelect: (department: string) => void;
}

export const DepartmentList: React.FC<DepartmentListProps> = ({ departments, onSelect }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {departments.map((dept) => (
      <button
        key={dept}
        className="bg-blue-100 hover:bg-blue-200 rounded p-4 text-lg font-semibold shadow"
        onClick={() => onSelect(dept)}
      >
        {dept}
      </button>
    ))}
  </div>
); 