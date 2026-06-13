import React, { useState } from 'react';
import { SYLLABUS_DATA, VOCABULARY_BANK } from '../data/syllabus';
import { 
  BookOpen, CheckCircle, AlertTriangle, Lightbulb, Copy, Check,
  ChevronDown, Camera, Heart, Scale, Sparkles, Rocket
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SyllabusTabProps {
  onStartWriting: (genreId: string, topic?: string) => void;
}

// Map iconName from syllabus data to Lucide components
const ICON_MAP: Record<string, React.ElementType> = {
  'camera': Camera,
  'book-open': BookOpen,
  'heart-handshake': Heart,
  'heart': Heart,
  'scale': Scale,
};

// Themed emojis for vocabulary categories
const VOCAB_CATEGORY_THEME: Record<string, { emoji: string; bg: string }> = {
  'Màu sắc thiên nhiên': { emoji: '🎨', bg: 'bg-emerald-50/60' },
  'Âm thanh không gian': { emoji: '🎵', bg: 'bg-sky-50/60' },
  'Giác quan, xúc giác': { emoji: '✋', bg: 'bg-amber-50/60' },
  'Từ nối cuốn hút': { emoji: '🔗', bg: 'bg-purple-50/60' },
  'Khêu gợi sự tò mò': { emoji: '🔮', bg: 'bg-violet-50/60' },
  'Bài học triết lý': { emoji: '💎', bg: 'bg-blue-50/60' },
  'Ngoại hình/Tính cách': { emoji: '👤', bg: 'bg-pink-50/60' },
  'Cảm xúc kính phục': { emoji: '🌟', bg: 'bg-amber-50/60' },
  'Hành động lay động': { emoji: '💪', bg: 'bg-orange-50/60' },
  'Rung động ban đầu': { emoji: '💓', bg: 'bg-rose-50/60' },
  'Xúc cảm quá trình': { emoji: '🔥', bg: 'bg-red-50/60' },
  'Ý nghĩa sâu xa': { emoji: '🌱', bg: 'bg-emerald-50/60' },
  'Bày tỏ lập trường': { emoji: '⚖️', bg: 'bg-blue-50/60' },
  'Từ nối lập luận': { emoji: '🧩', bg: 'bg-indigo-50/60' },
  'Khẳng định đề xuất': { emoji: '🏅', bg: 'bg-yellow-50/60' },
};

export default function SyllabusTab({ onStartWriting }: SyllabusTabProps) {
  const [selectedGenre, setSelectedGenre] = useState(SYLLABUS_DATA[0]);
  const [copiedWord, setCopiedWord] = useState<string | null>(null);
  // Accordion state — Mở bài open by default
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['mobi']));

  const handleCopy = (word: string) => {
    navigator.clipboard.writeText(word);
    setCopiedWord(word);
    setTimeout(() => setCopiedWord(null), 2000);
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const vocabData = VOCABULARY_BANK[selectedGenre.id as keyof typeof VOCABULARY_BANK];

  // Template sections config
  const templateSections = [
    { key: 'mobi', label: 'Mở bài', subtitle: 'Giới thiệu & khơi gợi', items: selectedGenre.template.mobi, color: 'blue', borderColor: 'border-blue-300', bgBadge: 'bg-blue-100 text-blue-800', dotColor: 'text-blue-400', emoji: '📖' },
    { key: 'thanbi', label: 'Thân bài', subtitle: 'Trình tự & miêu tả sâu', items: selectedGenre.template.thanbi, color: 'emerald', borderColor: 'border-emerald-300', bgBadge: 'bg-emerald-100 text-emerald-800', dotColor: 'text-emerald-500', emoji: '✍️' },
    { key: 'ketbi', label: 'Kết bài', subtitle: 'Đọng lại xúc cảm', items: selectedGenre.template.ketbi, color: 'purple', borderColor: 'border-purple-300', bgBadge: 'bg-purple-100 text-purple-800', dotColor: 'text-purple-400', emoji: '🎯' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-1 md:p-4">
      {/* Sidebar: Genre selection */}
      <div className="lg:col-span-1 space-y-3">
        <h3 className="text-sm font-heading font-bold tracking-wide text-neutral-500 uppercase px-2 mb-2">📚 Thư viện dạng bài</h3>
        <div className="space-y-1.5">
          {SYLLABUS_DATA.map((genre) => {
            const isSelected = selectedGenre.id === genre.id;
            const IconComp = ICON_MAP[(genre as any).iconName] || BookOpen;
            const iconBg = (genre as any).iconBg || 'from-neutral-100 to-neutral-50';
            const iconColor = (genre as any).iconColor || 'text-neutral-600';
            return (
              <motion.button
                key={genre.id}
                id={`genre-btn-${genre.id}`}
                onClick={() => { setSelectedGenre(genre); setOpenSections(new Set(['mobi'])); }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full text-left p-3 rounded-xl transition-all duration-200 border flex items-center space-x-3 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-900 border-amber-200/80 shadow-sm font-semibold ring-1 ring-amber-200/50'
                    : 'bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-100 hover:border-neutral-200'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${iconBg} flex items-center justify-center shrink-0`}>
                  <IconComp className={`w-4.5 h-4.5 ${iconColor}`} />
                </div>
                <span className="text-[13px] leading-tight flex-1 font-medium">{genre.title}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Quick launch CTA with animation */}
        <motion.div 
          className="p-4 bg-gradient-to-br from-amber-50/80 to-orange-50/60 rounded-2xl border border-amber-200/50 space-y-3 relative overflow-hidden"
          animate={{ boxShadow: ['0 4px 15px rgba(251,191,36,0.15)', '0 8px 30px rgba(251,191,36,0.3)', '0 4px 15px rgba(251,191,36,0.15)'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="flex items-center space-x-2 text-amber-800">
            <Lightbulb className="w-5 h-5 text-amber-600" />
            <h4 className="font-heading font-bold text-xs text-amber-900">Em muốn viết dạng này?</h4>
          </div>
          <p className="text-[11px] text-amber-800/80 leading-relaxed">
            Học tập dàn ý chuẩn rồi thực hành ngay cùng 🦉 Cú Văn — huấn luyện viên AI thông thái!
          </p>
          <button
            id="start-writing-btn"
            onClick={() => onStartWriting(selectedGenre.id)}
            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-amber-300/40 hover:shadow-xl hover:shadow-amber-400/40 cursor-pointer flex items-center justify-center space-x-2 group"
          >
            <span>Lên đường lập dàn ý ngay</span>
            <motion.span
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Rocket className="w-4 h-4" />
            </motion.span>
          </button>
          <p className="text-[10px] text-amber-600/60 text-center font-medium animate-pulse-soft">✨ Bấm vào đây nè!</p>
        </motion.div>
      </div>

      {/* Content pane */}
      <div className="lg:col-span-3 space-y-6">
        {/* Header summary of selected genre + banner */}
        <motion.div
          key={selectedGenre.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6 bg-white/90 backdrop-blur-sm rounded-2xl border border-amber-100/50 shadow-sm space-y-3 relative overflow-hidden"
        >
          {/* Decorative gradient bg */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-amber-100/30 via-transparent to-transparent rounded-bl-full pointer-events-none" />
          <div className="relative flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {(() => {
                const IconComp = ICON_MAP[(selectedGenre as any).iconName] || BookOpen;
                const iconBg = (selectedGenre as any).iconBg || 'from-neutral-100 to-neutral-50';
                const iconColor = (selectedGenre as any).iconColor || 'text-neutral-600';
                return (
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${iconBg} flex items-center justify-center shadow-sm`}>
                    <IconComp className={`w-6 h-6 ${iconColor}`} />
                  </div>
                );
              })()}
              <div>
                <h2 className="text-xl font-heading font-bold tracking-tight text-neutral-800">{selectedGenre.title}</h2>
                <p className="text-xs text-neutral-500 mt-0.5">Tiếng Việt lớp 5 • Bản thiết kế ý tưởng viết văn</p>
              </div>
            </div>
            <span className="text-4xl opacity-20 select-none">{selectedGenre.emoji}</span>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed max-w-3xl relative">
            {selectedGenre.description}
          </p>
        </motion.div>

        {/* Bento Layout for Template & Vocabulary */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Template Details with Accordion (3 columns) */}
          <div className="md:col-span-3 space-y-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-amber-100/30 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 border-b border-neutral-100 pb-3">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <h3 className="font-heading font-bold text-sm text-neutral-800 uppercase tracking-wider">Cấu trúc dàn ý chuẩn lớp 5</h3>
                <span className="text-[10px] text-neutral-400 ml-auto">(Bấm để mở/đóng)</span>
              </div>

              {/* Accordion Sections */}
              <div className="space-y-2">
                {templateSections.map((section) => {
                  const isOpen = openSections.has(section.key);
                  return (
                    <div key={section.key} className={`rounded-xl border ${isOpen ? section.borderColor + '/50' : 'border-neutral-100'} overflow-hidden transition-colors`}>
                      {/* Accordion Header */}
                      <button
                        onClick={() => toggleSection(section.key)}
                        className="w-full flex items-center justify-between p-3 hover:bg-neutral-50/50 transition cursor-pointer"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{section.emoji}</span>
                          <span className={`${section.bgBadge} text-[10px] font-bold px-2 py-0.5 rounded-full uppercase`}>{section.label}</span>
                          <span className="text-xs text-neutral-400">({section.subtitle})</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!isOpen && <span className="text-[10px] text-neutral-400 font-medium">{section.items.length} ý</span>}
                          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                            <ChevronDown className="w-4 h-4 text-neutral-400" />
                          </motion.div>
                        </div>
                      </button>
                      {/* Accordion Content */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <ul className={`px-4 pb-3 border-l-2 ${section.borderColor} ml-4 space-y-1.5 text-xs text-neutral-600`}>
                              {section.items.map((item, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className={`${section.dotColor} font-semibold mr-1.5 shrink-0`}>•</span>
                                  <span className="leading-relaxed">{item}</span>
                                </li>
                              ))}
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Rules with Mascot 🦉 Cú Văn */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-emerald-50/40 border border-emerald-100 p-5 rounded-2xl space-y-3 relative">
                <div className="flex items-center space-x-2 text-emerald-800">
                  <span className="text-xl">🦉</span>
                  <h4 className="font-heading font-bold text-xs uppercase tracking-wide">Cú Văn khuyến khích 👍</h4>
                </div>
                <ul className="space-y-2 text-[11px] text-emerald-900/90 leading-relaxed">
                  {selectedGenre.aiRules.mustHave.map((rule, idx) => (
                    <li key={idx} className="flex items-start bg-white/60 rounded-lg p-2 border border-emerald-100/50">
                      <span className="text-emerald-500 mr-2 shrink-0">✔</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-rose-50/40 border border-rose-100 p-5 rounded-2xl space-y-3 relative">
                <div className="flex items-center space-x-2 text-rose-800">
                  <span className="text-xl">🦉</span>
                  <h4 className="font-heading font-bold text-xs uppercase tracking-wide">Cú Văn nhắc nhở 🛑</h4>
                </div>
                <ul className="space-y-2 text-[11px] text-rose-900/90 leading-relaxed">
                  {selectedGenre.aiRules.shouldAvoid.map((rule, idx) => (
                    <li key={idx} className="flex items-start bg-white/60 rounded-lg p-2 border border-rose-100/50">
                      <span className="text-rose-500 mr-2 shrink-0">✘</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Topics & Word Bank (2 columns) */}
          <div className="md:col-span-2 space-y-6">
            {/* Đề tài gợi ý */}
            <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-amber-100/30 shadow-sm space-y-3">
              <h4 className="font-heading font-bold text-xs text-neutral-800 uppercase tracking-widest border-b border-neutral-100 pb-2">🎯 Đề tài luyện tập gợi ý</h4>
              <div className="space-y-2">
                {selectedGenre.topics.map((topic, id) => (
                  <motion.div
                    key={id}
                    onClick={() => onStartWriting(selectedGenre.id, topic)}
                    whileHover={{ x: 3 }}
                    className="p-2.5 rounded-xl text-neutral-700 bg-neutral-50/80 hover:bg-gradient-to-r hover:from-amber-50/80 hover:to-orange-50/50 hover:text-amber-900 border border-transparent hover:border-amber-200/60 text-xs transition cursor-pointer flex items-start space-x-2 card-hover"
                  >
                    <span className="text-amber-500 font-semibold shrink-0">•</span>
                    <span className="flex-1 leading-snug">{topic}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Themed Word bank */}
            {vocabData && (
              <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-amber-100/30 shadow-sm space-y-4">
                <h4 className="font-heading font-bold text-xs text-neutral-800 uppercase tracking-widest border-b border-neutral-100 pb-2">🌿 Kho từ vựng đắt giá</h4>
                <div className="space-y-3">
                  {vocabData.categories.map((cat, idx) => {
                    const theme = VOCAB_CATEGORY_THEME[cat.name] || { emoji: '📝', bg: 'bg-neutral-50/60' };
                    return (
                      <div key={idx} className={`${theme.bg} rounded-xl p-3 space-y-2`}>
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center space-x-1">
                          <span>{theme.emoji}</span>
                          <span>{cat.name}</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {cat.words.map((word) => {
                            const isCopied = copiedWord === word;
                            return (
                              <button
                                key={word}
                                onClick={() => handleCopy(word)}
                                className={`px-2.5 py-1 text-xs rounded-full border flex items-center space-x-1 cursor-pointer transition-all duration-200 ${
                                  isCopied
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm'
                                    : 'bg-white/80 hover:bg-white text-neutral-700 border-neutral-200/80 hover:border-amber-300 hover:shadow-sm active:scale-95'
                                }`}
                              >
                                <span>{word}</span>
                                {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-neutral-400 opacity-50" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
