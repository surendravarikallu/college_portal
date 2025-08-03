import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

interface YearListProps {
  years: number[];
  onSelect: (year: number) => void;
}

export function YearList({ years, onSelect }: YearListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {years.map((year) => (
        <Card 
          key={year} 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onSelect(year)}
        >
          <CardContent className="p-6 text-center">
            <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-slate-800">
              Batch {year}
            </h3>
            <p className="text-sm text-slate-600">
              Pass Out Year
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}