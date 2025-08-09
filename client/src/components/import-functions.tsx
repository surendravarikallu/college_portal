import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Users, Calendar, GraduationCap, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImportResult {
  success: boolean;
  message: string;
  imported: number;
  errors: string[];
}

export function ImportFunctions() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'students' | 'events' | 'alumni' | 'attendance'>('students');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      setImportResult(null);
    } else {
      toast({
        title: "Invalid file",
        description: "Please select a valid CSV file.",
        variant: "destructive",
      });
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to import.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', importType);

      const response = await fetch(`/api/import/${importType}`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const result: ImportResult = await response.json();

      if (response.ok) {
        setImportResult(result);
        toast({
          title: "Import successful",
          description: `Successfully imported ${result.imported} records.`,
        });
      } else {
        setImportResult(result);
        toast({
          title: "Import failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Import error",
        description: "An error occurred during import.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const getCSVTemplate = () => {
    const templates = {
      students: `name,rollNumber,branch,year,batch,email,phone,selected,companyName,package,role,photoUrl,offerLetterUrl,idCardUrl,driveCompanyName,driveDate,driveRoundsQualified,driveRoundsName,driveStatus,driveOfferPackage,driveNotes
John Doe,2024001,CSE,3,2020-2024,john@example.com,1234567890,true,TCS,12,Software Engineer,https://example.com/photo.jpg,https://example.com/offer.pdf,https://example.com/id-card.pdf,,,,,,
Jane Smith,2024002,ECE,2,2020-2024,jane@example.com,1234567891,false,,,,,,,TCS,15-01-2024,2,"Aptitude, Technical",not shortlisted,,Good technical skills
Jane Smith,2024002,ECE,2,2020-2024,jane@example.com,1234567891,false,,,,,,,Infosys,20-02-2024,1,Aptitude,not shortlisted,,Need to improve coding skills
Mike Johnson,2024003,CSE,4,2020-2024,mike@example.com,1234567892,true,Infosys,10,Developer,https://example.com/photo2.jpg,https://example.com/offer2.pdf,https://example.com/id-card2.pdf,,,,,,
Sarah Wilson,2024004,ECE,1,2021-2025,sarah@example.com,1234567893,false,,,,,,,Wipro,20-02-2024,1,Aptitude,not shortlisted,,Need more practice
Sarah Wilson,2024004,ECE,1,2021-2025,sarah@example.com,1234567893,false,,,,,,,HCL,10-03-2024,0,None,not shortlisted,,Aptitude needs improvement
Alex Brown,2024005,CSE,3,2020-2024,alex@example.com,1234567894,true,Microsoft,18,Software Engineer,https://example.com/photo3.jpg,https://example.com/offer3.pdf,https://example.com/id-card3.pdf,,,,,,`,
      driveDetails: `rollNumber,companyName,date,roundsQualified,roundsName,failedRound,notes
2024002,TCS,15-01-2024,2,Aptitude Technical,HR Round,Good technical skills
2024002,Infosys,20-02-2024,1,Aptitude,Technical Round,Need to improve coding skills
2024004,Wipro,20-02-2024,1,Aptitude,Technical Round,Need more practice
2024004,HCL,10-03-2024,0,None,Aptitude Round,Aptitude needs improvement`,
      events: `title,description,company,startDate,endDate,notificationLink,attachmentUrl
Campus Drive,Technical interview and coding round,TCS,2024-03-15T09:00:00Z,2024-03-15T17:00:00Z,,
Placement Drive,Final placement round,Infosys,2024-03-20T10:00:00Z,2024-03-20T16:00:00Z,https://example.com/notification,`,
      alumni: `name,rollNumber,passOutYear,currentStatus,higherEducationCollege,collegeRollNumber,company,package,role,offerLetterUrl,idCardUrl,address,contactNumber,email
John Doe,2020001,2020,job,,,Google,25,Software Engineer,https://example.com/offer.pdf,https://example.com/id-card.pdf,123 Main St,1234567890,john@google.com
Jane Smith,2020002,2020,higher_education,MIT,MIT001,,,,"https://example.com/offer.pdf",,456 Oak Ave,1234567891,jane@mit.edu
Mike Johnson,2020003,2020,job,,,Microsoft,20,Developer,https://example.com/offer.pdf,https://example.com/id-card.pdf,789 Pine St,1234567892,mike@microsoft.com`,
      attendance: `eventId,studentName,rollNumber,branch,year
1,John Doe,2024001,CSE,2024
1,Jane Smith,2024002,ECE,2024`
    };

    const template = templates[importType];
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${importType}_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Import Type Selection */}
          <div className="space-y-2">
            <Label>Import Type</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[
                { value: 'students', label: 'Students', icon: Users },
                { value: 'driveDetails', label: 'Drive Details', icon: FileText },
                { value: 'events', label: 'Events', icon: Calendar },
                { value: 'alumni', label: 'Alumni', icon: GraduationCap },
                { value: 'attendance', label: 'Attendance', icon: FileText },
              ].map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={importType === value ? 'default' : 'outline'}
                  onClick={() => setImportType(value as any)}
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Select CSV File</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={getCSVTemplate}
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Template
              </Button>
            </div>
          </div>

          {/* Import Button */}
          <Button
            onClick={handleImport}
            disabled={!selectedFile || isImporting}
            className="w-full"
          >
            {isImporting ? 'Importing...' : 'Import Data'}
          </Button>

          {/* Import Result */}
          {importResult && (
            <Card className={`border ${importResult.success ? 'border-green-200' : 'border-red-200'}`}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  {importResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`font-medium ${importResult.success ? 'text-green-600' : 'text-red-600'}`}>
                    {importResult.success ? 'Import Successful' : 'Import Failed'}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-2">{importResult.message}</p>
                {importResult.imported > 0 && (
                  <p className="text-sm text-green-600">Imported: {importResult.imported} records</p>
                )}
                {importResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-red-600">Errors:</p>
                    <ul className="text-xs text-red-600 list-disc list-inside">
                      {importResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Import Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Students CSV Format:</h4>
              <p className="text-slate-600">
                name, rollNumber, branch, year, batch, email, phone, selected, companyName, package, role, photoUrl, offerLetterUrl, idCardUrl, driveCompanyName, driveDate, driveRoundsQualified, driveRoundsName, driveStatus, driveOfferPackage, driveNotes
              </p>
              <p className="text-xs text-slate-500 mt-1">
                • Required: name, rollNumber • year: study year (1, 2, 3, 4) • batch: study period (e.g., "2020-2024").
                • For placed students: set selected=true and optionally fill companyName, package (LPA), role, photoUrl, offerLetterUrl, idCardUrl.
                • For not placed students: leave selected=false and include one row per drive attempt using driveCompanyName, driveDate (DD-MM-YYYY), driveRoundsQualified (number), driveRoundsName (e.g., "Aptitude, Technical"), driveStatus (shortlisted/not shortlisted), driveOfferPackage (LPA), driveNotes. Duplicate student info can be repeated across drive rows.
              </p>
              <div className="text-xs text-slate-500 mt-1">
                <span className="font-medium">Tip:</span> Multiple rows with same rollNumber are merged into a single student with aggregated drive details.
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Drive Details CSV Format:</h4>
              <p className="text-slate-600">
                rollNumber, companyName, date, roundsQualified, roundsName, failedRound, notes
              </p>
              <p className="text-xs text-slate-500 mt-1">
                • Required: rollNumber, companyName, date, roundsQualified, roundsName, failedRound • rollNumber: must match existing student • date: YYYY-MM-DD format • roundsQualified: number of rounds cleared • roundsName: description of rounds (e.g., "Aptitude, Technical") • failedRound: where student failed • notes: optional comments
              </p>
              <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                <p className="font-medium text-green-800 mb-1">✅ Easy Format:</p>
                <p className="text-green-700">Each row represents one drive attempt. Multiple rows for same rollNumber = multiple drives.</p>
                <p className="text-green-700 mt-1"><strong>Step 1:</strong> Import students first</p>
                <p className="text-green-700"><strong>Step 2:</strong> Import drive details for existing students</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Events CSV Format:</h4>
              <p className="text-slate-600">
                title, description, company, startDate, endDate, notificationLink, attachmentUrl
              </p>
              <p className="text-xs text-slate-500 mt-1">
                • Required: title, description, company, startDate, endDate • dates: ISO format (YYYY-MM-DDTHH:MM:SSZ)
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Alumni CSV Format:</h4>
              <p className="text-slate-600">
                name, rollNumber, passOutYear, currentStatus, higherEducationCollege, collegeRollNumber, company, package, role, offerLetterUrl, idCardUrl, address, contactNumber, email
              </p>
              <p className="text-xs text-slate-500 mt-1">
                • Required: name, rollNumber, passOutYear, currentStatus, address, contactNumber, email • currentStatus: "higher_education" or "job" • package: LPA (number) • role: job position • offerLetterUrl: optional file URL • idCardUrl: mandatory file URL for job alumni
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Attendance CSV Format:</h4>
              <p className="text-slate-600">
                eventId, studentName, rollNumber, branch, year
              </p>
              <p className="text-xs text-slate-500 mt-1">
                • Required: studentName, rollNumber • eventId: reference to existing event
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 