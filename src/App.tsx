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
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState(() => {
    return sessionStorage.getItem('vm5_is_teacher') === 'true';
  });
  const [showTeacherUnlockModal, setShowTeacherUnlockModal] = useState(false);
  const [teacherUnlockInput, setTeacherUnlockInput] = useState('');
  const [teacherUnlockError, setTeacherUnlockError] = useState(false);

  // Unique teacher UUID for telemetry tracking
  const [teacherId, setTeacherId] = useState(() => {
    let tid = localStorage.getItem('vm5_teacher_id');
    if (!tid) {
      tid = `t_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
      localStorage.setItem('vm5_teacher_id', tid);
    }
    return tid;
  });

  // Admin authentication states
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem('vm5_is_admin') === 'true';
  });
  const [showAdminUnlockModal, setShowAdminUnlockModal] = useState(false);
  const [adminUnlockInput, setAdminUnlockInput] = useState('');
  const [adminUnlockError, setAdminUnlockError] = useState(false);
  const [adminStats, setAdminStats] = useState<any[]>([]);
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  // Telemetry: Ping backend to track teacher usage
  const trackTeacherUsage = async (cls: ClassInfo | null) => {
    try {
      const tid = localStorage.getItem('vm5_teacher_id') || teacherId;
      await fetch('/api/admin/track-use', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teacherId: tid,
          schoolName: cls?.schoolName || 'Chưa cập nhật',
          className: cls?.className || 'Chưa cập nhật',
          studentCount: cls?.students?.length || 0
        })
      });
    } catch (err) {
      console.error('Failed to send usage statistics:', err);
    }
  };

  // Telemetry: Fetch all statistics for Admin Dashboard
  const fetchAdminStats = async () => {
    setIsAdminLoading(true);
    try {
      const response = await fetch('/api/admin/stats', {
        headers: {
          'x-admin-key': 'admin9999'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAdminStats(data.stats || []);
      } else {
        console.error('Failed to fetch admin stats:', response.statusText);
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    } finally {
      setIsAdminLoading(false);
    }
  };

  // Auto-fetch admin stats when authenticated as admin
  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchAdminStats();
    }
  }, [isAdminAuthenticated]);

  // Show settings modal on first load if teacher is authenticated but has no API key
  useEffect(() => {
    if (isTeacherAuthenticated && !apiKey) {
      setShowSettingsModal(true);
    }
  }, [isTeacherAuthenticated]);

  // Auto-redirect unauthorized users away from teacher tab or disabled tabs
  useEffect(() => {
    if (activeTab === 'teacher') {
      if (!isTeacherAuthenticated && classInfo) {
        setActiveTab('syllabus');
      }
      return;
    }

    if (isTeacherAuthenticated || isAdminAuthenticated) return;

    const role = currentStudent ? 'student' : 'guest';
    const isAllowed = tabPermissions[activeTab]?.[role] !== false;
    if (!isAllowed) {
      const firstAllowed = tabs.find(tab => tabPermissions[tab.id]?.[role] !== false);
      if (firstAllowed) {
        setActiveTab(firstAllowed.id);
      }
    }
  }, [activeTab, isTeacherAuthenticated, isAdminAuthenticated, classInfo, currentStudent, tabPermissions]);

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

  const handleTeacherUnlockSubmit = () => {
    if (teacherUnlockInput === teacherPassword) {
      setIsTeacherAuthenticated(true);
      sessionStorage.setItem('vm5_is_teacher', 'true');
      trackTeacherUsage(classInfo);
      setActiveTab('teacher');
      setShowTeacherUnlockModal(false);
      setTeacherUnlockInput('');
      setTeacherUnlockError(false);
    } else {
      setTeacherUnlockError(true);
    }
  };

  const handleAdminUnlockSubmit = () => {
    if (adminUnlockInput === 'admin9999') {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('vm5_is_admin', 'true');
      setShowAdminUnlockModal(false);
      setAdminUnlockInput('');
      setAdminUnlockError(false);
    } else {
      setAdminUnlockError(true);
    }
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
    trackTeacherUsage(info);
  };

  const handleLogout = () => {
    setCurrentStudent(null);
    setIsTeacherAuthenticated(false);
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('vm5_is_teacher');
    sessionStorage.removeItem('vm5_is_admin');
    localStorage.removeItem('vm5_current_student');
    setActiveTab('syllabus');
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

  // Helper to render student picker modal
  const renderStudentPicker = () => {
    if (!classInfo) {
      return (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-overlay bg-black/40 backdrop-blur-xs"
          onClick={() => setShowStudentPicker(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md space-y-4 text-center"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-heading font-extrabold text-neutral-800">🎒 Chọn học sinh</h2>
              <button onClick={() => setShowStudentPicker(false)} className="p-2 hover:bg-neutral-100 rounded-xl transition cursor-pointer">
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>
            <div className="py-6 space-y-2">
              <span className="text-5xl block">🏫</span>
              <p className="text-sm font-bold text-neutral-700">Lớp học chưa được thiết lập</p>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Vui lòng báo cô giáo/thầy giáo đăng nhập bằng tài khoản Giáo viên để thiết lập danh sách lớp trước nhé!
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-overlay bg-black/40 backdrop-blur-xs"
        onClick={() => { setShowStudentPicker(false); setPickerStep('select'); setPinInput(''); setPinError(false); }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md space-y-5 max-h-[80vh] overflow-y-auto"
        >
          {pickerStep === 'select' ? (
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
              <div className="grid grid-cols-2 gap-2 max-h-[40vh] overflow-y-auto pr-1">
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
                  <p className="text-xs text-red-500 font-bold">❌ Sai mã PIN! Hỏi cô giáo để lấy mã nhé.</p>
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
        </div>
      </div>
    );
  };

  // Helper to render teacher unlock modal contents
  const renderTeacherUnlockModal = () => {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-overlay bg-black/40 backdrop-blur-xs"
        onClick={() => { setShowTeacherUnlockModal(false); }}
      >
        <div
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
                    handleTeacherUnlockSubmit();
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
              * Lưu ý: Đây là khu vực dành riêng cho Giáo viên để quản lý lớp học.
            </p>

            <div className="flex space-x-2 w-full pt-2">
              <button
                onClick={() => setShowTeacherUnlockModal(false)}
                className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleTeacherUnlockSubmit}
                className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold rounded-xl text-xs transition shadow-md cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Helper to render admin unlock modal contents
  const renderAdminUnlockModal = () => {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-overlay bg-black/40 backdrop-blur-xs"
        onClick={() => { setShowAdminUnlockModal(false); }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm space-y-5"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
              <Lock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-sm font-heading font-extrabold text-neutral-800">🔑 Xác minh Quản trị viên</h2>
              <p className="text-[11px] text-neutral-500">Nhập mật mã Admin để xem thống kê</p>
            </div>
          </div>

          <div className="flex flex-col items-center space-y-4 py-2">
            <div className="relative w-full">
              <input
                type="password"
                placeholder="Mật mã Admin..."
                value={adminUnlockInput}
                onChange={(e) => { setAdminUnlockInput(e.target.value); setAdminUnlockError(false); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAdminUnlockSubmit();
                  }
                }}
                className={`w-full text-center text-lg font-bold py-2.5 rounded-xl border-2 focus:outline-none transition ${
                  adminUnlockError ? 'border-red-400 bg-red-50' : 'border-neutral-200 focus:border-purple-400 bg-neutral-50 focus:bg-white'
                }`}
                autoFocus
              />
              <Shield className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
            </div>

            {adminUnlockError && (
              <p className="text-xs text-red-500 font-bold">❌ Mật mã Admin chưa đúng! Hãy thử lại nhé.</p>
            )}

            <div className="flex space-x-2 w-full pt-2">
              <button
                onClick={() => setShowAdminUnlockModal(false)}
                className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleAdminUnlockSubmit}
                className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-xl text-xs transition shadow-md cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Early return: Render Cổng Đăng Nhập (Login Portal) if not authenticated
  if (!currentStudent && !isTeacherAuthenticated && !isAdminAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-amber-50 via-orange-50/30 to-rose-50 font-body text-neutral-800 antialiased">
        <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 h-2 w-full" />
        
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-4xl mx-auto w-full">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-8 space-y-4"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 shadow-xl text-5xl mb-2 select-none">
              🦉
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 tracking-tight">
                VietMaster 5
              </h1>
              <p className="text-sm font-semibold text-neutral-500 uppercase tracking-widest mt-1">
                Cổng Học Tập & Dạy Học Tiếng Việt Lớp 5
              </p>
              <p className="text-xs text-neutral-400 max-w-md mx-auto mt-2 leading-relaxed">
                Hệ thống rèn luyện lập bản đồ ý tưởng, viết văn tự động với AI và đo lường sự tiến bộ dành riêng cho lớp 5.
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl px-2">
            <motion.div
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl border border-amber-100 shadow-lg hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between text-left relative overflow-hidden group"
              onClick={() => {
                setPickerStep('select');
                setShowStudentPicker(true);
              }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-100/50 to-transparent rounded-bl-full group-hover:scale-110 transition-transform" />
              <div className="space-y-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-3xl">
                  🎒
                </div>
                <div>
                  <h3 className="text-lg font-heading font-extrabold text-neutral-800 flex items-center space-x-1">
                    <span>Học sinh Đăng nhập</span>
                    <span className="text-amber-500 group-hover:translate-x-1 transition-transform">→</span>
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
                    Vào lớp học để phác thảo dàn ý, viết văn cùng Cú Văn thông thái, chơi trò chơi sắp đặt và xem portfolio của mình.
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-100 text-xs font-bold text-amber-600 flex items-center space-x-1">
                <span>Chọn tên & nhập mã PIN</span>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl border border-blue-100 shadow-lg hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between text-left relative overflow-hidden group"
              onClick={() => {
                setTeacherUnlockInput('');
                setTeacherUnlockError(false);
                setShowTeacherUnlockModal(true);
              }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-100/50 to-transparent rounded-bl-full group-hover:scale-110 transition-transform" />
              <div className="space-y-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-3xl">
                  👩‍🏫
                </div>
                <div>
                  <h3 className="text-lg font-heading font-extrabold text-neutral-800 flex items-center space-x-1">
                    <span>Giáo viên Đăng nhập</span>
                    <span className="text-blue-500 group-hover:translate-x-1 transition-transform">→</span>
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
                    Quản lý học sinh lớp học, chia nhóm học tập, giao nhiệm vụ viết văn, cấu hình quyền truy cập và xem báo cáo năng lực.
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-100 text-xs font-bold text-blue-600 flex items-center space-x-1">
                <span>Nhập mã bảo vệ giáo viên</span>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="py-6 border-t border-amber-100/40 text-center space-y-2">
          <p className="text-[10px] text-neutral-400 font-medium">
            © {new Date().getFullYear()} VietMaster 5 • Ms. Ngọc Mai
          </p>
          <button
            onClick={() => {
              setAdminUnlockInput('');
              setAdminUnlockError(false);
              setShowAdminUnlockModal(true);
            }}
            className="text-[11px] text-neutral-450 hover:text-amber-600 font-bold transition flex items-center space-x-1 mx-auto cursor-pointer border-none bg-transparent"
          >
            <span>Dành cho Quản trị viên 🔑</span>
          </button>
        </div>

        {showStudentPicker && renderStudentPicker()}
        {showTeacherUnlockModal && renderTeacherUnlockModal()}
        {showAdminUnlockModal && renderAdminUnlockModal()}

        <div className="absolute top-24 left-10 text-3xl opacity-[0.05] animate-float select-none pointer-events-none">🌸</div>
        <div className="absolute bottom-24 right-12 text-3xl opacity-[0.05] animate-float-slow select-none pointer-events-none">🍃</div>
      </div>
    );
  }

  // Early return: Render Bảng điều khiển Quản trị (Admin Dashboard) if authenticated as admin
  if (isAdminAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col font-body bg-neutral-50 text-neutral-800 antialiased">
        <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-3xl bg-white/20 p-2 rounded-2xl">🔑</span>
              <div>
                <h1 className="text-xl font-heading font-black">Bảng điều khiển Quản trị viên</h1>
                <p className="text-xs text-white/80 font-medium mt-0.5">Theo dõi hoạt động của hệ thống VietMaster 5</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 bg-white/20 hover:bg-white/30 text-white border border-white/20 py-2 px-4 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <span>Đăng xuất Cổng Admin 🚪</span>
            </button>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-6 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center text-2xl font-bold">👩‍🏫</div>
              <div>
                <p className="text-xs text-neutral-450 font-bold uppercase tracking-wider">Tổng Giáo viên</p>
                <h3 className="text-2xl font-heading font-black text-neutral-800">{adminStats.length}</h3>
              </div>
            </div>
            <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-6 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-bold">🎒</div>
              <div>
                <p className="text-xs text-neutral-450 font-bold uppercase tracking-wider">Tổng Học sinh quản lý</p>
                <h3 className="text-2xl font-heading font-black text-neutral-800">
                  {adminStats.reduce((acc, curr) => acc + (curr.studentCount || 0), 0)}
                </h3>
              </div>
            </div>
            <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-6 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl font-bold">📈</div>
              <div>
                <p className="text-xs text-neutral-450 font-bold uppercase tracking-wider">Tổng lượt hoạt động</p>
                <h3 className="text-2xl font-heading font-black text-neutral-800">
                  {adminStats.reduce((acc, curr) => acc + (curr.useCount || 0), 0)}
                </h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-neutral-100 shadow-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <h2 className="text-base font-heading font-extrabold text-neutral-800">Danh sách các Lớp & Trường học đang sử dụng</h2>
                <p className="text-xs text-neutral-500 mt-0.5">Thống kê dữ liệu hoạt động tự động gửi từ trình duyệt của Giáo viên.</p>
              </div>
              <button
                onClick={fetchAdminStats}
                disabled={isAdminLoading}
                className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl text-xs transition cursor-pointer flex items-center space-x-2"
              >
                <span>{isAdminLoading ? 'Đang tải...' : 'Làm mới ↻'}</span>
              </button>
            </div>

            {isAdminLoading ? (
              <div className="text-center py-12 text-neutral-450">
                <p className="text-xs">Đang tải dữ liệu thống kê...</p>
              </div>
            ) : adminStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-neutral-700">
                  <thead className="text-[10px] uppercase font-bold text-neutral-450 bg-neutral-50/70 border-b border-neutral-250/50">
                    <tr>
                      <th className="p-4">STT</th>
                      <th className="p-4">Trường học</th>
                      <th className="p-4">Lớp học</th>
                      <th className="p-4 text-center">Sĩ số</th>
                      <th className="p-4 text-center">Số lượt hoạt động</th>
                      <th className="p-4">Hoạt động cuối</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {adminStats.map((record, index) => (
                      <tr key={record.teacherId} className="hover:bg-neutral-50/50 transition">
                        <td className="p-4 font-bold text-neutral-450">{index + 1}</td>
                        <td className="p-4 font-extrabold text-neutral-800">{record.schoolName || 'Chưa cập nhật'}</td>
                        <td className="p-4 font-bold text-indigo-600">{record.className || 'Chưa cập nhật'}</td>
                        <td className="p-4 text-center font-bold">{record.studentCount || 0} em</td>
                        <td className="p-4 text-center font-bold text-emerald-600">{record.useCount || 0} lần</td>
                        <td className="p-4 text-neutral-500 font-medium">
                          {record.lastActive ? new Date(record.lastActive).toLocaleString('vi-VN') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-neutral-400">
                <span className="text-4xl block mb-2">📊</span>
                <p className="text-xs">Chưa có dữ liệu thống kê giáo viên nào.</p>
              </div>
            )}
          </div>
        </main>

        <footer className="py-6 border-t border-neutral-200/50 text-center text-xs text-neutral-400 font-medium mt-auto">
          © {new Date().getFullYear()} VietMaster 5 • Hệ thống Quản trị Bảo mật
        </footer>
      </div>
    );
  }

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

            {/* Right side: Active Role & Logout */}
            <div className="flex items-center space-x-3">
              {/* Active Role Indicator */}
              {isTeacherAuthenticated ? (
                <div className="flex items-center space-x-1.5 bg-white/20 backdrop-blur-sm border border-white/30 py-1.5 px-3 rounded-xl text-white">
                  <span className="text-xs font-black">👩‍🏫 Giáo viên</span>
                </div>
              ) : currentStudent ? (
                <button
                  onClick={() => {
                    setPickerStep('select');
                    setShowStudentPicker(true);
                  }}
                  className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm border border-white/30 py-1.5 px-3 rounded-xl hover:bg-white/30 transition cursor-pointer"
                >
                  <span className="text-sm">{currentStudent.avatar}</span>
                  <span className="text-xs font-bold text-white">{currentStudent.name}</span>
                  <span className="text-[10px] text-white/70">▾</span>
                </button>
              ) : null}

              {/* Logout / Switch Role Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1.5 bg-white/20 hover:bg-white text-white hover:text-rose-600 border border-white/30 hover:border-transparent py-1.5 px-3 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                title="Đổi vai trò / Đăng xuất"
              >
                <span>Đổi vai trò 🚪</span>
              </button>
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
              {isTeacherAuthenticated && (
                <span className="w-px bg-neutral-200/80 self-stretch my-1.5 mx-1" />
              )}

              {/* Teacher tab - separated */}
              {isTeacherAuthenticated && (
                <motion.button
                  onClick={() => {
                    setActiveTab('teacher');
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
                  <span>👩‍🏫 Chế độ Giáo viên</span>
                </motion.button>
              )}
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
                isTeacher={isTeacherAuthenticated}
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
                onViewStudentPortfolio={(student) => {
                  setCurrentStudent(student);
                  localStorage.setItem('vm5_current_student', student.id);
                  const saved = localStorage.getItem(`vm5_submissions_${student.id}`);
                  setCustomSavedOutlines(saved ? JSON.parse(saved) : []);
                  setActiveTab('portfolio');
                }}
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
                      placeholder="Nhập mật mã bảo vệ mới..."
                      value={tempTeacherPassword}
                      onChange={(e) => setTempTeacherPassword(e.target.value)}
                      className="w-full py-3 px-4 pr-10 text-sm font-medium text-neutral-800 placeholder-neutral-400 bg-neutral-50 rounded-xl border-2 border-neutral-100 focus:border-amber-400 focus:bg-white focus:outline-none transition"
                    />
                    <Shield className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
                  </div>
                  <p className="text-[10px] text-neutral-400 font-medium">
                    Thiết lập mật mã riêng của Giáo viên để hạn chế học sinh tự ý truy cập các nội dung quản lý lớp học.
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
        {showStudentPicker && renderStudentPicker()}
      </AnimatePresence>

      {/* ===== TEACHER DASHBOARD PASSCODE UNLOCK MODAL ===== */}
      <AnimatePresence>
        {showTeacherUnlockModal && renderTeacherUnlockModal()}
      </AnimatePresence>

      {/* ===== ADMIN UNLOCK MODAL ===== */}
      <AnimatePresence>
        {showAdminUnlockModal && renderAdminUnlockModal()}
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
