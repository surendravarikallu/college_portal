import React from 'react';

interface CompanyListProps {
  companies: string[];
  onSelect: (company: string) => void;
}

export const CompanyList: React.FC<CompanyListProps> = ({ companies, onSelect }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {companies.map((company) => (
      <button
        key={company}
        className="bg-purple-100 hover:bg-purple-200 rounded p-4 text-lg font-semibold shadow"
        onClick={() => onSelect(company)}
      >
        {company}
      </button>
    ))}
  </div>
); 