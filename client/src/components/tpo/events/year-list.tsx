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
        className="bg-yellow-100 hover:bg-yellow-200 rounded p-4 text-lg font-semibold shadow"
        onClick={() => onSelect(year)}
      >
        {year}
      </button>
    ))}
  </div>
); 