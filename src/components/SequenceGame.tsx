import React, { useState, useEffect } from 'react';
import { EssayType } from '../types';
import { SYLLABUS_DATA } from '../data/syllabus';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Gamepad2, Star, ArrowUp, ArrowDown, HelpCircle, RefreshCw, 
  CheckCircle, AlertCircle, PlayCircle
} from 'lucide-react';

// Card definition
interface OutlineCard {
  id: string;
  correctIndex: number;
  text: string;
}

// 5 predefined scrambled exercises reflecting the 5 distinct styles
const SEQUENCE_EXERCISES = {
  'ta-canh': [
    { text: '❶ Mở bài: Giới thiệu hồ nước xanh ngắt, trong mát mùa thu.', correctIndex: 0 },
    { text: '❷ Thân bài (Bao quát): Tả làn mây bồng bềnh nhẹ trôi, gió heo may se lạnh.', correctIndex: 1 },
    { text: '❸ Thân bài (Chi tiết): Tiếng khua mái chèo róc rách, rặng liễu xõa bóng dịu hiền.', correctIndex: 2 },
    { text: '❹ Thân bài (Nổi bật): Bóng mặt trời đỏ ửng nhuộm sắc hoàng hôn lấp lánh như dát vàng.', correctIndex: 3 },
    { text: '❺ Kết bài: Thể hiện lòng mong mỏi giữ hồ sạch trong, hứa ghé thăm mùa sau.', correctIndex: 4 }
  ],
  'ke-chuyen-sang-tao': [
    { text: '❶ Mở bài: Minh lặn lội tìm thấy một quả trứng lấp lánh lạ thường rưới chân đồi rộng.', correctIndex: 0 },
    { text: '❷ Thân bài (Khởi phát): Quả trứng bỗng tách rách, bộc lộ một chú chim nhỏ có cánh vàng thần kỳ.', correctIndex: 1 },
    { text: '❸ Thân bài (Biến cố): Thợ săn hung ác kéo lưới bắt chim con, Minh dũng cảm can ngăn trì kéo.', correctIndex: 2 },
    { text: '❹ Thân bài (Cao trào): Chim vàng vụt bay gõ cánh tạo gió xoáy cuốn lưới săn bắt, cứu nguy.', correctIndex: 3 },
    { text: '❺ Kết bài: Minh thả chú chim rực rỡ về bầy, khắc ghi bài học tình bạn lớn lao.', correctIndex: 4 }
  ],
  'cam-xuc-nhan-vat': [
    { text: '❶ Mở bài: Giới thiệu nhân vật chú Dế Mèn hối lỗi trong trang truyện "Dế Mèn phiêu lưu ký".', correctIndex: 0 },
    { text: '❷ Thân bài (Ấn tượng): Em gặp gỡ chú rực rỡ phong sương khi đọc lướt sách hè năm ngoái.', correctIndex: 1 },
    { text: '❸ Thân bài (Đắc sắc ngoại hình): Đôi càng rẫm mẫm bóng, sợi râu cứng uốn cong tưng bừng kiêu hãnh.', correctIndex: 2 },
    { text: '❹ Thân bài (Lay động): Dế Mèn bật tiếng khóc nức nở hối hận tạ lỗi trước mộ người bạn Dế Choắt đáng thương.', correctIndex: 3 },
    { text: '❺ Kết bài: Em tự nhắc nhở bản thân bỏ thói kiêu căng phách lối như bài học Dế Mèn.', correctIndex: 4 }
  ],
  'cam-xuc-su-viec': [
    { text: '❶ Mở bài: Nêu hoàn cảnh cùng các bạn tham gia dọn rác bãi cát biển rực nắng.', correctIndex: 0 },
    { text: '❷ Thân bài (Diễn tiến): Chia hai nhóm hăng say nhặt bao nilon, vỏ sữa trôi dạt sóng biển nhạt nhòa.', correctIndex: 1 },
    { text: '❸ Thân bài (Cảm xúc rần rần): Mồ hôi nhỏ đọt lấp lánh, tiếng hát bè cười vui dẹp mỏi mệt nắng gắt.', correctIndex: 2 },
    { text: '❹ Thân bài (Ý nghĩa thắt nút): Ánh mắt cám ơn chân thành của bác ngư dân lớn tuổi đứng ngoài mạn thuyền.', correctIndex: 3 },
    { text: '❺ Kết bài: Thầm tự hào rộn ràng thấy bãi biển uốn quanh xanh thắm lộng gió đẹp tự nhiên.', correctIndex: 4 }
  ],
  'neu-y-kien': [
    { text: '❶ Mở bài: Giới thiệu luận điểm quan trọng lớp học lớp 5 có nên bắt buộc học thêm hay không.', correctIndex: 0 },
    { text: '❷ Thân bài (Luận điểm 1): Em đồng ý vì tự học cần kế hoạch, học thêm có thầy cô chỉnh sửa bài chuẩn.', correctIndex: 1 },
    { text: '❸ Thân bài (Dẫn chứng thực tế): Ví dụ bài văn của em tăng từ 6 lên 8.5 điểm nhờ cô phụ đạo thầm lặng.', correctIndex: 2 },
    { text: '❹ Thân bài (Phản biện trái chiều): Tất nhiên chúng ta cũng cần chú trọng nghỉ ngơi, chừa thời giờ thể chất tự do.', correctIndex: 3 },
    { text: '❺ Kết bài: Học thêm đúng nhịp chính là bệ phóng tự tin tỏa sáng năng lực thích đáng.', correctIndex: 4 }
  ]
};

