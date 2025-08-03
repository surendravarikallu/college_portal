import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, Phone, Mail, MapPin, Building, ArrowLeft } from 'lucide-react';

interface Alumni {
  id: number;
  name: string;
  rollNumber: string;
  passOutYear: number;
  higherEducationCollege?: string;
  collegeRollNumber?: string;
  contactNumber: string;
  email: string;
  address: string;
}

interface AlumniDetailsProps {
  alumni: Alumni;
  onBack: () => void;
}

export function AlumniDetails({ alumni, onBack }: AlumniDetailsProps) {
  return (
    <div className="space-y-6">
      <Button 
        variant="outline" 
        onClick={onBack}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Alumni List
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">{alumni.name}</CardTitle>
              <p className="text-slate-600">{alumni.rollNumber} • Batch {alumni.passOutYear}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800">Contact Information</h3>
              
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-slate-500" />
                <div>
                  <p className="text-sm text-slate-600">Phone Number</p>
                  <p className="font-medium">{alumni.contactNumber}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-slate-500" />
                <div>
                  <p className="text-sm text-slate-600">Email Address</p>
                  <p className="font-medium">{alumni.email}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-slate-500 mt-1" />
                <div>
                  <p className="text-sm text-slate-600">Current Address</p>
                  <p className="font-medium">{alumni.address}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800">Education Details</h3>
              
              <div className="flex items-center space-x-3">
                <GraduationCap className="w-5 h-5 text-slate-500" />
                <div>
                  <p className="text-sm text-slate-600">Undergraduate</p>
                  <p className="font-medium">KITS Akshar Institute ({alumni.passOutYear})</p>
                </div>
              </div>

              {alumni.higherEducationCollege && (
                <div className="flex items-center space-x-3">
                  <Building className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="text-sm text-slate-600">Higher Education</p>
                    <p className="font-medium">{alumni.higherEducationCollege}</p>
                    {alumni.collegeRollNumber && (
                      <p className="text-sm text-slate-500">Roll: {alumni.collegeRollNumber}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}