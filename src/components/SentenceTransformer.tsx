import React, { useState } from 'react';
import { Wand2, Loader2, Copy, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { callGeminiApiDirectly } from '../utils/geminiDirect';

interface Variation {
  style: string;
  text: string;
  explanation: string;
}

interface SentenceTransformerProps {
  genreId: string;
  apiKey?: string;
  selectedModel?: string;
}

const STYLE_COLORS: Record<string, { bg: string; text: string; border: string; emoji: string }> = {
  'Nhân hóa': { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200', emoji: '🧙' },
  'So sánh': { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', emoji: '🔗' },
  'Từ láy & Giác quan': { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', emoji: '🎨' },
};

export default function SentenceTransformer({ genreId, apiKey, selectedModel }: SentenceTransformerProps) {
  const [sentence, setSentence] = useState('');
  const [isTransforming, setIsTransforming] = useState(false);
  const [result, setResult] = useState<{ original: string; variations: Variation[] } | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleTransform = async () => {
    if (!sentence.trim()) return;
    setIsTransforming(true);
    setResult(null);

    const getMockResult = (s: string) => ({
      original: s,
      variations: [
        { style: 'Nhân hóa', text: `${s.replace(/\.$/, '')} như một người bạn hiền dịu, luôn thầm lặng dõi theo chúng em.`, explanation: 'Biến sự vật thành con người có cảm xúc, hành động sống động.' },
        { style: 'So sánh', text: `${s.replace(/\.$/, '')}, tựa như một bức tranh thiên nhiên tuyệt đẹp mà tạo hóa ban tặng.`, explanation: 'Dùng hình ảnh quen thuộc để người đọc hình dung rõ hơn.' },
        { style: 'Từ láy & Giác quan', text: `${s.replace(/\.$/, '')}, lừng lững, mát rượi, tỏa bóng mát cho cả sân trường.`, explanation: 'Từ láy gợi hình ảnh, âm thanh, xúc giác sinh động hơn.' }
      ]
    });

    try {
      const res = await fetch('/api/gemini/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'x-api-key': apiKey } : {}) },
        body: JSON.stringify({ sentence: sentence.trim(), type: genreId, model: selectedModel })
      });
      const data = await res.json();
      if (!data.variations || data.error) {
        throw new Error(data?.error || 'Invalid API response');
      }
      setResult(data);
    } catch (err) {
      console.warn('Gemini sentence transform failed, trying direct client call:', err);
      if (apiKey) {
        try {
          const directData = await callGeminiApiDirectly({
            action: 'transform',
            sentence: sentence.trim(),
            type: genreId,
            model: selectedModel,
            apiKey
          });
          setResult(directData);
          setIsTransforming(false);
          return;
        } catch (directErr) {
          console.error('Direct client-side Gemini transform failed:', directErr);
        }
      }
      setResult(getMockResult(sentence.trim()));
    } finally {
      setIsTransforming(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-purple-50/40 to-blue-50/30 rounded-2xl border border-purple-100/40 p-5 space-y-4">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
          <Wand2 className="w-4 h-4 text-purple-600" />
        </div>
        <div>
          <h4 className="text-xs font-heading font-bold text-neutral-800">✨ Biến hóa Câu Văn</h4>
          <p className="text-[10px] text-neutral-500">Nhập 1 câu đơn giản → nhận 3 phiên bản nâng cấp</p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleTransform()}
          placeholder='VD: "Cây bàng rất to"'
          className="flex-1 py-2.5 px-4 text-xs rounded-xl border border-neutral-200 focus:border-purple-400 focus:outline-none bg-white transition placeholder-neutral-400"
        />
        <button
          onClick={handleTransform}
          disabled={isTransforming || !sentence.trim()}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold rounded-xl text-xs transition shadow-md disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
        >
          {isTransforming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>Biến hóa!</span>
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2.5"
          >
            {result.variations.map((v, idx) => {
              const colors = STYLE_COLORS[v.style] || { bg: 'bg-neutral-50', text: 'text-neutral-800', border: 'border-neutral-200', emoji: '📝' };
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`${colors.bg} ${colors.border} border rounded-xl p-3.5 space-y-2`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`${colors.text} text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1`}>
                      <span>{colors.emoji}</span>
                      <span>{v.style}</span>
                    </span>
                    <button
                      onClick={() => handleCopy(v.text, idx)}
                      className="text-neutral-400 hover:text-neutral-600 transition cursor-pointer"
                    >
                      {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-xs text-neutral-800 font-medium leading-relaxed italic">"{v.text}"</p>
                  <p className="text-[10px] text-neutral-500 leading-relaxed">💡 {v.explanation}</p>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
