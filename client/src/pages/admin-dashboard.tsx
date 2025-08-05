import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BarChart3, Users, Briefcase, GraduationCap, Calendar, Settings, Download, LogOut, Plus, Edit, Trash2, FileText } from 'lucide-react';
import { DepartmentList } from '@/components/tpo/students/department-list';
import { YearList as StudentYearList } from '@/components/tpo/students/year-list';
import { StudentList } from '@/components/tpo/students/student-list';
import { StudentDetails } from '@/components/tpo/students/student-details';
import { CompanyList } from '@/components/tpo/events/company-list';
import { YearList as EventYearList } from '@/components/tpo/events/year-list';
import { EventList } from '@/components/tpo/events/event-list';
import { EventDetails } from '@/components/tpo/events/event-details';
import { YearList as AlumniYearList } from '@/components/tpo/alumni/year-list';
import { AlumniList } from '@/components/tpo/alumni/alumni-list';
import { AlumniDetails } from '@/components/tpo/alumni/alumni-details';
import { fetchDepartments, fetchYears as fetchStudentYears, fetchStudentsByDepartmentYear } from '@/api/students';
import { fetchCompanies, fetchYears as fetchEventYears, fetchEventsByCompanyYear } from '@/api/events';
import { Event, Student, Alumni, Attendance } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { ExportFunctions } from '@/components/export-functions';
import { ImportFunctions } from '@/components/import-functions';
import { NotificationManagement } from '@/components/notification-management';
import { EventManagement } from '@/components/event-management';
import { StudentManagement } from '@/components/student-management';
import { AlumniManagement } from '@/components/alumni-management';
import { NewsManagement } from '@/components/news-management';
import { AttendanceModal } from '@/components/attendance-modal';
import AdminManagement from '@/components/admin-management';
import PlacementManagement from '@/components/placement-management';
import collegeHeaderImg from '@assets/Screenshot 2025-07-25 113411_1753423944040.png';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertStudentSchema } from '@shared/schema';

const addStudentFormSchema = insertStudentSchema.extend({
  year: z.number().min(1, "Year is required").max(4, "Year must be between 1-4"),
  package: z.number().optional(),
});

type AddStudentFormData = z.infer<typeof addStudentFormSchema>;

interface AddStudentFormProps {
  onSuccess: () => void;
}

