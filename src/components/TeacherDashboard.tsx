import React, { useState } from 'react';
import { ClassInfo, StudentEntry, StudentGroup, GroupAssignment } from '../types';
import { 
  Users, Award, AlertTriangle, CheckCircle, BarChart, 
  BookOpen, ChevronRight, Star, HelpCircle, FileText, Printer, Mail,
  Settings, Key, UserPlus, Trash2, Save, Edit3, X, Eye, EyeOff, Lock,
  Layers, Plus, Clock, Target, CheckCircle2, Calendar, ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SYLLABUS_DATA } from '../data/syllabus';

// Emoji avatars for students
const AVATAR_OPTIONS = ['🎒', '⚽', '🎨', '🌸', '🤖', '🦋', '🎵', '🌟', '🐶', '🐱', '🦁', '🐻', '🎯', '📚', '✈️', '🚀'];

interface TeacherDashboardProps {
  apiKey: string;
  selectedModel: string;
  onOpenSettings: () => void;
  classInfo: ClassInfo | null;
  onSaveClass: (info: ClassInfo) => void;
  tabPermissions: Record<string, { student: boolean; guest: boolean }>;
  onUpdatePermissions: (newPermissions: Record<string, { student: boolean; guest: boolean }>) => void;
  onViewStudentPortfolio?: (student: StudentEntry) => void;
  teacherId: string;
  onUpdateTeacherId?: (newTeacherId: string) => void;
}

