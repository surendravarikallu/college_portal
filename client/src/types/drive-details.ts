export interface DriveDetail {
  id: string;
  companyName: string;
  date: string;
  roundsQualified: number;
  roundsName: string; // Names/types of rounds qualified (e.g., "Aptitude, Technical, HR")
  status: string; // 'shortlisted' or 'not shortlisted'
  offerPackage?: number; // Company offer for this specific drive (LPA)
  notes?: string;
}

export interface StudentDriveDetails {
  drives: DriveDetail[];
  totalDrives: number;
  totalRoundsQualified: number;
} 