// Shuffling helper
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Sortable item wrapper
function SortableItem({ id, text, onMoveUp, onMoveDown, isFirst, isLast }: { 
  id: string; 
  text: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold bg-white cursor-grab active:cursor-grabbing select-none transition-shadow ${
        isDragging 
          ? 'border-amber-400 shadow-lg ring-2 ring-amber-300/40 bg-amber-50/30' 
          : 'border-neutral-200 shadow-sm hover:border-amber-200 hover:bg-amber-50/20'
      }`}
    >
      <div className="flex items-center space-x-3 flex-1" {...attributes} {...listeners}>
        <div className="flex-1 text-neutral-700 leading-relaxed pr-2">{text}</div>
      </div>
      
      {/* Fallback buttons for instant accessibility inside iframe containers */}
      <div className="flex items-center space-x-1 shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
          disabled={isFirst}
          className={`p-1.5 rounded-lg border text-neutral-500 cursor-pointer ${
            isFirst ? 'opacity-30 cursor-not-allowed' : 'hover:bg-neutral-100 hover:text-neutral-800'
          }`}
          title="Di chuyển lên"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
          disabled={isLast}
          className={`p-1.5 rounded-lg border text-neutral-500 cursor-pointer ${
            isLast ? 'opacity-30 cursor-not-allowed' : 'hover:bg-neutral-100 hover:text-neutral-800'
          }`}
          title="Di chuyển xuống"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function SequenceGame() {
  const [selectedGenreId, setSelectedGenreId] = useState<EssayType>('ta-canh');
  const [cards, setCards] = useState<OutlineCard[]>([]);
  const [gameStatus, setGameStatus] = useState<'playing' | 'checked'>('playing');
  const [scoreResult, setScoreResult] = useState<{ stars: number; feedback: string } | null>(null);

  // Load and scrambled cards on genre swap
  useEffect(() => {
    initializeGame();
  }, [selectedGenreId]);

  const initializeGame = () => {
    const rawData = SEQUENCE_EXERCISES[selectedGenreId];
    const initialCards: OutlineCard[] = rawData.map((item, id) => ({
      id: `card_${selectedGenreId}_${id}`,
      correctIndex: item.correctIndex,
      text: item.text
    }));
    // Continuously scramble until it is NOT equal to the target order (to avoid instant victory)
    let scrambled = shuffleArray(initialCards);
    while (JSON.stringify(scrambled.map(c => c.correctIndex)) === JSON.stringify([0, 1, 2, 3, 4])) {
      scrambled = shuffleArray(initialCards);
    }
    setCards(scrambled);
    setGameStatus('playing');
    setScoreResult(null);
  };

  // Keyboard and pointer configuration
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setCards((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleManualMove = (idx: number, direction: 'up' | 'down') => {
    if (direction === 'up' && idx > 0) {
      const updated = [...cards];
      const temp = updated[idx];
      updated[idx] = updated[idx - 1];
      updated[idx - 1] = temp;
      setCards(updated);
    } else if (direction === 'down' && idx < cards.length - 1) {
      const updated = [...cards];
      const temp = updated[idx];
      updated[idx] = updated[idx + 1];
      updated[idx + 1] = temp;
      setCards(updated);
    }
  };

  const handleCheckSequence = () => {
    // Score calculations
    let correctCount = 0;
    cards.forEach((card, currentIdx) => {
      if (card.correctIndex === currentIdx) {
        correctCount++;
      }
    });

    const percent = correctCount / cards.length;
    let stars = 1;
    if (percent === 1) stars = 10;
    else if (percent >= 0.8) stars = 8;
    else if (percent >= 0.6) stars = 6;
    else if (percent >= 0.4) stars = 4;
    else stars = 2;

    let feedback = '';
    if (stars === 10) {
      feedback = 'Xuất sắc tuyệt vời! Em tự mình giải mã logic cực mượt. Bố cục 3 phần Mở - Thân - Kết của dạng văn tự nhiên uốn lượn đúng trình tự chuẩn mực lớp 5.';
    } else if (stars >= 8) {
      feedback = 'Tốt lắm! Em chỉ còn mâu thuẫn nhỏ ở phần sắp đặt chi tiết lồng ghép tả nổi bật. Hãy nhìn kỹ ký hiệu chữ số và lập luận tinh ranh thử lại lần nữa xem sao!';
    } else if (stars >= 5) {
      feedback = 'Khá rồi, nhưng tư duy dàn ý và trình tự chuyển đoạn chính phụ đang hơi lộn xộn. Nhớ quy luật tả rộng trước, zoom chi tiết hẹp sau kết đọng cảm xúc em nhé!';
    } else {
      feedback = 'Cố gắng lên nhé! Đọc kỹ bài gợi ý ở Thư viện dạng bài rồi bình tĩnh click phím mũi tên kéo các phần mở đầu lên trên cùng.';
    }

    setScoreResult({ stars, feedback });
    setGameStatus('checked');
  };

  const currentSyllabus = SYLLABUS_DATA.find(s => s.id === selectedGenreId) || SYLLABUS_DATA[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-1 md:p-4">
      {/* Game instructions panel (1 Column) */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-amber-900 border-b border-neutral-100 pb-3">
            <Gamepad2 className="w-5 h-5 text-amber-600 animate-bounce" />
            <span className="font-extrabold text-sm uppercase tracking-wide">Trò Chơi Sắp Đặt Dàn Ý</span>
          </div>

          <p className="text-xs text-neutral-600 leading-relaxed">
            Các thẻ dàn ý cấu trúc bài viết của <strong className="text-amber-800">"{currentSyllabus.title}"</strong> đã bị biến động lộn xộn mất thứ tự lập luận chuẩn.
          </p>

          <p className="text-xs text-neutral-600 leading-relaxed">
            <strong>Cách chơi:</strong> Di con trỏ kéo thả vị trí thẻ hoặc click vào nút mũi tên <span className="bg-neutral-100 text-[10px] px-1.5 py-0.5 rounded-sm font-bold">▲/▼</span> từng thẻ để hoán chuyển vị trí. Xếp sao cho trình tự Mở bài, Thân bài bao quát, Thân bài miêu tả chi tiết, Thân bài làm rõ nổi bật và Kết bài đúng tiến trình nhất có thể!
          </p>

          {/* Genre switchers */}
          <div className="space-y-2 pt-2 border-t border-neutral-100">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Chọn chủ đề chơi:</span>
            <div className="grid grid-cols-2 gap-2">
              {SYLLABUS_DATA.map((genre) => {
                const isSelected = selectedGenreId === genre.id;
                return (
                  <button
                    key={genre.id}
                    onClick={() => setSelectedGenreId(genre.id as EssayType)}
                    className={`py-2 px-1 text-center font-bold text-[10.5px] rounded-lg border transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border-neutral-100'
                    }`}
                  >
                    {genre.emoji} {genre.title.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Tips Box */}
        <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-100/50 space-y-2">
          <div className="flex items-center space-x-1 text-amber-900 font-bold text-xs">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span>Mẹo vàng logic lớp 5:</span>
          </div>
          <ul className="text-[11px] text-amber-800/95 space-y-1 pl-4 list-decimal leading-relaxed">
            <li>Mở bài luôn là bước khởi phát đặt vấn đề.</li>
            <li>Tả cảnh: Bao quát không gian rộng trước, chi tiết đặc chất sau.</li>
            <li>Kể chuyện: Thắt biến cố rồi mới đến đỉnh cao trào hành động.</li>
            <li>Kết bài khép lại tình thâm giữ gìn.</li>
          </ul>
        </div>
      </div>

      {/* Main Sortable cards view (2 Columns) */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-100 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wider">Khu vực bàn sắp xếp quân bài</h3>
            <p className="text-xs text-neutral-400 mt-1">Lập trình dàn bài cho dạng {currentSyllabus.title}</p>
          </div>
          <button
            onClick={initializeGame}
            className="flex items-center space-x-1 border border-neutral-200 text-neutral-500 hover:text-amber-800 hover:border-amber-100 px-3 py-1.5 rounded-lg text-xs transition bg-white cursor-pointer select-none"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Xáo trộn lại 🎲</span>
          </button>
        </div>

        {/* Checked results banner */}
        <AnimatePresence>
          {gameStatus === 'checked' && scoreResult && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center gap-4 ${
                scoreResult.stars === 10
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-900'
                  : 'bg-amber-50 border-amber-100 text-amber-900'
              }`}
            >
              {/* Star review icons */}
              <div className="text-center shrink-0 bg-white/95 py-2 px-3.5 rounded-xl border border-amber-200 shadow-xs flex flex-col items-center">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Đánh giá</span>
                <div className="flex items-center text-amber-500 font-extrabold text-2xl mt-1 space-x-1">
                  <Star className="w-6 h-6 fill-amber-400 text-amber-500 animate-pulse" />
                  <span>{scoreResult.stars}/10</span>
                </div>
                <span className="text-[9px] text-amber-600 mt-0.5 font-bold">⭐ đạt chuẩn</span>
              </div>

              <div className="space-y-1 flex-1 text-center sm:text-left">
                <h4 className="font-bold text-xs uppercase flex items-center justify-center sm:justify-start space-x-1">
                  {scoreResult.stars === 10 ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Xác quyết: Logic hoàn hảo!</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Cố gắng thêm chút nữa!</span>
                    </>
                  )}
                </h4>
                <p className="text-[11px] leading-relaxed opacity-95">
                  {scoreResult.feedback}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Interactive Sortable Game area */}
        <div className="space-y-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={cards.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2.5">
                {cards.map((card, idx) => {
                  // If evaluated, show checks for position
                  const isCorrect = gameStatus === 'checked' && card.correctIndex === idx;
                  const isIncorrect = gameStatus === 'checked' && card.correctIndex !== idx;

                  return (
                    <div key={card.id} className="relative">
                      {/* Left color ribbon for status visual feedback */}
                      <div className={`absolute top-0 left-0 w-1.5 h-full rounded-l-xl z-20 ${
                        isCorrect 
                          ? 'bg-emerald-500' 
                          : isIncorrect 
                            ? 'bg-rose-400' 
                            : 'bg-amber-400/70'
                      }`} />

                      <SortableItem
                        id={card.id}
                        text={card.text}
                        onMoveUp={() => handleManualMove(idx, 'up')}
                        onMoveDown={() => handleManualMove(idx, 'down')}
                        isFirst={idx === 0}
                        isLast={idx === cards.length - 1}
                      />

                      {/* Evaluated Badge */}
                      {gameStatus === 'checked' && (
                        <div className="absolute right-28 top-3.5 z-20 hidden sm:block">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                            isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {isCorrect ? 'VỊ TRÍ ĐÚNG ✓' : 'SAI SẮP ĐẶT ✘'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Submit review footer */}
        <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
          <button
            onClick={initializeGame}
            className="px-4 py-2 hover:bg-neutral-50 text-neutral-600 text-xs rounded-xl font-bold border transition cursor-pointer select-none"
          >
            Xếp Lại Mới
          </button>

          <button
            id="check-sequence-btn"
            onClick={handleCheckSequence}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-xs transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Nộp Bài Chấm Điểm 🌟</span>
          </button>
        </div>
      </div>
    </div>
  );
}
