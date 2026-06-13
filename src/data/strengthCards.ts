export interface StrengthCard {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
}

export const STRENGTH_CARDS: StrengthCard[] = [
  { id: 'gratitude', name: 'Lòng biết ơn', emoji: '🙏', color: 'amber', description: 'Biết trân trọng những điều tốt đẹp xung quanh mình' },
  { id: 'courage', name: 'Sự dũng cảm', emoji: '🦁', color: 'orange', description: 'Dám nói lên suy nghĩ và đối mặt với thử thách' },
  { id: 'patience', name: 'Sự kiên nhẫn', emoji: '🐢', color: 'emerald', description: 'Kiên trì rèn luyện từng ngày để tiến bộ' },
  { id: 'joy', name: 'Niềm vui', emoji: '🌻', color: 'yellow', description: 'Lan tỏa năng lượng tích cực trong bài viết' },
  { id: 'empathy', name: 'Sự thấu cảm', emoji: '💗', color: 'pink', description: 'Hiểu và chia sẻ cảm xúc của nhân vật, con người' },
  { id: 'creativity', name: 'Sáng tạo', emoji: '🎨', color: 'purple', description: 'Tưởng tượng phong phú, ý tưởng độc đáo' },
  { id: 'teamwork', name: 'Tinh thần đồng đội', emoji: '🤝', color: 'blue', description: 'Biết hợp tác và lắng nghe ý kiến bạn bè' },
  { id: 'curiosity', name: 'Trí tò mò', emoji: '🔍', color: 'teal', description: 'Ham học hỏi, khám phá thế giới qua con chữ' },
];

export const EMOTION_TAGS = [
  { id: 'grateful', name: 'Biết ơn', emoji: '🙏' },
  { id: 'proud', name: 'Tự hào', emoji: '🏆' },
  { id: 'happy', name: 'Vui vẻ', emoji: '😊' },
  { id: 'touched', name: 'Xúc động', emoji: '🥹' },
  { id: 'brave', name: 'Dũng cảm', emoji: '💪' },
  { id: 'thoughtful', name: 'Suy tư', emoji: '🤔' },
];
