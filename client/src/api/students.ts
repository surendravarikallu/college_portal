// API for students section

export async function fetchAllStudents() {
  const res = await fetch('/api/students', { 
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  if (!res.ok) {
    console.error('Failed to fetch students:', res.status, res.statusText);
    throw new Error('Failed to fetch students');
  }
  return res.json();
}

export async function fetchDepartments() {
  try {
    const students = await fetchAllStudents();
    console.log('Fetched students:', students);
    // Get unique departments
    const departments = Array.from(new Set(students.map((s: any) => s.branch).filter(Boolean)));
    console.log('Departments found:', departments);
    return departments;
  } catch (error) {
    console.error('Error fetching departments:', error);
    return [];
  }
}

export async function fetchYears(department: string) {
  try {
    const students = await fetchAllStudents();
    // Get unique years for department
    const years = Array.from(new Set(students.filter((s: any) => s.branch === department).map((s: any) => s.year))).sort();
    console.log(`Years for ${department}:`, years);
    return years;
  } catch (error) {
    console.error('Error fetching years:', error);
    return [];
  }
}

export async function fetchStudentsByDepartmentYear(department: string, year: number) {
  try {
    const students = await fetchAllStudents();
    const filteredStudents = students.filter((s: any) => s.branch === department && s.year === year);
    console.log(`Students for ${department} ${year}:`, filteredStudents);
    return filteredStudents;
  } catch (error) {
    console.error('Error fetching students by department/year:', error);
    return [];
  }
}

export async function fetchStudentById(id: number) {
  try {
    const students = await fetchAllStudents();
    return students.find((s: any) => s.id === id);
  } catch (error) {
    console.error('Error fetching student by ID:', error);
    return null;
  }
} 