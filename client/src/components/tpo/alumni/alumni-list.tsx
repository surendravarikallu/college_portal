import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, Phone, Mail, MapPin, Edit, Trash2 } from 'lucide-react';

interface Alumni {
  id: number;
  name: string;
  rollNumber: string;
  passOutYear: number;
  higherEducationCollege?: string;
  contactNumber: string;
  email: string;
  address: string;
}

interface AlumniListProps {
  alumni: Alumni[];
  onSelect: (alumni: Alumni) => void;
  onEdit?: (alumni: Alumni) => void;
  onDelete?: (alumniId: number) => void;
}

export function AlumniList({ alumni, onSelect, onEdit, onDelete }: AlumniListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {alumni.map((alumnus) => (
        <Card 
          key={alumnus.id} 
          className="hover:shadow-md transition-shadow"
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{alumnus.name}</h3>
                  <p className="text-sm text-slate-600">{alumnus.rollNumber}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(alumnus);
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
                      onDelete(alumnus.id);
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
                <GraduationCap className="w-4 h-4 mr-2" />
                <span>Class of {alumnus.passOutYear}</span>
              </div>
              {alumnus.higherEducationCollege && (
                <div className="flex items-center text-blue-600">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  <span className="truncate">{alumnus.higherEducationCollege}</span>
                </div>
              )}
              <div className="flex items-center text-slate-600">
                <Phone className="w-4 h-4 mr-2" />
                <span>{alumnus.contactNumber}</span>
              </div>
              <div className="flex items-center text-slate-600">
                <Mail className="w-4 h-4 mr-2" />
                <span className="truncate">{alumnus.email}</span>
              </div>
              {alumnus.address && (
                <div className="flex items-center text-slate-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span className="truncate">{alumnus.address}</span>
                </div>
              )}
            </div>
            
            <Button
              variant="ghost"
              className="w-full mt-3 text-xs"
              onClick={() => onSelect(alumnus)}
            >
              View Details
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}