function AddStudentForm({ onSuccess }: AddStudentFormProps) {
  const { toast } = useToast();
  
  const form = useForm<AddStudentFormData>({
    resolver: zodResolver(addStudentFormSchema),
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
    },
  });

  const onSubmit = async (data: AddStudentFormData) => {
    try {
      const formData = new FormData();
      
      // Add all form fields to FormData
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'package' && value === 0) {
            formData.append(key, '');
          } else {
            formData.append(key, String(value));
          }
        }
      });

      const response = await fetch("/api/students", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create student");
      }

      toast({
        title: "Success",
        description: "Student added successfully!",
      });
      
      form.reset();
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add student",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            {...form.register("name")}
            placeholder="Enter student name"
          />
          {form.formState.errors.name && (
            <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="rollNumber">Roll Number *</Label>
          <Input
            id="rollNumber"
            {...form.register("rollNumber")}
            placeholder="Enter roll number"
          />
          {form.formState.errors.rollNumber && (
            <p className="text-sm text-red-500">{form.formState.errors.rollNumber.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="branch">Branch *</Label>
          <Select onValueChange={(value) => form.setValue("branch", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CSE">CSE</SelectItem>
              <SelectItem value="ECE">ECE</SelectItem>
              <SelectItem value="EEE">EEE</SelectItem>
              <SelectItem value="MECH">MECH</SelectItem>
              <SelectItem value="CIVIL">CIVIL</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.branch && (
            <p className="text-sm text-red-500">{form.formState.errors.branch.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="year">Year *</Label>
          <Select onValueChange={(value) => form.setValue("year", parseInt(value))}>
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
          {form.formState.errors.year && (
            <p className="text-sm text-red-500">{form.formState.errors.year.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="batch">Batch</Label>
          <Input
            id="batch"
            {...form.register("batch")}
            placeholder="e.g., 2020-2024"
          />
          {form.formState.errors.batch && (
            <p className="text-sm text-red-500">{form.formState.errors.batch.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...form.register("email")}
            placeholder="Enter email address"
          />
          {form.formState.errors.email && (
            <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            {...form.register("phone")}
            placeholder="Enter phone number"
          />
          {form.formState.errors.phone && (
            <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="selected"
            checked={Boolean(form.watch("selected"))}
            onCheckedChange={(checked) => form.setValue("selected", checked as boolean)}
          />
          <Label htmlFor="selected">Selected for Placement</Label>
        </div>

        {form.watch("selected") && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                {...form.register("companyName")}
                placeholder="Enter company name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="package">Package (LPA)</Label>
              <Input
                id="package"
                type="number"
                step="0.1"
                {...form.register("package", { valueAsNumber: true })}
                placeholder="Enter package"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                {...form.register("role")}
                placeholder="Enter role"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onSuccess}
        >
          Cancel
        </Button>
        <Button type="submit" className="bg-primary text-white hover:bg-primary/90">
          Add Student
        </Button>
      </div>
    </form>
  );
}

export default function AdminDashboard() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  


  // Existing dashboard data
  const { data: events = [] } = useQuery<Event[]>({ queryKey: ['/api/events'] });
  const { data: students = [] } = useQuery<Student[]>({ queryKey: ['/api/students'] });
  const { data: alumni = [] } = useQuery<Alumni[]>({ queryKey: ['/api/alumni'] });
  const { data: attendance = [] } = useQuery<Attendance[]>({ queryKey: ['/api/attendance'] });

  // Students navigation state
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [studentYears, setStudentYears] = useState<number[]>([]);
  const [selectedStudentYear, setSelectedStudentYear] = useState<number | null>(null);
  const [studentsNav, setStudentsNav] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  // Events navigation state
  const [companies, setCompanies] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [eventYears, setEventYears] = useState<number[]>([]);
  const [selectedEventYear, setSelectedEventYear] = useState<number | null>(null);
  const [eventsNav, setEventsNav] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  // Alumni navigation state
  const [alumniYears, setAlumniYears] = useState<number[]>([]);
  const [selectedAlumniYear, setSelectedAlumniYear] = useState<number | null>(null);
  const [alumniNav, setAlumniNav] = useState<any[]>([]);
  const [selectedAlumni, setSelectedAlumni] = useState<any | null>(null);

  // Modal states for management components
  const [showEventManagement, setShowEventManagement] = useState(false);
  const [showStudentManagement, setShowStudentManagement] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAlumniManagement, setShowAlumniManagement] = useState(false);
  const [showNewsManagement, setShowNewsManagement] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedEventForAttendance, setSelectedEventForAttendance] = useState<Event | null>(null);
  
  // Search state
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [isSearchNavigating, setIsSearchNavigating] = useState(false);
  const [hasNavigatedToStudent, setHasNavigatedToStudent] = useState(false);
  

  
  // Filter students based on search term - search across ALL students, not just current department
  const allStudents = students; // Use the full students array from the query
  
  // When searching, show results from all departments
  // When not searching, show only current department students
  const filteredStudents = studentSearchTerm ? allStudents.filter(student => {
    const searchLower = studentSearchTerm.toLowerCase();
    return (
      student.name?.toLowerCase().includes(searchLower) ||
      student.rollNumber?.toLowerCase().includes(searchLower) ||
      student.companyName?.toLowerCase().includes(searchLower) ||
      student.branch?.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower) ||
      student.phone?.toLowerCase().includes(searchLower)
    );
  }) : studentsNav; // If no search term, use the current navigation students

  // Handle direct navigation to student when exact roll number is searched
  const handleSearchSubmit = (e: React.FormEvent | any) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    
    if (studentSearchTerm && studentSearchTerm.trim()) {
      // Look for exact roll number match first
      const exactRollMatch = allStudents.find(student => 
        student.rollNumber?.toLowerCase() === studentSearchTerm.toLowerCase()
      );
      
              if (exactRollMatch) {
          // Set the appropriate navigation state based on the found student
          const batchMatch = exactRollMatch.batch ? exactRollMatch.batch.match(/(\d{4})(?:-\d{4})?$/) : null;
          const studentYear = batchMatch ? 
            parseInt(batchMatch[1]) : 
            new Date().getFullYear();
          
          // Set search navigation flag to prevent interference
          setIsSearchNavigating(true);
          setHasNavigatedToStudent(true);
          
          // Use a callback approach to ensure state is set before showing toast
          setSelectedStudentYear(studentYear);
          setSelectedDept(exactRollMatch.branch);
          setSelectedStudent(exactRollMatch);
          setStudentSearchTerm('');
          
          // Show success toast
          setTimeout(() => {
            toast({ 
              title: 'Student Found!', 
              description: `Navigating to ${exactRollMatch.name} (${exactRollMatch.rollNumber})` 
            });
            // Reset the flag after navigation is complete
            setTimeout(() => setIsSearchNavigating(false), 1000);
          }, 200);
          return;
        }
      
      // If no exact roll number match, check for exact name match
      const exactNameMatch = allStudents.find(student => 
        student.name?.toLowerCase() === studentSearchTerm.toLowerCase()
      );
      

      
      if (exactNameMatch) {
        // Set the appropriate navigation state based on the found student
        const batchMatch = exactNameMatch.batch ? exactNameMatch.batch.match(/(\d{4})(?:-\d{4})?$/) : null;
        const studentYear = batchMatch ? 
          parseInt(batchMatch[1]) : 
          new Date().getFullYear();
        

        
        setSelectedStudentYear(studentYear);
        setSelectedDept(exactNameMatch.branch);
        setSelectedStudent(exactNameMatch);
        setStudentSearchTerm('');
        
        // Show success toast
        setTimeout(() => {
          toast({ 
            title: 'Student Found!', 
            description: `Navigating to ${exactNameMatch.name} (${exactNameMatch.rollNumber})` 
          });
          // Reset the flag after navigation is complete
          setTimeout(() => setIsSearchNavigating(false), 1000);
        }, 200);
        return;
      }
      
      // If no exact match found, show a notification
      toast({ 
        title: 'No Exact Match', 
        description: 'No exact match found. Showing filtered results instead.', 
        variant: 'destructive' 
      });
    }
  };

  // Load departments, companies, and alumni years on mount with optimized queries
  useEffect(() => {
    if (students.length >= 0) {
      // Extract departments from existing students data (filter out null/undefined)
      const depts = Array.from(new Set(students.map(s => s.branch).filter((branch): branch is string => Boolean(branch)))).sort();
      setDepartments(depts);
    }
  }, [students]);

  useEffect(() => {
    if (events.length >= 0) {
      // Extract companies from existing events data (filter out null/undefined)
      const comps = Array.from(new Set(events.map(e => e.company).filter((company): company is string => Boolean(company)))).sort();
      setCompanies(comps);
    }
  }, [events]);

  useEffect(() => {
    if (alumni.length >= 0) {
      // Extract unique alumni pass out years
      const years = Array.from(new Set(alumni.map(a => a.passOutYear))).sort((a, b) => b - a);
      setAlumniYears(years);
      console.log("Alumni years loaded:", years, "from alumni:", alumni.length);
    }
  }, [alumni]);

  // Load years first - optimized
  useEffect(() => {
    if (students.length > 0) {
      // Extract unique batch strings from batch field (e.g., "2020-2024", "2021-2025")
      const batches = Array.from(new Set(
        students
          .filter(s => s.batch)
          .map(s => s.batch)
          .filter((batch): batch is string => Boolean(batch))
      )).sort((a, b) => {
        // Sort by end year (extract last 4 digits)
        const aEndYear = a.match(/(\d{4})(?:-\d{4})?$/)?.[1];
        const bEndYear = b.match(/(\d{4})(?:-\d{4})?$/)?.[1];
        return (parseInt(bEndYear || '0') - parseInt(aEndYear || '0'));
      });
      
      // Store both batches and their end years
      const batchData = batches.map(batch => {
        const match = batch.match(/(\d{4})(?:-\d{4})?$/);
        const endYear = match ? parseInt(match[1]) : 0;
        return { batch, endYear };
      });
      
      // Store batch strings for display and end years for filtering
      (window as any).batchData = batchData;
      setStudentYears(batchData.map(b => b.endYear));
    }
  }, [students]);

  // Load departments when year is selected - optimized
  useEffect(() => {
    if (selectedStudentYear !== null && students.length > 0) {
      // Extract departments that have students in the selected year
      const depts = Array.from(new Set(
        students
          .filter(s => {
            // Extract end year from batch format "2020-2024" or "2024"
            const batchStr = s.batch || '';
            const match = batchStr.match(/(\d{4})(?:-\d{4})?$/);
            const batchYear = match ? parseInt(match[1]) : null;
            return batchYear === selectedStudentYear;
          })
          .map(s => s.branch)
          .filter((branch): branch is string => Boolean(branch))
      )).sort();
      
      setDepartments(depts);
      setSelectedDept(null);
      setStudentsNav([]);
      // Only reset selectedStudent if we're not in the middle of a search navigation
      if (!studentSearchTerm && !isSearchNavigating && !hasNavigatedToStudent) {
        setSelectedStudent(null);
      }
    }
      }, [selectedStudentYear, students, studentSearchTerm, isSearchNavigating, hasNavigatedToStudent]);

  useEffect(() => {
    if (selectedCompany && events.length > 0) {
      // Use existing events data instead of API call - extract year from startDate
      const years = Array.from(new Set(
        events.filter(e => e.company === selectedCompany).map(e => new Date(e.startDate).getFullYear()).filter(Boolean)
      )).sort((a, b) => (b || 0) - (a || 0));
      setEventYears(years);
      setSelectedEventYear(null);
      setEventsNav([]);
      setSelectedEvent(null);
    }
  }, [selectedCompany, events]);

  // Load students when department is selected - optimized
  useEffect(() => {
    if (selectedDept && selectedStudentYear !== null && students.length > 0) {
      // Filter students by department and batch year
      const filteredStudents = students.filter(s => {
        if (s.branch !== selectedDept) return false;
        
        // Extract end year from batch format "2020-2024" or "2024"
        const batchStr = s.batch || '';
        const match = batchStr.match(/(\d{4})(?:-\d{4})?$/);
        const batchYear = match ? parseInt(match[1]) : null;
        
        return batchYear === selectedStudentYear;
      });
      setStudentsNav(filteredStudents);
    }
  }, [selectedDept, selectedStudentYear, students]);

  useEffect(() => {
    if (selectedCompany && selectedEventYear !== null && events.length > 0) {
      // Use existing events data instead of API call
      const filteredEvents = events.filter(
        e => e.company === selectedCompany && new Date(e.startDate).getFullYear() === selectedEventYear
      );
      setEventsNav(filteredEvents);
    }
  }, [selectedCompany, selectedEventYear, events]);

  useEffect(() => {
    if (selectedAlumniYear !== null) {
      // Use existing alumni data instead of API call
      const filteredAlumni = alumni.filter(
        a => a.passOutYear === selectedAlumniYear
      );
      setAlumniNav(filteredAlumni);
      setSelectedAlumni(null);
    }
  }, [selectedAlumniYear, alumni]);

  

  const handleLogout = async () => {
      await logoutMutation.mutateAsync();
    setLocation('/auth');
  };

  // Client-side PDF generation for department placement reports
  const generateDepartmentPlacementReport = async (department: string, year: number) => {
    try {
      // Get students for the specific department and year
      const response = await fetch(`/api/students?department=${department}&year=${year}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch students data');
      }
      
      const students: Student[] = await response.json();
      
      // Calculate placement statistics
      const totalStudents = students.length;
      const placedStudents = students.filter(s => s.selected).length;
      const unplacedStudents = totalStudents - placedStudents;
      const placementRate = totalStudents > 0 ? ((placedStudents / totalStudents) * 100).toFixed(2) : '0';
      
      const packages = students
        .filter(s => s.selected && s.package)
        .map(s => s.package!)
        .sort((a, b) => b - a);
      
      const avgPackage = packages.length > 0 
        ? (packages.reduce((sum, pkg) => sum + pkg, 0) / packages.length).toFixed(2)
        : '0';
      
      const highestPackage = packages.length > 0 ? packages[0] : 0;
      const lowestPackage = packages.length > 0 ? packages[packages.length - 1] : 0;

      // Get company-wise statistics
      const companyStats = students
        .filter(s => s.selected && s.companyName)
        .reduce((acc, student) => {
          const company = student.companyName!;
          if (!acc[company]) {
            acc[company] = { count: 0, packages: [], roles: [] };
          }
          acc[company].count++;
          if (student.package) acc[company].packages.push(student.package);
          if (student.role) acc[company].roles.push(student.role);
          return acc;
        }, {} as Record<string, { count: number; packages: number[]; roles: string[] }>);

      // Get current date and year
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const currentYear = new Date().getFullYear();

      // Generate professional HTML report content with improved styling
      const reportContent = `
        <div style="text-align: center; margin-bottom: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 15px; color: white;">
          <h1 style="color: white; font-size: 32px; margin-bottom: 15px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">${department} Department Placement Statistics Report</h1>
          <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin-bottom: 8px;">Generated on ${currentDate}</p>
          <p style="color: rgba(255,255,255,0.8); font-size: 14px;">Academic Year: ${currentYear} | Batch Year: ${year}</p>
        </div>
        
        <div style="margin-bottom: 30px; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 25px; border-radius: 12px; border-left: 5px solid #3b82f6;">
          <h2 style="color: #1f2937; border-bottom: 3px solid #3b82f6; padding-bottom: 12px; margin-bottom: 20px; font-size: 24px;">Executive Summary</h2>
          <p style="color: #4b5563; line-height: 1.8; margin-bottom: 20px; font-size: 16px;">
            This comprehensive placement report provides detailed analysis of student placement outcomes for the <strong>${department}</strong> department, 
            including statistical breakdowns, trend analysis, and performance metrics. The report serves as a strategic document 
            for understanding placement effectiveness and identifying areas for improvement within the department.
          </p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-top: 25px;">
            <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 20px; border-radius: 10px; border: 2px solid #3b82f6;">
              <h3 style="color: #1e40af; margin-bottom: 15px; font-size: 18px;">📊 Overall Performance</h3>
              <p style="color: #1e40af; font-size: 16px; margin-bottom: 8px;">Total Students: <strong style="font-size: 20px;">${totalStudents}</strong></p>
              <p style="color: #1e40af; font-size: 16px;">Placement Rate: <strong style="font-size: 20px;">${placementRate}%</strong></p>
            </div>
            <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); padding: 20px; border-radius: 10px; border: 2px solid #16a34a;">
              <h3 style="color: #166534; margin-bottom: 15px; font-size: 18px;">💰 Package Analysis</h3>
              <p style="color: #166534; font-size: 16px; margin-bottom: 8px;">Average Package: <strong style="font-size: 20px;">${avgPackage} LPA</strong></p>
              <p style="color: #166534; font-size: 16px;">Highest Package: <strong style="font-size: 20px;">${highestPackage} LPA</strong></p>
            </div>
          </div>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="color: #374151; border-bottom: 3px solid #e5e7eb; padding-bottom: 12px; font-size: 24px;">📈 Detailed Key Metrics</h2>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 20px;">
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 18px; border-radius: 10px; border: 2px solid #f59e0b;">
              <h4 style="color: #92400e; margin-bottom: 12px; font-size: 16px;">👥 Student Distribution</h4>
              <ul style="color: #92400e; font-size: 14px; line-height: 1.8;">
                <li style="margin-bottom: 6px;">Total Students: <strong>${totalStudents}</strong></li>
                <li style="margin-bottom: 6px;">Placed Students: <strong>${placedStudents}</strong></li>
                <li style="margin-bottom: 6px;">Unplaced Students: <strong>${unplacedStudents}</strong></li>
                <li style="margin-bottom: 6px;">Placement Rate: <strong>${placementRate}%</strong></li>
              </ul>
            </div>
            <div style="background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%); padding: 18px; border-radius: 10px; border: 2px solid #ec4899;">
              <h4 style="color: #be185d; margin-bottom: 12px; font-size: 16px;">💼 Package Statistics</h4>
              <ul style="color: #be185d; font-size: 14px; line-height: 1.8;">
                <li style="margin-bottom: 6px;">Average Package: <strong>${avgPackage} LPA</strong></li>
                <li style="margin-bottom: 6px;">Highest Package: <strong>${highestPackage} LPA</strong></li>
                <li style="margin-bottom: 6px;">Lowest Package: <strong>${lowestPackage} LPA</strong></li>
                <li style="margin-bottom: 6px;">Students with Packages: <strong>${packages.length}</strong></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="color: #374151; border-bottom: 3px solid #e5e7eb; padding-bottom: 12px; font-size: 24px;">🏢 Company-wise Analysis</h2>
          <p style="color: #6b7280; margin-bottom: 20px; font-size: 16px;">
            Detailed breakdown of placement performance by companies, showing total students placed, 
            average packages, and roles offered for each company.
          </p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);">
                <th style="border: 1px solid #1d4ed8; padding: 15px; text-align: left; color: white; font-weight: 600;">Company</th>
                <th style="border: 1px solid #1d4ed8; padding: 15px; text-align: center; color: white; font-weight: 600;">Students Placed</th>
                <th style="border: 1px solid #1d4ed8; padding: 15px; text-align: center; color: white; font-weight: 600;">Avg Package</th>
                <th style="border: 1px solid #1d4ed8; padding: 15px; text-align: center; color: white; font-weight: 600;">Top Roles</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(companyStats).map(([company, stats], index) => {
                const avgPackage = stats.packages.length > 0 ? (stats.packages.reduce((sum, pkg) => sum + pkg, 0) / stats.packages.length).toFixed(1) : 'N/A';
                const topRoles = Array.from(new Set(stats.roles)).slice(0, 3).join(', ') || 'N/A';
                const rowBg = index % 2 === 0 ? '#f8fafc' : '#ffffff';
                return `
                  <tr style="background-color: ${rowBg};">
                    <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: 500; color: #374151;">${company}</td>
                    <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center; color: #059669; font-weight: 600;">${stats.count}</td>
                    <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center; color: #7c3aed; font-weight: 600;">${avgPackage} LPA</td>
                    <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center; color: #6b7280;">${topRoles}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="color: #374151; border-bottom: 3px solid #e5e7eb; padding-bottom: 12px; font-size: 24px;">📋 Student Details</h2>
          <p style="color: #6b7280; margin-bottom: 20px; font-size: 16px;">
            Complete list of students with their placement status, company details, and package information.
          </p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: linear-gradient(135deg, #059669 0%, #047857 100%);">
                <th style="border: 1px solid #047857; padding: 12px; text-align: left; color: white; font-weight: 600;">Name</th>
                <th style="border: 1px solid #047857; padding: 12px; text-align: left; color: white; font-weight: 600;">Roll Number</th>
                <th style="border: 1px solid #047857; padding: 12px; text-align: center; color: white; font-weight: 600;">Status</th>
                <th style="border: 1px solid #047857; padding: 12px; text-align: center; color: white; font-weight: 600;">Company</th>
                <th style="border: 1px solid #047857; padding: 12px; text-align: center; color: white; font-weight: 600;">Package</th>
                <th style="border: 1px solid #047857; padding: 12px; text-align: center; color: white; font-weight: 600;">Role</th>
              </tr>
            </thead>
            <tbody>
              ${students.map((student, index) => {
                const status = student.selected ? 'Placed' : 'Not Placed';
                const statusColor = student.selected ? '#059669' : '#dc2626';
                const company = student.selected ? (student.companyName || 'N/A') : 'N/A';
                const packageAmount = student.selected ? (student.package ? `${student.package} LPA` : 'N/A') : 'N/A';
                const role = student.selected ? (student.role || 'N/A') : 'N/A';
                const rowBg = index % 2 === 0 ? '#f8fafc' : '#ffffff';
                return `
                  <tr style="background-color: ${rowBg};">
                    <td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: 500; color: #374151;">${student.name}</td>
                    <td style="border: 1px solid #e5e7eb; padding: 10px; color: #6b7280;">${student.rollNumber || 'N/A'}</td>
                    <td style="border: 1px solid #e5e7eb; padding: 10px; text-align: center; color: ${statusColor}; font-weight: 600;">${status}</td>
                    <td style="border: 1px solid #e5e7eb; padding: 10px; text-align: center; color: #374151;">${company}</td>
                    <td style="border: 1px solid #e5e7eb; padding: 10px; text-align: center; color: #7c3aed; font-weight: 600;">${packageAmount}</td>
                    <td style="border: 1px solid #e5e7eb; padding: 10px; text-align: center; color: #6b7280;">${role}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        
        <div style="margin-bottom: 30px; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); padding: 25px; border-radius: 12px; border-left: 5px solid #dc2626;">
          <h2 style="color: #991b1b; border-bottom: 3px solid #fecaca; padding-bottom: 12px; font-size: 24px;">💡 Recommendations & Insights</h2>
          <div style="color: #7f1d1d; line-height: 1.8;">
            <h3 style="margin-bottom: 15px; font-size: 18px;">Key Insights:</h3>
            <ul style="margin-bottom: 20px; font-size: 16px;">
              <li style="margin-bottom: 8px;">Department placement rate of <strong>${placementRate}%</strong> indicates ${parseFloat(placementRate) >= 80 ? 'excellent' : parseFloat(placementRate) >= 60 ? 'good' : parseFloat(placementRate) >= 40 ? 'moderate' : 'room for improvement'} performance</li>
              <li style="margin-bottom: 8px;">Average package of <strong>${avgPackage} LPA</strong> reflects the market value of ${department} graduates</li>
              <li style="margin-bottom: 8px;"><strong>${Object.keys(companyStats).length}</strong> companies participated in the placement process for ${department}</li>
              <li style="margin-bottom: 8px;"><strong>${unplacedStudents}</strong> students require additional support and career guidance</li>
            </ul>
            <h3 style="margin-bottom: 15px; font-size: 18px;">Strategic Recommendations:</h3>
            <ul style="font-size: 16px;">
              <li style="margin-bottom: 8px;">Focus on skill development programs to improve placement rates</li>
              <li style="margin-bottom: 8px;">Strengthen industry partnerships to increase company participation</li>
              <li style="margin-bottom: 8px;">Enhance career counseling initiatives for unplaced students</li>
              <li style="margin-bottom: 8px;">Implement targeted training programs based on market demands</li>
            </ul>
          </div>
        </div>
      `;

      // Create temporary div for PDF generation with improved styling
      const reportDiv = document.createElement('div');
      reportDiv.style.position = 'absolute';
      reportDiv.style.left = '-9999px';
      reportDiv.style.top = '0';
      reportDiv.style.width = '210mm';
      reportDiv.style.padding = '20mm';
      reportDiv.style.backgroundColor = '#ffffff';
      reportDiv.style.fontFamily = 'Arial, sans-serif';
      reportDiv.style.fontSize = '12px';
      reportDiv.style.lineHeight = '1.4';
      reportDiv.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
      reportDiv.style.borderRadius = '8px';
      reportDiv.innerHTML = reportContent;
      
      document.body.appendChild(reportDiv);
      
      // Convert to canvas with improved settings
      const canvas = await html2canvas(reportDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 210 * 5.905511811, // Convert mm to pixels
        height: reportDiv.scrollHeight
      });
      
      document.body.removeChild(reportDiv);
      
      // Create PDF with proper page handling - using 92% of page width
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 329; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgWidth = pageWidth * 0.93; // 92% of page width
      const margin = (pageWidth - imgWidth) / 2; // Center the image
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Download PDF
      pdf.save(`${department}_placement_report_${year}.pdf`);
      
      toast({ 
        title: 'Success', 
        description: 'Department placement report generated successfully!' 
      });
      
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to generate department placement report', 
        variant: 'destructive' 
      });
    }
  };

  const handleExport = async (endpoint: string, filename: string) => {
    try {
      const response = await fetch(endpoint, {
        credentials: 'include',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: 'Success', description: 'File exported successfully!' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to export file', variant: 'destructive' });
    }
  };

  const stats = {
    totalStudents: students.length,
    placedStudents: students.filter(s => s.selected).length,
    activeCompanies: Array.from(new Set(events.map(e => e.company))).length,
    alumniRegistered: alumni.length,
  };

  return (
    <div className="min-h-screen page-transition">
      {/* Dashboard Header */}
      <div className="glass-card border-0 border-b border-white/20 backdrop-blur-xl bg-white/90 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18 py-2">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-glow">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold gradient-text-primary">TPO Dashboard</h1>
                <span className="text-sm text-slate-600">KITS Akshar Institute of Technology</span>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm font-medium text-slate-700">Welcome, {user?.name || user?.username}</span>
              </div>
              <Button 
                variant="ghost" 
                className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 hover:scale-105" 
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="w-full animate-scale-in">
          <TabsList className="grid w-full grid-cols-11 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="alumni">Alumni</TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="placement">Placement Stuff</TabsTrigger>
            <TabsTrigger value="admins">Admins</TabsTrigger>
            <TabsTrigger value="exports">Exports</TabsTrigger>
            <TabsTrigger value="imports">Imports</TabsTrigger>
          </TabsList>
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card variant="glass" className="stagger-item group overflow-hidden">
                <CardContent className="p-6 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="flex items-center relative z-10">
                    <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-glow">
                      <Users className="text-white text-2xl" />
                    </div>
                    <div className="ml-6">
                      <p className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Total Students</p>
                      <p className="text-3xl font-bold gradient-text-primary mt-1">{stats.totalStudents}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card variant="glass" className="stagger-item group overflow-hidden">
                <CardContent className="p-6 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="flex items-center relative z-10">
                    <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-glow-green">
                      <Briefcase className="text-white text-2xl" />
                    </div>
                    <div className="ml-6">
                      <p className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Placed Students</p>
                      <p className="text-3xl font-bold text-green-600 mt-1">{stats.placedStudents}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card variant="glass" className="stagger-item group overflow-hidden">
                <CardContent className="p-6 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="flex items-center relative z-10">
                    <div className="p-4 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl shadow-lg">
                      <Calendar className="text-white text-2xl" />
                    </div>
                    <div className="ml-6">
                      <p className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Active Companies</p>
                      <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.activeCompanies}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card variant="glass" className="stagger-item group overflow-hidden">
                <CardContent className="p-6 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="flex items-center relative z-10">
                    <div className="p-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-glow-purple">
                      <GraduationCap className="text-white text-2xl" />
                    </div>
                    <div className="ml-6">
                      <p className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Alumni Registered</p>
                      <p className="text-3xl font-bold text-purple-600 mt-1">{stats.alumniRegistered}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Recent Activities */}
            <Card variant="glass" className="animate-slide-up overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-50/50 to-blue-50/50 backdrop-blur-sm">
                <CardTitle gradient>Recent Activities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {events.slice(0, 5).map((event, index) => {
                    let dateStr = 'Date not available';
                    if (event.startDate && !isNaN(new Date(event.startDate).getTime())) {
                      dateStr = new Date(event.startDate).toLocaleDateString();
                    }
                    const status = (event as any).status || 'upcoming';
                    return (
                      <div 
                        key={event.id} 
                        className="flex items-center space-x-4 p-4 glass-card group hover:scale-[1.02] transition-all duration-300"
                        style={{animationDelay: `${index * 0.1}s`}}
                      >
                        <div className={`w-3 h-3 rounded-full ${
                          status === 'ongoing' ? 'bg-green-500 shadow-glow-green pulse-glow' : 
                          status === 'upcoming' ? 'bg-blue-500 shadow-glow animate-pulse' : 
                          'bg-slate-400'
                        }`}></div>
                        <div className="flex-1">
                          <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                            {event.title} - {event.company}
                          </span>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              status === 'ongoing' ? 'bg-green-100 text-green-700' :
                              status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {status.toUpperCase()}
                            </span>
                            <span className="text-xs text-slate-500">{dateStr}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {events.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                        <Calendar className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-600 font-medium">No recent activities.</p>
                      <p className="text-slate-500 text-sm mt-1">Activities will appear here as they happen.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Events Tab */}
          <TabsContent value="events">
            {!selectedCompany ? (
              <div className="hierarchy-fade-in">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-semibold text-slate-800">Events by Company</h3>
                  <Button className="bg-primary text-white hover:bg-primary/90 transition-colors" onClick={() => setShowEventManagement(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Event
                  </Button>
                </div>
                <CompanyList companies={companies} onSelect={setSelectedCompany} />
              </div>
            ) : !selectedEventYear ? (
              <div className="hierarchy-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={() => setSelectedCompany(null)} className="breadcrumb-enter">
                      Back to Companies
                    </Button>
                    <span className="text-slate-500">/</span>
                    <span className="font-medium text-slate-700">{selectedCompany}</span>
                  </div>
                  <Button className="bg-primary text-white hover:bg-primary/90 transition-colors" onClick={() => setShowEventManagement(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Event
                  </Button>
                </div>
                <EventYearList years={eventYears} onSelect={setSelectedEventYear} />
              </div>
            ) : !selectedEvent ? (
              <div className="hierarchy-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={() => setSelectedEventYear(null)} className="breadcrumb-enter">
                      Back to Years
                    </Button>
                    <span className="text-slate-500">/</span>
                    <span className="font-medium text-slate-700">{selectedCompany}</span>
                    <span className="text-slate-500">/</span>
                    <span className="font-medium text-slate-700">{selectedEventYear}</span>
                  </div>
                  <Button className="bg-primary text-white hover:bg-primary/90 transition-colors" onClick={() => setShowEventManagement(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Event
                  </Button>
                </div>
                <EventList 
                  events={eventsNav} 
                  onSelect={setSelectedEvent}
                  onEdit={(event) => {
                    setShowEventManagement(true);
                  }}
                  onDelete={async (eventId) => {
                    try {
                      const response = await fetch(`/api/events/${eventId}`, {
                        method: 'DELETE',
                        credentials: 'include'
                      });
                      if (response.ok) {
                        toast({ title: 'Success', description: 'Event deleted successfully!' });
                        window.location.reload();
                      }
                    } catch (error) {
                      toast({ title: 'Error', description: 'Failed to delete event', variant: 'destructive' });
                    }
                  }}
                />
              </div>
            ) : (
              <div className="hierarchy-fade-in">
                <EventDetails event={selectedEvent} onBack={() => setSelectedEvent(null)} />
              </div>
            )}
          </TabsContent>
          {/* Students Tab */}
          <TabsContent value="students">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-semibold text-slate-800">Student Management</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search students by name, roll number, or company... (Press Enter for exact match)"
                      value={studentSearchTerm}
                                              onClick={() => {
                          // Search input is working
                        }}
                                              onChange={(e) => {
                          setStudentSearchTerm(e.target.value);
                        }}
                                              onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSearchSubmit(e as any);
                          }
                        }}
                      className="w-80 pr-10"
                    />
                    <Users className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                  {studentSearchTerm && (
                    <>
                                              <Button 
                          onClick={() => {
                            handleSearchSubmit({ preventDefault: () => {} } as any);
                          }}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Search
                      </Button>
                                              <Button 
                          variant="outline" 
                          onClick={() => {
                            setStudentSearchTerm('');
                          }}
                        className="text-red-600 hover:text-red-700"
                      >
                        Clear
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {selectedStudent ? (
                <Card className="hierarchy-fade-in">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Student Details</CardTitle>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSelectedStudent(null);
                        setHasNavigatedToStudent(false);
                      }}
                      className="breadcrumb-enter hover:bg-slate-50"
                    >
                      Back to List
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <StudentDetails 
                      student={selectedStudent} 
                      onBack={() => setSelectedStudent(null)}
                      onUpdate={(updatedStudent) => {
                        // Update the selected student with the updated data
                        setSelectedStudent(updatedStudent);
                        // Refresh the students list
                        window.location.reload();
                      }}
                    />
                  </CardContent>
                </Card>
              ) : !selectedStudentYear ? (
                <Card className="hierarchy-fade-in">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Browse Students by Batch Year</CardTitle>
                    <Button 
                      className="bg-primary text-white hover:bg-primary/90 transition-colors"
                      onClick={() => setShowAddStudentModal(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Student
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <StudentYearList years={studentYears} onSelect={setSelectedStudentYear} />
                  </CardContent>
                </Card>
              ) : !selectedDept ? (
                <Card className="hierarchy-fade-in">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CardTitle>Departments in {(() => {
                        const batchData = (window as any).batchData || [];
                        const batchInfo = batchData.find((b: any) => b.endYear === selectedStudentYear);
                        return batchInfo ? batchInfo.batch : `Batch Year ${selectedStudentYear}`;
                      })()}</CardTitle>
                      <div className="flex items-center space-x-2 text-sm text-slate-500">
                        <span>/</span>
                        <span className="breadcrumb-enter">{(() => {
                          const batchData = (window as any).batchData || [];
                          const batchInfo = batchData.find((b: any) => b.endYear === selectedStudentYear);
                          return batchInfo ? batchInfo.batch : `Batch Year ${selectedStudentYear}`;
                        })()}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        className="bg-primary text-white hover:bg-primary/90 transition-colors"
                        onClick={() => setShowStudentManagement(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Student
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedStudentYear(null)}
                        className="breadcrumb-enter hover:bg-slate-50"
                      >
                        Back to Batch Years
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <DepartmentList departments={departments} onSelect={setSelectedDept} />
                  </CardContent>
                </Card>
              ) : (
                <Card className="hierarchy-fade-in">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CardTitle>
                        {studentSearchTerm 
                          ? `Search Results for "${studentSearchTerm}" (All Departments)`
                          : `${selectedDept} Students in ${(() => {
                              const batchData = (window as any).batchData || [];
                              const batchInfo = batchData.find((b: any) => b.endYear === selectedStudentYear);
                              return batchInfo ? batchInfo.batch : `Batch Year ${selectedStudentYear}`;
                            })()}`
                        }
                      </CardTitle>
                      <div className="flex items-center space-x-2 text-sm text-slate-500">
                        <span>/</span>
                        <span className="breadcrumb-enter">{(() => {
                          const batchData = (window as any).batchData || [];
                          const batchInfo = batchData.find((b: any) => b.endYear === selectedStudentYear);
                          return batchInfo ? batchInfo.batch : `Batch Year ${selectedStudentYear}`;
                        })()}</span>
                        <span>/</span>
                        <span className="breadcrumb-enter">{selectedDept}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedDept(null)}
                        className="breadcrumb-enter hover:bg-slate-50"
                      >
                        Back to Departments
                      </Button>
                      <Button 
                        className="bg-primary text-white hover:bg-primary/90 transition-colors"
                        onClick={() => setShowAddStudentModal(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Student
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => generateDepartmentPlacementReport(selectedDept!, selectedStudentYear!)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {selectedDept} Placement Report
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Placement Statistics Summary */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold text-blue-800">Placement Statistics</h4>
                        <Badge variant="outline" className="text-blue-700 border-blue-300">
                          {selectedDept} - {selectedStudentYear}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{filteredStudents.length}</div>
                          <div className="text-sm text-blue-600">
                            {studentSearchTerm ? 'Search Results' : 'Total Students'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {filteredStudents.filter(s => s.selected).length}
                          </div>
                          <div className="text-sm text-green-600">Placed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            {filteredStudents.length > 0 
                              ? ((filteredStudents.filter(s => s.selected).length / filteredStudents.length) * 100).toFixed(1)
                              : '0'
                            }%
                          </div>
                          <div className="text-sm text-orange-600">Placement Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {filteredStudents.filter(s => s.selected && s.package).length > 0
                              ? (filteredStudents.filter(s => s.selected && s.package)
                                  .reduce((sum, s) => sum + (s.package || 0), 0) / 
                                  filteredStudents.filter(s => s.selected && s.package).length).toFixed(1)
                              : '0'
                            }
                          </div>
                          <div className="text-sm text-purple-600">Avg Package (LPA)</div>
                        </div>
                      </div>
                    </div>
                    
                    {studentSearchTerm && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-700">
                          Showing {filteredStudents.length} of {allStudents.length} students matching "{studentSearchTerm}" (searching across all departments)
                        </p>
                      </div>
                    )}
                    
                    <StudentList 
                      students={filteredStudents} 
                      onSelect={setSelectedStudent}
                      onEdit={(student) => {
                        setShowStudentManagement(true);
                      }}
                      onDelete={async (studentId) => {
                        try {
                          const response = await fetch(`/api/students/${studentId}`, {
                            method: 'DELETE',
                            credentials: 'include'
                          });
                          if (response.ok) {
                            toast({ title: 'Success', description: 'Student deleted successfully!' });
                            window.location.reload();
                          }
                        } catch (error) {
                          toast({ title: 'Error', description: 'Failed to delete student', variant: 'destructive' });
                        }
                      }}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          {/* Attendance Tab */}
          <TabsContent value="attendance">
            {!selectedDept ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-semibold text-slate-800">Attendance by Department</h3>
                  <Button 
                    className="bg-primary text-white" 
                    onClick={() => {
                      if (events.length > 0) {
                        setSelectedEventForAttendance(events[0]);
                        setShowAttendanceModal(true);
                      } else {
                        toast({
                          title: "No Events Available",
                          description: "Please create an event first before marking attendance.",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Attendance
                  </Button>
                </div>
                <DepartmentList departments={departments} onSelect={setSelectedDept} />
              </>
            ) : !selectedStudentYear ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <button className="px-4 py-2 bg-slate-200 rounded" onClick={() => setSelectedDept(null)}>Back</button>
                  <Button 
                    className="bg-primary text-white" 
                    onClick={() => {
                      if (events.length > 0) {
                        setSelectedEventForAttendance(events[0]);
                        setShowAttendanceModal(true);
                      } else {
                        toast({
                          title: "No Events Available",
                          description: "Please create an event first before marking attendance.",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Attendance
                  </Button>
                </div>
                <StudentYearList years={studentYears} onSelect={setSelectedStudentYear} />
              </>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <button className="px-4 py-2 bg-slate-200 rounded" onClick={() => setSelectedStudentYear(null)}>Back</button>
                  <div className="space-x-2">
                    <Button 
                      className="bg-primary text-white" 
                      onClick={() => {
                        if (events.length > 0) {
                          setSelectedEventForAttendance(events[0]);
                          setShowAttendanceModal(true);
                        } else {
                          toast({
                            title: "No Events Available",
                            description: "Please create an event first before marking attendance.",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Attendance
                    </Button>
                    <Button variant="outline" onClick={() => handleExport('/api/export/attendance', 'attendance.xlsx')}>
                      <Download className="w-4 h-4 mr-2" /> Export
                    </Button>
                  </div>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle>Attendance Records - {selectedDept} Year {selectedStudentYear}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {attendance.filter(a => a.branch === selectedDept && a.year === selectedStudentYear).length === 0 ? (
                        <p className="text-slate-600 text-center py-8">No attendance records found for this department and year.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Student Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Roll Number</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Event</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                              {attendance
                                .filter(a => a.branch === selectedDept && a.year === selectedStudentYear)
                                .map((record) => (
                                <tr key={record.id}>
                                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-800">{record.studentName}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">{record.rollNumber}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                    {events.find(e => e.id === record.eventId)?.title || 'Unknown Event'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                    {record.markedAt ? new Date(record.markedAt).toLocaleDateString() : 'N/A'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                    <div className="flex space-x-2">
                                      <Button size="sm" variant="outline">
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                      <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
          {/* Alumni Tab */}
          <TabsContent value="alumni">
            {!selectedAlumniYear ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-semibold text-slate-800">Alumni by Pass Out Year</h3>
                  <Button className="bg-primary text-white" onClick={() => setShowAlumniManagement(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Alumni
                  </Button>
                </div>
                <AlumniYearList years={alumniYears} onSelect={setSelectedAlumniYear} />
              </>
            ) : !selectedAlumni ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <button className="px-4 py-2 bg-slate-200 rounded" onClick={() => setSelectedAlumniYear(null)}>Back</button>
                  <Button className="bg-primary text-white" onClick={() => setShowAlumniManagement(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Alumni
                  </Button>
                </div>
                <AlumniList 
                  alumni={alumniNav} 
                  onSelect={setSelectedAlumni}
                  onEdit={(alumni) => {
                    setShowAlumniManagement(true);
                  }}
                  onDelete={async (alumniId) => {
                    try {
                      const response = await fetch(`/api/alumni/${alumniId}`, {
                        method: 'DELETE',
                        credentials: 'include'
                      });
                      if (response.ok) {
                        toast({ title: 'Success', description: 'Alumni deleted successfully!' });
                        window.location.reload();
                      }
                    } catch (error) {
                      toast({ title: 'Error', description: 'Failed to delete alumni', variant: 'destructive' });
                    }
                  }}
                />
              </>
            ) : (
              <AlumniDetails alumni={selectedAlumni} onBack={() => setSelectedAlumni(null)} />
            )}
          </TabsContent>
          {/* News Tab */}
          <TabsContent value="news">
            <NewsManagement />
          </TabsContent>
          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <NotificationManagement />
          </TabsContent>
          {/* Placement Stuff Tab */}
          <TabsContent value="placement">
            <PlacementManagement />
          </TabsContent>
          {/* Admins Tab */}
          <TabsContent value="admins">
            <AdminManagement />
          </TabsContent>
          {/* Exports Tab */}
          <TabsContent value="exports">
            <ExportFunctions />
          </TabsContent>
          {/* Imports Tab */}
          <TabsContent value="imports">
            <ImportFunctions />
          </TabsContent>
        </Tabs>
      </div>

      {/* Management Component Modals */}
      {showEventManagement && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">Event Management</h2>
                <Button variant="outline" onClick={() => setShowEventManagement(false)}>
                  Close
                </Button>
              </div>
              <EventManagement />
            </div>
          </div>
        </div>
      )}

      {showStudentManagement && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">Student Management</h2>
                <Button variant="outline" onClick={() => setShowStudentManagement(false)}>
                  Close
                </Button>
              </div>
              <StudentManagement />
            </div>
          </div>
        </div>
      )}

      {showAlumniManagement && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">Alumni Management</h2>
                <Button variant="outline" onClick={() => setShowAlumniManagement(false)}>
                  Close
                </Button>
              </div>
              <AlumniManagement />
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Add New Student</h2>
                <Button variant="outline" onClick={() => setShowAddStudentModal(false)}>
                  Close
                </Button>
              </div>
              <AddStudentForm onSuccess={() => {
                setShowAddStudentModal(false);
                window.location.reload();
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      <AttendanceModal 
        open={showAttendanceModal}
        onOpenChange={setShowAttendanceModal}
        event={selectedEventForAttendance}
      />
    </div>
  );
}