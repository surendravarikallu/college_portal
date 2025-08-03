import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertAlumniSchema, Alumni } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, GraduationCap, User, Calendar, Search } from "lucide-react";

const alumniFormSchema = insertAlumniSchema.extend({
  passOutYear: z.number().min(1900, "Invalid year").max(new Date().getFullYear(), "Year cannot be in future"),
});

type AlumniForm = z.infer<typeof alumniFormSchema>;

export function AlumniManagement() {
  const [showAlumniModal, setShowAlumniModal] = useState(false);
  const [editingAlumni, setEditingAlumni] = useState<Alumni | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFilter, setSearchFilter] = useState<"all" | "name" | "rollNumber" | "email" | "passOutYear">("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alumni = [], isLoading } = useQuery<Alumni[]>({
    queryKey: ["/api/alumni"],
  });

  // Filter alumni based on search term
  const filteredAlumni = alumni.filter((alumniData) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    switch (searchFilter) {
      case "name":
        return alumniData.name.toLowerCase().includes(searchLower);
      case "rollNumber":
        return alumniData.rollNumber.toLowerCase().includes(searchLower);
      case "email":
        return alumniData.email.toLowerCase().includes(searchLower);
      case "passOutYear":
        return alumniData.passOutYear.toString().includes(searchLower);
      case "all":
      default:
        return (
          alumniData.name.toLowerCase().includes(searchLower) ||
          alumniData.rollNumber.toLowerCase().includes(searchLower) ||
          alumniData.email.toLowerCase().includes(searchLower) ||
          alumniData.passOutYear.toString().includes(searchLower) ||
          alumniData.higherEducationCollege?.toLowerCase().includes(searchLower) ||
          alumniData.address.toLowerCase().includes(searchLower) ||
          alumniData.contactNumber.includes(searchLower)
        );
    }
  });

  const form = useForm<AlumniForm>({
    resolver: zodResolver(alumniFormSchema),
    defaultValues: {
      name: "",
      rollNumber: "",
      passOutYear: new Date().getFullYear(),
      higherEducationCollege: "",
      collegeRollNumber: "",
      address: "",
      contactNumber: "",
      email: "",
    },
  });

  const createAlumniMutation = useMutation({
    mutationFn: async (data: AlumniForm) => {
      const response = await apiRequest("POST", "/api/alumni", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Alumni record created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/alumni"] });
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

  const updateAlumniMutation = useMutation({
    mutationFn: async (data: AlumniForm) => {
      if (!editingAlumni) return;
      const response = await apiRequest("PUT", `/api/alumni/${editingAlumni.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Alumni record updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/alumni"] });
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

  const deleteAlumniMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/alumni/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Alumni record deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/alumni"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddAlumni = () => {
    setEditingAlumni(null);
    form.reset({
      name: "",
      rollNumber: "",
      passOutYear: new Date().getFullYear(),
      higherEducationCollege: "",
      collegeRollNumber: "",
      address: "",
      contactNumber: "",
      email: "",
    });
    setShowAlumniModal(true);
  };

  const handleEditAlumni = (alumniData: Alumni) => {
    setEditingAlumni(alumniData);
    form.reset({
      name: alumniData.name,
      rollNumber: alumniData.rollNumber,
      passOutYear: alumniData.passOutYear,
      higherEducationCollege: alumniData.higherEducationCollege || "",
      collegeRollNumber: alumniData.collegeRollNumber || "",
      address: alumniData.address,
      contactNumber: alumniData.contactNumber,
      email: alumniData.email,
    });
    setShowAlumniModal(true);
  };

  const handleDeleteAlumni = (id: number) => {
    if (confirm("Are you sure you want to delete this alumni record?")) {
      deleteAlumniMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setShowAlumniModal(false);
    setEditingAlumni(null);
    form.reset();
  };

  const onSubmit = (data: AlumniForm) => {
    if (editingAlumni) {
      updateAlumniMutation.mutate(data);
    } else {
      createAlumniMutation.mutate(data);
    }
  };

  // Group alumni by pass out year
  const groupedAlumni = filteredAlumni.reduce((acc, alumniData) => {
    const year = alumniData.passOutYear;
    if (!acc[year]) acc[year] = [];
    acc[year].push(alumniData);
    return acc;
  }, {} as Record<number, Alumni[]>);

  if (isLoading) {
    return <div>Loading alumni...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-semibold text-slate-800">Alumni Management</h3>
          <p className="text-slate-600">Total Alumni: {alumni.length} | Showing: {filteredAlumni.length}</p>
        </div>
        <Button onClick={handleAddAlumni} className="bg-primary text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Alumni
        </Button>
      </div>

      {/* Search Section */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search alumni..."
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
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="passOutYear">Pass Out Year</SelectItem>
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

      {Object.keys(groupedAlumni).length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <GraduationCap className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">
              {searchTerm ? "No alumni found matching your search criteria." : "No alumni registered yet."}
            </p>
            {!searchTerm && (
              <Button className="mt-4" onClick={handleAddAlumni}>
                Add your first alumni record
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedAlumni)
            .sort(([a], [b]) => parseInt(b) - parseInt(a))
            .map(([year, yearAlumni]) => (
            <Card key={year}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Pass Out Year {year}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {yearAlumni.map((alumniData) => (
                    <Card key={alumniData.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <h5 className="font-medium text-slate-800">{alumniData.name}</h5>
                              <p className="text-sm text-slate-600">{alumniData.rollNumber}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-slate-700">Email:</span>
                            <p className="text-slate-600">{alumniData.email}</p>
                          </div>
                          <div>
                            <span className="font-medium text-slate-700">Contact:</span>
                            <p className="text-slate-600">{alumniData.contactNumber}</p>
                          </div>
                          {alumniData.higherEducationCollege && (
                            <div>
                              <span className="font-medium text-slate-700">Higher Education:</span>
                              <p className="text-slate-600">{alumniData.higherEducationCollege}</p>
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-slate-700">Address:</span>
                            <p className="text-slate-600 text-xs">{alumniData.address}</p>
                          </div>
                        </div>

                        <div className="flex space-x-2 mt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditAlumni(alumniData)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                            onClick={() => handleDeleteAlumni(alumniData.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAlumniModal} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAlumni ? "Edit Alumni" : "Add Alumni Record"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Alumni name"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="rollNumber">College Roll Number</Label>
                <Input
                  id="rollNumber"
                  placeholder="College roll number"
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
                <Label htmlFor="passOutYear">Pass Out Year</Label>
                <Input
                  id="passOutYear"
                  type="number"
                  placeholder="2024"
                  {...form.register("passOutYear", { valueAsNumber: true })}
                />
                {form.formState.errors.passOutYear && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.passOutYear.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="alumni@example.com"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="contactNumber">Contact Number</Label>
              <Input
                id="contactNumber"
                placeholder="Contact number"
                {...form.register("contactNumber")}
              />
              {form.formState.errors.contactNumber && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.contactNumber.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="Current address"
                {...form.register("address")}
              />
              {form.formState.errors.address && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.address.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="higherEducationCollege">Higher Education College (Optional)</Label>
                <Input
                  id="higherEducationCollege"
                  placeholder="University/College name"
                  {...form.register("higherEducationCollege")}
                />
              </div>
              <div>
                <Label htmlFor="collegeRollNumber">Higher Ed Roll Number (Optional)</Label>
                <Input
                  id="collegeRollNumber"
                  placeholder="University roll number"
                  {...form.register("collegeRollNumber")}
                />
              </div>
            </div>

            <div className="flex space-x-2">
              <Button type="button" variant="outline" className="flex-1" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={createAlumniMutation.isPending || updateAlumniMutation.isPending}
              >
                {createAlumniMutation.isPending || updateAlumniMutation.isPending 
                  ? "Saving..." 
                  : editingAlumni ? "Update" : "Create"
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}