export interface DriveDetail {
  id: string;
  companyName: string;
  date: string;
  roundsQualified: number;
  roundsName: string; // Names/types of rounds qualified (e.g., "Aptitude, Technical, HR")
  failedRound: string;
  notes?: string;
}

export interface StudentDriveDetails {
  drives: DriveDetail[];
  totalDrives: number;
  totalRoundsQualified: number;
} 