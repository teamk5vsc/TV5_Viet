import React, { useState, useEffect } from 'react';
import { OutlineSubmission, StudentProfile, ClassInfo, StudentEntry, StudentGroup, GroupAssignment } from './types';
import SyllabusTab from './components/SyllabusTab';
import AIOutlineHelper from './components/AIOutlineHelper';
import SequenceGame from './components/SequenceGame';
import PortfolioTab from './components/PortfolioTab';
import TeacherDashboard from './components/TeacherDashboard';
import DetectiveGame from './components/DetectiveGame';
import { 
  BookOpen, Sparkles, Gamepad2, Award, Users, Compass, 
  HelpCircle, Lightbulb, CheckSquare, Heart, Settings,
  Key, ExternalLink, X, Cpu, Zap, Star, Shield, Search, UserPlus, Lock, ArrowLeft, ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- AI Model Configuration ---
const AI_MODELS = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', desc: 'Nhanh & tiết kiệm, phù hợp sử dụng hàng ngày', emoji: '⚡', isDefault: true },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', desc: 'Chất lượng cao, phân tích sâu hơn', emoji: '🧠', isDefault: false },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Ổn định, dự phòng khi model mới quá tải', emoji: '🛡️', isDefault: false },
];

// Default empty student profile builder
function buildStudentProfile(student: StudentEntry, submissions: OutlineSubmission[] = [], className: string = ''): StudentProfile {
  const scores = submissions
    .map(s => s.gradeAfter?.score || s.gradeBefore?.score || 0)
    .filter(s => s > 0);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const level = avgScore >= 85 ? 'Master Outliner 🎖️' : avgScore >= 70 ? 'Nhà văn tập sự ✍️' : avgScore >= 50 ? 'Người học chăm chỉ 📖' : 'Bạn mới bắt đầu 🌱';
  
  return {
    id: student.id,
    name: student.name,
    gradeClass: className || 'Chưa xếp lớp',
    avatar: student.avatar,
    level,
    avgScore,
    outlineCount: submissions.length,
    progressScore: scores.length >= 2 ? scores[scores.length - 1] - scores[0] : 0,
    timeline: submissions.slice(-6).map((s, i) => ({
      month: `Bài ${i + 1}`,
      score: s.gradeAfter?.score || s.gradeBefore?.score || 0
    })),
    skillMap: {
      understand: avgScore > 0 ? Math.min(Math.round(avgScore * 0.95), 100) : 0,
      structure: avgScore > 0 ? Math.min(Math.round(avgScore * 0.9), 100) : 0,
      development: avgScore > 0 ? Math.min(Math.round(avgScore * 0.85), 100) : 0,
      creativity: avgScore > 0 ? Math.min(Math.round(avgScore * 0.88), 100) : 0,
      logic: avgScore > 0 ? Math.min(Math.round(avgScore * 0.82), 100) : 0,
    },
    styleAttributes: {
      tag: submissions.length > 0 ? 'Đang phát triển phong cách' : 'Chưa có dữ liệu',
      description: submissions.length > 0 ? 'Phong cách viết đang được hình thành qua từng bài luyện tập.' : 'Hãy bắt đầu luyện tập để khám phá phong cách viết của bạn!',
      examples: []
    },
    badges: [
      { id: 'obs', title: 'Người quan sát tinh tế', description: 'Hoàn thành 1 bài Văn tả cảnh.', emoji: '🌳', unlocked: submissions.some(s => s.type === 'ta-canh') },
      { id: 'nar', title: 'Người kể chuyện sáng tạo', description: 'Hoàn thành 1 bài Kể chuyện sáng tạo.', emoji: '🦊', unlocked: submissions.some(s => s.type === 'ke-chuyen-sang-tao') },
      { id: 'log', title: 'Nhà lập luận nhỏ tuổi', description: 'Hoàn thành 1 bài Nêu ý kiến.', emoji: '⚖️', unlocked: submissions.some(s => s.type === 'neu-y-kien') },
    ],
    strengthCards: [],
  };
}

// Emoji avatars for students to pick from
const AVATAR_OPTIONS = ['🎒', '⚽', '🎨', '🌸', '🤖', '🦋', '🎵', '🌟', '🐶', '🐱', '🦁', '🐻', '🎯', '📚', '✈️', '🚀'];

