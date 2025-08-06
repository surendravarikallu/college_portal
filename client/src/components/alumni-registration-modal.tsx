import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';

interface AlumniFormData {
  name: string;
  rollNumber: string;
  passOutYear: number;
  higherEducationCollege?: string;
  contactNumber: string;
  email: string;
  address: string;
}

interface AddAlumniFormProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

// Legacy interface for backward compatibility
interface AlumniRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Standalone modal for adding alumni
interface AddAlumniModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Edit alumni modal
interface EditAlumniModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alumni: Alumni | null;
}

export function AddAlumniForm({ onSuccess, trigger }: AddAlumniFormProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AlumniFormData>({
    name: '',
    rollNumber: '',
    passOutYear: new Date().getFullYear(),
    higherEducationCollege: '',
    contactNumber: '',
    email: '',
    address: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/alumni', formData);
      
      if (response.ok) {
        const newAlumni = await response.json();
        toast({
          title: 'Success',
          description: 'Alumni added successfully!',
        });
        
        // Invalidate and refetch alumni data
        queryClient.invalidateQueries({ queryKey: ['/api/alumni'] });
        
        // Reset form
        setFormData({
          name: '',
          rollNumber: '',
          passOutYear: new Date().getFullYear(),
          higherEducationCollege: '',
          contactNumber: '',
          email: '',
          address: '',
        });
        
        setOpen(false);
        onSuccess?.();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add alumni');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add alumni',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof AlumniFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Add New Alumni</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Alumni</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rollNumber">Roll Number *</Label>
            <Input
              id="rollNumber"
              value={formData.rollNumber}
              onChange={(e) => handleInputChange('rollNumber', e.target.value)}
              placeholder="Enter roll number"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="passOutYear">Pass Out Year *</Label>
            <Input
              id="passOutYear"
              type="number"
              value={formData.passOutYear}
              onChange={(e) => handleInputChange('passOutYear', parseInt(e.target.value))}
              min={2000}
              max={new Date().getFullYear() + 5}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="higherEducationCollege">Higher Education College</Label>
            <Input
              id="higherEducationCollege"
              value={formData.higherEducationCollege}
              onChange={(e) => handleInputChange('higherEducationCollege', e.target.value)}
              placeholder="Enter higher education institution"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactNumber">Contact Number *</Label>
            <Input
              id="contactNumber"
              value={formData.contactNumber}
              onChange={(e) => handleInputChange('contactNumber', e.target.value)}
              placeholder="Enter contact number"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter email address"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter address"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Alumni'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Standalone modal for adding alumni
export function AddAlumniModal({ open, onOpenChange }: AddAlumniModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Use the same form schema as Alumni Management
  const alumniFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    rollNumber: z.string().min(1, "Roll number is required"),
    passOutYear: z.number().min(1900, "Invalid year").max(new Date().getFullYear(), "Year cannot be in future"),
    currentStatus: z.enum(["higher_education", "job"]),
    higherEducationCollege: z.string().optional(),
    collegeRollNumber: z.string().optional(),
    company: z.string().optional(),
    package: z.number().optional(),
    role: z.string().optional(),
    offerLetterUrl: z.string().optional(),
    idCardUrl: z.string().optional(),
    address: z.string().min(1, "Address is required"),
    contactNumber: z.string().min(1, "Contact number is required"),
    email: z.string().email("Invalid email").min(1, "Email is required"),
  });

  type AlumniForm = z.infer<typeof alumniFormSchema>;

  const form = useForm<AlumniForm>({
    resolver: zodResolver(alumniFormSchema),
    defaultValues: {
      name: "",
      rollNumber: "",
      passOutYear: new Date().getFullYear(),
      currentStatus: "higher_education" as const,
      higherEducationCollege: "",
      collegeRollNumber: "",
      company: "",
      package: undefined,
      role: "",
      offerLetterUrl: "",
      idCardUrl: "",
      address: "",
      contactNumber: "",
      email: "",
    },
  });

  const createAlumniMutation = useMutation({
    mutationFn: async (data: AlumniForm) => {
      const formData = new FormData();
      
      console.log("Form data before sending:", data);
      
      // Add all form data
      Object.keys(data).forEach(key => {
        if (data[key as keyof AlumniForm] !== undefined && data[key as keyof AlumniForm] !== null) {
          if (key === 'offerLetterUrl' || key === 'idCardUrl') {
            // Handle file uploads
            const fileInput = document.getElementById(key) as HTMLInputElement;
            if (fileInput?.files?.[0]) {
              formData.append(key, fileInput.files[0]);
            }
          } else {
            formData.append(key, String(data[key as keyof AlumniForm]));
          }
        }
      });

      const response = await fetch('/api/alumni', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add alumni');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Alumni added successfully!',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/alumni'] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: AlumniForm) => {
    createAlumniMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Alumni Record</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="modal-name">Name</Label>
              <Input
                id="modal-name"
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
              <Label htmlFor="modal-rollNumber">College Roll Number</Label>
              <Input
                id="modal-rollNumber"
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
              <Label htmlFor="modal-passOutYear">Pass Out Year</Label>
              <Input
                id="modal-passOutYear"
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
              <Label htmlFor="modal-email">Email</Label>
              <Input
                id="modal-email"
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
            <Label htmlFor="modal-contactNumber">Contact Number</Label>
            <Input
              id="modal-contactNumber"
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
            <Label>Current Status</Label>
            <Controller
              name="currentStatus"
              control={form.control}
              render={({ field }) => (
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="higher_education" id="modal-higher_education" />
                    <Label htmlFor="modal-higher_education">Higher Education</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="job" id="modal-job" />
                    <Label htmlFor="modal-job">Job</Label>
                  </div>
                </RadioGroup>
              )}
            />
            {form.formState.errors.currentStatus && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.currentStatus.message}
              </p>
            )}
          </div>

          {form.watch("currentStatus") === "higher_education" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="modal-higherEducationCollege">Higher Education College</Label>
                <Input
                  id="modal-higherEducationCollege"
                  placeholder="University/College name"
                  {...form.register("higherEducationCollege")}
                />
              </div>
              <div>
                <Label htmlFor="modal-collegeRollNumber">Higher Ed Roll Number</Label>
                <Input
                  id="modal-collegeRollNumber"
                  placeholder="University roll number"
                  {...form.register("collegeRollNumber")}
                />
              </div>
            </div>
          )}

          {form.watch("currentStatus") === "job" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="modal-company">Company Name</Label>
                  <Input
                    id="modal-company"
                    placeholder="Company name"
                    {...form.register("company")}
                  />
                </div>
                <div>
                  <Label htmlFor="modal-package">Package (LPA)</Label>
                  <Input
                    id="modal-package"
                    type="number"
                    placeholder="e.g., 6.5"
                    {...form.register("package", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="modal-role">Role/Position</Label>
                  <Input
                    id="modal-role"
                    placeholder="e.g., Software Engineer"
                    {...form.register("role")}
                  />
                </div>
                <div>
                  <Label htmlFor="modal-idCardUrl">ID Card (Mandatory)</Label>
                  <Input
                    id="modal-idCardUrl"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    {...form.register("idCardUrl")}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="modal-offerLetterUrl">Offer Letter (Optional)</Label>
                <Input
                  id="modal-offerLetterUrl"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  placeholder="Upload offer letter"
                  {...form.register("offerLetterUrl")}
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="modal-address">Address</Label>
            <Textarea
              id="modal-address"
              placeholder="Current address"
              {...form.register("address")}
            />
            {form.formState.errors.address && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.address.message}
              </p>
            )}
          </div>

          <div className="flex space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1" 
              onClick={() => onOpenChange(false)}
              disabled={createAlumniMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={createAlumniMutation.isPending}
            >
              {createAlumniMutation.isPending ? "Saving..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Legacy component for backward compatibility
export function AlumniRegistrationModal({ open, onOpenChange }: AlumniRegistrationModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AlumniFormData>({
    name: '',
    rollNumber: '',
    passOutYear: new Date().getFullYear(),
    higherEducationCollege: '',
    contactNumber: '',
    email: '',
    address: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/alumni', formData);
      
      if (response.ok) {
        const newAlumni = await response.json();
        toast({
          title: 'Success',
          description: 'Alumni registration submitted successfully!',
        });
        
        // Invalidate and refetch alumni data
        queryClient.invalidateQueries({ queryKey: ['/api/alumni'] });
        
        // Reset form
        setFormData({
          name: '',
          rollNumber: '',
          passOutYear: new Date().getFullYear(),
          higherEducationCollege: '',
          contactNumber: '',
          email: '',
          address: '',
        });
        
        onOpenChange(false);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to register alumni');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to register alumni',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof AlumniFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Alumni Registration</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rollNumber">Roll Number *</Label>
            <Input
              id="rollNumber"
              value={formData.rollNumber}
              onChange={(e) => handleInputChange('rollNumber', e.target.value)}
              placeholder="Enter roll number"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="passOutYear">Pass Out Year *</Label>
            <Input
              id="passOutYear"
              type="number"
              value={formData.passOutYear}
              onChange={(e) => handleInputChange('passOutYear', parseInt(e.target.value))}
              min={2000}
              max={new Date().getFullYear() + 5}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="higherEducationCollege">Higher Education College</Label>
            <Input
              id="higherEducationCollege"
              value={formData.higherEducationCollege}
              onChange={(e) => handleInputChange('higherEducationCollege', e.target.value)}
              placeholder="Enter higher education institution"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactNumber">Contact Number *</Label>
            <Input
              id="contactNumber"
              value={formData.contactNumber}
              onChange={(e) => handleInputChange('contactNumber', e.target.value)}
              placeholder="Enter contact number"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter email address"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter address"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Registering...' : 'Register'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit alumni modal
export function EditAlumniModal({ open, onOpenChange, alumni }: EditAlumniModalProps) {
  const { toast } = useToast();
  
  // Use the same form schema as Alumni Management
  const alumniFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    rollNumber: z.string().min(1, "Roll number is required"),
    passOutYear: z.number().min(1900, "Invalid year").max(new Date().getFullYear(), "Year cannot be in future"),
    currentStatus: z.enum(["higher_education", "job"]),
    higherEducationCollege: z.string().optional(),
    collegeRollNumber: z.string().optional(),
    company: z.string().optional(),
    package: z.number().optional(),
    role: z.string().optional(),
    offerLetterUrl: z.string().optional(),
    idCardUrl: z.string().optional(),
    address: z.string().min(1, "Address is required"),
    contactNumber: z.string().min(1, "Contact number is required"),
    email: z.string().email("Invalid email").min(1, "Email is required"),
  });

  type AlumniForm = z.infer<typeof alumniFormSchema>;

  const form = useForm<AlumniForm>({
    resolver: zodResolver(alumniFormSchema),
    defaultValues: {
      name: "",
      rollNumber: "",
      passOutYear: new Date().getFullYear(),
      currentStatus: "higher_education" as const,
      higherEducationCollege: "",
      collegeRollNumber: "",
      company: "",
      package: undefined,
      role: "",
      offerLetterUrl: "",
      idCardUrl: "",
      address: "",
      contactNumber: "",
      email: "",
    },
  });

  // Update form when alumni changes
  useEffect(() => {
    if (alumni) {
      form.reset({
        name: alumni.name,
        rollNumber: alumni.rollNumber,
        passOutYear: alumni.passOutYear,
        currentStatus: (alumni.currentStatus as "higher_education" | "job") || "higher_education",
        higherEducationCollege: alumni.higherEducationCollege || "",
        collegeRollNumber: alumni.collegeRollNumber || "",
        company: alumni.company || "",
        package: alumni.package || undefined,
        role: alumni.role || "",
        offerLetterUrl: alumni.offerLetterUrl || "",
        idCardUrl: alumni.idCardUrl || "",
        address: alumni.address,
        contactNumber: alumni.contactNumber,
        email: alumni.email,
      });
    }
  }, [alumni, form]);

  const updateAlumniMutation = useMutation({
    mutationFn: async (data: AlumniForm) => {
      if (!alumni) throw new Error("No alumni selected for editing");
      
      const formData = new FormData();
      
      // Add all form data
      Object.keys(data).forEach(key => {
        if (data[key as keyof AlumniForm] !== undefined && data[key as keyof AlumniForm] !== null) {
          if (key === 'offerLetterUrl' || key === 'idCardUrl') {
            // Handle file uploads
            const fileInput = document.getElementById(key) as HTMLInputElement;
            if (fileInput?.files?.[0]) {
              formData.append(key, fileInput.files[0]);
            }
          } else {
            formData.append(key, String(data[key as keyof AlumniForm]));
          }
        }
      });

      const response = await fetch(`/api/alumni/${alumni.id}`, {
        method: 'PUT',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update alumni');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Alumni updated successfully!',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/alumni'] });
      form.reset();
      onOpenChange(false);
      // setEditingAlumni(null); // This state variable is not defined in the original file
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: AlumniForm) => {
    updateAlumniMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Alumni Record</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
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
              <Label htmlFor="edit-rollNumber">College Roll Number</Label>
              <Input
                id="edit-rollNumber"
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
              <Label htmlFor="edit-passOutYear">Pass Out Year</Label>
              <Input
                id="edit-passOutYear"
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
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
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
            <Label htmlFor="edit-contactNumber">Contact Number</Label>
            <Input
              id="edit-contactNumber"
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
            <Label>Current Status</Label>
            <Controller
              name="currentStatus"
              control={form.control}
              render={({ field }) => (
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="higher_education" id="edit-higher_education" />
                    <Label htmlFor="edit-higher_education">Higher Education</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="job" id="edit-job" />
                    <Label htmlFor="edit-job">Job</Label>
                  </div>
                </RadioGroup>
              )}
            />
            {form.formState.errors.currentStatus && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.currentStatus.message}
              </p>
            )}
          </div>

          {form.watch("currentStatus") === "higher_education" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-higherEducationCollege">Higher Education College</Label>
                <Input
                  id="edit-higherEducationCollege"
                  placeholder="University/College name"
                  {...form.register("higherEducationCollege")}
                />
              </div>
              <div>
                <Label htmlFor="edit-collegeRollNumber">Higher Ed Roll Number</Label>
                <Input
                  id="edit-collegeRollNumber"
                  placeholder="University roll number"
                  {...form.register("collegeRollNumber")}
                />
              </div>
            </div>
          )}

          {form.watch("currentStatus") === "job" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-company">Company Name</Label>
                  <Input
                    id="edit-company"
                    placeholder="Company name"
                    {...form.register("company")}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-package">Package (LPA)</Label>
                  <Input
                    id="edit-package"
                    type="number"
                    placeholder="e.g., 6.5"
                    {...form.register("package", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-role">Role/Position</Label>
                  <Input
                    id="edit-role"
                    placeholder="e.g., Software Engineer"
                    {...form.register("role")}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-idCardUrl">ID Card (Mandatory)</Label>
                  <Input
                    id="edit-idCardUrl"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    {...form.register("idCardUrl")}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-offerLetterUrl">Offer Letter (Optional)</Label>
                <Input
                  id="edit-offerLetterUrl"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  placeholder="Upload offer letter"
                  {...form.register("offerLetterUrl")}
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="edit-address">Address</Label>
            <Textarea
              id="edit-address"
              placeholder="Current address"
              {...form.register("address")}
            />
            {form.formState.errors.address && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.address.message}
              </p>
            )}
          </div>

          <div className="flex space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={updateAlumniMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={updateAlumniMutation.isPending}
            >
              {updateAlumniMutation.isPending ? "Updating..." : "Update"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
