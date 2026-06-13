import React, { useState } from 'react';
import { Search, Loader2, CheckCircle2, XCircle, Trophy, RefreshCw, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { callGeminiApiDirectly } from '../utils/geminiDirect';

interface DetectedError {
  location: string;
  type: string;
  suggestion: string;
}

interface DetectiveGameProps {
  apiKey?: string;
  selectedModel?: string;
}

export default function DetectiveGame({ apiKey, selectedModel }: DetectiveGameProps) {
  const [topic, setTopic] = useState('Tả cảnh sân trường giờ ra chơi');
  const [isLoading, setIsLoading] = useState(false);
  const [passage, setPassage] = useState('');
  const [errors, setErrors] = useState<DetectedError[]>([]);
  const [showAnswers, setShowAnswers] = useState(false);
  const [studentAnswers, setStudentAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [gamePhase, setGamePhase] = useState<'setup' | 'playing' | 'review'>('setup');

  const handleGenerate = async () => {
    setIsLoading(true);
    setShowAnswers(false);
    setStudentAnswers([]);
    setScore(null);

    const mockData = {
      passage: 'Sáng nay em đi học. Trường em rất đẹp. Cây bàng rất to. Hôm qua em ăn phở. Bạn bè rất vui. Trường em có sân rộng. Em thích đi học. Cô giáo dạy toán rất hay. Em rất thích trường em.',
      errors: [
        { location: 'Câu 4', type: 'Lạc đề', suggestion: 'Câu "Hôm qua em ăn phở" không liên quan đến tả trường học.' },
        { location: 'Toàn bài', type: 'Thiếu cảm xúc', suggestion: 'Bài viết liệt kê như danh sách, thiếu từ ngữ miêu tả.' },
        { location: 'Câu 1-3', type: 'Câu ngắn đơn điệu', suggestion: 'Các câu quá ngắn. Cần dùng từ láy, tính từ chi tiết hơn.' }
      ],
      difficulty: 'easy'
    };

    try {
      const res = await fetch('/api/gemini/detective', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'x-api-key': apiKey } : {}) },
        body: JSON.stringify({ topic, type: 'ta-canh', errorType: 'thiếu cảm xúc, lạc đề nhẹ, câu đơn điệu', model: selectedModel })
      });
      const data = await res.json();
      if (!data.passage || data.error) {
        throw new Error(data?.error || 'Invalid API response');
      }
      setPassage(data.passage);
      setErrors(data.errors || []);
      setGamePhase('playing');
    } catch (err) {
      console.warn('Gemini detective generation failed, trying direct client call:', err);
      if (apiKey) {
        try {
          const directData = await callGeminiApiDirectly({
            action: 'detective',
            topic,
            type: 'ta-canh',
            errorType: 'thiếu cảm xúc, lạc đề nhẹ, câu đơn điệu',
            model: selectedModel,
            apiKey
          });
          setPassage(directData.passage);
          setErrors(directData.errors || []);
          setGamePhase('playing');
          setIsLoading(false);
          return;
        } catch (directErr) {
          console.error('Direct client-side Gemini detective failed:', directErr);
        }
      }
      setPassage(mockData.passage);
      setErrors(mockData.errors);
      setGamePhase('playing');
    } finally {
      setIsLoading(false);
    }
  };

  const addAnswer = () => {
    if (currentAnswer.trim()) {
      setStudentAnswers(prev => [...prev, currentAnswer.trim()]);
      setCurrentAnswer('');
    }
  };

  const handleSubmit = () => {
    const maxScore = errors.length * 10;
    const matched = studentAnswers.filter(ans => 
      errors.some(err => 
        ans.toLowerCase().includes(err.type.toLowerCase()) || 
        ans.toLowerCase().includes(err.location.toLowerCase()) ||
        err.suggestion.toLowerCase().includes(ans.toLowerCase().slice(0, 10))
      )
    ).length;
    const finalScore = Math.min(Math.round((matched / Math.max(errors.length, 1)) * 100), 100);
    setScore(finalScore);
    setShowAnswers(true);
    setGamePhase('review');
  };

  const resetGame = () => {
    setPassage('');
    setErrors([]);
    setStudentAnswers([]);
    setScore(null);
    setShowAnswers(false);
    setGamePhase('setup');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-amber-100/50 shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-2xl">🕵️</div>
          <div>
            <h2 className="text-lg font-heading font-bold text-neutral-800">Thám Tử Bắt Lỗi</h2>
            <p className="text-xs text-neutral-500">AI viết bài có lỗi chủ đích — Em hãy tìm và sửa!</p>
          </div>
        </div>
        <p className="text-xs text-neutral-600 leading-relaxed bg-amber-50/50 rounded-xl p-3 border border-amber-100/50">
          🦉 Cú Văn sẽ viết một đoạn văn có LỖI ẩn bên trong. Nhiệm vụ của em là đọc kỹ, phát hiện lỗi sai và giải thích tại sao đó là lỗi. Em càng tìm được nhiều lỗi, điểm thám tử càng cao!
        </p>
      </div>

      {gamePhase === 'setup' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/90 backdrop-blur-sm rounded-2xl border border-amber-100/30 shadow-sm p-6 space-y-4">
          <label className="text-xs font-heading font-bold text-neutral-700 uppercase tracking-wider">Chọn đề bài</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full py-3 px-4 text-sm rounded-xl border border-neutral-200 focus:border-amber-400 focus:outline-none bg-neutral-50 focus:bg-white transition"
            placeholder="VD: Tả cảnh trường em"
          />
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl text-sm transition shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center space-x-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            <span>{isLoading ? 'Đang tạo bài...' : '🔍 Bắt đầu điều tra!'}</span>
          </button>
        </motion.div>
      )}

      {gamePhase !== 'setup' && passage && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Passage */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-neutral-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-heading font-bold text-neutral-800 uppercase tracking-wider">Đoạn văn cần điều tra</h3>
            </div>
            <div className="bg-amber-50/30 rounded-xl p-4 border border-amber-100/50">
              <p className="text-sm text-neutral-800 leading-relaxed whitespace-pre-line">{passage}</p>
            </div>
          </div>

          {/* Detective Notepad */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-blue-100/30 shadow-sm p-6 space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-heading font-bold text-neutral-800 uppercase tracking-wider">Sổ tay thám tử</h3>
            </div>

            {gamePhase === 'playing' && (
              <>
                <div className="flex items-center space-x-2">
                  <input
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addAnswer()}
                    placeholder="Ghi lỗi em phát hiện..."
                    className="flex-1 py-2.5 px-4 text-xs rounded-xl border border-neutral-200 focus:border-blue-400 focus:outline-none bg-neutral-50 focus:bg-white transition"
                  />
                  <button onClick={addAnswer} className="px-3 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition cursor-pointer">+ Ghi</button>
                </div>

                {studentAnswers.length > 0 && (
                  <div className="space-y-1.5">
                    {studentAnswers.map((ans, idx) => (
                      <div key={idx} className="flex items-start space-x-2 bg-blue-50/50 rounded-lg p-2 border border-blue-100/50">
                        <span className="text-blue-500 text-xs font-bold">#{idx + 1}</span>
                        <span className="text-xs text-neutral-700">{ans}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={studentAnswers.length === 0}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl text-xs transition shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Nộp bài điều tra 🔎</span>
                </button>
              </>
            )}

            {gamePhase === 'review' && score !== null && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                {/* Score */}
                <div className="text-center py-4">
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${score >= 70 ? 'bg-gradient-to-br from-emerald-100 to-teal-100' : 'bg-gradient-to-br from-amber-100 to-orange-100'} shadow-md mb-2`}>
                    <span className="text-2xl font-heading font-extrabold">{score}</span>
                  </div>
                  <p className="text-xs font-bold text-neutral-700 mt-1">
                    {score >= 80 ? '🌟 Thám tử xuất sắc!' : score >= 50 ? '👍 Khá tốt, tiếp tục rèn luyện!' : '💪 Cần luyện mắt thêm nhé!'}
                  </p>
                </div>

                {/* Correct Answers */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-neutral-600 uppercase">Đáp án chính xác:</h4>
                  {errors.map((err, idx) => (
                    <div key={idx} className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 space-y-1">
                      <div className="flex items-center space-x-2">
                        <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="text-[11px] font-bold text-rose-800">{err.location} — {err.type}</span>
                      </div>
                      <p className="text-[11px] text-neutral-600 pl-5">{err.suggestion}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={resetGame}
                  className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Chơi lại với đề mới</span>
                </button>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
