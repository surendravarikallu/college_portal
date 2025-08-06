import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { GraduationCap, Phone, Mail, MapPin, Edit, Trash2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

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
  onAddNew?: () => void;
}

export function AlumniList({ alumni, onSelect, onEdit, onDelete, onAddNew }: AlumniListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter alumni based on search term
  const filteredAlumni = alumni.filter(alumnus => {
    const searchLower = searchTerm.toLowerCase();
    return (
      alumnus.name?.toLowerCase().includes(searchLower) ||
      alumnus.rollNumber?.toLowerCase().includes(searchLower) ||
      alumnus.email?.toLowerCase().includes(searchLower) ||
      alumnus.contactNumber?.toLowerCase().includes(searchLower) ||
      alumnus.higherEducationCollege?.toLowerCase().includes(searchLower) ||
      alumnus.passOutYear?.toString().includes(searchLower)
    );
  });

  return (
    <div className="space-y-4">
      {/* Search and Add Section */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search alumni..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {onAddNew && (
          <Button onClick={onAddNew} className="whitespace-nowrap">
            Add New Alumni
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Roll Number</TableHead>
              <TableHead>Pass Out Year</TableHead>
              <TableHead>Higher Education</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAlumni.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  {searchTerm ? 'No alumni found matching your search.' : 'No alumni data available.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredAlumni.map((alumnus) => (
                <TableRow 
                  key={alumnus.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onSelect(alumnus)}
                >
                  <TableCell className="font-medium">{alumnus.name}</TableCell>
                  <TableCell>{alumnus.rollNumber}</TableCell>
                  <TableCell>{alumnus.passOutYear}</TableCell>
                  <TableCell>
                    {alumnus.higherEducationCollege || '-'}
                  </TableCell>
                  <TableCell>{alumnus.contactNumber}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {alumnus.email}
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-500">
        Showing {filteredAlumni.length} of {alumni.length} alumni
        {searchTerm && ` matching "${searchTerm}"`}
      </div>
    </div>
  );
}