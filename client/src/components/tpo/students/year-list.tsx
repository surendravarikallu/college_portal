import React from 'react';

interface YearListProps {
  years: number[];
  onSelect: (year: number) => void;
}

export const YearList: React.FC<YearListProps> = ({ years, onSelect }) => (
  <div className="flex flex-wrap gap-4">
    {years.map((year) => (
      <button
        key={year}
        className="bg-green-100 hover:bg-green-200 rounded p-4 text-lg font-semibold shadow"
        onClick={() => onSelect(year)}
      >
        {year}
      </button>
    ))}
  </div>
); 