export default function TeacherDashboard({ 
  apiKey, 
  selectedModel, 
  onOpenSettings, 
  classInfo, 
  onSaveClass,
  tabPermissions,
  onUpdatePermissions,
  onViewStudentPortfolio,
  teacherId,
  onUpdateTeacherId
}: TeacherDashboardProps) {
  // Class setup state
  const [isEditing, setIsEditing] = useState(!classInfo);
  const [className, setClassName] = useState(classInfo?.className || '');
  const [schoolName, setSchoolName] = useState(classInfo?.schoolName || '');
  const [studentNames, setStudentNames] = useState(
    classInfo?.students.map(s => s.name).join('\n') || ''
  );
  
  // Excel / CSV File upload and parsing state
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [excelSuccessMsg, setExcelSuccessMsg] = useState<string | null>(null);

  // Student detail view
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [reportSuccessMsg, setReportSuccessMsg] = useState<string | null>(null);
  const [showPins, setShowPins] = useState(false);

  // Tab permissions toast
  const [showPermissionsToast, setShowPermissionsToast] = useState(false);
  const showSaveToast = () => {
    setShowPermissionsToast(true);
    setTimeout(() => setShowPermissionsToast(false), 2500);
  };

  // Group state
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupEmoji, setNewGroupEmoji] = useState('🦊');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);
  
  // Assignment state
  const [assignGroupId, setAssignGroupId] = useState('');
  const [assignTitle, setAssignTitle] = useState('');
  const [assignGenre, setAssignGenre] = useState('');
  const [assignTopic, setAssignTopic] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');

  const GROUP_EMOJIS = ['🦊', '🦁', '🦉', '🐼', '🐨', '🐝', '🦕', '🐙', '🦄', '🌟', '🎨', '🚀'];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        const names = text.split(/\r?\n/)
          .map(line => line.trim())
          .filter(line => line.length > 0 && !line.toLowerCase().includes('họ và tên') && !line.toLowerCase().includes('họ tên') && !line.toLowerCase().includes('danh sách') && !line.toLowerCase().includes('stt'));
        
        if (names.length > 0) {
          setStudentNames(prev => {
            const current = prev.trim();
            return current ? `${current}\n${names.join('\n')}` : names.join('\n');
          });
          setExcelSuccessMsg(`Đã nhập thành công ${names.length} học sinh từ file text/CSV!`);
          setTimeout(() => setExcelSuccessMsg(null), 4000);
        } else {
          alert('Không tìm thấy danh sách học sinh trong file.');
        }
      };
      reader.readAsText(file, 'UTF-8');
      e.target.value = '';
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      setIsParsingExcel(true);
      try {
        const XLSX = await new Promise<any>((resolve, reject) => {
          if ((window as any).XLSX) {
            resolve((window as any).XLSX);
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
          script.onload = () => resolve((window as any).XLSX);
          script.onerror = (err) => reject(err);
          document.head.appendChild(script);
        });

        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const data = new Uint8Array(evt.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
            
            const names: string[] = [];
            let nameColIdx = 0;
            
            for (let r = 0; r < Math.min(rows.length, 10); r++) {
              const row = rows[r];
              if (!row) continue;
              let found = false;
              for (let c = 0; c < row.length; c++) {
                const val = String(row[c]).toLowerCase().trim();
                if (val.includes('họ và tên') || val === 'họ tên' || val === 'tên học sinh' || val === 'tên' || val === 'name' || val === 'student name') {
                  nameColIdx = c;
                  found = true;
                  break;
                }
              }
              if (found) break;
            }
            
            for (let i = 0; i < rows.length; i++) {
              const row = rows[i];
              if (!row) continue;
              const cellVal = row[nameColIdx];
              if (cellVal) {
                const nameStr = String(cellVal).trim();
                const lower = nameStr.toLowerCase();
                if (
                  lower.length > 0 &&
                  !lower.includes('họ và tên') &&
                  lower !== 'họ tên' &&
                  lower !== 'tên' &&
                  lower !== 'tên học sinh' &&
                  lower !== 'name' &&
                  lower !== 'student name' &&
                  !lower.includes('danh sách') &&
                  !lower.includes('stt') &&
                  isNaN(Number(nameStr))
                ) {
                  names.push(nameStr);
                }
              }
            }
            
            if (names.length > 0) {
              setStudentNames(prev => {
                const current = prev.trim();
                return current ? `${current}\n${names.join('\n')}` : names.join('\n');
              });
              setExcelSuccessMsg(`Đã nhập thành công ${names.length} học sinh từ file Excel!`);
              setTimeout(() => setExcelSuccessMsg(null), 4000);
            } else {
              alert('Không tìm thấy danh sách học sinh hợp lệ trong file Excel. Vui lòng kiểm tra lại cột tên.');
            }
          } catch (err) {
            console.error(err);
            alert('Lỗi đọc nội dung file Excel.');
          } finally {
            setIsParsingExcel(false);
          }
        };
        reader.readAsArrayBuffer(file);
      } catch (err) {
        console.error(err);
        alert('Không thể tải bộ thư viện đọc Excel từ CDN. Vui lòng kiểm tra kết nối mạng.');
        setIsParsingExcel(false);
      }
      e.target.value = '';
    } else {
      alert('Định dạng file không được hỗ trợ. Vui lòng tải file .txt, .csv, .xls hoặc .xlsx');
      e.target.value = '';
    }
  };

  const handleSaveClass = () => {
    if (!className.trim()) return;
    const names = studentNames.split('\n').map(n => n.trim()).filter(n => n.length > 0);
    const existingStudents = classInfo?.students || [];
    
    const students: StudentEntry[] = names.map((name, idx) => {
      // Keep existing student's ID, avatar, and PIN if name matches
      const existing = existingStudents.find(s => s.name === name);
      return existing || {
        id: `student_${Date.now()}_${idx}`,
        name,
        avatar: AVATAR_OPTIONS[idx % AVATAR_OPTIONS.length],
        pin: String(Math.floor(1000 + Math.random() * 9000)), // Auto 4-digit PIN
      };
    });

    const info: ClassInfo = {
      className: className.trim(),
      schoolName: schoolName.trim(),
      students,
      groups: classInfo?.groups || [],
      assignments: classInfo?.assignments || [],
      createdAt: classInfo?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSaveClass(info);
    setIsEditing(false);
  };

  const handleSendToParent = (name: string) => {
    setReportSuccessMsg(`Đã gửi thư báo cáo năng lực của em ${name} tới phụ huynh thành công!`);
    setTimeout(() => setReportSuccessMsg(null), 5000);
  };

  const handleCreateGroup = () => {
    if (!classInfo || !newGroupName.trim() || selectedGroupMembers.length === 0) return;
    
    const newGroup: StudentGroup = {
      id: `group_${Date.now()}`,
      name: newGroupName.trim(),
      emoji: newGroupEmoji,
      studentIds: selectedGroupMembers,
    };
    
    const updatedGroups = [...(classInfo.groups || []), newGroup];
    const updatedClassInfo: ClassInfo = {
      ...classInfo,
      groups: updatedGroups,
      updatedAt: new Date().toISOString(),
    };
    onSaveClass(updatedClassInfo);
    
    // Reset form
    setNewGroupName('');
    setNewGroupEmoji('🦊');
    setSelectedGroupMembers([]);
  };

  const handleDeleteGroup = (groupId: string) => {
    if (!classInfo) return;
    
    // Also delete any assignments linked to this group
    const updatedGroups = (classInfo.groups || []).filter(g => g.id !== groupId);
    const updatedAssignments = (classInfo.assignments || []).filter(a => a.groupId !== groupId);
    
    const updatedClassInfo: ClassInfo = {
      ...classInfo,
      groups: updatedGroups,
      assignments: updatedAssignments,
      updatedAt: new Date().toISOString(),
    };
    
    onSaveClass(updatedClassInfo);
  };

  const handleCreateAssignment = () => {
    if (!classInfo || !assignGroupId || !assignTitle.trim() || !assignGenre || !assignTopic.trim()) return;
    
    const newAssignment: GroupAssignment = {
      id: `assign_${Date.now()}`,
      groupId: assignGroupId,
      title: assignTitle.trim(),
      genreId: assignGenre,
      topic: assignTopic.trim(),
      description: assignDesc.trim(),
      dueDate: assignDueDate || undefined,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    
    const updatedAssignments = [...(classInfo.assignments || []), newAssignment];
    const updatedClassInfo: ClassInfo = {
      ...classInfo,
      assignments: updatedAssignments,
      updatedAt: new Date().toISOString(),
    };
    onSaveClass(updatedClassInfo);
    
    // Reset form
    setAssignTitle('');
    setAssignTopic('');
    setAssignDesc('');
    setAssignDueDate('');
  };

  const handleToggleAssignmentStatus = (assignmentId: string) => {
    if (!classInfo) return;
    
    const updatedAssignments = (classInfo.assignments || []).map(a => 
      a.id === assignmentId 
        ? { ...a, status: (a.status === 'active' ? 'completed' : 'active') as 'active' | 'completed' }
        : a
    );
    
    const updatedClassInfo: ClassInfo = {
      ...classInfo,
      assignments: updatedAssignments,
      updatedAt: new Date().toISOString(),
    };
    onSaveClass(updatedClassInfo);
  };

  const handleDeleteAssignment = (assignmentId: string) => {
    if (!classInfo) return;
    
    const updatedAssignments = (classInfo.assignments || []).filter(a => a.id !== assignmentId);
    
    const updatedClassInfo: ClassInfo = {
      ...classInfo,
      assignments: updatedAssignments,
      updatedAt: new Date().toISOString(),
    };
    onSaveClass(updatedClassInfo);
  };

  // Get student submissions from localStorage
  const getStudentSubmissions = (studentId: string) => {
    const saved = localStorage.getItem(`vm5_submissions_${studentId}`);
    return saved ? JSON.parse(saved) : [];
  };

  const selectedStudent = classInfo?.students.find(s => s.id === selectedStudentId) || null;
  const selectedSubmissions = selectedStudent ? getStudentSubmissions(selectedStudent.id) : [];
  const selectedAvgScore = selectedSubmissions.length > 0 
    ? Math.round(selectedSubmissions.reduce((acc: number, s: any) => acc + (s.gradeAfter?.score || s.gradeBefore?.score || 0), 0) / selectedSubmissions.length)
    : 0;

  // Class-wide stats
  const allStudentStats = classInfo?.students.map(s => {
    const subs = getStudentSubmissions(s.id);
    const scores = subs.map((sub: any) => sub.gradeAfter?.score || sub.gradeBefore?.score || 0).filter((sc: number) => sc > 0);
    const avg = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
    return { ...s, submissions: subs, avgScore: avg, count: subs.length };
  }) || [];

  const classAvg = allStudentStats.length > 0 && allStudentStats.some(s => s.count > 0)
    ? Math.round(allStudentStats.filter(s => s.count > 0).reduce((acc, s) => acc + s.avgScore, 0) / allStudentStats.filter(s => s.count > 0).length)
    : 0;
  const totalSubmissions = allStudentStats.reduce((acc, s) => acc + s.count, 0);

  return (
    <div className="space-y-6 p-1 md:p-4">
      {/* ===== CLASS SETUP / EDIT ===== */}
      {isEditing ? (
        <div className="max-w-2xl mx-auto w-full space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl border border-amber-100/50 shadow-sm p-6 space-y-5"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-2xl">🏫</div>
              <div>
                <h2 className="text-lg font-heading font-extrabold text-neutral-800">
                  {classInfo ? 'Chỉnh sửa lớp học' : 'Thiết lập lớp học'}
                </h2>
                <p className="text-xs text-neutral-500">Nhập thông tin lớp và danh sách học sinh để bắt đầu quản lý</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">📝 Tên lớp <span className="text-red-400">*</span></label>
                <input
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="VD: 5A22"
                  className="w-full py-2.5 px-4 text-sm rounded-xl border border-neutral-200 focus:border-amber-400 focus:outline-none bg-neutral-50 focus:bg-white transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">🏫 Trường</label>
                <input
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="VD: Vinschool Central Park"
                  className="w-full py-2.5 px-4 text-sm rounded-xl border border-neutral-200 focus:border-amber-400 focus:outline-none bg-neutral-50 focus:bg-white transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-neutral-700">👥 Danh sách học sinh <span className="text-neutral-400">(mỗi em 1 dòng)</span></label>
                
                {/* Excel / Text Uploader */}
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    id="excel-upload-input"
                    accept=".xlsx,.xls,.csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="excel-upload-input"
                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-bold rounded-xl transition cursor-pointer select-none"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-700" />
                    <span>{isParsingExcel ? 'Đang đọc file...' : 'Nhập từ file Excel/CSV/TXT 📁'}</span>
                  </label>
                </div>
              </div>

              {excelSuccessMsg && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl font-medium flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{excelSuccessMsg}</span>
                </div>
              )}

              <textarea
                value={studentNames}
                onChange={(e) => setStudentNames(e.target.value)}
                placeholder={"Nguyễn Văn A\nTrần Thị B\nLê Văn C\n..."}
                rows={8}
                className="w-full py-3 px-4 text-sm rounded-xl border border-neutral-200 focus:border-amber-400 focus:outline-none bg-neutral-50 focus:bg-white transition font-mono leading-relaxed resize-none"
              />
              <p className="text-[10px] text-neutral-400">
                {studentNames.split('\n').filter(n => n.trim()).length} học sinh đã nhập
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleSaveClass}
                disabled={!className.trim()}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl text-sm transition shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Lưu lớp học</span>
              </button>
              {classInfo && (
                <button
                  onClick={() => setIsEditing(false)}
                  className="py-3 px-6 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-sm transition cursor-pointer"
                >
                  Hủy
                </button>
              )}
            </div>
          </motion.div>

          {/* ===== ACCESS CONTROL CONFIGURATION (Also visible in Class Setup/Edit) ===== */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-purple-100/30 shadow-sm p-6 space-y-4">
            <div className="flex items-center space-x-3 border-b border-neutral-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                <Lock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-heading font-extrabold text-neutral-800">🔒 Cấu hình quyền truy cập thanh công cụ</h3>
                <p className="text-[11px] text-neutral-500">Thiết lập linh hoạt những mục hiển thị cho Học sinh và Khách</p>
              </div>
            </div>

            {/* List of tabs and their permissions */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-neutral-700 min-w-[400px]">
                <thead className="text-[10px] uppercase font-bold text-neutral-400 bg-neutral-50/70 border-b border-neutral-200/50">
                  <tr>
                    <th className="p-3">Mục thanh công cụ</th>
                    <th className="p-3 text-center">Học sinh (Đã đăng nhập)</th>
                    <th className="p-3 text-center">Khách (Chưa đăng nhập)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {[
                    { id: 'syllabus', label: '📚 Thư viện dạng bài', desc: 'Thư viện lý thuyết, đề gợi ý và các quy tắc viết văn AI' },
                    { id: 'helper', label: '💡 Dàn ý thông minh AI', desc: 'Không gian phác thảo dàn ý và chấm điểm/so sánh bằng AI' },
                    { id: 'game', label: '🎮 Trò chơi sắp đặt', desc: 'Trò chơi kéo thả sắp xếp bố cục câu chuyện' },
                    { id: 'detective', label: '🕵️ Thám tử bắt lỗi', desc: 'Trò chơi tìm lỗi văn bản và đối chiếu kết quả' },
                    { id: 'portfolio', label: '🏆 Portfolio Tiến Bộ', desc: 'Hồ sơ năng lực học tập và bài viết mẫu đã lưu' },
                  ].map((tabItem) => {
                    const perm = tabPermissions[tabItem.id] || { student: true, guest: true };
                    return (
                      <tr key={tabItem.id} className="hover:bg-neutral-50/50 transition">
                        <td className="p-3">
                          <span className="font-bold text-neutral-800 block">{tabItem.label}</span>
                          <span className="text-[10px] text-neutral-400 font-medium block mt-0.5">{tabItem.desc}</span>
                        </td>
                        <td className="p-3 text-center">
                          <label className="inline-flex items-center justify-center cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={perm.student}
                              onChange={(e) => {
                                const updated = {
                                  ...tabPermissions,
                                  [tabItem.id]: { ...perm, student: e.target.checked }
                                };
                                onUpdatePermissions(updated);
                                showSaveToast();
                              }}
                              className="w-4.5 h-4.5 rounded border-neutral-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                            />
                          </label>
                        </td>
                        <td className="p-3 text-center">
                          <label className="inline-flex items-center justify-center cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={perm.guest}
                              onChange={(e) => {
                                const updated = {
                                  ...tabPermissions,
                                  [tabItem.id]: { ...perm, guest: e.target.checked }
                                };
                                onUpdatePermissions(updated);
                                showSaveToast();
                              }}
                              className="w-4.5 h-4.5 rounded border-neutral-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                            />
                          </label>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Save indicator toast message */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
              <p className="text-[10px] text-neutral-400 font-medium">
                * Lưu ý: Giáo viên luôn có toàn quyền xem toàn bộ các mục trên.
              </p>
              <AnimatePresence>
                {showPermissionsToast && (
                  <motion.span
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-[10px] font-bold text-emerald-600 flex items-center space-x-1"
                  >
                    <span>✓ Tự động lưu cấu hình thành công!</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ===== SYSTEM SETTINGS (Also visible in Class Setup/Edit) ===== */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-blue-100/30 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-800">⚙️ Cài đặt hệ thống AI</h3>
                  <p className="text-[11px] text-neutral-500">Quản lý API Key và Model AI cho ứng dụng</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenSettings}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl text-xs transition shadow-md hover:shadow-lg cursor-pointer flex items-center space-x-2"
              >
                <Key className="w-4 h-4" />
                <span>Cấu hình API Key & Model</span>
              </button>
            </div>
            {/* Current status */}
            <div className="flex items-center space-x-4 pt-2 border-t border-neutral-100">
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${apiKey ? 'bg-emerald-400' : 'bg-red-400'}`} />
                <span className="text-xs text-neutral-600">
                  {apiKey ? 'API Key đã cấu hình ✓' : '⚠️ Chưa có API Key — đang chạy chế độ mô phỏng'}
                </span>
              </div>
              <span className="text-xs text-neutral-400">|</span>
              <span className="text-xs text-neutral-500">Model: <span className="font-semibold text-neutral-700">{selectedModel}</span></span>
            </div>
          </div>
        </div>
      ) : classInfo ? (
        /* ===== CLASS DASHBOARD ===== */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar: Class stats */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-blue-100/30 shadow-sm space-y-4">
              <div className="flex items-center justify-between text-neutral-800 border-b border-neutral-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-amber-600" />
                  <h3 className="font-extrabold text-sm uppercase tracking-wide">{classInfo.className}</h3>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 hover:bg-neutral-100 rounded-lg transition cursor-pointer"
                  title="Chỉnh sửa lớp"
                >
                  <Edit3 className="w-4 h-4 text-neutral-400" />
                </button>
              </div>
              {classInfo.schoolName && (
                <p className="text-[10px] text-neutral-400 font-medium -mt-2">🏫 {classInfo.schoolName}</p>
              )}

              <div className="space-y-3">
                <div className="flex justify-between items-center bg-neutral-50 p-2.5 rounded-xl border border-neutral-100">
                  <span className="text-xs text-neutral-500 font-semibold">Tổng số học sinh:</span>
                  <span className="text-sm font-black text-neutral-800">{classInfo.students.length} em</span>
                </div>
                <div className="flex justify-between items-center bg-neutral-50 p-2.5 rounded-xl border border-neutral-100">
                  <span className="text-xs text-neutral-500 font-semibold">Điểm TB lớp:</span>
                  <span className="text-sm font-black text-amber-700">{classAvg > 0 ? `${classAvg}/100đ` : 'Chưa có'}</span>
                </div>
                <div className="flex justify-between items-center bg-neutral-50 p-2.5 rounded-xl border border-neutral-100">
                  <span className="text-xs text-neutral-500 font-semibold">Tổng bài luyện tập:</span>
                  <span className="text-sm font-black text-emerald-600">{totalSubmissions} bài</span>
                </div>
              </div>
            </div>

            {/* PIN List for teacher */}
            <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-blue-100/30 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-amber-600" />
                  <h4 className="font-extrabold text-xs text-neutral-800 uppercase tracking-wide">Mã PIN học sinh</h4>
                </div>
                <button
                  onClick={() => setShowPins(!showPins)}
                  className="p-1.5 hover:bg-neutral-100 rounded-lg transition cursor-pointer"
                  title={showPins ? 'Ẩn mã PIN' : 'Xem mã PIN'}
                >
                  {showPins ? <EyeOff className="w-4 h-4 text-neutral-400" /> : <Eye className="w-4 h-4 text-neutral-400" />}
                </button>
              </div>
              <p className="text-[10px] text-neutral-400">Đưa mã PIN cho từng em để xác nhận danh tính khi vào app.</p>
              {showPins && (
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto custom-scrollbar">
                  {classInfo.students.map((s) => (
                    <div key={s.id} className="flex items-center justify-between bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-100">
                      <div className="flex items-center space-x-2">
                        <span className="text-base">{s.avatar}</span>
                        <span className="text-[11px] font-semibold text-neutral-700 truncate max-w-[100px]">{s.name}</span>
                      </div>
                      <span className="text-sm font-mono font-black text-amber-600 tracking-widest">{s.pin}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Center: Student roster table */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-blue-100/30 shadow-sm p-6 space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-neutral-800">Bảng theo sát năng lực từng học sinh</h3>
                <p className="text-xs text-neutral-500 mt-1">Dữ liệu thực từ các lần luyện tập của học trò trên app.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-neutral-700 min-w-[450px]">
                  <thead className="text-[10px] uppercase font-bold text-neutral-400 bg-neutral-50/70 border-b border-neutral-200/50">
                    <tr>
                      <th className="p-3">Học sinh</th>
                      <th className="p-3">Điểm TB</th>
                      <th className="p-3">Số bài</th>
                      <th className="p-3">Trạng thái</th>
                      <th className="p-3">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {allStudentStats.map((student) => {
                      const isSelected = selectedStudentId === student.id;
                      return (
                        <tr 
                          key={student.id}
                          onClick={() => setSelectedStudentId(student.id)}
                          className={`hover:bg-neutral-50/50 transition cursor-pointer ${
                            isSelected ? 'bg-amber-50/40 text-amber-900' : ''
                          }`}
                        >
                          <td className="p-3 flex items-center space-x-2 font-bold">
                            <span className="text-xl">{student.avatar}</span>
                            <span>{student.name}</span>
                          </td>
                          <td className="p-3">
                            {student.avgScore > 0 ? (
                              <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                                student.avgScore >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {student.avgScore}đ
                              </span>
                            ) : (
                              <span className="text-neutral-400 text-[10px]">—</span>
                            )}
                          </td>
                          <td className="p-3 font-semibold text-neutral-600">{student.count > 0 ? `${student.count} bài` : '—'}</td>
                          <td className="p-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              student.count >= 3 ? 'bg-emerald-100 text-emerald-700' :
                              student.count > 0 ? 'bg-amber-100 text-amber-700' :
                              'bg-neutral-100 text-neutral-500'
                            }`}>
                              {student.count >= 3 ? 'Tích cực' : student.count > 0 ? 'Đang luyện' : 'Chưa bắt đầu'}
                            </span>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedStudentId(student.id); }}
                              className="px-2.5 py-1 bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-600 hover:text-neutral-900 rounded-lg text-[10px] font-bold transition select-none cursor-pointer"
                            >
                              Xem chi tiết 🔎
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected student detail */}
            <AnimatePresence mode="wait">
              {selectedStudent && (
                <motion.div
                  key={selectedStudent.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl border border-blue-100/30 shadow-sm p-6 space-y-5"
                >
                  <div className="flex flex-col sm:flex-row items-center justify-between border-b border-neutral-100 pb-3 gap-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl bg-neutral-100 p-2 rounded-xl">{selectedStudent.avatar}</span>
                      <div>
                        <h4 className="text-sm font-extrabold text-neutral-800">{selectedStudent.name}</h4>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Điểm TB: <strong className="text-amber-600">{selectedAvgScore > 0 ? `${selectedAvgScore}/100đ` : 'Chưa có'}</strong> • {selectedSubmissions.length} bài luyện tập
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end">
                      <button
                        onClick={() => handleSendToParent(selectedStudent.name)}
                        className="flex items-center space-x-1 px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl text-xs transition shadow-md cursor-pointer"
                      >
                        <Mail className="w-4 h-4" />
                        <span>Gửi thư phụ huynh 📧</span>
                      </button>
                      <button
                        onClick={() => onViewStudentPortfolio?.(selectedStudent)}
                        className="flex items-center space-x-1 px-3 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-xl text-xs transition shadow-md cursor-pointer"
                      >
                        <Award className="w-4 h-4" />
                        <span>Xem Portfolio 🏆</span>
                      </button>
                    </div>
                  </div>

                  {reportSuccessMsg && (
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-900 font-extrabold text-xs">✓ {reportSuccessMsg}</div>
                  )}

                  {selectedSubmissions.length > 0 ? (
                    <div className="space-y-2">
                      <h5 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Lịch sử luyện tập</h5>
                      {selectedSubmissions.map((sub: any, idx: number) => (
                        <div key={idx} className="p-3 bg-neutral-50/70 rounded-xl border border-neutral-100 flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-xs font-bold text-neutral-800">{sub.topic}</p>
                            <p className="text-[10px] text-neutral-400">{new Date(sub.createdAt).toLocaleDateString('vi-VN')}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            {sub.gradeBefore && (
                              <span className="text-[10px] font-bold text-neutral-500">V1: {sub.gradeBefore.score}đ</span>
                            )}
                            {sub.gradeAfter && (
                              <span className="text-[10px] font-bold text-emerald-600">V2: {sub.gradeAfter.score}đ</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-neutral-400">
                      <span className="text-3xl block mb-2">📝</span>
                      <p className="text-xs">Em {selectedStudent.name} chưa có bài luyện tập nào.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ===== GROUPS & ASSIGNMENTS ===== */}
          <div className="lg:col-span-4 bg-white/90 backdrop-blur-sm rounded-2xl border border-blue-100/30 shadow-sm p-6 space-y-6">
            <div className="flex items-center space-x-3 border-b border-neutral-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                <Layers className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-heading font-extrabold text-neutral-800">👥 Quản lý nhóm & Nhiệm vụ luyện viết</h3>
                <p className="text-[11px] text-neutral-500">Chia nhóm học tập và giao nhiệm vụ luyện viết dàn ý theo chủ đề</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* COLUMN 1: GROUP MANAGEMENT */}
              <div className="space-y-6">
                <div className="bg-neutral-50/50 p-4 rounded-xl border border-neutral-200/60 space-y-4">
                  <h4 className="text-xs font-bold text-neutral-800 flex items-center space-x-1.5">
                    <Plus className="w-3.5 h-3.5 text-amber-600" />
                    <span>Tạo nhóm học sinh mới</span>
                  </h4>
                  
                  {/* Group Name & Emoji */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500">Tên nhóm</label>
                      <input
                        type="text"
                        placeholder="VD: Nhóm Chim Sẻ"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="w-full py-1.5 px-3 text-xs rounded-lg border border-neutral-200 focus:border-amber-400 focus:outline-none bg-white transition"
                      />
                    </div>
                    <div className="col-span-1 space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500">Emoji</label>
                      <select
                        value={newGroupEmoji}
                        onChange={(e) => setNewGroupEmoji(e.target.value)}
                        className="w-full py-1.5 px-2 text-xs rounded-lg border border-neutral-200 focus:border-amber-400 focus:outline-none bg-white transition"
                      >
                        {GROUP_EMOJIS.map(em => (
                          <option key={em} value={em}>{em}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Student Multi-Select */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500">Chọn thành viên nhóm</label>
                    <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto p-1.5 bg-white rounded-lg border border-neutral-100">
                      {classInfo.students.map((s) => {
                        const isSelected = selectedGroupMembers.includes(s.id);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedGroupMembers(selectedGroupMembers.filter(id => id !== s.id));
                              } else {
                                setSelectedGroupMembers([...selectedGroupMembers, s.id]);
                              }
                            }}
                            className={`p-1.5 rounded-lg border text-left text-[11px] transition flex items-center space-x-1.5 cursor-pointer ${
                              isSelected 
                                ? 'bg-amber-50 border-amber-300 font-bold text-amber-900' 
                                : 'bg-white border-neutral-150 hover:bg-neutral-50 text-neutral-600'
                            }`}
                          >
                            <span>{s.avatar}</span>
                            <span className="truncate">{s.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit Group Button */}
                  <button
                    type="button"
                    onClick={handleCreateGroup}
                    disabled={!newGroupName.trim() || selectedGroupMembers.length === 0}
                    className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-lg text-xs transition shadow-sm disabled:opacity-40 cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tạo nhóm</span>
                  </button>
                </div>

                {/* Group List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-neutral-700 flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>Danh sách nhóm ({ (classInfo.groups || []).length })</span>
                  </h4>
                  
                  { (classInfo.groups || []).length > 0 ? (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {classInfo.groups.map((g) => (
                        <div key={g.id} className="p-3 bg-white rounded-xl border border-neutral-200/70 shadow-2xs flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg bg-neutral-50 p-1 rounded-md">{g.emoji}</span>
                              <span className="text-xs font-bold text-neutral-800">{g.name}</span>
                              <span className="text-[10px] text-neutral-400 font-medium">({g.studentIds.length} em)</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {g.studentIds.map(sid => {
                                const s = classInfo.students.find(st => st.id === sid);
                                return s ? (
                                  <span key={sid} className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-neutral-100 border border-neutral-200 text-[10px] text-neutral-600 font-medium">
                                    {s.avatar} {s.name}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteGroup(g.id)}
                            className="p-1 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Xóa nhóm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-neutral-50/50 rounded-xl border border-dashed border-neutral-200 text-[11px] text-neutral-400">
                      Chưa tạo nhóm nào. Hãy tạo nhóm để giao bài tập theo nhóm nhé!
                    </div>
                  )}
                </div>
              </div>

              {/* COLUMN 2: ASSIGNMENT MANAGEMENT */}
              <div className="space-y-6">
                <div className="bg-neutral-50/50 p-4 rounded-xl border border-neutral-200/60 space-y-4">
                  <h4 className="text-xs font-bold text-neutral-800 flex items-center space-x-1.5">
                    <Target className="w-3.5 h-3.5 text-amber-600" />
                    <span>Giao nhiệm vụ viết văn</span>
                  </h4>

                  <div className="space-y-3">
                    {/* Select Group */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500">Giao cho nhóm</label>
                      <select
                        value={assignGroupId}
                        onChange={(e) => setAssignGroupId(e.target.value)}
                        className="w-full py-1.5 px-2.5 text-xs rounded-lg border border-neutral-200 focus:border-amber-400 focus:outline-none bg-white transition"
                      >
                        <option value="">-- Chọn nhóm nhận nhiệm vụ --</option>
                        {(classInfo.groups || []).map(g => (
                          <option key={g.id} value={g.id}>{g.emoji} {g.name} ({g.studentIds.length} học sinh)</option>
                        ))}
                      </select>
                    </div>

                    {/* Assignment Title */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500">Tên nhiệm vụ</label>
                      <input
                        type="text"
                        placeholder="VD: Luyện viết văn tả cảnh sáng tạo"
                        value={assignTitle}
                        onChange={(e) => setAssignTitle(e.target.value)}
                        className="w-full py-1.5 px-3 text-xs rounded-lg border border-neutral-200 focus:border-amber-400 focus:outline-none bg-white transition"
                      />
                    </div>

                    {/* Select Genre & Topic */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500">Dạng bài</label>
                        <select
                          value={assignGenre}
                          onChange={(e) => {
                            setAssignGenre(e.target.value);
                            setAssignTopic(''); // Reset topic when changing genre
                          }}
                          className="w-full py-1.5 px-2 text-xs rounded-lg border border-neutral-200 focus:border-amber-400 focus:outline-none bg-white transition"
                        >
                          <option value="">-- Chọn dạng bài --</option>
                          {SYLLABUS_DATA.map(genre => (
                            <option key={genre.id} value={genre.id}>{genre.emoji} {genre.title}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500">Hạn chót (tùy chọn)</label>
                        <input
                          type="date"
                          value={assignDueDate}
                          onChange={(e) => setAssignDueDate(e.target.value)}
                          className="w-full py-1.5 px-2 text-xs rounded-lg border border-neutral-200 focus:border-amber-400 focus:outline-none bg-white transition"
                        />
                      </div>
                    </div>

                    {/* Topic Suggestion or Custom Input */}
                    {assignGenre && (
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-neutral-500">Chọn đề bài gợi ý</label>
                          <select
                            value={SYLLABUS_DATA.find(g => g.id === assignGenre)?.topics.includes(assignTopic) ? assignTopic : ''}
                            onChange={(e) => setAssignTopic(e.target.value)}
                            className="w-full py-1.5 px-2 text-xs rounded-lg border border-neutral-200 focus:border-amber-400 focus:outline-none bg-white transition"
                          >
                            <option value="">-- Chọn đề gợi ý hoặc tự nhập bên dưới --</option>
                            {SYLLABUS_DATA.find(g => g.id === assignGenre)?.topics.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-neutral-500">Chi tiết đề bài</label>
                          <textarea
                            placeholder="Nhập đề bài cụ thể cho học sinh..."
                            value={assignTopic}
                            onChange={(e) => setAssignTopic(e.target.value)}
                            rows={2}
                            className="w-full py-1.5 px-3 text-xs rounded-lg border border-neutral-200 focus:border-amber-400 focus:outline-none bg-white transition resize-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* Assignment Description */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500">Lời dặn của cô (tùy chọn)</label>
                      <input
                        type="text"
                        placeholder="VD: Cố gắng sử dụng ít nhất 3 từ láy gợi tả nhé!"
                        value={assignDesc}
                        onChange={(e) => setAssignDesc(e.target.value)}
                        className="w-full py-1.5 px-3 text-xs rounded-lg border border-neutral-200 focus:border-amber-400 focus:outline-none bg-white transition"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateAssignment}
                    disabled={!assignGroupId || !assignTitle.trim() || !assignGenre || !assignTopic.trim()}
                    className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-lg text-xs transition shadow-sm disabled:opacity-40 cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Giao nhiệm vụ</span>
                  </button>
                </div>

                {/* Assignment List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-neutral-700 flex items-center space-x-1.5">
                    <ClipboardList className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Nhiệm vụ đã giao ({ (classInfo.assignments || []).length })</span>
                  </h4>

                  { (classInfo.assignments || []).length > 0 ? (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {classInfo.assignments.map((a) => {
                        const group = (classInfo.groups || []).find(g => g.id === a.groupId);
                        const genreInfo = SYLLABUS_DATA.find(g => g.id === a.genreId);
                        const isCompleted = a.status === 'completed';
                        return (
                          <div key={a.id} className={`p-3 rounded-xl border transition flex items-start justify-between gap-3 ${
                            isCompleted ? 'bg-neutral-50/70 border-neutral-200 opacity-60' : 'bg-white border-neutral-200/70 shadow-2xs'
                          }`}>
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded">
                                  {group ? `${group.emoji} ${group.name}` : 'Không xác định'}
                                </span>
                                <span className="text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded">
                                  {genreInfo ? `${genreInfo.emoji} ${genreInfo.title}` : a.genreId}
                                </span>
                                {a.dueDate && (
                                  <span className="text-[9px] text-neutral-400 flex items-center space-x-0.5">
                                    <Calendar className="w-3 h-3" />
                                    <span>Hạn: {new Date(a.dueDate).toLocaleDateString('vi-VN')}</span>
                                  </span>
                                )}
                              </div>
                              <h5 className={`text-xs font-bold text-neutral-800 ${isCompleted ? 'line-through' : ''}`}>{a.title}</h5>
                              <p className="text-[10px] text-neutral-600 font-medium line-clamp-2">{a.topic}</p>
                              {a.description && (
                                <p className="text-[9px] text-neutral-400 italic">💡 Lời dặn: {a.description}</p>
                              )}
                            </div>

                            <div className="flex items-center space-x-1 shrink-0">
                              <button
                                onClick={() => handleToggleAssignmentStatus(a.id)}
                                className={`p-1 rounded-lg border transition cursor-pointer ${
                                  isCompleted 
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-600 hover:bg-emerald-100' 
                                    : 'bg-white border-neutral-200 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50'
                                }`}
                                title={isCompleted ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu đã hoàn thành'}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteAssignment(a.id)}
                                className="p-1 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                title="Xóa nhiệm vụ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-neutral-50/50 rounded-xl border border-dashed border-neutral-200 text-[11px] text-neutral-400">
                      Chưa giao nhiệm vụ nào. Hãy giao nhiệm vụ để học sinh luyện tập nhé!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>


          {/* ===== ACCESS CONTROL CONFIGURATION ===== */}
          <div className="lg:col-span-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-purple-100/30 shadow-sm p-6 space-y-4">
              <div className="flex items-center space-x-3 border-b border-neutral-100 pb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-sm font-heading font-extrabold text-neutral-800">🔒 Cấu hình quyền truy cập thanh công cụ</h3>
                  <p className="text-[11px] text-neutral-500">Thiết lập linh hoạt những mục hiển thị cho Học sinh và Khách</p>
                </div>
              </div>

              {/* List of tabs and their permissions */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-neutral-700 min-w-[400px]">
                  <thead className="text-[10px] uppercase font-bold text-neutral-400 bg-neutral-50/70 border-b border-neutral-200/50">
                    <tr>
                      <th className="p-3">Mục thanh công cụ</th>
                      <th className="p-3 text-center">Học sinh (Đã đăng nhập)</th>
                      <th className="p-3 text-center">Khách (Chưa đăng nhập)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {[
                      { id: 'syllabus', label: '📚 Thư viện dạng bài', desc: 'Thư viện lý thuyết, đề gợi ý và các quy tắc viết văn AI' },
                      { id: 'helper', label: '💡 Dàn ý thông minh AI', desc: 'Không gian phác thảo dàn ý và chấm điểm/so sánh bằng AI' },
                      { id: 'game', label: '🎮 Trò chơi sắp đặt', desc: 'Trò chơi kéo thả sắp xếp bố cục câu chuyện' },
                      { id: 'detective', label: '🕵️ Thám tử bắt lỗi', desc: 'Trò chơi tìm lỗi văn bản và đối chiếu kết quả' },
                      { id: 'portfolio', label: '🏆 Portfolio Tiến Bộ', desc: 'Hồ sơ năng lực học tập và bài viết mẫu đã lưu' },
                    ].map((tabItem) => {
                      const perm = tabPermissions[tabItem.id] || { student: true, guest: true };
                      return (
                        <tr key={tabItem.id} className="hover:bg-neutral-50/50 transition">
                          <td className="p-3">
                            <span className="font-bold text-neutral-800 block">{tabItem.label}</span>
                            <span className="text-[10px] text-neutral-400 font-medium block mt-0.5">{tabItem.desc}</span>
                          </td>
                          <td className="p-3 text-center">
                            <label className="inline-flex items-center justify-center cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={perm.student}
                                onChange={(e) => {
                                  const updated = {
                                    ...tabPermissions,
                                    [tabItem.id]: { ...perm, student: e.target.checked }
                                  };
                                  onUpdatePermissions(updated);
                                  showSaveToast();
                                }}
                                className="w-4.5 h-4.5 rounded border-neutral-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                              />
                            </label>
                          </td>
                          <td className="p-3 text-center">
                            <label className="inline-flex items-center justify-center cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={perm.guest}
                                onChange={(e) => {
                                  const updated = {
                                    ...tabPermissions,
                                    [tabItem.id]: { ...perm, guest: e.target.checked }
                                  };
                                  onUpdatePermissions(updated);
                                  showSaveToast();
                                }}
                                className="w-4.5 h-4.5 rounded border-neutral-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                              />
                            </label>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Save indicator toast message */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                <p className="text-[10px] text-neutral-400 font-medium">
                  * Lưu ý: Giáo viên luôn có toàn quyền xem toàn bộ các mục trên.
                </p>
                <AnimatePresence>
                  {showPermissionsToast && (
                    <motion.span
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-[10px] font-bold text-emerald-600 flex items-center space-x-1"
                    >
                      <span>✓ Tự động lưu cấu hình thành công!</span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* ===== SYSTEM SETTINGS ===== */}
          <div className="lg:col-span-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-blue-100/30 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-800">⚙️ Cài đặt hệ thống AI</h3>
                    <p className="text-[11px] text-neutral-500">Quản lý API Key và Model AI cho ứng dụng</p>
                  </div>
                </div>
                <button
                  onClick={onOpenSettings}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl text-xs transition shadow-md hover:shadow-lg cursor-pointer flex items-center space-x-2"
                >
                  <Key className="w-4 h-4" />
                  <span>Cấu hình API Key & Model</span>
                </button>
              </div>
              <div className="flex items-center space-x-4 pt-2 border-t border-neutral-100">
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${apiKey ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <span className="text-xs text-neutral-600">
                    {apiKey ? 'API Key đã cấu hình ✓' : '⚠️ Chưa có API Key — đang chạy chế độ mô phỏng'}
                  </span>
                </div>
                <span className="text-xs text-neutral-400">|</span>
                <span className="text-xs text-neutral-500">Model: <span className="font-semibold text-neutral-700">{selectedModel}</span></span>
              </div>
            </div>
          </div>

          {/* ===== DEVICE SYNC ===== */}
          <div className="lg:col-span-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-blue-100/30 shadow-sm p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center text-lg">
                  🌐
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-800">🌐 Đồng bộ hóa thiết bị khác</h3>
                  <p className="text-[11px] text-neutral-500">Kết nối máy tính và điện thoại để dùng chung dữ liệu học tập</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-neutral-100 text-xs">
                {/* Section 1: Show sync code */}
                <div className="space-y-2.5">
                  <span className="font-bold text-neutral-700 block">Mã đồng bộ lớp học hiện tại:</span>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 text-center bg-neutral-100 py-2 px-3 rounded-xl font-mono font-bold text-indigo-600 select-all border border-neutral-200">
                      {teacherId}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(teacherId);
                        alert('Đã sao chép mã đồng bộ lớp học! 📋');
                      }}
                      className="px-4 py-2 bg-neutral-100 hover:bg-neutral-250 text-neutral-700 border border-neutral-200 font-bold rounded-xl transition cursor-pointer"
                    >
                      Sao chép 📋
                    </button>
                  </div>
                  <p className="text-[10px] text-neutral-400 leading-relaxed">
                    * Đưa mã này cho học sinh nhập trên điện thoại khi đăng nhập, hoặc nhập mã này trên thiết bị di động của bạn để xem báo cáo.
                  </p>
                </div>

                {/* Section 2: Input other sync code */}
                <div className="space-y-2.5">
                  <span className="font-bold text-neutral-700 block">Nhập mã đồng bộ từ thiết bị khác:</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Mã thiết bị (t_abc123...)"
                      id="teacher-sync-code-input"
                      className="flex-1 py-2 px-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-purple-400 bg-neutral-50 focus:bg-white transition text-xs font-mono"
                    />
                    <button
                      onClick={async () => {
                        const inputVal = (document.getElementById('teacher-sync-code-input') as HTMLInputElement)?.value?.trim();
                        if (!inputVal) return;
                        if (inputVal === teacherId) {
                          alert('Mã này chính là mã của thiết bị hiện tại!');
                          return;
                        }
                        if (confirm('Lưu ý: Kết nối mã đồng bộ khác sẽ thay thế danh sách lớp hiện tại trên trình duyệt này bằng lớp của thiết bị đó. Bạn có chắc chắn muốn tiếp tục?')) {
                          try {
                            const res = await fetch(`/api/sync/class-info?teacherId=${inputVal}`);
                            if (res.ok) {
                              const data = await res.json();
                              if (data.success && data.classInfo) {
                                // Update teacherId and classInfo
                                onUpdateTeacherId?.(inputVal);
                                alert('Kết nối đồng bộ thành công! 🎉 Dữ liệu lớp học và bài viết đã được tải về trình duyệt này.');
                              } else {
                                alert('Không tìm thấy lớp học với mã đồng bộ này. Vui lòng kiểm tra lại.');
                              }
                            } else {
                              alert('Lỗi kết nối máy chủ.');
                            }
                          } catch (err) {
                            alert('Lỗi kết nối mạng.');
                          }
                        }
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-xl transition shadow-sm cursor-pointer"
                    >
                      Kết nối 🔗
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
