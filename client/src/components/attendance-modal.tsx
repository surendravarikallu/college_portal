import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertAttendanceSchema, Event } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const attendanceFormSchema = insertAttendanceSchema.pick({
  studentName: true,
  rollNumber: true,
  eventId: true,
});

type AttendanceForm = z.infer<typeof attendanceFormSchema>;

interface AttendanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
}

export function AttendanceModal({ open, onOpenChange, event }: AttendanceModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AttendanceForm>({
    resolver: zodResolver(attendanceFormSchema),
    defaultValues: {
      studentName: "",
      rollNumber: "",
      eventId: event?.id || 0,
    },
  });

  const markAttendanceMutation = useMutation({
    mutationFn: async (data: AttendanceForm) => {
      const response = await apiRequest("POST", "/api/attendance", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Attendance marked successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
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

  const onSubmit = (data: AttendanceForm) => {
    if (!event) return;
    markAttendanceMutation.mutate({ ...data, eventId: event.id });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark Attendance</DialogTitle>
        </DialogHeader>
        
        {event && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-700">
              Event: {event.title}
            </p>
            <p className="text-sm text-green-600">Company: {event.company}</p>
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="studentName">Student Name</Label>
            <Input
              id="studentName"
              placeholder="Enter your full name"
              {...form.register("studentName")}
            />
            {form.formState.errors.studentName && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.studentName.message}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="rollNumber">Roll Number</Label>
            <Input
              id="rollNumber"
              placeholder="Enter your roll number"
              {...form.register("rollNumber")}
            />
            {form.formState.errors.rollNumber && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.rollNumber.message}
              </p>
            )}
          </div>

          <div className="flex space-x-2">
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
              disabled={markAttendanceMutation.isPending}
            >
              {markAttendanceMutation.isPending ? "Marking..." : "Mark Present"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
