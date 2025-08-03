import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertAlumniSchema } from "@shared/schema";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

type AlumniForm = z.infer<typeof insertAlumniSchema>;

interface AlumniRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AlumniRegistrationModal({ open, onOpenChange }: AlumniRegistrationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AlumniForm>({
    resolver: zodResolver(insertAlumniSchema),
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

  const registerAlumniMutation = useMutation({
    mutationFn: async (data: AlumniForm) => {
      const response = await apiRequest("POST", "/api/alumni", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Alumni registration submitted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/alumni"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AlumniForm) => {
    registerAlumniMutation.mutate(data);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Alumni Registration</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Your full name"
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
                placeholder="Your roll number"
                {...form.register("rollNumber")}
              />
              {form.formState.errors.rollNumber && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.rollNumber.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="passOutYear">Pass Out Year</Label>
              <Controller
                name="passOutYear"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.passOutYear && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.passOutYear.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="contactNumber">Contact Number</Label>
              <Input
                id="contactNumber"
                placeholder="+91 9876543210"
                {...form.register("contactNumber")}
              />
              {form.formState.errors.contactNumber && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.contactNumber.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="higherEducationCollege">Higher Education College Name</Label>
            <Input
              id="higherEducationCollege"
              placeholder="College/University name (if pursuing higher education)"
              {...form.register("higherEducationCollege")}
            />
          </div>

          <div>
            <Label htmlFor="collegeRollNumber">College Roll Number</Label>
            <Input
              id="collegeRollNumber"
              placeholder="Roll number at higher education institution"
              {...form.register("collegeRollNumber")}
            />
          </div>

          <div>
            <Label htmlFor="address">Address with Pincode</Label>
            <Textarea
              id="address"
              rows={3}
              placeholder="Complete address including pincode"
              {...form.register("address")}
            />
            {form.formState.errors.address && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.address.message}
              </p>
            )}
          </div>

          <div className="flex space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={registerAlumniMutation.isPending}
            >
              {registerAlumniMutation.isPending ? "Registering..." : "Register"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
