import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertStudentSchema, Student } from "@shared/schema";
import { DriveDetail, StudentDriveDetails } from "@/types/drive-details";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, Users, UserCheck, Building, Search } from "lucide-react";

const studentFormSchema = insertStudentSchema.extend({
  year: z.number().min(1, "Year is required").max(4, "Year must be between 1-4"),
  package: z.number().optional(),
  driveDetails: z.string().optional(),
});

type StudentForm = z.infer<typeof studentFormSchema>;

export function StudentManagement() {
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [offerLetterFile, setOfferLetterFile] = useState<File | null>(null);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [driveDetails, setDriveDetails] = useState<StudentDriveDetails>({
    drives: [],
    totalDrives: 0,
    totalRoundsQualified: 0,
  });
  const [searchFilter, setSearchFilter] = useState<"all" | "name" | "rollNumber" | "branch" | "email">("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  // Filter students based on search term
  const filteredStudents = students.filter((student) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    switch (searchFilter) {
      case "name":
        return student.name.toLowerCase().includes(searchLower);
      case "rollNumber":
        return student.rollNumber.toLowerCase().includes(searchLower);
      case "branch":
        return student.branch?.toLowerCase().includes(searchLower) || false;
      case "email":
        return student.email?.toLowerCase().includes(searchLower) || false;
      case "all":
      default:
        return (
          student.name.toLowerCase().includes(searchLower) ||
          student.rollNumber.toLowerCase().includes(searchLower) ||
          student.branch?.toLowerCase().includes(searchLower) ||
          student.email?.toLowerCase().includes(searchLower) ||
          student.companyName?.toLowerCase().includes(searchLower) ||
          student.role?.toLowerCase().includes(searchLower)
        );
    }
  });

  const form = useForm<StudentForm>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      name: "",
      rollNumber: "",
      branch: "",
      year: 1,
      batch: "",
      email: "",
      phone: "",
      selected: false,
      companyName: "",
      package: undefined,
      role: "",
      driveDetails: JSON.stringify({ drives: [], totalDrives: 0, totalRoundsQualified: 0 }),
    },
  });

  const createStudentMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/students", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create student");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Student created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      handleCloseModal();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStudentMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!editingStudent) return;

      const response = await fetch(`/api/students/${editingStudent.id}`, {
        method: "PUT",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update student");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Student updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      handleCloseModal();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/students/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Student deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddStudent = () => {
    setEditingStudent(null);
    form.reset({
      name: "",
      rollNumber: "",
      branch: "",
      year: 1,
      batch: "",
      email: "",
      phone: "",
      selected: false,
      companyName: "",
      package: undefined,
      role: "",
    });
    setShowStudentModal(true);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    form.reset({
      name: student.name,
      rollNumber: student.rollNumber,
      branch: student.branch || "",
      year: student.year || 1,
      batch: student.batch || "",
      email: student.email || "",
      phone: student.phone || "",
      selected: student.selected || false,
      companyName: student.companyName || "",
      package: student.package || undefined,
      role: student.role || "",
    });
    setShowStudentModal(true);
  };

  const handleDeleteStudent = (id: number) => {
    if (confirm("Are you sure you want to delete this student?")) {
      deleteStudentMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setShowStudentModal(false);
    setEditingStudent(null);
    setOfferLetterFile(null);
    form.reset({
      name: "",
      rollNumber: "",
      branch: "",
      year: 1,
      batch: "",
      email: "",
      phone: "",
      selected: false,
      companyName: "",
      package: undefined,
      role: "",
    });
  };

  const onSubmit = async (data: StudentForm) => {
    console.log("Form data being sent:", data);
    console.log("Form validation errors:", form.formState.errors);

    try {
      const formData = new FormData();

      // Add text fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          formData.append(key, value.toString());
        }
      });

      // Add files if present
      if (offerLetterFile) {
        formData.append('offerLetter', offerLetterFile);
      }
      if (idCardFile) {
        formData.append('idCard', idCardFile);
      }

      if (editingStudent) {
        await updateStudentMutation.mutateAsync(formData as any);
      } else {
        await createStudentMutation.mutateAsync(formData as any);
      }
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleOfferLetterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type (PDF or images)
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (allowedTypes.includes(file.type)) {
        setOfferLetterFile(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF, JPEG, JPG, or PNG file.",
          variant: "destructive",
        });
        event.target.value = '';
      }
    }
  };

  const handleIdCardChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type (PDF or images)
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (allowedTypes.includes(file.type)) {
        setIdCardFile(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF, JPEG, JPG, or PNG file.",
          variant: "destructive",
        });
        event.target.value = '';
      }
    }
  };

  const addDriveDetail = () => {
    const newDrive: DriveDetail = {
      id: Date.now().toString(),
      companyName: "",
      date: new Date().toISOString().split('T')[0],
      roundsQualified: 0,
      failedRound: "",
      notes: "",
    };
    
    const updatedDrives = [...driveDetails.drives, newDrive];
    const updatedDetails = {
      ...driveDetails,
      drives: updatedDrives,
      totalDrives: updatedDrives.length,
      totalRoundsQualified: updatedDrives.reduce((sum, drive) => sum + drive.roundsQualified, 0),
    };
    
    setDriveDetails(updatedDetails);
    form.setValue("driveDetails", JSON.stringify(updatedDetails));
  };

  const updateDriveDetail = (id: string, field: keyof DriveDetail, value: any) => {
    const updatedDrives = driveDetails.drives.map(drive => 
      drive.id === id ? { ...drive, [field]: value } : drive
    );
    
    const updatedDetails = {
      ...driveDetails,
      drives: updatedDrives,
      totalRoundsQualified: updatedDrives.reduce((sum, drive) => sum + drive.roundsQualified, 0),
    };
    
    setDriveDetails(updatedDetails);
    form.setValue("driveDetails", JSON.stringify(updatedDetails));
  };

  const removeDriveDetail = (id: string) => {
    const updatedDrives = driveDetails.drives.filter(drive => drive.id !== id);
    const updatedDetails = {
      ...driveDetails,
      drives: updatedDrives,
      totalDrives: updatedDrives.length,
      totalRoundsQualified: updatedDrives.reduce((sum, drive) => sum + drive.roundsQualified, 0),
    };
    
    setDriveDetails(updatedDetails);
    form.setValue("driveDetails", JSON.stringify(updatedDetails));
  };

  // Group students by branch, batch, and batch year
  const groupedStudents = filteredStudents.reduce((acc, student) => {
    const branch = student.branch || 'Unknown';
    const batch = student.batch || 'Unknown Batch';
    
    // Extract end year from batch format "2020-2024" or "2024"
    const batchStr = student.batch || '';
    const match = batchStr.match(/(\d{4})(?:-\d{4})?$/);
    const batchYear = match ? parseInt(match[1]) : 0;
    
    if (!acc[branch]) acc[branch] = {};
    if (!acc[branch][batch]) acc[branch][batch] = {};
    if (!acc[branch][batch][batch]) acc[branch][batch][batch] = [];
    acc[branch][batch][batch].push(student);
    return acc;
  }, {} as Record<string, Record<string, Record<string, Student[]>>>);

  if (isLoading) {
    return <div>Loading students...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-semibold text-slate-800">Student Management</h3>
          <p className="text-slate-600">Total Students: {students.length} | Showing: {filteredStudents.length}</p>
        </div>
        <Button onClick={handleAddStudent} className="bg-primary text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Student
        </Button>
      </div>

      {/* Search Section */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={searchFilter} onValueChange={(value: any) => setSearchFilter(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Search by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fields</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="rollNumber">Roll Number</SelectItem>
                <SelectItem value="branch">Branch</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
            {searchTerm && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSearchFilter("all");
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {Object.keys(groupedStudents).length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">
              {searchTerm ? "No students found matching your search criteria." : "No students registered yet."}
            </p>
            {!searchTerm && (
              <Button className="mt-4" onClick={handleAddStudent}>
                Add your first student
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedStudents).map(([branch, batchGroups]) => (
            <Card key={branch}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="w-5 h-5 mr-2" />
                  {branch}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(batchGroups).map(([batch, yearGroups]) => (
                  <div key={batch} className="mb-6">
                    <h4 className="text-lg font-medium text-slate-700 mb-3 border-b pb-2">
                      Batch: {batch}
                    </h4>
                    {Object.entries(yearGroups).map(([batch, students]) => (
                      <div key={batch} className="mb-4 ml-4">
                        <h5 className="text-md font-medium text-slate-600 mb-2">Batch: {batch}</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {students.map((student) => (
                            <Card key={student.id} className="border">
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1">
                                    <h5 className="font-medium text-slate-800">{student.name}</h5>
                                    <p className="text-sm text-slate-600">{student.rollNumber}</p>
                                    {student.email && (
                                      <p className="text-xs text-slate-500">{student.email}</p>
                                    )}
                                  </div>
                                  {student.selected && (
                                    <Badge className="bg-green-500 text-white">
                                      <UserCheck className="w-3 h-3 mr-1" />
                                      Placed
                                    </Badge>
                                  )}
                                </div>
                                {student.selected ? (
                                  <div className="mb-2 p-2 bg-green-50 rounded text-xs">
                                    {student.companyName && <p className="font-medium text-green-800">{student.companyName}</p>}
                                    {student.role && <p className="text-green-600">{student.role}</p>}
                                    {student.package && <p className="text-green-600">₹{student.package} LPA</p>}
                                    {student.offerLetterUrl && (
                                      <p className="text-green-600 mt-1">
                                        <a 
                                          href={student.offerLetterUrl} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="underline hover:text-green-800"
                                        >
                                          View Offer Letter
                                        </a>
                                      </p>
                                    )}
                                    {student.idCardUrl && (
                                      <p className="text-green-600 mt-1">
                                        <a 
                                          href={student.idCardUrl} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="underline hover:text-green-800"
                                        >
                                          View ID Card
                                        </a>
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="mb-2 p-2 bg-red-50 rounded text-xs">
                                    <p className="font-medium text-red-800">Not Placed</p>
                                    {(() => {
                                      try {
                                        const driveData = student.driveDetails ? JSON.parse(student.driveDetails) : { drives: [], totalDrives: 0, totalRoundsQualified: 0 };
                                        return (
                                          <>
                                            <p className="text-red-600">Total Drives: {driveData.totalDrives}</p>
                                            <p className="text-red-600">Total Rounds Qualified: {driveData.totalRoundsQualified}</p>
                                            {driveData.drives.length > 0 && (
                                              <div className="mt-2 space-y-1">
                                                {driveData.drives.slice(0, 2).map((drive: any, index: number) => (
                                                  <div key={drive.id || index} className="border-l-2 border-red-300 pl-2">
                                                    <p className="text-red-700 text-xs">{drive.companyName}</p>
                                                    <p className="text-red-600 text-xs">Failed at: {drive.failedRound}</p>
                                                  </div>
                                                ))}
                                                {driveData.drives.length > 2 && (
                                                  <p className="text-red-600 text-xs">+{driveData.drives.length - 2} more drives</p>
                                                )}
                                              </div>
                                            )}
                                          </>
                                        );
                                      } catch {
                                        return <p className="text-red-600">No drive data available</p>;
                                      }
                                    })()}
                                  </div>
                                )}
                                <div className="flex space-x-2 mt-3">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditStudent(student)}
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 border-red-300 hover:bg-red-50"
                                    onClick={() => handleDeleteStudent(student.id)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showStudentModal} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingStudent ? "Edit Student" : "Add New Student"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Student name"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="rollNumber">Roll Number</Label>
                <Input
                  id="rollNumber"
                  placeholder="Roll number"
                  {...form.register("rollNumber")}
                />
                {form.formState.errors.rollNumber && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.rollNumber.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="branch">Branch/Department</Label>
                <Controller
                  name="branch"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CSE">CSE</SelectItem>
                        <SelectItem value="CSE AIML">CSE AIML</SelectItem>
                        <SelectItem value="CSE DS">CSE DS</SelectItem>
                        <SelectItem value="CSE IT">CSE IT</SelectItem>
                        <SelectItem value="ECE">ECE</SelectItem>
                        <SelectItem value="Civil">Civil</SelectItem>
                        <SelectItem value="Mech">Mech</SelectItem>
                        <SelectItem value="EEE">EEE</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <Label htmlFor="year">Year</Label>
                <Controller
                  name="year"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1st Year</SelectItem>
                        <SelectItem value="2">2nd Year</SelectItem>
                        <SelectItem value="3">3rd Year</SelectItem>
                        <SelectItem value="4">4th Year</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.year && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.year.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="batch">Batch (Study Period)</Label>
              <Input
                id="batch"
                placeholder="e.g., 2020-2024, 2021-2025"
                {...form.register("batch")}
              />
              <p className="text-xs text-slate-500 mt-1">Enter the study period (e.g., 2020-2024 for 4-year course)</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@example.com"
                  {...form.register("email")}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="Phone number"
                  {...form.register("phone")}
                />
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center space-x-2">
                <Controller
                  name="selected"
                  control={form.control}
                  render={({ field }) => (
                    <Checkbox
                      id="selected"
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="selected">Student is placed</Label>
              </div>

              {!form.watch("selected") && (
                <>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-base font-medium">Drive Details</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addDriveDetail}
                      >
                        Add Drive
                      </Button>
                    </div>
                    
                    {driveDetails.drives.length === 0 ? (
                      <div className="text-center py-4 text-slate-500">
                        No drives added yet. Click "Add Drive" to start tracking.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {driveDetails.drives.map((drive, index) => (
                          <div key={drive.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium">Drive #{index + 1}</h4>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeDriveDetail(drive.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Remove
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <Label htmlFor={`company-${drive.id}`}>Company Name</Label>
                                <Input
                                  id={`company-${drive.id}`}
                                  value={drive.companyName}
                                  onChange={(e) => updateDriveDetail(drive.id, 'companyName', e.target.value)}
                                  placeholder="e.g., TCS, Infosys"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor={`date-${drive.id}`}>Drive Date</Label>
                                <Input
                                  id={`date-${drive.id}`}
                                  type="date"
                                  value={drive.date}
                                  onChange={(e) => updateDriveDetail(drive.id, 'date', e.target.value)}
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor={`rounds-${drive.id}`}>Rounds Qualified</Label>
                                <Input
                                  id={`rounds-${drive.id}`}
                                  type="number"
                                  min="0"
                                  value={drive.roundsQualified}
                                  onChange={(e) => updateDriveDetail(drive.id, 'roundsQualified', parseInt(e.target.value) || 0)}
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor={`failed-${drive.id}`}>Failed at Round</Label>
                                <Input
                                  id={`failed-${drive.id}`}
                                  value={drive.failedRound}
                                  onChange={(e) => updateDriveDetail(drive.id, 'failedRound', e.target.value)}
                                  placeholder="e.g., Technical Round, HR Round"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <Label htmlFor={`notes-${drive.id}`}>Notes (Optional)</Label>
                              <Input
                                id={`notes-${drive.id}`}
                                value={drive.notes || ""}
                                onChange={(e) => updateDriveDetail(drive.id, 'notes', e.target.value)}
                                placeholder="Additional notes about this drive"
                              />
                            </div>
                          </div>
                        ))}
                        
                        <div className="bg-slate-50 p-3 rounded-lg">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Total Drives:</span> {driveDetails.totalDrives}
                            </div>
                            <div>
                              <span className="font-medium">Total Rounds Qualified:</span> {driveDetails.totalRoundsQualified}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {form.watch("selected") && (
                    <>
                      <div>
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input
                          id="companyName"
                          placeholder="Company name"
                          {...form.register("companyName")}
                        />
                        {form.formState.errors.companyName && (
                          <p className="text-sm text-red-500 mt-1">
                            {form.formState.errors.companyName.message}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="package">Package (LPA)</Label>
                          <Input
                            id="package"
                            type="number"
                            placeholder="Package amount"
                            {...form.register("package", { valueAsNumber: true })}
                          />
                          {form.formState.errors.package && (
                            <p className="text-sm text-red-500 mt-1">
                              {form.formState.errors.package.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="role">Role</Label>
                          <Input
                            id="role"
                            placeholder="Job role"
                            {...form.register("role")}
                          />
                          {form.formState.errors.role && (
                            <p className="text-sm text-red-500 mt-1">
                              {form.formState.errors.role.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="offerLetter">Offer Letter (PDF/Image)</Label>
                        <Input
                          id="offerLetter"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleOfferLetterChange}
                        />
                        <p className="text-xs text-slate-500 mt-1">Upload offer letter (PDF or image format)</p>
                      </div>

                      <div>
                        <Label htmlFor="idCard">ID Card (PDF/Image)</Label>
                        <Input
                          id="idCard"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleIdCardChange}
                        />
                        <p className="text-xs text-slate-500 mt-1">Upload ID card (PDF or image format)</p>
                      </div>
                    </>
                  )}
            </div>

            <div className="flex space-x-2">
              <Button type="button" variant="outline" className="flex-1" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={createStudentMutation.isPending || updateStudentMutation.isPending}
              >
                {createStudentMutation.isPending || updateStudentMutation.isPending 
                  ? "Saving..." 
                  : editingStudent ? "Update" : "Create"
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}