import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { FileSpreadsheet, FileText, Download, Users, Calendar, GraduationCap, Briefcase, Filter } from "lucide-react";
import { useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Type definitions for data structures
interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  branch: string;
  year: string;
  batch: string;
  cgpa: number;
  selected: boolean;
  package?: number;
  company?: string;
  companyName?: string;
  role?: string;
  gender?: string;
}

interface DeptStats {
  [key: string]: {
    total: number;
    placed: number;
    packages: number[];
  };
}

interface CompanyStats {
  [key: string]: {
    count: number;
    packages: number[];
    roles: string[];
  };
}

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  type: string;
  status: string;
  startDate?: string;
  endDate?: string;
}

interface YearStats {
  [key: string]: {
    total: number;
    placed: number;
    packages: number[];
  };
}

interface Alumni {
  id: string;
  name: string;
  email: string;
  phone: string;
  branch: string;
  year: string;
  batch: string;
  company?: string;
  position?: string;
  package?: number;
}

export function ExportFunctions() {
  const { toast } = useToast();
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedBatch, setSelectedBatch] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleExport = async (endpoint: string, filename: string) => {
    try {
      const response = await fetch(endpoint, {
        credentials: "include",
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

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

      toast({
        title: "Success",
        description: "File exported successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export file",
        variant: "destructive",
      });
    }
  };

  const exportStudents = () => handleExport("/api/export/students", "students.xlsx");
  const exportAlumni = () => handleExport("/api/export/alumni", "alumni.xlsx");
  const exportAttendance = () => handleExport("/api/export/attendance", "attendance.xlsx");

  const exportStudentsFiltered = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedBranch && selectedBranch !== 'all') params.append('branch', selectedBranch);
      if (selectedYear && selectedYear !== 'all') params.append('year', selectedYear);
      if (selectedBatch && selectedBatch !== 'all') params.append('batch', selectedBatch);
      
      const endpoint = `/api/export/students${params.toString() ? '?' + params.toString() : ''}`;
      
      const response = await fetch(endpoint, {
        credentials: "include",
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Generate filename based on filters
      let filename = "students";
      if (selectedBranch && selectedBranch !== 'all') filename += `_${selectedBranch}`;
      if (selectedYear && selectedYear !== 'all') filename += `_${selectedYear}`;
      if (selectedBatch && selectedBatch !== 'all') filename += `_${selectedBatch}`;
      filename += ".xlsx";
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Students data exported successfully!",
      });
      
      setIsDialogOpen(false);
      setSelectedBranch("all");
      setSelectedYear("all");
      setSelectedBatch("all");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export students data",
        variant: "destructive",
      });
    }
  };

  const generatePDFReport = async (type: string) => {
    try {
      console.log('Starting PDF generation for:', type);
      
      // Create a temporary div to hold the report content
      const reportDiv = document.createElement('div');
      reportDiv.style.position = 'absolute';
      reportDiv.style.left = '-9999px';
      reportDiv.style.top = '0';
      reportDiv.style.width = '800px';
      reportDiv.style.padding = '20px';
      reportDiv.style.backgroundColor = 'white';
      reportDiv.style.fontFamily = 'Arial, sans-serif';
      
      const currentDate = new Date().toLocaleDateString();
      const currentYear = new Date().getFullYear();
      
      // Fetch actual data from the database
      let students: Student[] = [];
      let events: Event[] = [];
      let alumni: Alumni[] = [];
      
      try {
        console.log('Fetching data from API...');
        const [studentsResponse, eventsResponse, alumniResponse] = await Promise.all([
          fetch('/api/students', { credentials: 'include' }),
          fetch('/api/events', { credentials: 'include' }),
          fetch('/api/alumni', { credentials: 'include' })
        ]);
        
        if (studentsResponse.ok) {
          students = await studentsResponse.json();
          console.log('Students data loaded:', students.length, 'records');
        } else {
          console.error('Failed to fetch students:', studentsResponse.status);
        }
        
        if (eventsResponse.ok) {
          events = await eventsResponse.json();
          console.log('Events data loaded:', events.length, 'records');
        } else {
          console.error('Failed to fetch events:', eventsResponse.status);
        }
        
        if (alumniResponse.ok) {
          alumni = await alumniResponse.json();
          console.log('Alumni data loaded:', alumni.length, 'records');
        } else {
          console.error('Failed to fetch alumni:', alumniResponse.status);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch data for report generation",
          variant: "destructive",
        });
        return;
      }
      
      // Calculate comprehensive statistics with error handling
      const totalStudents = students.length || 0;
      const placedStudents = students.filter((s: Student) => s && s.selected).length || 0;
      const unplacedStudents = totalStudents - placedStudents;
      const placementRate = totalStudents > 0 ? ((placedStudents / totalStudents) * 100).toFixed(1) : 0;
      
      // Package analysis with error handling
      const placedStudentsWithPackage = students.filter((s: Student) => s && s.selected && s.package && typeof s.package === 'number');
      const averagePackage = placedStudentsWithPackage.length > 0 ? 
        (placedStudentsWithPackage.reduce((sum: number, s: Student) => sum + (s.package || 0), 0) / placedStudentsWithPackage.length).toFixed(1) : 0;
      const highestPackage = placedStudentsWithPackage.length > 0 ? 
        Math.max(...placedStudentsWithPackage.map((s: Student) => s.package || 0)) : 0;
      const lowestPackage = placedStudentsWithPackage.length > 0 ? 
        Math.min(...placedStudentsWithPackage.map((s: Student) => s.package || 0)) : 0;
      
      // Department-wise analysis with error handling
      const deptStats = students.reduce((acc: DeptStats, student: Student) => {
        if (!student) return acc;
        const dept = student.branch || 'Unknown';
        if (!acc[dept]) acc[dept] = { total: 0, placed: 0, packages: [] };
        acc[dept].total++;
        if (student.selected) {
          acc[dept].placed++;
          if (student.package && typeof student.package === 'number') acc[dept].packages.push(student.package);
        }
        return acc;
      }, {} as DeptStats);
      
      // Company-wise distribution with detailed analysis and error handling
      const companyStats = students.filter((s: Student) => s && s.selected && s.companyName).reduce((acc: CompanyStats, student: Student) => {
        const company = student.companyName || 'Unknown';
        if (!acc[company]) acc[company] = { count: 0, packages: [], roles: [] };
        acc[company].count++;
        if (student.package && typeof student.package === 'number') acc[company].packages.push(student.package);
        if (student.role) acc[company].roles.push(student.role);
        return acc;
      }, {} as CompanyStats);
      
                // Year-wise analysis with error handling (Student Profiles specific)
          const studentYearStats = students.reduce((acc: YearStats, student: Student) => {
            if (!student) return acc;
            const year = student.year || 'Unknown';
            if (!acc[year]) acc[year] = { total: 0, placed: 0, packages: [] };
            acc[year].total++;
            if (student.selected) {
              acc[year].placed++;
              if (student.package && typeof student.package === 'number') acc[year].packages.push(student.package);
            }
            return acc;
          }, {} as YearStats);
      
      // Event statistics
      const totalEvents = events.length;
      const completedEvents = events.filter(e => {
        if (!e.endDate) return false;
        return new Date(e.endDate) < new Date();
      }).length;
      const ongoingEvents = events.filter(e => {
        if (!e.startDate || !e.endDate) return false;
        const now = new Date();
        const start = new Date(e.startDate);
        const end = new Date(e.endDate);
        return now >= start && now <= end;
      }).length;
      const upcomingEvents = events.filter(e => {
        if (!e.startDate) return false;
        return new Date(e.startDate) > new Date();
      }).length;
      const uniqueCompanies = [...new Set(events.map(e => e.company).filter(Boolean))].length;
      
      // Alumni analysis
      const totalAlumni = alumni.length;
      const alumniByYear = alumni.reduce((acc, a) => {
        const year = a.passOutYear;
        if (!acc[year]) acc[year] = 0;
        acc[year]++;
        return acc;
      }, {});
      
      // Generate detailed report content based on type
      let reportContent = '';
      let title = '';
      
      switch (type) {
        case "Placement Statistics":
          title = "Comprehensive Placement Statistics Report";
          reportContent = `
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #1f2937; font-size: 28px; margin-bottom: 10px;">${title}</h1>
              <p style="color: #6b7280; font-size: 14px;">Generated on ${currentDate}</p>
              <p style="color: #6b7280; font-size: 12px;">Academic Year: ${currentYear}</p>
            </div>
            
            <div style="margin-bottom: 30px; background-color: #f8fafc; padding: 20px; border-radius: 8px;">
              <h2 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 20px;">Executive Summary</h2>
              <p style="color: #4b5563; line-height: 1.8; margin-bottom: 15px;">
                This comprehensive placement report provides detailed analysis of student placement outcomes, 
                including statistical breakdowns, trend analysis, and performance metrics across departments, 
                companies, and academic years. The report serves as a strategic document for understanding 
                placement effectiveness and identifying areas for improvement.
              </p>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                <div style="background-color: #dbeafe; padding: 15px; border-radius: 6px;">
                  <h3 style="color: #1e40af; margin-bottom: 10px;">Overall Performance</h3>
                  <p style="color: #1e40af; font-size: 14px;">Total Students: <strong>${totalStudents}</strong></p>
                  <p style="color: #1e40af; font-size: 14px;">Placement Rate: <strong>${placementRate}%</strong></p>
                </div>
                <div style="background-color: #dcfce7; padding: 15px; border-radius: 6px;">
                  <h3 style="color: #166534; margin-bottom: 10px;">Package Analysis</h3>
                  <p style="color: #166534; font-size: 14px;">Average Package: <strong>₹${averagePackage} LPA</strong></p>
                  <p style="color: #166534; font-size: 14px;">Highest Package: <strong>₹${highestPackage} LPA</strong></p>
                </div>
              </div>
            </div>
            
            <div style="margin-bottom: 30px;">
              <h2 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Detailed Key Metrics</h2>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 15px;">
                <div style="background-color: #fef3c7; padding: 12px; border-radius: 6px;">
                  <h4 style="color: #92400e; margin-bottom: 8px;">Student Distribution</h4>
                  <ul style="color: #92400e; font-size: 13px; line-height: 1.6;">
                    <li>Total Students: ${totalStudents}</li>
                    <li>Placed Students: ${placedStudents}</li>
                    <li>Unplaced Students: ${unplacedStudents}</li>
                    <li>Placement Rate: ${placementRate}%</li>
                  </ul>
                </div>
                <div style="background-color: #fce7f3; padding: 12px; border-radius: 6px;">
                  <h4 style="color: #be185d; margin-bottom: 8px;">Package Statistics</h4>
                  <ul style="color: #be185d; font-size: 13px; line-height: 1.6;">
                    <li>Average Package: ₹${averagePackage} LPA</li>
                    <li>Highest Package: ₹${highestPackage} LPA</li>
                    <li>Lowest Package: ₹${lowestPackage} LPA</li>
                    <li>Students with Packages: ${placedStudentsWithPackage.length}</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div style="margin-bottom: 30px;">
              <h2 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Department-wise Analysis</h2>
              <p style="color: #6b7280; margin-bottom: 15px; font-size: 14px;">
                Detailed breakdown of placement performance across different departments, showing total students, 
                placement rates, and average packages for each department.
              </p>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
                <thead>
                  <tr style="background-color: #f3f4f6;">
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Department</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Total Students</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Placed Students</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Placement Rate</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Avg Package</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(deptStats).map(([dept, stats]: [string, any]) => {
                    const deptPlacementRate = stats.total > 0 ? ((stats.placed / stats.total) * 100).toFixed(1) : 0;
                    const avgPackage = stats.packages.length > 0 ? (stats.packages.reduce((sum: number, pkg: number) => sum + pkg, 0) / stats.packages.length).toFixed(1) : 'N/A';
                    const performance = parseFloat(deptPlacementRate) >= 80 ? 'Excellent' : parseFloat(deptPlacementRate) >= 60 ? 'Good' : parseFloat(deptPlacementRate) >= 40 ? 'Average' : 'Needs Improvement';
                    const performanceColor = performance === 'Excellent' ? '#059669' : performance === 'Good' ? '#d97706' : performance === 'Average' ? '#dc2626' : '#dc2626';
                    return `
                      <tr>
                        <td style="border: 1px solid #d1d5db; padding: 10px; font-weight: 500;">${dept}</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">${stats.total}</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">${stats.placed}</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">${deptPlacementRate}%</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">₹${avgPackage} LPA</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center; color: ${performanceColor}; font-weight: 500;">${performance}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
            
            <div style="margin-bottom: 30px;">
              <h2 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Company-wise Distribution</h2>
              <p style="color: #6b7280; margin-bottom: 15px; font-size: 14px;">
                Analysis of placement distribution across different companies, including the number of students placed 
                and average packages offered by each company.
              </p>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
                <thead>
                  <tr style="background-color: #f3f4f6;">
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Company</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Students Placed</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Avg Package</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Top Roles</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(companyStats).map(([company, stats]: [string, any]) => {
                    const avgPackage = stats.packages.length > 0 ? (stats.packages.reduce((sum: number, pkg: number) => sum + pkg, 0) / stats.packages.length).toFixed(1) : 'N/A';
                    const topRoles = [...new Set(stats.roles)].slice(0, 3).join(', ') || 'N/A';
                    return `
                      <tr>
                        <td style="border: 1px solid #d1d5db; padding: 10px; font-weight: 500;">${company}</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">${stats.count}</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">₹${avgPackage} LPA</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">${topRoles}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
            
            <div style="margin-bottom: 30px;">
              <h2 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Year-wise Analysis</h2>
              <p style="color: #6b7280; margin-bottom: 15px; font-size: 14px;">
                Placement trends across different academic years, showing how placement performance has evolved over time.
              </p>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
                <thead>
                  <tr style="background-color: #f3f4f6;">
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Academic Year</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Total Students</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Placed Students</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Placement Rate</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Avg Package</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(studentYearStats).map(([year, stats]: [string, any]) => {
                    const yearPlacementRate = stats.total > 0 ? ((stats.placed / stats.total) * 100).toFixed(1) : 0;
                    const avgPackage = stats.packages.length > 0 ? (stats.packages.reduce((sum: number, pkg: number) => sum + pkg, 0) / stats.packages.length).toFixed(1) : 'N/A';
                    return `
                      <tr>
                        <td style="border: 1px solid #d1d5db; padding: 10px; font-weight: 500;">Year ${year}</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">${stats.total}</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">${stats.placed}</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">${yearPlacementRate}%</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">₹${avgPackage} LPA</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
            
            <div style="margin-bottom: 30px; background-color: #fef2f2; padding: 20px; border-radius: 8px;">
              <h2 style="color: #991b1b; border-bottom: 2px solid #fecaca; padding-bottom: 10px;">Recommendations & Insights</h2>
              <div style="color: #7f1d1d; line-height: 1.8;">
                <h3 style="margin-bottom: 10px;">Key Insights:</h3>
                <ul style="margin-bottom: 15px;">
                  <li>Overall placement rate of ${placementRate}% indicates ${parseFloat(placementRate) >= 80 ? 'excellent' : parseFloat(placementRate) >= 60 ? 'good' : parseFloat(placementRate) >= 40 ? 'moderate' : 'room for improvement'} performance</li>
                  <li>Average package of ₹${averagePackage} LPA reflects the market value of our graduates</li>
                  <li>${Object.keys(companyStats).length} companies participated in the placement process</li>
                  <li>Department-wise analysis shows varying performance levels across different branches</li>
                </ul>
                <h3 style="margin-bottom: 10px;">Strategic Recommendations:</h3>
                <ul>
                  <li>Focus on departments with lower placement rates for targeted improvement</li>
                  <li>Strengthen industry partnerships to increase company participation</li>
                  <li>Enhance skill development programs to improve package offerings</li>
                  <li>Implement career counseling initiatives for unplaced students</li>
                </ul>
              </div>
            </div>
          `;
          break;
          
        case "Event Summary":
          title = "Comprehensive Event Management Report";
          
          // Event analysis
          const eventsByCompany = events.reduce((acc, event) => {
            const company = event.company || 'Unknown';
            if (!acc[company]) acc[company] = [];
            acc[company].push(event);
            return acc;
          }, {});
          
          const eventsByStatus = {
            completed: completedEvents,
            ongoing: ongoingEvents,
            upcoming: upcomingEvents
          };
          
          reportContent = `
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #1f2937; font-size: 28px; margin-bottom: 10px;">${title}</h1>
              <p style="color: #6b7280; font-size: 14px;">Generated on ${currentDate}</p>
              <p style="color: #6b7280; font-size: 12px;">Academic Year: ${currentYear}</p>
            </div>
            
            <div style="margin-bottom: 30px; background-color: #f8fafc; padding: 20px; border-radius: 8px;">
              <h2 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 20px;">Executive Summary</h2>
              <p style="color: #4b5563; line-height: 1.8; margin-bottom: 15px;">
                This comprehensive event management report provides detailed analysis of all events conducted, 
                including placement drives, workshops, career development sessions, and corporate interactions. 
                The report serves as a strategic document for understanding event effectiveness and planning future initiatives.
              </p>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 20px;">
                <div style="background-color: #dbeafe; padding: 15px; border-radius: 6px;">
                  <h3 style="color: #1e40af; margin-bottom: 10px;">Event Overview</h3>
                  <p style="color: #1e40af; font-size: 14px;">Total Events: <strong>${totalEvents}</strong></p>
                  <p style="color: #1e40af; font-size: 14px;">Companies: <strong>${uniqueCompanies}</strong></p>
                </div>
                <div style="background-color: #dcfce7; padding: 15px; border-radius: 6px;">
                  <h3 style="color: #166534; margin-bottom: 10px;">Event Status</h3>
                  <p style="color: #166534; font-size: 14px;">Completed: <strong>${completedEvents}</strong></p>
                  <p style="color: #166534; font-size: 14px;">Ongoing: <strong>${ongoingEvents}</strong></p>
                </div>
                <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px;">
                  <h3 style="color: #92400e; margin-bottom: 10px;">Future Planning</h3>
                  <p style="color: #92400e; font-size: 14px;">Upcoming: <strong>${upcomingEvents}</strong></p>
                  <p style="color: #92400e; font-size: 14px;">Success Rate: <strong>${totalEvents > 0 ? ((completedEvents / totalEvents) * 100).toFixed(1) : 0}%</strong></p>
                </div>
              </div>
            </div>
            
            <div style="margin-bottom: 30px;">
              <h2 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Detailed Event Statistics</h2>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 15px;">
                <div style="background-color: #fef3c7; padding: 12px; border-radius: 6px;">
                  <h4 style="color: #92400e; margin-bottom: 8px;">Event Distribution</h4>
                  <ul style="color: #92400e; font-size: 13px; line-height: 1.6;">
                    <li>Total Events: ${totalEvents}</li>
                    <li>Completed Events: ${completedEvents}</li>
                    <li>Ongoing Events: ${ongoingEvents}</li>
                    <li>Upcoming Events: ${upcomingEvents}</li>
                  </ul>
                </div>
                <div style="background-color: #fce7f3; padding: 12px; border-radius: 6px;">
                  <h4 style="color: #be185d; margin-bottom: 8px;">Company Participation</h4>
                  <ul style="color: #be185d; font-size: 13px; line-height: 1.6;">
                    <li>Unique Companies: ${uniqueCompanies}</li>
                    <li>Average Events per Company: ${uniqueCompanies > 0 ? (totalEvents / uniqueCompanies).toFixed(1) : 0}</li>
                    <li>Most Active Company: ${Object.entries(eventsByCompany).sort((a, b) => b[1].length - a[1].length)[0]?.[0] || 'N/A'}</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div style="margin-bottom: 30px;">
              <h2 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Comprehensive Event Timeline</h2>
              <p style="color: #6b7280; margin-bottom: 15px; font-size: 14px;">
                Detailed timeline of all events with comprehensive information including company details, 
                event descriptions, dates, and current status.
              </p>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
                <thead>
                  <tr style="background-color: #f3f4f6;">
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Event Title</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Company</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Start Date</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">End Date</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Status</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Type</th>
                  </tr>
                </thead>
                <tbody>
                  ${events.map(event => {
                    const startDate = event.startDate ? new Date(event.startDate).toLocaleDateString() : 'N/A';
                    const endDate = event.endDate ? new Date(event.endDate).toLocaleDateString() : 'N/A';
                    const now = new Date();
                    let status = 'Upcoming';
                    let statusColor = '#059669';
                    if (event.startDate && event.endDate) {
                      const start = new Date(event.startDate);
                      const end = new Date(event.endDate);
                      if (now >= start && now <= end) {
                        status = 'Ongoing';
                        statusColor = '#d97706';
                      } else if (end < now) {
                        status = 'Completed';
                        statusColor = '#dc2626';
                      }
                    }
                    const eventType = event.title.toLowerCase().includes('placement') ? 'Placement Drive' : 
                                    event.title.toLowerCase().includes('workshop') ? 'Workshop' : 
                                    event.title.toLowerCase().includes('seminar') ? 'Seminar' : 'Career Event';
                    return `
                      <tr>
                        <td style="border: 1px solid #d1d5db; padding: 10px; font-weight: 500;">${event.title}</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px;">${event.company || 'N/A'}</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">${startDate}</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">${endDate}</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center; color: ${statusColor}; font-weight: 500;">${status}</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">${eventType}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
            
            <div style="margin-bottom: 30px;">
              <h2 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Company-wise Event Analysis</h2>
              <p style="color: #6b7280; margin-bottom: 15px; font-size: 14px;">
                Analysis of event distribution across different companies, showing the level of engagement 
                and participation from various corporate partners.
              </p>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
                <thead>
                  <tr style="background-color: #f3f4f6;">
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Company</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Total Events</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Completed</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Ongoing</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Upcoming</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Engagement Level</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(eventsByCompany).map(([company, companyEvents]: [string, any]) => {
                    const completed = companyEvents.filter((e: any) => {
                      if (!e.endDate) return false;
                      return new Date(e.endDate) < new Date();
                    }).length;
                    const ongoing = companyEvents.filter((e: any) => {
                      if (!e.startDate || !e.endDate) return false;
                      const now = new Date();
                      const start = new Date(e.startDate);
                      const end = new Date(e.endDate);
                      return now >= start && now <= end;
                    }).length;
                    const upcoming = companyEvents.filter((e: any) => {
                      if (!e.startDate) return false;
                      return new Date(e.startDate) > new Date();
                    }).length;
                    const engagementLevel = companyEvents.length >= 5 ? 'High' : companyEvents.length >= 3 ? 'Medium' : 'Low';
                    const engagementColor = engagementLevel === 'High' ? '#059669' : engagementLevel === 'Medium' ? '#d97706' : '#dc2626';
                    return `
                      <tr>
                        <td style="border: 1px solid #d1d5db; padding: 10px; font-weight: 500;">${company}</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">${companyEvents.length}</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">${completed}</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">${ongoing}</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">${upcoming}</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center; color: ${engagementColor}; font-weight: 500;">${engagementLevel}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
            
            <div style="margin-bottom: 30px; background-color: #fef2f2; padding: 20px; border-radius: 8px;">
              <h2 style="color: #991b1b; border-bottom: 2px solid #fecaca; padding-bottom: 10px;">Event Performance Analysis</h2>
              <div style="color: #7f1d1d; line-height: 1.8;">
                <h3 style="margin-bottom: 10px;">Key Insights:</h3>
                <ul style="margin-bottom: 15px;">
                  <li>Event completion rate of ${totalEvents > 0 ? ((completedEvents / totalEvents) * 100).toFixed(1) : 0}% indicates ${(() => {
                    if (totalEvents === 0) return 'no data available';
                    const completionRate = (completedEvents / totalEvents) * 100;
                    if (completionRate >= 80) return 'excellent';
                    if (completionRate >= 60) return 'good';
                    if (completionRate >= 40) return 'moderate';
                    return 'room for improvement';
                  })()} event management</li>
                  <li>${uniqueCompanies} companies actively participated in campus events</li>
                  <li>${ongoingEvents} events currently in progress show active engagement</li>
                  <li>${upcomingEvents} upcoming events indicate strong future planning</li>
                </ul>
                <h3 style="margin-bottom: 10px;">Strategic Recommendations:</h3>
                <ul>
                  <li>Strengthen partnerships with companies showing high engagement levels</li>
                  <li>Diversify event types to include more workshops and skill development sessions</li>
                  <li>Implement feedback mechanisms to improve event effectiveness</li>
                  <li>Plan more industry-specific events based on student interests</li>
                </ul>
              </div>
            </div>
          `;
          break;
          
        case "Student Profiles":
          title = "Comprehensive Student Database Report";
          
          // Calculate comprehensive student statistics
          const currentStudents = students.filter(s => !s.selected).length;
          const studentYearStats2 = students.reduce((acc, student) => {
            const year = student.year || 'Unknown';
            if (!acc[year]) acc[year] = { total: 0, placed: 0, packages: [] };
            acc[year].total++;
            if (student.selected) {
              acc[year].placed++;
              if (student.package) acc[year].packages.push(student.package);
            }
            return acc;
          }, {});
          
          // Gender analysis (if available)
          const genderStats = students.reduce((acc, student) => {
            const gender = student.gender || 'Unknown';
            if (!acc[gender]) acc[gender] = { total: 0, placed: 0 };
            acc[gender].total++;
            if (student.selected) acc[gender].placed++;
            return acc;
          }, {});
          
          // Academic performance analysis
          const academicStats = students.reduce((acc, student) => {
            const cgpa = student.cgpa || 0;
            if (cgpa >= 8.0) acc.excellent++;
            else if (cgpa >= 7.0) acc.good++;
            else if (cgpa >= 6.0) acc.average++;
            else acc.needsImprovement++;
            return acc;
          }, { excellent: 0, good: 0, average: 0, needsImprovement: 0 });
          
          reportContent = `
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #1f2937; font-size: 28px; margin-bottom: 10px;">${title}</h1>
              <p style="color: #6b7280; font-size: 14px;">Generated on ${currentDate}</p>
              <p style="color: #6b7280; font-size: 12px;">Academic Year: ${currentYear}</p>
            </div>
            
            <div style="margin-bottom: 30px; background-color: #f8fafc; padding: 20px; border-radius: 8px;">
              <h2 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 20px;">Executive Summary</h2>
              <p style="color: #4b5563; line-height: 1.8; margin-bottom: 15px;">
                This comprehensive student database report provides detailed analysis of student profiles, 
                including academic performance, placement status, demographic distribution, and career outcomes. 
                The report serves as a strategic document for understanding student demographics and planning 
                academic and career development initiatives.
              </p>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 20px;">
                <div style="background-color: #dbeafe; padding: 15px; border-radius: 6px;">
                  <h3 style="color: #1e40af; margin-bottom: 10px;">Student Overview</h3>
                  <p style="color: #1e40af; font-size: 14px;">Total Students: <strong>${totalStudents}</strong></p>
                  <p style="color: #1e40af; font-size: 14px;">Current Students: <strong>${currentStudents}</strong></p>
                </div>
                <div style="background-color: #dcfce7; padding: 15px; border-radius: 6px;">
                  <h3 style="color: #166534; margin-bottom: 10px;">Placement Status</h3>
                  <p style="color: #166534; font-size: 14px;">Placed Students: <strong>${placedStudents}</strong></p>
                  <p style="color: #166534; font-size: 14px;">Placement Rate: <strong>${placementRate}%</strong></p>
                </div>
                <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px;">
                  <h3 style="color: #92400e; margin-bottom: 10px;">Academic Distribution</h3>
                  <p style="color: #92400e; font-size: 14px;">Departments: <strong>${Object.keys(deptStats).length}</strong></p>
                  <p style="color: #92400e; font-size: 14px;">Academic Years: <strong>${Object.keys(studentYearStats2).length}</strong></p>
                </div>
              </div>
            </div>
            
            <div style="margin-bottom: 30px;">
              <h2 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Detailed Student Statistics</h2>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 15px;">
                <div style="background-color: #fef3c7; padding: 12px; border-radius: 6px;">
                  <h4 style="color: #92400e; margin-bottom: 8px;">Student Distribution</h4>
                  <ul style="color: #92400e; font-size: 13px; line-height: 1.6;">
                    <li>Total Students: ${totalStudents}</li>
                    <li>Current Students: ${currentStudents}</li>
                    <li>Placed Students: ${placedStudents}</li>
                    <li>Unplaced Students: ${unplacedStudents}</li>
                  </ul>
                </div>
                <div style="background-color: #fce7f3; padding: 12px; border-radius: 6px;">
                  <h4 style="color: #be185d; margin-bottom: 8px;">Academic Performance</h4>
                  <ul style="color: #be185d; font-size: 13px; line-height: 1.6;">
                    <li>Excellent (8.0+ CGPA): ${academicStats.excellent}</li>
                    <li>Good (7.0-7.9 CGPA): ${academicStats.good}</li>
                    <li>Average (6.0-6.9 CGPA): ${academicStats.average}</li>
                    <li>Needs Improvement (<6.0): ${academicStats.needsImprovement}</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div style="margin-bottom: 30px;">
              <h2 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Comprehensive Student Database</h2>
              <p style="color: #6b7280; margin-bottom: 15px; font-size: 14px;">
                Complete student profiles with detailed information including academic details, placement status, 
                contact information, and career outcomes for administrative and analytical purposes.
              </p>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
                <thead>
                  <tr style="background-color: #f3f4f6;">
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Name</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Roll Number</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Department</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Year</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Email</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Status</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Package</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Company</th>
                  </tr>
                </thead>
                <tbody>
                  ${students.map(student => {
                    const status = student.selected ? 'Placed' : 'Not Placed';
                    const statusColor = student.selected ? '#059669' : '#dc2626';
                    const packageAmount = student.selected && student.package ? `₹${student.package} LPA` : 'N/A';
                    return `
                      <tr>
                        <td style="border: 1px solid #d1d5db; padding: 10px; font-weight: 500;">${student.name}</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px;">${student.rollNumber}</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px;">${student.branch || 'N/A'}</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">${student.year || 'N/A'}</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px;">${student.email || 'N/A'}</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center; color: ${statusColor}; font-weight: 500;">${status}</td>
                                                 <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">${packageAmount}</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">${student.companyName || 'N/A'}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
            
            <div style="margin-bottom: 30px;">
              <h2 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Year-wise Academic Analysis</h2>
              <p style="color: #6b7280; margin-bottom: 15px; font-size: 14px;">
                Detailed analysis of student distribution and placement performance across different academic years, 
                showing trends and patterns in student enrollment and career outcomes.
              </p>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
                <thead>
                  <tr style="background-color: #f3f4f6;">
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Academic Year</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Total Students</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Placed Students</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Placement Rate</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Avg Package</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(studentYearStats2).map(([year, stats]: [string, any]) => {
                    const yearPlacementRate = stats.total > 0 ? ((stats.placed / stats.total) * 100).toFixed(1) : 0;
                    const avgPackage = stats.packages.length > 0 ? (stats.packages.reduce((sum: number, pkg: number) => sum + pkg, 0) / stats.packages.length).toFixed(1) : 'N/A';
                    const performance = parseFloat(yearPlacementRate) >= 80 ? 'Excellent' : parseFloat(yearPlacementRate) >= 60 ? 'Good' : parseFloat(yearPlacementRate) >= 40 ? 'Average' : 'Needs Improvement';
                    const performanceColor = performance === 'Excellent' ? '#059669' : performance === 'Good' ? '#d97706' : performance === 'Average' ? '#dc2626' : '#dc2626';
                    return `
                      <tr>
                        <td style="border: 1px solid #d1d5db; padding: 10px; font-weight: 500;">Year ${year}</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">${stats.total}</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">${stats.placed}</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">${yearPlacementRate}%</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">₹${avgPackage} LPA</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center; color: ${performanceColor}; font-weight: 500;">${performance}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
            
            <div style="margin-bottom: 30px;">
              <h2 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Department-wise Student Distribution</h2>
              <p style="color: #6b7280; margin-bottom: 15px; font-size: 14px;">
                Analysis of student distribution across different departments, showing enrollment patterns 
                and placement performance by academic discipline.
              </p>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
                <thead>
                  <tr style="background-color: #f3f4f6;">
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Department</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Total Students</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Placed Students</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Placement Rate</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Avg Package</th>
                    <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Market Demand</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(deptStats).map(([dept, stats]: [string, any]) => {
                    const deptPlacementRate = stats.total > 0 ? ((stats.placed / stats.total) * 100).toFixed(1) : 0;
                    const avgPackage = stats.packages.length > 0 ? (stats.packages.reduce((sum: number, pkg: number) => sum + pkg, 0) / stats.packages.length).toFixed(1) : 'N/A';
                    const marketDemand = parseFloat(deptPlacementRate) >= 80 ? 'High' : parseFloat(deptPlacementRate) >= 60 ? 'Medium' : 'Low';
                    const demandColor = marketDemand === 'High' ? '#059669' : marketDemand === 'Medium' ? '#d97706' : '#dc2626';
                    return `
                      <tr>
                        <td style="border: 1px solid #d1d5db; padding: 10px; font-weight: 500;">${dept}</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">${stats.total}</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">${stats.placed}</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">${deptPlacementRate}%</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">₹${avgPackage} LPA</td>
                        <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center; color: ${demandColor}; font-weight: 500;">${marketDemand}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
            
            <div style="margin-bottom: 30px; background-color: #fef2f2; padding: 20px; border-radius: 8px;">
              <h2 style="color: #991b1b; border-bottom: 2px solid #fecaca; padding-bottom: 10px;">Student Database Insights</h2>
              <div style="color: #7f1d1d; line-height: 1.8;">
                <h3 style="margin-bottom: 10px;">Key Insights:</h3>
                <ul style="margin-bottom: 15px;">
                  <li>Student database contains ${totalStudents} comprehensive profiles with detailed academic and career information</li>
                  <li>Overall placement rate of ${placementRate}% reflects the institution's career development effectiveness</li>
                  <li>${Object.keys(deptStats).length} departments show diverse academic offerings and varying placement success</li>
                  <li>${Object.keys(studentYearStats2).length} academic years of data provide insights into enrollment and placement trends</li>
                </ul>
                <h3 style="margin-bottom: 10px;">Strategic Recommendations:</h3>
                <ul>
                  <li>Focus on departments with lower placement rates for targeted career development programs</li>
                  <li>Implement academic performance tracking to improve student outcomes</li>
                  <li>Develop industry partnerships based on department-wise market demand analysis</li>
                  <li>Enhance career counseling services for unplaced students</li>
                </ul>
              </div>
            </div>
          `;
          break;
          
        default:
          title = "General Report";
          reportContent = `
            <h1 style="color: #1f2937; text-align: center; margin-bottom: 30px;">${title}</h1>
            <p style="color: #6b7280; text-align: center; margin-bottom: 40px;">Generated on ${currentDate}</p>
            <p style="color: #4b5563; line-height: 1.6;">This is a general report template.</p>
          `;
      }
      
      reportDiv.innerHTML = reportContent;
      document.body.appendChild(reportDiv);
      
      // Convert to canvas and then to PDF
      const canvas = await html2canvas(reportDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      document.body.removeChild(reportDiv);
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      // Download the PDF
      const filename = `${type.replace(/\s+/g, '_').toLowerCase()}_report_${currentDate.replace(/\//g, '-')}.pdf`;
      console.log('Saving PDF as:', filename);
      pdf.save(filename);
      
      console.log('PDF generation completed successfully');
      toast({
        title: "Success",
        description: `${type} PDF report generated successfully!`,
      });
    } catch (error) {
      console.error('PDF generation error:', error);
    toast({
        title: "Error",
        description: "Failed to generate PDF report",
        variant: "destructive",
    });
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-semibold text-slate-800">Data Export Options</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileSpreadsheet className="w-5 h-5 text-green-600 mr-3" />
              Excel Exports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="w-full bg-green-600 text-white hover:bg-green-700"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Export Students Data
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Export Students Data</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="branch">Department (Optional)</Label>
                    <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        <SelectItem value="CSE">Computer Science Engineering</SelectItem>
                        <SelectItem value="ECE">Electronics & Communication</SelectItem>
                        <SelectItem value="ME">Mechanical Engineering</SelectItem>
                        <SelectItem value="CE">Civil Engineering</SelectItem>
                        <SelectItem value="IT">Information Technology</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year (Optional)</Label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        <SelectItem value="2020">2020</SelectItem>
                        <SelectItem value="2021">2021</SelectItem>
                        <SelectItem value="2022">2022</SelectItem>
                        <SelectItem value="2023">2023</SelectItem>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batch">Batch (Optional)</Label>
                    <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select batch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Batches</SelectItem>
                        <SelectItem value="2020-2024">2020-2024</SelectItem>
                        <SelectItem value="2021-2025">2021-2025</SelectItem>
                        <SelectItem value="2022-2026">2022-2026</SelectItem>
                        <SelectItem value="2023-2027">2023-2027</SelectItem>
                        <SelectItem value="2024-2028">2024-2028</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={exportStudentsFiltered}
                      className="flex-1 bg-green-600 text-white hover:bg-green-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSelectedBranch("all");
                        setSelectedYear("all");
                        setSelectedBatch("all");
                        setIsDialogOpen(false);
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button 
              className="w-full bg-green-600 text-white hover:bg-green-700"
              onClick={exportAttendance}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Export Attendance Records
            </Button>
            <Button 
              className="w-full bg-green-600 text-white hover:bg-green-700"
              onClick={exportAlumni}
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              Export Alumni Database
            </Button>
            <Button 
              className="w-full bg-green-600 text-white hover:bg-green-700"
              onClick={() => generatePDFReport("Placement Results")}
            >
              <Briefcase className="w-4 h-4 mr-2" />
              Export Placement Results
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 text-red-600 mr-3" />
              PDF Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full bg-red-600 text-white hover:bg-red-700"
              onClick={() => generatePDFReport("Placement Statistics")}
            >
              <Download className="w-4 h-4 mr-2" />
              Placement Statistics Report
            </Button>
            <Button 
              className="w-full bg-red-600 text-white hover:bg-red-700"
              onClick={() => generatePDFReport("Event Summary")}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Event Summary Report
            </Button>
            <Button 
              className="w-full bg-red-600 text-white hover:bg-red-700"
              onClick={() => generatePDFReport("Student Profiles")}
            >
              <Users className="w-4 h-4 mr-2" />
              Student Profile Cards
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