export default function App() {
  const [activeTab, setActiveTab] = useState<'syllabus' | 'helper' | 'game' | 'detective' | 'portfolio' | 'teacher'>('syllabus');
  
  // Custom saved outlines tracked in client app state
  const [customSavedOutlines, setCustomSavedOutlines] = useState<OutlineSubmission[]>(() => {
    const studentId = localStorage.getItem('vm5_current_student');
    if (studentId) {
      const saved = localStorage.getItem(`vm5_submissions_${studentId}`);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  
  // Deep link states to jump from Syllabus topic cards directly into AI helper workspace
  const [selectionGenreId, setSelectionGenreId] = useState('ta-canh');
  const [selectionTopic, setSelectionTopic] = useState('');

  // API Key & Model management
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('vm5_api_key') || '');
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('vm5_model') || 'gemini-3-flash-preview');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');

  // Tab permissions configuration
  const [tabPermissions, setTabPermissions] = useState<Record<string, { student: boolean; guest: boolean }>>(() => {
    const saved = localStorage.getItem('vm5_tab_permissions');
    return saved ? JSON.parse(saved) : {
      syllabus: { student: true, guest: true },
      helper: { student: true, guest: true },
      game: { student: true, guest: true },
      detective: { student: true, guest: true },
      portfolio: { student: true, guest: true }
    };
  });

  // Class & Student management
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(() => {
    const saved = localStorage.getItem('vm5_class_info');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ClassInfo;
        let modified = false;
        if (parsed && parsed.students) {
          parsed.students = parsed.students.map((s, idx) => {
            if (!s.pin) {
              s.pin = String(Math.floor(1000 + Math.random() * 9000));
              modified = true;
            }
            return s;
          });
        }
        if (modified) {
          localStorage.setItem('vm5_class_info', JSON.stringify(parsed));
        }
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [currentStudent, setCurrentStudent] = useState<StudentEntry | null>(() => {
    const savedId = localStorage.getItem('vm5_current_student');
    const savedClass = localStorage.getItem('vm5_class_info');
    if (savedId && savedClass) {
      const cls = JSON.parse(savedClass) as ClassInfo;
      return cls.students.find(s => s.id === savedId) || null;
    }
    return null;
  });
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [pickerStep, setPickerStep] = useState<'select' | 'pin'>('select');
  const [pickerStudent, setPickerStudent] = useState<StudentEntry | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Teacher authentication and locking
  const [teacherPassword, setTeacherPassword] = useState(() => localStorage.getItem('vm5_teacher_password') || '1234');
  const [tempTeacherPassword, setTempTeacherPassword] = useState('');
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState(false);
  const [showTeacherUnlockModal, setShowTeacherUnlockModal] = useState(false);
  const [teacherUnlockInput, setTeacherUnlockInput] = useState('');
  const [teacherUnlockError, setTeacherUnlockError] = useState(false);

  // Show modal on first load if no API key
  useEffect(() => {
    if (!apiKey) {
      setShowSettingsModal(true);
    }
  }, []);

  // Auto-lock teacher mode when not on the teacher tab or when selecting student picker
  useEffect(() => {
    if (activeTab !== 'teacher' || showStudentPicker) {
      setIsTeacherAuthenticated(false);
    }
  }, [activeTab, showStudentPicker]);

  // Auto-redirect unauthorized users away from teacher tab or disabled tabs
  useEffect(() => {
    if (activeTab === 'teacher') {
      if (!isTeacherAuthenticated && classInfo) {
        setActiveTab('syllabus');
      }
      return;
    }

    if (isTeacherAuthenticated) return;

    const role = currentStudent ? 'student' : 'guest';
    const isAllowed = tabPermissions[activeTab]?.[role] !== false;
    if (!isAllowed) {
      // Find the first allowed tab
      const firstAllowed = tabs.find(tab => tabPermissions[tab.id]?.[role] !== false);
      if (firstAllowed) {
        setActiveTab(firstAllowed.id);
      }
    }
  }, [activeTab, isTeacherAuthenticated, classInfo, currentStudent, tabPermissions]);

  const handleSaveSettings = () => {
    if (tempApiKey.trim()) {
      setApiKey(tempApiKey.trim());
      localStorage.setItem('vm5_api_key', tempApiKey.trim());
    }
    if (tempTeacherPassword.trim()) {
      setTeacherPassword(tempTeacherPassword.trim());
      localStorage.setItem('vm5_teacher_password', tempTeacherPassword.trim());
    }
    localStorage.setItem('vm5_model', selectedModel);
    setShowSettingsModal(false);
  };

  const handleUpdatePermissions = (newPermissions: Record<string, { student: boolean; guest: boolean }>) => {
    setTabPermissions(newPermissions);
    localStorage.setItem('vm5_tab_permissions', JSON.stringify(newPermissions));
  };

  const handleOpenSettings = () => {
    setTempApiKey(apiKey);
    setTempTeacherPassword(teacherPassword);
    setShowSettingsModal(true);
  };

  const handleStartWriting = (genreId: string, topic?: string) => {
    setSelectionGenreId(genreId);
    setSelectionTopic(topic || '');
    setActiveTab('helper');
  };

  const handleOutlineSaved = (newOutline: OutlineSubmission) => {
    const updated = [newOutline, ...customSavedOutlines];
    setCustomSavedOutlines(updated);
    if (currentStudent) {
      localStorage.setItem(`vm5_submissions_${currentStudent.id}`, JSON.stringify(updated));
    }
  };

  const handleSelectStudent = (student: StudentEntry) => {
    setCurrentStudent(student);
    localStorage.setItem('vm5_current_student', student.id);
    // Load this student's submissions
    const saved = localStorage.getItem(`vm5_submissions_${student.id}`);
    setCustomSavedOutlines(saved ? JSON.parse(saved) : []);
    
    // Auto-lock teacher mode and switch to student home when a student logs in
    setIsTeacherAuthenticated(false);
    if (activeTab === 'teacher') {
      setActiveTab('syllabus');
    }
    
    setShowStudentPicker(false);
  };

  const handleSaveClass = (info: ClassInfo) => {
    setClassInfo(info);
    localStorage.setItem('vm5_class_info', JSON.stringify(info));
  };

  // Get active assignments for the current student
  const getStudentAssignments = (): GroupAssignment[] => {
    if (!currentStudent || !classInfo) return [];
    const studentGroups = (classInfo.groups || []).filter(g => g.studentIds.includes(currentStudent.id));
    const groupIds = studentGroups.map(g => g.id);
    return (classInfo.assignments || []).filter(a => a.status === 'active' && groupIds.includes(a.groupId));
  };

  const studentAssignments = getStudentAssignments();

  const tabs = [
    { id: 'syllabus' as const, label: '📚 Thư viện dạng bài', icon: BookOpen, color: 'text-amber-600' },
    { id: 'helper' as const, label: '💡 Dàn ý thông minh AI', icon: Sparkles, color: 'text-yellow-500' },
    { id: 'game' as const, label: '🎮 Trò chơi sắp đặt', icon: Gamepad2, color: 'text-emerald-500' },
    { id: 'detective' as const, label: '🕵️ Thám tử bắt lỗi', icon: Search, color: 'text-rose-500' },
    { id: 'portfolio' as const, label: '🏆 Portfolio Tiến Bộ', icon: Award, color: 'text-purple-500' },
  ];

  const allowedTabs = tabs.filter(tab => {
    if (isTeacherAuthenticated) return true;
    const role = currentStudent ? 'student' : 'guest';
    return tabPermissions[tab.id]?.[role] !== false;
  });

  return (
    <div className="min-h-screen flex flex-col font-body text-neutral-800 antialiased">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-50 w-full">
        <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 animate-gradient">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center space-x-3">
              <motion.div 
                className="w-12 h-12 rounded-2xl bg-white/90 flex items-center justify-center text-2xl shadow-lg select-none"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                📝
              </motion.div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg font-heading font-extrabold text-white tracking-tight drop-shadow-sm">VietMaster 5</h1>
                  <span className="hidden sm:inline-flex bg-white/25 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-white/30">
                    Bản đồ ý tưởng lớp 5
                  </span>
                </div>
                <p className="text-[11px] text-white/80 font-medium mt-0.5 hidden sm:block">
                  Huấn luyện viên rèn luyện dàn ý thông minh & Đo lường sự tiến bộ ✨
                </p>
              </div>
            </div>

            {/* Right side: Student badge + Settings */}
            <div className="flex items-center space-x-3">
              {/* Student chip — clickable to switch */}
              {currentStudent ? (
                <button
                  onClick={() => setShowStudentPicker(true)}
                  className="hidden sm:flex items-center space-x-2 bg-white/20 backdrop-blur-sm border border-white/30 py-1.5 px-3 rounded-xl hover:bg-white/30 transition cursor-pointer"
                >
                  <span className="text-sm">{currentStudent.avatar}</span>
                  <span className="text-xs font-bold text-white">{currentStudent.name}</span>
                  <span className="text-[10px] text-white/70">▾</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowStudentPicker(true)}
                  className="hidden sm:flex items-center space-x-2 bg-white/20 backdrop-blur-sm border border-white/30 py-1.5 px-3 rounded-xl hover:bg-white/30 transition cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-white" />
                  <span className="text-xs font-bold text-white">Chọn học sinh</span>
                </button>
              )}


            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white/80 backdrop-blur-md border-b border-amber-100/50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-1 py-2.5 overflow-x-auto no-scrollbar scroll-smooth">
              {allowedTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => {
                      setIsTeacherAuthenticated(false);
                      setActiveTab(tab.id);
                    }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={`px-4 py-2.5 text-xs font-bold rounded-xl flex items-center space-x-2 transition-all cursor-pointer select-none whitespace-nowrap ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-900 border border-amber-200/80 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50/80 border border-transparent'
                    }`}
                  >
                    <tab.icon className={`w-4 h-4 ${isActive ? tab.color : ''}`} />
                    <span>{tab.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="tab-dot"
                        className="w-1.5 h-1.5 rounded-full bg-amber-400"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </motion.button>
                );
              })}

              {/* Separator */}
              <span className="w-px bg-neutral-200/80 self-stretch my-1.5 mx-1" />

              {/* Teacher tab - separated */}
              <motion.button
                onClick={() => {
                  if (isTeacherAuthenticated) {
                    setActiveTab('teacher');
                  } else {
                    setTeacherUnlockInput('');
                    setTeacherUnlockError(false);
                    setShowTeacherUnlockModal(true);
                  }
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`px-4 py-2.5 text-xs font-bold rounded-xl flex items-center space-x-2 transition-all cursor-pointer select-none whitespace-nowrap ${
                  activeTab === 'teacher'
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-900 border border-blue-200/80 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50/80 border border-transparent'
                }`}
              >
                <Users className={`w-4 h-4 ${activeTab === 'teacher' ? 'text-blue-600' : ''}`} />
                <span>👩🏫 Chế độ Giáo viên</span>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* ===== HERO WELCOME BANNER ===== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-400 to-rose-400 shadow-lg" style={{ maxHeight: '180px' }}>
          {/* Text content - left side */}
          <div className="relative z-10 flex items-center justify-between h-full">
            <div className="flex items-center space-x-3 p-5 sm:p-6 max-w-lg">
              <motion.div 
                className="w-12 h-12 rounded-2xl bg-white/25 backdrop-blur-sm border border-white/30 flex items-center justify-center text-2xl shadow-md shrink-0"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                🦉
              </motion.div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-heading font-extrabold text-white drop-shadow-sm">
                  Mỗi bài văn là một cuộc phiêu lưu! 🌟
                </h3>
                <p className="text-[11px] sm:text-xs text-white/90 leading-relaxed drop-shadow-sm">
                  {currentStudent ? `${currentStudent.name} ơi, hôm nay mình sẽ kể câu chuyện gì nhỉ? ✨` : 'Em có cả một thế giới trong trí tưởng tượng — hãy viết nó ra nào! ✍️'}
                </p>
                <span className="inline-flex items-center text-[10px] font-bold text-white/90 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-lg border border-white/20">
                  <CheckSquare className="w-3 h-3 mr-1" />
                  {apiKey ? '🦉 AI sẵn sàng ✓' : '📖 Offline mode'}
                </span>
              </div>
            </div>

            {/* Illustration - right side, visible */}
            <div className="hidden sm:block h-[180px] w-[320px] shrink-0">
              <img 
                src="/hero-banner.png" 
                alt="VietMaster 5 - Cú Văn và các bạn nhỏ" 
                className="h-full w-full object-cover object-center rounded-r-2xl"
              />
            </div>
          </div>

          {/* Decorative sparkles */}
          <div className="absolute top-2 left-1/3 text-lg opacity-20 animate-sparkle select-none">✨</div>
          <div className="absolute bottom-2 left-1/4 text-sm opacity-15 animate-float select-none" style={{ animationDelay: '1s' }}>🌟</div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Student's pending assignments */}
        {currentStudent && studentAssignments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200/50 space-y-2"
          >
            <div className="flex items-center space-x-2">
              <ClipboardList className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-heading font-bold text-amber-800 uppercase tracking-wider">Nhiệm vụ của em</h3>
              <span className="text-[9px] font-bold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full">{studentAssignments.length}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {studentAssignments.map(a => {
                const group = (classInfo?.groups || []).find(g => g.id === a.groupId);
                return (
                  <button
                    key={a.id}
                    onClick={() => handleStartWriting(a.genreId, a.topic)}
                    className="flex items-center space-x-2 px-3 py-2 bg-white rounded-xl border border-amber-200 hover:border-amber-400 hover:shadow-sm transition cursor-pointer text-left"
                  >
                    <span className="text-base">{group?.emoji || '\u{1F4DD}'}</span>
                    <div>
                      <p className="text-[11px] font-bold text-neutral-800">{a.title}</p>
                      <p className="text-[9px] text-neutral-400">{a.topic}{a.dueDate ? ` \u2022 H\u1EA1n: ${new Date(a.dueDate).toLocaleDateString('vi-VN')}` : ''}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
        <AnimatePresence mode="wait">
          {activeTab === 'syllabus' && (
            <motion.div
              key="syllabus-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <SyllabusTab onStartWriting={handleStartWriting} />
            </motion.div>
          )}

          {activeTab === 'helper' && (
            <motion.div
              key="helper-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <AIOutlineHelper 
                initialGenreId={selectionGenreId} 
                initialTopic={selectionTopic}
                onOutlineSaved={handleOutlineSaved}
                apiKey={apiKey}
                selectedModel={selectedModel}
                currentStudent={currentStudent}
              />
            </motion.div>
          )}

          {activeTab === 'game' && (
            <motion.div
              key="game-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <SequenceGame />
            </motion.div>
          )}

          {activeTab === 'detective' && (
            <motion.div
              key="detective-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <DetectiveGame apiKey={apiKey} selectedModel={selectedModel} />
            </motion.div>
          )}

          {activeTab === 'portfolio' && (
            <motion.div
              key="portfolio-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <PortfolioTab 
                studentProfile={currentStudent ? buildStudentProfile(currentStudent, customSavedOutlines, classInfo?.className) : buildStudentProfile({ id: 'guest', name: 'Khách', avatar: '🎒' }, [], classInfo?.className)} 
                customSavedOutlines={customSavedOutlines} 
              />
            </motion.div>
          )}

          {activeTab === 'teacher' && (isTeacherAuthenticated || !classInfo) && (
            <motion.div
              key="teacher-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <TeacherDashboard 
                apiKey={apiKey}
                selectedModel={selectedModel}
                onOpenSettings={handleOpenSettings}
                classInfo={classInfo}
                onSaveClass={handleSaveClass}
                tabPermissions={tabPermissions}
                onUpdatePermissions={handleUpdatePermissions}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="relative bg-gradient-to-r from-amber-50 via-white to-rose-50 border-t border-amber-100/50 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4">
            {/* Main footer info */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📝</span>
                <div>
                  <p className="text-xs font-heading font-bold text-neutral-700 uppercase tracking-wider">VietMaster 5 • Bản Đồ Ý Tưởng Sư Phạm</p>
                  <p className="text-[10px] text-neutral-400 font-medium mt-0.5">
                    Tiếng Việt Lớp 5 • Hỗ trợ bởi Gemini AI
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-[10px] text-neutral-400 font-medium">
                <span className="flex items-center space-x-1">
                  <Shield className="w-3 h-3" />
                  <span>Môi trường an toàn học tập</span>
                </span>
              </div>
            </div>

            {/* Separator */}
            <div className="w-full border-t border-amber-100/60" />

            {/* Credit line */}
            <div className="flex items-center space-x-2 text-xs text-neutral-500">
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
              <span className="font-medium">Được tạo bởi</span>
              <span className="font-heading font-bold text-amber-700">Ms. Ngọc Mai</span>
              <span className="text-neutral-300">•</span>
              <span className="text-[10px] text-neutral-400">© {new Date().getFullYear()} VietMaster 5</span>
            </div>
          </div>
        </div>
        {/* Decorative floating elements */}
        <div className="absolute top-3 right-20 text-lg opacity-[0.06] animate-float select-none">🌸</div>
        <div className="absolute bottom-3 left-24 text-lg opacity-[0.06] animate-float-slow select-none">🍃</div>
      </footer>

      {/* ===== API KEY & MODEL SETTINGS MODAL ===== */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-overlay"
            onClick={(e) => { if (apiKey && e.target === e.currentTarget) setShowSettingsModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 p-6 text-white relative">
                <div className="absolute top-3 right-3 text-3xl opacity-20 animate-float select-none">🔑</div>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Key className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-heading font-extrabold">Thiết lập Model & API Key</h2>
                    <p className="text-xs text-white/80 mt-0.5">Cấu hình trước khi sử dụng VietMaster 5</p>
                  </div>
                </div>
                {apiKey && (
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition cursor-pointer"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Model Selection Cards */}
                <div className="space-y-3">
                  <label className="text-xs font-heading font-bold text-neutral-700 uppercase tracking-wider flex items-center space-x-1.5">
                    <Cpu className="w-4 h-4 text-amber-500" />
                    <span>Chọn Model AI</span>
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {AI_MODELS.map((model) => {
                      const isSelected = selectedModel === model.id;
                      return (
                        <button
                          key={model.id}
                          onClick={() => setSelectedModel(model.id)}
                          className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-amber-400 bg-amber-50/50 shadow-sm ring-1 ring-amber-200'
                              : 'border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-xl">{model.emoji}</span>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-bold text-neutral-800">{model.name}</span>
                                  {model.isDefault && (
                                    <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full uppercase">Mặc định</span>
                                  )}
                                </div>
                                <p className="text-[11px] text-neutral-500 mt-0.5">{model.desc}</p>
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                              isSelected ? 'border-amber-400 bg-amber-400' : 'border-neutral-300'
                            }`}>
                              {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* API Key Input */}
                <div className="space-y-3">
                  <label className="text-xs font-heading font-bold text-neutral-700 uppercase tracking-wider flex items-center space-x-1.5">
                    <Key className="w-4 h-4 text-amber-500" />
                    <span>API Key Gemini</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="Dán API key của bạn vào đây..."
                      value={tempApiKey}
                      onChange={(e) => setTempApiKey(e.target.value)}
                      className="w-full py-3 px-4 pr-10 text-sm font-medium text-neutral-800 placeholder-neutral-400 bg-neutral-50 rounded-xl border-2 border-neutral-100 focus:border-amber-400 focus:bg-white focus:outline-none transition"
                    />
                    <Zap className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
                  </div>
                  <a
                    href="https://aistudio.google.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs text-amber-600 hover:text-amber-700 font-semibold transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Lấy API key miễn phí tại Google AI Studio →</span>
                  </a>
                  {!apiKey && (
                    <p className="text-[11px] text-red-500 font-semibold flex items-center space-x-1">
                      <span>⚠️</span>
                      <span>Bạn cần nhập API key để sử dụng tính năng AI. Không có key, app sẽ chạy chế độ mô phỏng offline.</span>
                    </p>
                  )}
                </div>

                {/* Teacher Password Input */}
                <div className="space-y-3 pt-4 border-t border-neutral-100">
                  <label className="text-xs font-heading font-bold text-neutral-700 uppercase tracking-wider flex items-center space-x-1.5">
                    <Lock className="w-4 h-4 text-indigo-500" />
                    <span>Mật mã bảo vệ Chế độ Giáo viên</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Mật mã mặc định là 1234..."
                      value={tempTeacherPassword}
                      onChange={(e) => setTempTeacherPassword(e.target.value)}
                      className="w-full py-3 px-4 pr-10 text-sm font-medium text-neutral-800 placeholder-neutral-400 bg-neutral-50 rounded-xl border-2 border-neutral-100 focus:border-amber-400 focus:bg-white focus:outline-none transition"
                    />
                    <Shield className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
                  </div>
                  <p className="text-[10px] text-neutral-400 font-medium">
                    Học sinh sẽ cần nhập mật mã này để vào tab Chế độ Giáo viên. Mặc định ban đầu là 1234.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 pb-6 flex items-center justify-between">
                {apiKey && (
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="px-4 py-2 text-xs text-neutral-500 hover:text-neutral-700 font-semibold transition cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                )}
                <button
                  onClick={handleSaveSettings}
                  className="ml-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl text-sm transition shadow-md hover:shadow-lg cursor-pointer flex items-center space-x-2"
                >
                  <Star className="w-4 h-4" />
                  <span>{apiKey ? 'Lưu cấu hình' : 'Bắt đầu sử dụng VietMaster 5'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== STUDENT PICKER MODAL WITH PIN ===== */}
      <AnimatePresence>
        {showStudentPicker && classInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-overlay"
            onClick={() => { setShowStudentPicker(false); setPickerStep('select'); setPinInput(''); setPinError(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md space-y-5 max-h-[80vh] overflow-y-auto"
            >
              {pickerStep === 'select' ? (
                /* Step 1: Choose name */
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-heading font-extrabold text-neutral-800">🎒 Em tên gì nhỉ?</h2>
                      <p className="text-xs text-neutral-500">{classInfo.className} • Chọn tên của em</p>
                    </div>
                    <button onClick={() => { setShowStudentPicker(false); setPickerStep('select'); }} className="p-2 hover:bg-neutral-100 rounded-xl transition cursor-pointer">
                      <X className="w-5 h-5 text-neutral-400" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {classInfo.students.map((student) => {
                      const isActive = currentStudent?.id === student.id;
                      return (
                        <button
                          key={student.id}
                          onClick={() => { setPickerStudent(student); setPickerStep('pin'); setPinInput(''); setPinError(false); }}
                          className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center space-x-2 ${
                            isActive 
                              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200' 
                              : 'bg-white hover:bg-neutral-50 border-neutral-200 hover:border-amber-200'
                          }`}
                        >
                          <span className="text-2xl">{student.avatar}</span>
                          <span className="text-xs font-bold text-neutral-800 truncate">{student.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                /* Step 2: Enter PIN */
                <>
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => { setPickerStep('select'); setPinInput(''); setPinError(false); }}
                      className="p-2 hover:bg-neutral-100 rounded-xl transition cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5 text-neutral-400" />
                    </button>
                    <div>
                      <h2 className="text-lg font-heading font-extrabold text-neutral-800">🔐 Nhập mã PIN</h2>
                      <p className="text-xs text-neutral-500">Xác nhận em là <strong>{pickerStudent?.name}</strong></p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center space-y-4 py-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-3xl">
                      {pickerStudent?.avatar}
                    </div>
                    <p className="text-sm font-heading font-bold text-neutral-800">{pickerStudent?.name}</p>
                    
                    <div className="relative w-48">
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={pinInput}
                        onChange={(e) => { setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4)); setPinError(false); }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && pinInput.length === 4 && pickerStudent) {
                            if (pinInput === pickerStudent.pin) {
                              handleSelectStudent(pickerStudent);
                              setPickerStep('select');
                              setPinInput('');
                            } else {
                              setPinError(true);
                            }
                          }
                        }}
                        placeholder="• • • •"
                        className={`w-full text-center text-2xl font-mono font-bold tracking-[0.5em] py-3 rounded-xl border-2 focus:outline-none transition ${
                          pinError ? 'border-red-400 bg-red-50 animate-wiggle' : 'border-neutral-200 focus:border-amber-400 bg-neutral-50 focus:bg-white'
                        }`}
                        autoFocus
                      />
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
                    </div>

                    {pinError && (
                      <p className="text-xs text-red-500 font-bold animate-bounce-in">❌ Sai mã PIN! Hỏi cô giáo để lấy mã nhé.</p>
                    )}
                    <p className="text-[10px] text-neutral-400">Nhập 4 số mã PIN cô giáo đã phát cho em</p>

                    <button
                      onClick={() => {
                        if (pickerStudent && pinInput === pickerStudent.pin) {
                          handleSelectStudent(pickerStudent);
                          setPickerStep('select');
                          setPinInput('');
                        } else {
                          setPinError(true);
                        }
                      }}
                      disabled={pinInput.length !== 4}
                      className="w-48 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl text-sm transition shadow-md cursor-pointer disabled:opacity-40 flex items-center justify-center space-x-2"
                    >
                      <span>Vào học thôi! 🚀</span>
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== TEACHER DASHBOARD PASSCODE UNLOCK MODAL ===== */}
      <AnimatePresence>
        {showTeacherUnlockModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-overlay"
            onClick={() => { setShowTeacherUnlockModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm space-y-5"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-sm font-heading font-extrabold text-neutral-800">👩‍🏫 Xác minh Giáo viên</h2>
                  <p className="text-[11px] text-neutral-500">Vui lòng nhập mật mã giáo viên</p>
                </div>
              </div>

              <div className="flex flex-col items-center space-y-4 py-2">
                <div className="relative w-full">
                  <input
                    type="password"
                    placeholder="Mật mã Giáo viên..."
                    value={teacherUnlockInput}
                    onChange={(e) => { setTeacherUnlockInput(e.target.value); setTeacherUnlockError(false); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (teacherUnlockInput === teacherPassword) {
                          setIsTeacherAuthenticated(true);
                          setActiveTab('teacher');
                          setShowTeacherUnlockModal(false);
                        } else {
                          setTeacherUnlockError(true);
                        }
                      }
                    }}
                    className={`w-full text-center text-lg font-bold py-2.5 rounded-xl border-2 focus:outline-none transition ${
                      teacherUnlockError ? 'border-red-400 bg-red-50' : 'border-neutral-200 focus:border-blue-400 bg-neutral-50 focus:bg-white'
                    }`}
                    autoFocus
                  />
                  <Shield className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
                </div>

                {teacherUnlockError && (
                  <p className="text-xs text-red-500 font-bold">❌ Mật mã chưa đúng! Hãy thử lại nhé.</p>
                )}
                <p className="text-[10px] text-neutral-400 text-center font-medium leading-relaxed">
                  * Mật mã mặc định là <strong className="text-neutral-600">1234</strong>. Bạn có thể thay đổi mật mã này trong phần Cấu hình hệ thống.
                </p>

                <div className="flex space-x-2 w-full pt-2">
                  <button
                    onClick={() => setShowTeacherUnlockModal(false)}
                    className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={() => {
                      if (teacherUnlockInput === teacherPassword) {
                        setIsTeacherAuthenticated(true);
                        setActiveTab('teacher');
                        setShowTeacherUnlockModal(false);
                      } else {
                        setTeacherUnlockError(true);
                      }
                    }}
                    className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold rounded-xl text-xs transition shadow-md cursor-pointer"
                  >
                    Xác nhận
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== NO CLASS SETUP PROMPT ===== */}
      {!classInfo && activeTab !== 'teacher' && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => {
              if (isTeacherAuthenticated || !classInfo) {
                setActiveTab('teacher');
              } else {
                setTeacherUnlockInput('');
                setTeacherUnlockError(false);
                setShowTeacherUnlockModal(true);
              }
            }}
            className="px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-2xl text-xs shadow-lg hover:shadow-xl transition cursor-pointer animate-pulse-soft flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thiết lập lớp học để bắt đầu!</span>
          </button>
        </div>
      )}
    </div>
  );
}
