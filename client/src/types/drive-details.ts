export interface DriveDetail {
  id: string;
  companyName: string;
  date: string;
  roundsQualified: number;
  failedRound: string;
  notes?: string;
}

export interface StudentDriveDetails {
  drives: DriveDetail[];
  totalDrives: number;
  totalRoundsQualified: number;
} 