export type EssayType = 
  | 'ta-canh' 
  | 'ke-chuyen-sang-tao' 
  | 'cam-xuc-nhan-vat' 
  | 'cam-xuc-su-viec' 
  | 'neu-y-kien';

export interface EssayMetadata {
  id: EssayType;
  title: string;
  emoji: string;
  iconName?: string;
  iconBg?: string;
  iconColor?: string;
  description: string;
  topics: string[];
  template: {
    mobi: string[];
    thanbi: string[];
    ketbi: string[];
  };
  aiRules: {
    mustHave: string[];
    shouldAvoid: string[];
  };
}

export interface RubricCriteria {
  understand: number;     // max 20
  structure: number;      // max 20
  development: number;    // max 25
  creativity: number;     // max 20
  logic: number;          // max 15
}

export interface ChecklistItem {
  name: string;
  status: boolean;
}

export interface GradeResult {
  score: number;
  criteriaScores: RubricCriteria;
  feedback: {
    general: string;
    strengths: string[];
    improvements: string[];
    nextSteps: string;
  };
  checklist: ChecklistItem[]; // specific to the essay type
}

export interface GrowthComparison {
  scoreBefore: number;
  scoreAfter: number;
  scoreDiff: number;
  skillsBefore: RubricCriteria;
  skillsAfter: RubricCriteria;
  feedback: {
    celebration: string; // What improved noticeably
    reminders: string;   // Working targets remaining
    growthWords: string; // A message summarizing growth of style (Before vs After)
  };
}

export interface SampleHighlight {
  text: string;
  type: 'imagery' | 'emotion' | 'rhetorical' | 'vocabulary';
  explanation: string;
}

export interface SampleEssayResult {
  format: 'essay' | 'paragraph';
  content: string;
  highlights: SampleHighlight[];
  analysis: string[];
  isSimulated?: boolean; // Indicates if this is a static mock/simulated fallback
}

export interface OutlineSubmission {
  id: string; // unique ID
  studentId: string;
  studentName: string;
  topic: string;
  type: EssayType;
  outlineBefore: string;
  gradeBefore?: GradeResult;
  outlineAfter?: string;
  gradeAfter?: GradeResult;
  comparison?: GrowthComparison;
  reflection?: {
    q1_changes: string; // Em đã thay đổi những gì?
    q2_reasons: string; // Điều gì giúp bài của em tốt hơn?
    q3_learnings: string; // Lần sau em rút ra lưu ý gì?
  };
  sampleEssay?: SampleEssayResult;
  createdAt: string;
  updatedAt: string;
  emotionTag?: string; // SEL emotion tag selected by student
}

export interface StudentProfile {
  id: string;
  name: string;
  avatar: string;
  gradeClass: string;
  level: string;
  avgScore: number;
  outlineCount: number;
  progressScore: number; // sum of scoreDiff or average diff
  timeline: {
    month: string;
    score: number;
  }[];
  skillMap: {
    understand: number;   // % (out of 100)
    structure: number;    // %
    development: number;  // %
    creativity: number;   // %
    logic: number;        // %
  };
  styleAttributes: {
    tag: string;
    description: string;
    examples: { before: string; after: string }[];
  };
  badges: {
    id: string;
    title: string;
    emoji: string;
    description: string;
    unlocked: boolean;
    unlockedAt?: string;
  }[];
  strengthCards?: string[]; // IDs of collected strength cards
}

export interface ClassStatistics {
  className: string;
  totalStudents: number;
  averageScore: number;
  skillAverages: {
    understand: number;
    structure: number;
    development: number;
    creativity: number;
    logic: number;
  };
  typeDistribution: {
    type: string;
    count: number;
  }[];
}

// === Class Management Types ===
export interface StudentEntry {
  id: string;
  name: string;
  avatar: string;
  pin: string; // 4-digit PIN for student verification
}

export interface StudentGroup {
  id: string;
  name: string;
  emoji: string;
  studentIds: string[];
}

export interface GroupAssignment {
  id: string;
  groupId: string;
  title: string;
  genreId: string;
  topic: string;
  description: string;
  createdAt: string;
  dueDate?: string;
  status: 'active' | 'completed';
}

export interface ClassInfo {
  className: string;
  schoolName: string;
  students: StudentEntry[];
  groups: StudentGroup[];
  assignments: GroupAssignment[];
  createdAt: string;
  updatedAt: string;
}
