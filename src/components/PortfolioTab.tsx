import React, { useState } from 'react';
import { OutlineSubmission, StudentProfile } from '../types';
import { SYLLABUS_DATA } from '../data/syllabus';
import { STRENGTH_CARDS } from '../data/strengthCards';
import { 
  Award, TrendingUp, BookOpen, Clock, Heart, Calendar, 
  Map, FileText, ChevronRight, Bookmark, ArrowRight, Printer, Star, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// No more mock data — portfolio shows real submissions only
const PAST_SUBMISSIONS_MOCK: OutlineSubmission[] = [];

interface PortfolioTabProps {
  studentProfile: StudentProfile;
  customSavedOutlines: OutlineSubmission[];
}

export default function PortfolioTab({ studentProfile, customSavedOutlines }: PortfolioTabProps) {
  // Combine static and custom saved outlines
  const allSubmissions = [...customSavedOutlines, ...PAST_SUBMISSIONS_MOCK];
  
  const [selectedSubmission, setSelectedSubmission] = useState<OutlineSubmission | null>(allSubmissions[0] || null);
  const [showParentReport, setShowParentReport] = useState(false);

  // Growth calculations
  const totalSubmissions = allSubmissions.length;
  // Compute true average from all available records
  const averageAllScores = Math.round(
    allSubmissions.reduce((acc, sub) => {
      const activeScore = sub.gradeAfter?.score || sub.gradeBefore?.score || 70;
      return acc + activeScore;
    }, 0) / (totalSubmissions || 1)
  );

  return (
    <div className="space-y-6">
      {/* Student Banner Overview */}
      <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-amber-100/50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800 text-3xl font-bold font-mono shadow-xs border border-amber-200">
            {studentProfile.avatar}
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-neutral-800 font-sans tracking-tight">{studentProfile.name}</h2>
              <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Lớp {studentProfile.gradeClass}</span>
            </div>
            <p className="text-xs text-neutral-500 font-medium">
              Writing Level: <span className="text-amber-600 font-extrabold">{studentProfile.level}</span> • Niên khóa 2025 - 2026
            </p>
          </div>
        </div>

        {/* Dashboard quick figures */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto shrink-0 border-t md:border-t-0 md:border-l border-neutral-100 pt-4 md:pt-0 md:pl-6">
          <div className="text-center bg-neutral-50 p-2.5 rounded-xl border border-neutral-100 min-w-[90px]">
            <Star className="w-4 h-4 text-amber-500 mx-auto mb-1 fill-amber-300" />
            <span className="text-[10px] uppercase text-neutral-400 font-semibold block">Điểm Trung Bình</span>
            <span className="text-[16px] font-extrabold text-neutral-800">{averageAllScores}/100</span>
          </div>

          <div className="text-center bg-neutral-50 p-2.5 rounded-xl border border-neutral-100 min-w-[90px]">
            <BookOpen className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
            <span className="text-[10px] uppercase text-neutral-400 font-semibold block">Đã Luyện tập</span>
            <span className="text-[16px] font-extrabold text-neutral-800">{totalSubmissions} bài viết</span>
          </div>

          <div className="text-center bg-neutral-50 p-2.5 rounded-xl border border-neutral-100 min-w-[90px]">
            <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
            <span className="text-[10px] uppercase text-neutral-400 font-semibold block">Mức tiến bộ TB</span>
            <span className="text-[16px] font-extrabold text-emerald-600">+{studentProfile.progressScore}đ</span>
          </div>

          <div className="text-center bg-neutral-50 p-2.5 rounded-xl border border-neutral-100 min-w-[90px]">
            <Award className="w-4 h-4 text-purple-500 mx-auto mb-1" />
            <span className="text-[10px] uppercase text-neutral-400 font-semibold block">Huy Hiệu Đạt</span>
            <span className="text-[16px] font-extrabold text-purple-600">
              {studentProfile.badges.filter(b => b.unlocked).length} khiên
            </span>
          </div>
        </div>
      </div>

      {/* Main double column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Skill Matrix Chart & Badge Shelf */}
        <div className="space-y-6">
          {/* Skill Radar Progress Block */}
          <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-amber-100/30 shadow-sm space-y-4">
            <h3 className="font-extrabold text-xs text-neutral-800 uppercase tracking-widest border-b border-neutral-100 pb-2 flex items-center space-x-1.5">
              <Map className="w-4 h-4 text-amber-500" />
              <span>Bản Đồ Năng Lực Viết</span>
            </h3>

            <div className="space-y-3 pt-1">
              {/* Nhận diện đề */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-neutral-600 font-semibold">
                  <span>Nhận diện đề & yêu cầu</span>
                  <span>{studentProfile.skillMap.understand}%</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-100 rounded-full">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${studentProfile.skillMap.understand}%` }} />
                </div>
              </div>

              {/* Lập bố cục */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-neutral-600 font-semibold">
                  <span>Lập bố cục 3 phần</span>
                  <span>{studentProfile.skillMap.structure}%</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-100 rounded-full">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${studentProfile.skillMap.structure}%` }} />
                </div>
              </div>

              {/* Phát triển ý */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-neutral-600 font-semibold">
                  <span>Phát triển ý chính, ý phụ</span>
                  <span>{studentProfile.skillMap.development}%</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-100 rounded-full">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${studentProfile.skillMap.development}%` }} />
                </div>
              </div>

              {/* Miêu tả chi tiết */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-neutral-600 font-semibold">
                  <span>Miêu tả có chiều sâu gợi giác quan</span>
                  <span>{studentProfile.skillMap.creativity}%</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-100 rounded-full">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${studentProfile.skillMap.creativity}%` }} />
                </div>
              </div>

              {/* Cảm xúc / Sáng tạo */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-neutral-600 font-semibold">
                  <span>Kiểu văn cảm xúc, kết bài mở rộng</span>
                  <span>{studentProfile.skillMap.logic}%</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-100 rounded-full">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${studentProfile.skillMap.logic}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Gamification badges shelf */}
          <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-purple-100/30 shadow-sm space-y-4">
            <h3 className="font-extrabold text-xs text-neutral-800 uppercase tracking-widest border-b border-neutral-100 pb-2 flex items-center space-x-1.5">
              <Award className="w-4 h-4 text-purple-500" />
              <span>Kho Huy Hiệu Danh Dự</span>
            </h3>

            <div className="space-y-3">
              {studentProfile.badges.map((badge) => {
                const isUnlocked = badge.unlocked || allSubmissions.length >= (badge.id === 'obs' ? 1 : 2);
                return (
                  <div 
                    key={badge.id} 
                    className={`p-3 rounded-xl border flex items-center space-x-3 transition-colors ${
                      isUnlocked 
                        ? 'bg-purple-50/40 border-purple-100 text-purple-900' 
                        : 'bg-neutral-100/50 border-neutral-100 opacity-60'
                    }`}
                  >
                    <span className="text-2xl">{isUnlocked ? badge.emoji : '🔒'}</span>
                    <div className="flex-1 space-y-0.5">
                      <h4 className="text-xs font-bold text-neutral-800">{badge.title}</h4>
                      <p className="text-[10px] text-neutral-500 leading-snug">{badge.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strength Cards Collection (SEL) */}
          <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-amber-100/30 shadow-sm space-y-4">
            <h3 className="font-extrabold text-xs text-neutral-800 uppercase tracking-widest border-b border-neutral-100 pb-2 flex items-center space-x-1.5">
              <span className="text-base">🃏</span>
              <span>Bộ Sưu Tập Thẻ Sức Mạnh</span>
              <span className="ml-auto text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                {studentProfile.strengthCards?.length || 0}/{STRENGTH_CARDS.length} thẻ
              </span>
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {STRENGTH_CARDS.map((card) => {
                const isCollected = studentProfile.strengthCards?.includes(card.id) || false;
                const colorMap: Record<string, string> = {
                  'amber': 'from-amber-100 to-yellow-50 border-amber-200',
                  'orange': 'from-orange-100 to-amber-50 border-orange-200',
                  'emerald': 'from-emerald-100 to-green-50 border-emerald-200',
                  'yellow': 'from-yellow-100 to-amber-50 border-yellow-200',
                  'pink': 'from-pink-100 to-rose-50 border-pink-200',
                  'purple': 'from-purple-100 to-violet-50 border-purple-200',
                  'blue': 'from-blue-100 to-sky-50 border-blue-200',
                  'teal': 'from-teal-100 to-cyan-50 border-teal-200',
                };
                const colors = colorMap[card.color] || 'from-neutral-100 to-neutral-50 border-neutral-200';
                return (
                  <div 
                    key={card.id}
                    className={`relative rounded-xl border p-3 text-center transition-all ${
                      isCollected 
                        ? `bg-gradient-to-br ${colors} shadow-sm` 
                        : 'bg-neutral-50/50 border-neutral-100 opacity-50 grayscale'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{isCollected ? card.emoji : '🔒'}</span>
                    <span className="text-[10px] font-bold text-neutral-800 block">{card.name}</span>
                    <span className="text-[9px] text-neutral-500 leading-tight block mt-0.5">{card.description}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Writer Portrait */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50/30 p-5 rounded-2xl border border-amber-200/50 shadow-sm space-y-2">
            <div className="flex items-center space-x-1.5 text-amber-900 font-bold text-xs uppercase tracking-wider">
              <User className="w-4 h-4 text-amber-600" />
              <span>Chân dung người viết An</span>
            </div>
            <p className="text-xs text-amber-800 font-medium leading-relaxed italic">
              "An là học sinh có khả năng quan sát thiên nhiên rất sinh động. Thích viết lồng ghép các bài học triết lý ngộ nghĩnh và biết lắng nghe, tiếp thu chi tiết đắt giá từ huấn luyện viên AI để vượt hạng ngoạn mục."
            </p>
          </div>
        </div>

        {/* Right Column: Historical timeline & Printable parent report */}
        <div className="lg:col-span-2 space-y-6">
          {/* Toggle Parent Report Button */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowParentReport(!showParentReport)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-xl border border-neutral-200 transition cursor-pointer select-none"
            >
              <Printer className="w-4 h-4 text-neutral-500" />
              <span>{showParentReport ? 'Quay về lịch sử học' : 'Xem Báo Cáo Phụ Huynh 👩‍👦'}</span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {showParentReport ? (
              /* PANEL A: Printable parent report */
              <motion.div
                key="parent-report"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white/95 backdrop-blur-sm p-8 rounded-3xl border border-purple-100/30 space-y-6 shadow-md"
              >
                {/* Print Header */}
                <div className="text-center space-y-1.5 border-b border-dashed border-neutral-200 pb-5">
                  <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest block">VietMaster 5 • Hồ Sơ Đánh Giá Định Kỳ</span>
                  <h3 className="text-xl font-black font-sans text-neutral-800 uppercase tracking-tight">BÁO CÁO PHÁT TRIỂN NĂNG LỰC VIẾT</h3>
                  <p className="text-xs text-neutral-500 font-medium">Báo cáo gửi các Bác Phụ Huynh của em <strong className="text-neutral-800">{studentProfile.name}</strong> • Lớp 5A22</p>
                </div>

                {/* Content body */}
                <div className="space-y-4 text-xs text-neutral-700 leading-relaxed">
                  <p>Kính thưa các Bác Phụ huynh,</p>
                  <p>
                    Dựa trên tiến trình quan sát và rèn luyện lập dàn ý Tiếng Việt lớp 5 của bé <strong>{studentProfile.name}</strong>, hệ thống thông minh xin gửi sơ bộ tóm tắt định tính kết quả học tập vượt khó học kỳ vừa rồi:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50 p-4 rounded-2xl border border-neutral-100/50">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Các điểm mốc cốt lõi:</span>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>Trung bình đạt điểm mốc: <strong>{averageAllScores}/100đ</strong> 🏆</li>
                        <li>Đã thực hành: <strong>{totalSubmissions} chủ đề đa dạng</strong></li>
                        <li>Mức tăng điểm thăng tiến: <strong>+{studentProfile.progressScore}đ</strong> ở Lần 2</li>
                      </ul>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Các Huy hiệu tiêu biểu:</span>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>Kẻ chuyện sáng tạo (Tấm cám) ✔</li>
                        <li>Người quan sát tinh tế (Tả cảnh sông nước) ✔</li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Nhận định sư phạm từ AI Huấn luyện viên:</span>
                    <p className="bg-amber-50/30 p-4 rounded-xl border border-amber-100/30 text-amber-900 leading-relaxed">
                      "Bé An cho thấy năng khiếu cảm thụ không gian tự nhiên và các hoạt động sinh động xuất sắc. Đặc biệt, bé có tinh thần tự hoàn khảo, chủ động thay đổi các ý chung chung vắn tắt của Lần 1 thành những hình tượng bừng sáng ở Lần 2. Kỹ năng lập dàn bài đạt xếp loại <strong>Master Outliner</strong>. Khuyến khích bé bộc lộ cảm xúc mộc mạc hướng nội nhiều hơn."
                    </p>
                  </div>

                  <div className="space-y-1 pt-2">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Định hướng nâng cấp kỳ tới:</span>
                    <p>
                      Mùa tới, bé cần rèn thêm cách hành văn luận điểm ý kiến phản biện đa chiều tinh nhuệ, tránh sử dụng lặp từ ở các phần thân bài miêu tả cảnh hoạt động dông dài.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-dashed border-neutral-200 pt-5 text-[10px] text-neutral-400 font-semibold uppercase">
                  <span>Kho dữ liệu: Firebase persistent</span>
                  <span>Ký bởi: Trợ lý Sư phạm VietMaster ✍️</span>
                </div>
              </motion.div>
            ) : (
              /* PANEL B: Outlines timeline list & Before-After compare card display */
              <div className="space-y-6">
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-amber-100/30 shadow-sm space-y-4">
                  <h4 className="font-extrabold text-xs text-neutral-800 uppercase tracking-widest border-b border-neutral-100 pb-2 flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>Lịch sử Hành trình Viết lách ({totalSubmissions} bài đã lưu)</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* List of outlines */}
                    <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                      {allSubmissions.map((sub, idx) => {
                        const isChosen = selectedSubmission?.id === sub.id;
                        const scoreDisp = sub.gradeAfter?.score || sub.gradeBefore?.score || 70;
                        const genreMetadata = SYLLABUS_DATA.find(g => g.id === sub.type);

                        return (
                          <div
                            key={sub.id}
                            onClick={() => setSelectedSubmission(sub)}
                            className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                              isChosen
                                ? 'bg-amber-50/70 border-amber-200 text-amber-900 shadow-xs ring-1 ring-amber-300/30'
                                : 'bg-neutral-50/50 hover:bg-neutral-50 text-neutral-700 border-neutral-100 hover:border-neutral-200'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="space-y-0.5">
                                <span className="text-[9px] font-bold text-neutral-400 uppercase block">
                                  {genreMetadata?.title || 'Dàn bài'}
                                </span>
                                <h5 className="text-xs font-bold leading-tight break-words">{sub.topic}</h5>
                              </div>
                              <span className="bg-amber-600 text-white font-bold text-[11px] py-0.5 px-2 rounded-md">
                                {scoreDisp}đ
                              </span>
                            </div>
                            <div className="flex items-center space-x-1.5 text-[10px] text-neutral-400 mt-2 font-semibold">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(sub.createdAt).toLocaleDateString('vi-VN')}</span>
                              {sub.comparison && (
                                <span className="text-emerald-600 font-bold ml-auto">+ {sub.comparison.scoreDiff}đ thăng tiến</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Detailed selected card viewer (Before - After expansion panel) */}
                    <AnimatePresence mode="wait">
                      {selectedSubmission ? (
                        <motion.div
                          key={selectedSubmission.id}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="bg-neutral-50/60 rounded-2xl border border-neutral-100 p-5 space-y-4 text-xs"
                        >
                          <div className="border-b border-neutral-200/55 pb-2">
                            <span className="text-[10px] text-amber-600 uppercase font-bold block">Trước → Sau Cải Tiến</span>
                            <h4 className="font-extrabold text-neutral-800 leading-snug break-words">{selectedSubmission.topic}</h4>
                          </div>

                          <div className="space-y-3">
                            <div className="bg-white p-3 rounded-xl border border-neutral-100">
                              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Dự thảo Lần 1:</span>
                              <p className="text-neutral-500 leading-relaxed italic">{selectedSubmission.outlineBefore}</p>
                            </div>

                            {selectedSubmission.outlineAfter && (
                              <div className="bg-amber-50/20 p-3 rounded-xl border border-amber-100/50">
                                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block mb-1">Bản sửa đổi Lần 2:</span>
                                <p className="text-amber-900 font-semibold leading-relaxed italic">{selectedSubmission.outlineAfter}</p>
                              </div>
                            )}

                            {selectedSubmission.comparison && (
                              <div className="p-3 bg-neutral-100 rounded-xl space-y-1 border border-neutral-200 text-[11px] leading-relaxed">
                                <strong className="text-neutral-700 block">✓ Phân tích sự chuyển mình:</strong>
                                <span className="text-neutral-600 italic block">
                                  "{selectedSubmission.comparison.feedback.growthWords}"
                                </span>
                              </div>
                            )}

                            {selectedSubmission.reflection && (
                              <div className="bg-purple-50/40 border border-purple-100/50 p-3 rounded-xl space-y-1.5">
                                <strong className="text-purple-900 text-[10px] uppercase font-bold tracking-wider block">🧠 Ghi chép tự phản hồi (Reflection Log):</strong>
                                <div className="space-y-1 text-purple-950 text-[11px]">
                                  <p>• Thay đổi: {selectedSubmission.reflection.q1_changes}</p>
                                  <p>• Lý do: {selectedSubmission.reflection.q2_reasons}</p>
                                </div>
                              </div>
                            )}

                            {selectedSubmission.sampleEssay && (
                              <div className="bg-emerald-50/40 border border-emerald-100/50 p-4 rounded-xl space-y-2">
                                <strong className="text-emerald-950 text-[10px] uppercase font-extrabold tracking-wider block flex items-center space-x-1">
                                  <span>🦉 Bài viết mẫu tham khảo (Cú Văn viết):</span>
                                </strong>
                                <div className="bg-white p-3.5 rounded-lg border border-emerald-100/50 shadow-2xs text-xs text-neutral-800 leading-relaxed font-serif whitespace-pre-line select-text">
                                  {selectedSubmission.sampleEssay.content}
                                </div>
                                {selectedSubmission.sampleEssay.analysis && selectedSubmission.sampleEssay.analysis.length > 0 && (
                                  <div className="pt-2 border-t border-emerald-100/30 text-[10px] text-emerald-800 space-y-1">
                                    <strong className="font-bold">💡 Nét nghệ thuật hay cần học hỏi:</strong>
                                    {selectedSubmission.sampleEssay.analysis.map((analysisItem, idx) => (
                                      <p key={idx} className="font-medium">• {analysisItem}</p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ) : (
                        <div className="flex items-center justify-center h-48 bg-neutral-50 rounded-2xl border border-dashed">
                          <span className="text-xs text-neutral-400">Chọn một bài viết để ngắm tiến trình đối chiếu nâng cấp!</span>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
