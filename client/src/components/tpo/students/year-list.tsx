import React from 'react';

interface YearListProps {
  years: number[];
  onSelect: (year: number) => void;
}

export const YearList: React.FC<YearListProps> = ({ years, onSelect }) => {
  // Get batch data from window object
  const batchData = (window as any).batchData || [];
  
  return (
    <div className="flex flex-wrap gap-4">
      {years.map((year) => {
        // Find the corresponding batch string for this year
        const batchInfo = batchData.find((b: any) => b.endYear === year);
        const displayText = batchInfo ? batchInfo.batch : `Batch Year ${year}`;
        
        return (
          <button
            key={year}
            className="bg-green-100 hover:bg-green-200 rounded p-4 text-lg font-semibold shadow"
            onClick={() => onSelect(year)}
          >
            {displayText}
          </button>
        );
      })}
    </div>
  );
}; 