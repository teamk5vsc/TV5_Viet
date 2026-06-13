import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { callGeminiApiDirectly } from '../utils/geminiDirect';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  outlinePart?: { section: string; content: string[] } | null;
}

interface AIChatScaffoldProps {
  topic: string;
  genreId: string;
  apiKey?: string;
  selectedModel?: string;
}

export default function AIChatScaffold({ topic, genreId, apiKey, selectedModel }: AIChatScaffoldProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [collectedOutline, setCollectedOutline] = useState<{ mobi: string[]; thanbi: string[]; ketbi: string[] }>({ mobi: [], thanbi: [], ketbi: [] });
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Dynamic welcome message and clear outline on genre change
  useEffect(() => {
    const welcomeMessages: Record<string, string> = {
      'ta-canh': '🦉 Chào bạn nhỏ! Mình là Cú Văn đây! Hôm nay chúng mình sẽ cùng xây dựng bản đồ ý tưởng cho bài Văn tả cảnh nhé. Bạn sẵn sàng chưa? Hãy cho mình biết em muốn miêu tả cảnh vật nào nào?',
      'ke-chuyen-sang-tao': '🦉 Chào bạn nhỏ! Mình là Cú Văn đây! Hôm nay chúng mình sẽ cùng sáng tạo một câu chuyện kể thật thú vị nhé. Bạn sẵn sàng chưa? Hãy kể cho mình biết chủ đề truyện em định viết là gì thế?',
      'cam-xuc-nhan-vat': '🦉 Chào bạn nhỏ! Mình là Cú Văn đây! Chúng mình cùng viết bày tỏ tình cảm về một nhân vật nhé. Em sẵn sàng chưa? Hãy cho mình biết nhân vật nào để lại cho em nhiều cảm xúc nhất?',
      'cam-xuc-su-viec': '🦉 Chào bạn nhỏ! Mình là Cú Văn đây! Mỗi sự việc ý nghĩa quanh ta đều chứa đựng nhiều cảm xúc. Bạn đã sẵn sàng chưa? Hãy kể cho mình biết sự việc hay hoạt động nào em muốn bày tỏ tình cảm hôm nay?',
      'neu-y-kien': '🦉 Chào bạn nhỏ! Mình là Cú Văn đây! Hôm nay chúng mình sẽ lập luận để bày tỏ ý kiến đồng tình / phản đối trước một vấn đề nhé. Em sẵn sàng chưa? Cho mình biết vấn đề nghị luận em định bàn tới là gì thế?',
      'cam-xuc-cau-chuyen': '🦉 Chào bạn nhỏ! Mình là Cú Văn đây! Hôm nay chúng mình sẽ cùng bày tỏ cảm xúc về một câu chuyện đầy ý nghĩa nhé. Bạn đã sẵn sàng chưa? Cho mình biết tên câu chuyện em muốn chia sẻ nào?',
      'cam-xuc-bai-tho': '🦉 Chào bạn nhỏ! Mình là Cú Văn đây! Những vần thơ ngọt ngào luôn chứa đựng nhiều xúc cảm. Hôm nay chúng mình sẽ viết cảm xúc về một bài thơ nhé. Em muốn chia sẻ bài thơ nào thế?',
      'gioi-thieu-nhan-vat-sach': '🦉 Chào bạn nhỏ! Mình là Cú Văn đây! Hôm nay chúng mình sẽ cùng giới thiệu một nhân vật ấn tượng trong một cuốn sách em đã đọc nhé. Nhân vật đó tên là gì và ở cuốn sách nào vậy em?',
      'gioi-thieu-nhan-vat-hoat-hinh': '🦉 Chào bạn nhỏ! Mình là Cú Văn đây! Thế giới hoạt hình chứa đựng bao sắc màu kỳ diệu. Hôm nay chúng mình sẽ cùng giới thiệu một nhân vật hoạt hình em yêu thích nhé. Đó là nhân vật nào vậy ta?',
      'ta-nguoi': '🦉 Chào bạn nhỏ! Mình là Cú Văn đây! Hôm nay chúng mình sẽ cùng tả một người gần gũi, yêu thương trong cuộc sống của em nhé. Người em định miêu tả là ai thế?',
      'lap-chuong-trinh-hoat-dong': '🦉 Chào bạn nhỏ! Mình là Cú Văn đây! Việc lập kế hoạch sẽ giúp các hoạt động tập thể diễn ra thật trơn tru. Hôm nay chúng mình sẽ cùng lập một chương trình hoạt động nhé. Em định tổ chức hoạt động nào?',
    };
    
    const welcomeText = welcomeMessages[genreId] || welcomeMessages['ta-canh'];
    setMessages([
      { role: 'assistant', content: welcomeText, outlinePart: null }
    ]);
    setCollectedOutline({ mobi: [], thanbi: [], ketbi: [] });
  }, [genreId]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    const userMsgCount = updatedMessages.filter(m => m.role === 'user').length;

    // Helper: get mock response based on message count and genre
    const getMockReply = () => {
      const genreReplies: Record<string, Array<{ reply: string; suggestedOutlinePart: any }>> = {
        'ta-canh': [
          { 
            reply: '🦉 Chủ đề tả cảnh thật tuyệt! Bạn nhỏ hãy miêu tả cụ thể hơn: bạn muốn ngắm nhìn cảnh vật vào thời điểm nào trong ngày (buổi sáng, buổi chiều, hoàng hôn...) và ở đâu thế?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Thời điểm và không gian rất đẹp! Bây giờ, bạn nhỏ hãy tưởng tượng mình đang đứng ở đó: bạn nhìn thấy những hình ảnh hay màu sắc nào nổi bật nhất?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Tuyệt vời! Những chi tiết màu sắc rất sắc nét. Mình gợi ý phần Mở bài nhé. Tiếp theo, bạn nhỏ có nghe thấy âm thanh gì đặc trưng xung quanh không (tiếng chim hót, tiếng sóng vỗ, tiếng gió rì rào, hay tiếng cười đùa của các bạn)?', 
            suggestedOutlinePart: { 
              section: 'mobi', 
              content: [
                `Giới thiệu cảnh vật định miêu tả: ${topic || 'Cảnh đẹp thiên nhiên'}`,
                'Nêu thời điểm quan sát và ấn tượng, cảm xúc bao quát đầu tiên.'
              ] 
            } 
          },
          { 
            reply: '🦉 Nghe sống động quá! Hãy kể thêm cho mình 2 hoạt động của con người hoặc con vật đang diễn ra trong cảnh vật đó nhé.', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Quá đầy đủ ý tưởng! Đây là gợi ý phần Thân bài dựa trên ý kiến của bạn nhỏ. Cuối cùng, em có cảm xúc gì sâu sắc nhất khi ngắm nhìn và gắn bó với cảnh vật này?', 
            suggestedOutlinePart: { 
              section: 'thanbi', 
              content: [
                'Tả bao quát: Cảm nhận không gian rộng lớn, thời tiết mát mẻ dễ chịu.',
                'Tả chi tiết: Điểm xuyết các sự vật tĩnh lặng (cây cối, bầu trời, mặt nước) bằng các tính từ miêu tả đặc trưng.',
                'Tả động: Kết hợp hoạt động của con người, muông thú và các âm thanh xôn xao làm cảnh vật sinh động.'
              ] 
            } 
          },
          { 
            reply: '🦉 Cảm xúc thật ấm áp và đáng quý! Đây là gợi ý phần Kết bài để hoàn thiện bản đồ ý tưởng tả cảnh của em.', 
            suggestedOutlinePart: { 
              section: 'ketbi', 
              content: [
                'Khẳng định tình cảm yêu quý, gắn bó tha thiết với cảnh vật.',
                'Nêu mong muốn hoặc hành động thiết thực để bảo vệ, giữ gìn vẻ đẹp đó.'
              ] 
            } 
          }
        ],
        'ke-chuyen-sang-tao': [
          { 
            reply: '🦉 Kể chuyện sáng tạo là một thế giới giàu trí tưởng tượng! Đề tài rất thú vị. Bạn nhỏ muốn đóng vai kể câu chuyện này dưới góc nhìn của nhân vật nào thế?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Góc nhìn rất độc đáo! Câu chuyện của bạn nhỏ sẽ bắt đầu bằng sự việc bất ngờ nào để khơi gợi sự tò mò của người nghe?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Một khởi đầu đầy hứa hẹn! Mình gợi ý phần Mở bài nhé. Tiếp theo, biến cố hay thử thách chính nào sẽ xảy ra với nhân vật trong câu chuyện của em?', 
            suggestedOutlinePart: { 
              section: 'mobi', 
              content: [
                `Giới thiệu câu chuyện định kể sáng tạo dựa trên đề tài: ${topic || 'Câu chuyện mới'}`,
                'Nêu nhân vật đóng vai kể và hoàn cảnh xuất hiện đặc biệt ban đầu.'
              ] 
            } 
          },
          { 
            reply: '🦉 Tình huống thật kịch tính! Nhân vật chính sẽ làm gì để vượt qua thử thách này, hoặc có ai giúp đỡ không?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Câu chuyện vô cùng hấp dẫn! Đây là gợi ý phần Thân bài chi tiết. Cuối cùng, kết cục câu chuyện sẽ thế nào và để lại bài học ý nghĩa gì?', 
            suggestedOutlinePart: { 
              section: 'thanbi', 
              content: [
                'Sự việc khơi mào: Tình huống phát sinh yếu tố mới lạ, khác biệt chuyện gốc.',
                'Diễn biến câu chuyện: Hành động của vai kể và các nhân vật phụ đối mặt với khó khăn.',
                'Cao trào: Đỉnh điểm thử thách buộc nhân vật phải đưa ra lựa chọn hoặc hành động quyết định.'
              ] 
            } 
          },
          { 
            reply: '🦉 Ý nghĩa sâu sắc quá! Đây là phần Kết bài gợi ý để bạn nhỏ hoàn thành bản đồ ý tưởng kể chuyện sáng tạo của mình.', 
            suggestedOutlinePart: { 
              section: 'ketbi', 
              content: [
                'Khép lại câu chuyện với kết thúc nhân văn, bất ngờ.',
                'Rút ra bài học cuộc sống sâu sắc hoặc thông điệp ý nghĩa gửi gắm người đọc.'
              ] 
            } 
          }
        ],
        'cam-xuc-nhan-vat': [
          { 
            reply: '🦉 Bày tỏ tình cảm về nhân vật văn học giúp chúng ta cảm nhận sâu sắc hơn! Bạn nhỏ muốn viết về nhân vật nào và trong tác phẩm nào thế?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Một nhân vật rất đáng nhớ! Điều gì ở nhân vật này (ngoại hình, tính cách, lời nói, hành động) làm bạn nhỏ ấn tượng nhất?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Ấn tượng thật rõ nét! Mình gợi ý phần Mở bài nhé. Tiếp theo, chi tiết hay hành động nào trong tác phẩm thể hiện rõ phẩm chất quý báu của nhân vật đó?', 
            suggestedOutlinePart: { 
              section: 'mobi', 
              content: [
                `Giới thiệu nhân vật văn học định bày tỏ tình cảm: ${topic || 'Nhân vật đáng yêu'}`,
                'Khái quát cảm xúc mến mộ, ấn tượng sâu sắc chung về nhân vật.'
              ] 
            } 
          },
          { 
            reply: '🦉 Những dẫn chứng rất thuyết phục! Bạn nhỏ học hỏi được điều gì quý báu từ phẩm chất hay cách ứng xử của nhân vật này?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Suy nghĩ rất chân thành! Đây là gợi ý phần Thân bài của em. Cuối cùng, tình cảm đọng lại lâu dài của em dành cho nhân vật là gì?', 
            suggestedOutlinePart: { 
              section: 'thanbi', 
              content: [
                'Trình bày cảm xúc về ngoại hình hoặc hành động đặc trưng đầu tiên của nhân vật.',
                'Phân tích tình cảm đối với phẩm chất đáng quý của nhân vật qua các tình huống cụ thể.',
                'Bộc lộ sự đồng cảm với hoàn cảnh, số phận hoặc suy nghĩ của nhân vật.'
              ] 
            } 
          },
          { 
            reply: '🦉 Rất quý giá! Đây là Kết bài gợi ý để hoàn thiện dàn ý bày tỏ tình cảm nhân vật.', 
            suggestedOutlinePart: { 
              section: 'ketbi', 
              content: [
                'Khẳng định lại sức sống của nhân vật và tình cảm yêu mến của bản thân.',
                'Liên hệ thực tế hoặc nêu bài học tự rèn luyện rút ra.'
              ] 
            } 
          }
        ],
        'cam-xuc-su-viec': [
          { 
            reply: '🦉 Mỗi sự việc trôi qua đều để lại cảm xúc riêng! Bạn nhỏ muốn chia sẻ suy nghĩ và bày tỏ cảm xúc về sự việc nào thế?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Sự việc rất đáng nhớ! Em đã trực tiếp tham gia hay chứng kiến sự việc đó diễn ra khi nào?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Cột mốc rất ý nghĩa! Mình gợi ý phần Mở bài nhé. Tiếp theo, hành động hoặc hình ảnh nào trong sự việc làm em xúc động nhất?', 
            suggestedOutlinePart: { 
              section: 'mobi', 
              content: [
                `Giới thiệu sự việc, hoạt động ý nghĩa để lại cảm xúc sâu sắc: ${topic || 'Sự việc đáng nhớ'}`,
                'Khái quát ấn tượng và tình cảm bao quát lúc ban đầu.'
              ] 
            } 
          },
          { 
            reply: '🦉 Khoảnh khắc thật xúc động! Sự việc này đã mang lại bài học hay thay đổi suy nghĩ của em thế nào?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Suy tư rất chín chắn! Đây là gợi ý phần Thân bài. Cuối cùng, em muốn nhắn nhủ điều gì đến những người cùng tham gia sự việc đó?', 
            suggestedOutlinePart: { 
              section: 'thanbi', 
              content: [
                'Miêu tả diễn biến sự việc kết hợp bộc lộ cảm xúc dâng trào qua từng mốc thời gian.',
                'Cảm nhận chi tiết về những hình ảnh, lời nói hay cử chỉ ấm áp của con người trong cuộc.',
                'Bày tỏ lòng biết ơn, niềm tự hào hoặc sự trân quý về giá trị của sự việc.'
              ] 
            } 
          },
          { 
            reply: '🦉 Lời nhắn nhủ thật ý nghĩa! Đây là gợi ý Kết bài để hoàn chỉnh dàn ý bày tỏ cảm xúc về sự việc.', 
            suggestedOutlinePart: { 
              section: 'ketbi', 
              content: [
                'Khẳng định ý nghĩa bền vững của sự việc đối với cuộc sống của bản thân.',
                'Nêu lời tự hứa hoặc thông điệp tích cực lan tỏa tới mọi người.'
              ] 
            } 
          }
        ],
        'neu-y-kien': [
          { 
            reply: '🦉 Nêu ý kiến lập luận giúp chúng ta bảo vệ quan điểm rõ ràng! Bạn nhỏ đồng tình hay phản đối ý kiến đề bài nêu ra?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Quan điểm rất rõ ràng! Hãy đưa ra lý do lớn nhất và thuyết phục nhất khiến em bảo vệ quan điểm này nhé.', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Lý lẽ rất đanh thép! Mình gợi ý phần Mở bài nhé. Tiếp theo, em có dẫn chứng thực tế nào từ cuộc sống hoặc học tập để làm rõ lý lẽ trên không?', 
            suggestedOutlinePart: { 
              section: 'mobi', 
              content: [
                `Nêu vấn đề cần bày tỏ ý kiến đồng tình hay phản đối dựa trên chủ đề: ${topic || 'Vấn đề thảo luận'}`,
                'Khẳng định quan điểm, thái độ rõ ràng của bản thân (Đồng tình / Phản đối).'
              ] 
            } 
          },
          { 
            reply: '🦉 Dẫn chứng thực tế rất mạnh mẽ! Để thuyết phục người đọc hơn nữa, em sẽ phản bác lại ý kiến ngược lại như thế nào?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Cách phản biện vô cùng thông minh! Gửi em gợi ý phần Thân bài. Cuối cùng, em muốn kêu gọi mọi người cùng hành động thế nào về vấn đề này?', 
            suggestedOutlinePart: { 
              section: 'thanbi', 
              content: [
                'Đưa ra các lý lẽ thuyết phục bảo vệ quan điểm cá nhân một cách chặt chẽ.',
                'Trình bày các dẫn chứng thực tế sinh động, số liệu hoặc câu chuyện minh họa.',
                'Phản bác ý kiến trái chiều để củng cố thêm tính đúng đắn của lập luận.'
              ] 
            } 
          },
          { 
            reply: '🦉 Thông điệp kêu gọi rất ý nghĩa! Đây là gợi ý Kết bài để hoàn thiện bài văn nêu ý kiến.', 
            suggestedOutlinePart: { 
              section: 'ketbi', 
              content: [
                'Khẳng định lại ý kiến, quan điểm của bản thân về vấn đề.',
                'Đưa ra thông điệp hoặc lời khuyên bổ ích, kêu gọi mọi người cùng nhận thức.'
              ] 
            } 
          }
        ],
        'cam-xuc-cau-chuyen': [
          { 
            reply: '🦉 Bạn nhỏ hãy giới thiệu tên câu chuyện và hoàn cảnh em đã đọc hoặc được nghe kể câu chuyện này nhé.', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Hoàn cảnh đọc truyện rất thú vị! Tiếp theo, chi tiết hoặc tình huống nào trong câu chuyện gây ấn tượng mạnh nhất với bạn nhỏ?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Thật là một chi tiết đắt giá! Mình gợi ý phần Mở bài nhé. Vậy nhân vật nào trong câu chuyện làm em cảm kích, xót thương hoặc khâm phục nhất?', 
            suggestedOutlinePart: { 
              section: 'mobi', 
              content: [
                `Giới thiệu tên câu chuyện em định bày tỏ cảm nghĩ: ${topic || 'Câu chuyện ý nghĩa'}`,
                'Nêu hoàn cảnh đọc/nghe kể và ấn tượng bao quát ban đầu.'
              ] 
            } 
          },
          { 
            reply: '🦉 Nhân vật thật đáng trân trọng! Sau câu chuyện này, bạn nhỏ đã rút ra bài học ý nghĩa nào cho bản thân mình?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Bài học thật sâu sắc! Đây là gợi ý phần Thân bài. Cuối cùng, bạn nhỏ muốn khẳng định lại tình cảm của mình với câu chuyện đó thế nào?', 
            suggestedOutlinePart: { 
              section: 'thanbi', 
              content: [
                'Tóm tắt ngắn sự việc khơi nguồn cảm xúc chính.',
                'Phân tích chi tiết cảm xúc với từng nhân vật/tình huống nổi bật.',
                'Nêu ý nghĩa nhân văn hay thông điệp câu chuyện mang lại.'
              ] 
            } 
          },
          { 
            reply: '🦉 Một tình cảm thật bền chặt! Gửi em gợi ý phần Kết bài để hoàn chỉnh dàn ý của mình.', 
            suggestedOutlinePart: { 
              section: 'ketbi', 
              content: [
                'Khẳng định giá trị câu chuyện theo thời gian và tình cảm dành cho tác phẩm.',
                'Rút ra bài học đạo đức, lời hứa rèn luyện của bản thân.'
              ] 
            } 
          }
        ],
        'cam-xuc-bai-tho': [
          { 
            reply: '🦉 Tên bài thơ và tác giả em chọn là gì? Nhạc điệu hay hình ảnh thơ nào nhen nhóm cảm xúc đầu tiên trong lòng em?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Một tác phẩm rất hay! Bây giờ, em ấn tượng nhất với những hình ảnh thiên nhiên hay con người nào được vẽ lên trong bài thơ?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Các hình ảnh thơ rất giàu sức gợi! Mình gửi ý Mở bài nhé. Tiếp theo, nhịp điệu hay vần điệu của bài thơ gợi cho em cảm giác như thế nào (êm đềm, thiết tha, dồn dập...)?', 
            suggestedOutlinePart: { 
              section: 'mobi', 
              content: [
                `Giới thiệu tên bài thơ và tác giả: ${topic || 'Bài thơ yêu thích'}`,
                'Bộc lộ ấn tượng chung bao quát đầu tiên.'
              ] 
            } 
          },
          { 
            reply: '🦉 Vần thơ nghe réo rắt quá! Bài thơ này đã đánh thức hay khơi gợi tình cảm nào sâu sắc nhất trong tâm hồn bạn nhỏ (tình yêu gia đình, quê hương...)?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Tình cảm thật đẹp và trong sáng! Đây là gợi ý Thân bài. Cuối cùng, bạn nhỏ thấy bài thơ này có giá trị hay ý nghĩa thế nào đối với tâm hồn tuổi thơ của em?', 
            suggestedOutlinePart: { 
              section: 'thanbi', 
              content: [
                'Cảm nhận hình ảnh thơ đẹp và độc đáo nhất.',
                'Cảm nhận nhạc điệu, vần thơ réo rắt gợi cảm.',
                'Phân tích những từ ngữ đắt giá bộc lộ tình thương và sự đồng điệu của tác giả.'
              ] 
            } 
          },
          { 
            reply: '🦉 Tuyệt vời! Gửi bạn nhỏ gợi ý phần Kết bài để hoàn thành dàn ý cảm xúc về bài thơ.', 
            suggestedOutlinePart: { 
              section: 'ketbi', 
              content: [
                'Khẳng định sức sống của bài thơ trong lòng em và sự trân trọng tác giả.',
                'Nêu ý nghĩa của bài thơ đối với đời sống tinh thần của em.'
              ] 
            } 
          }
        ],
        'gioi-thieu-nhan-vat-sach': [
          { 
            reply: '🦉 Cuốn sách em chọn giới thiệu là sách gì? Hãy nêu tên nhân vật chính gây ấn tượng sâu sắc nhất với em nhé.', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Nhân vật này rất đặc biệt! Bạn nhỏ hãy miêu tả một nét ngoại hình hoặc bối cảnh xuất hiện độc đáo nhất của nhân vật nhé.', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Ngoại hình thật sống động! Gợi ý phần Mở bài đây nha. Vậy phẩm chất hay nét tính cách đáng quý nào của nhân vật làm em ngưỡng mộ nhất (dũng cảm, tốt bụng...)?', 
            suggestedOutlinePart: { 
              section: 'mobi', 
              content: [
                `Giới thiệu nhân vật và tên cuốn sách chứa nhân vật đó: ${topic || 'Nhân vật văn học'}`,
                'Khái quát ấn tượng sâu sắc nhất về nhân vật.'
              ] 
            } 
          },
          { 
            reply: '🦉 Tính cách thật tuyệt vời! Em hãy kể lại một hành động hay lời nói cụ thể của nhân vật trong sách thể hiện rõ phẩm chất đó nhé.', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Một dẫn chứng vô cùng thuyết phục! Đây là gợi ý phần Thân bài. Cuối cùng, bạn nhỏ đã học tập được bài học hay rút ra tấm gương rèn luyện nào từ nhân vật này?', 
            suggestedOutlinePart: { 
              section: 'thanbi', 
              content: [
                'Giới thiệu bối cảnh xuất hiện của nhân vật trong trang sách.',
                'Miêu tả đặc điểm ngoại hình phản ánh tính cách.',
                'Khắc họa phẩm chất tốt đẹp thông qua hành động, lời nói cụ thể.'
              ] 
            } 
          },
          { 
            reply: '🦉 Lời hứa tự rèn luyện rất đáng quý! Đây là gợi ý phần Kết bài dành cho em.', 
            suggestedOutlinePart: { 
              section: 'ketbi', 
              content: [
                'Khẳng định giá trị nhân vật truyền cảm hứng tích cực cho người đọc.',
                'Nêu suy nghĩ tình cảm của em dành cho nhân vật và lời hứa noi gương.'
              ] 
            } 
          }
        ],
        'gioi-thieu-nhan-vat-hoat-hinh': [
          { 
            reply: '🦉 Nhân vật hoạt hình em muốn giới thiệu thuộc bộ phim nào? Hãy kể tên chú ấy nhé.', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Một bộ phim hoạt hình siêu vui nhộn! Ngoại hình đầy màu sắc hay nét vẽ ngộ nghĩnh nào của nhân vật làm em thích thú nhất?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Nét vẽ thật ngộ nghĩnh đáng yêu! Đây là gợi ý phần Mở bài nhé. Tiếp theo, nhân vật này có năng lực đặc biệt hay món bảo bối thần kỳ nào thú vị không?', 
            suggestedOutlinePart: { 
              section: 'mobi', 
              content: [
                `Giới thiệu tên nhân vật và bộ phim hoạt hình tương ứng: ${topic || 'Nhân vật hoạt hình'}`,
                'Nêu lý do yêu thích chung về nhân vật.'
              ] 
            } 
          },
          { 
            reply: '🦉 Các bảo bối nghe thật diệu kỳ! Vậy nét tính cách tốt bụng, vui vẻ hay dũng cảm nào của nhân vật làm em quý mến nhất?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Tình bạn và tính cách của nhân vật thật ý nghĩa! Gửi em gợi ý phần Thân bài. Cuối cùng, nhân vật hoạt hình này đã mang lại bài học bổ ích hay niềm vui gì cho tuổi thơ của em?', 
            suggestedOutlinePart: { 
              section: 'thanbi', 
              content: [
                'Miêu tả đặc điểm hình dáng, trang phục ngộ nghĩnh.',
                'Giới thiệu năng lực đặc biệt hoặc bảo bối kỳ diệu.',
                'Phân tích tính cách cốt lõi qua các tình huống hài hước, cảm động trong phim.'
              ] 
            } 
          },
          { 
            reply: '🦉 Niềm vui tuổi thơ thật ngọt ngào! Mình gửi bạn nhỏ gợi ý phần Kết bài nhé.', 
            suggestedOutlinePart: { 
              section: 'ketbi', 
              content: [
                'Khẳng định sự yêu mến của em dành cho nhân vật.',
                'Nêu bài học bổ ích hoặc thông điệp ý nghĩa nhân vật mang lại cho trẻ thơ.'
              ] 
            } 
          }
        ],
        'ta-nguoi': [
          { 
            reply: '🦉 Người mà em muốn tả là ai thế? Hãy nêu mối quan hệ và ấn tượng lớn nhất của em về người ấy nhé.', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Một người vô cùng thân thương! Em hãy miêu tả một vài nét ngoại hình tiêu biểu nhất (như vóc dáng, mái tóc, nụ cười...) của người ấy nhé.', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Nét tả ngoại hình rất chân thực và xúc động! Gợi ý phần Mở bài đây em. Tiếp theo, cử chỉ hay thói quen hoạt động nào của người ấy thể hiện sự quan tâm, chăm sóc dành cho em?', 
            suggestedOutlinePart: { 
              section: 'mobi', 
              content: [
                `Giới thiệu người định tả và mối quan hệ thân thiết với em: ${topic || 'Người thân thương'}`,
                'Nêu ấn tượng bao quát, tình cảm ban đầu dành cho người đó.'
              ] 
            } 
          },
          { 
            reply: '🦉 Sự chăm lo thật ấm áp! Em có kỷ niệm sâu đậm nào đáng nhớ nhất gắn liền với người ấy không?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Kỷ niệm thật ngọt ngào! Đây là gợi ý phần Thân bài văn tả người. Cuối cùng, bạn nhỏ muốn gửi gắm lời chúc hay lời hứa ngoan ngoãn thế nào đến người ấy?', 
            suggestedOutlinePart: { 
              section: 'thanbi', 
              content: [
                'Tả bao quát độ tuổi, vóc dáng, trang phục thường ngày.',
                'Tả chi tiết nét mặt, đôi mắt ấm áp và đôi bàn tay lao động lam lũ.',
                'Tả cử chỉ hoạt động kết hợp kỷ niệm đáng nhớ biểu lộ tình yêu thương chăm sóc.'
              ] 
            } 
          },
          { 
            reply: '🦉 Lòng biết ơn thật hiếu kính! Mình gửi em gợi ý phần Kết bài để hoàn chỉnh dàn ý văn tả người nhé.', 
            suggestedOutlinePart: { 
              section: 'ketbi', 
              content: [
                'Bộc lộ tình cảm yêu mến, kính trọng sâu sắc đối với người được tả.',
                'Nêu lời tự hứa ngoan ngoãn học tập tốt và mong ước tốt đẹp cho người đó.'
              ] 
            } 
          }
        ],
        'lap-chuong-trinh-hoat-dong': [
          { 
            reply: '🦉 Hoạt động tập thể em muốn lập kế hoạch là hoạt động gì thế? Mục đích của buổi sinh hoạt này nhằm đạt được điều gì?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Mục đích rất thiết thực và ý nghĩa! Để bắt đầu, chúng mình cần chuẩn bị những dụng cụ, phương tiện hay ban tổ chức như thế nào?', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Chuẩn bị thật chu đáo! Gửi em gợi ý phần Mở bài nhé. Tiếp theo, em sẽ phân công nhiệm vụ cụ thể cho các nhóm hay cá nhân trong lớp thế nào (ví dụ Tổ 1, Tổ 2 làm gì)?', 
            suggestedOutlinePart: { 
              section: 'mobi', 
              content: [
                `Nêu tên hoạt động tập thể và mục đích, ý nghĩa của chương trình: ${topic || 'Chương trình hoạt động'}`,
                'Xác định thời gian, địa điểm tổ chức cụ thể.'
              ] 
            } 
          },
          { 
            reply: '🦉 Sự phân công rất rõ ràng và công bằng! Hãy nêu trình tự các bước thực hiện chính (trước, trong và sau hoạt động) theo thời gian nhé.', 
            suggestedOutlinePart: null 
          },
          { 
            reply: '🦉 Các bước diễn ra rất khoa học và logic! Gửi em gợi ý phần Thân bài chi tiết. Cuối cùng, hoạt động tập thể này sẽ mang lại niềm vui gắn kết hay ý nghĩa gì cho cả lớp?', 
            suggestedOutlinePart: { 
              section: 'thanbi', 
              content: [
                'Công tác chuẩn bị: dụng cụ, nhân sự, phương tiện đầy đủ.',
                'Phân công cụ thể công việc rõ ràng cho từng tổ/nhóm.',
                'Các bước tiến hành chi tiết theo trình tự thời gian hợp lý.'
              ] 
            } 
          },
          { 
            reply: '🦉 Tinh thần đoàn kết thật tuyệt vời! Đây là gợi ý phần Kết bài để hoàn thành chương trình hoạt động của em.', 
            suggestedOutlinePart: { 
              section: 'ketbi', 
              content: [
                'Khẳng định kết quả tốt đẹp và ý nghĩa sâu sắc hoạt động mang lại.',
                'Nêu ý thức trách nhiệm và niềm vui gắn kết tinh thần đoàn kết tập thể.'
              ] 
            } 
          }
        ]
      };

      const currentReplies = genreReplies[genreId] || genreReplies['ta-canh'];
      const idx = Math.min(Math.max(userMsgCount - 1, 0), currentReplies.length - 1);
      return currentReplies[idx];
    };

    let data;
    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'x-api-key': apiKey } : {}) },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          topic: topic || 'Bài viết tự do', type: genreId, model: selectedModel
        })
      });
      data = await res.json();
      if (!data.reply || data.error) {
        throw new Error(data?.error || 'Invalid API response');
      }
    } catch (err) {
      console.warn('Gemini chat failed, trying direct client call:', err);
      if (apiKey) {
        try {
          data = await callGeminiApiDirectly({
            action: 'chat',
            messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
            topic: topic || 'Bài viết tự do',
            type: genreId,
            model: selectedModel,
            apiKey
          });
        } catch (directErr) {
          console.error('Direct client-side Gemini chat failed:', directErr);
          data = getMockReply();
        }
      } else {
        data = getMockReply();
      }
    }

    try {
      const aiMsg: ChatMessage = { role: 'assistant', content: data.reply, outlinePart: data.suggestedOutlinePart || null };
      setMessages(prev => [...prev, aiMsg]);
      
      if (data.suggestedOutlinePart) {
        const { section, content } = data.suggestedOutlinePart;
        if (section && content && Array.isArray(content)) {
          setCollectedOutline(prev => ({
            ...prev,
            [section]: [...prev[section as keyof typeof prev], ...content]
          }));
        }
      }
    } catch (parseErr) {
      console.error('Failed to update chat message state:', parseErr);
    } finally {
      setIsLoading(false);
    }
  };

  const hasOutline = collectedOutline.mobi.length > 0 || collectedOutline.thanbi.length > 0 || collectedOutline.ketbi.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Chat Area */}
      <div className="lg:col-span-2 bg-white/90 backdrop-blur-sm rounded-2xl border border-amber-100/50 shadow-sm flex flex-col" style={{ height: '500px' }}>
        {/* Chat Header */}
        <div className="p-4 border-b border-amber-100/50 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-xl">🦉</div>
          <div>
            <h3 className="text-sm font-heading font-bold text-neutral-800">Cú Văn đồng hành</h3>
            <p className="text-[10px] text-neutral-500">Hỏi-đáp từng bước để xây dựng dàn ý</p>
          </div>
          {topic && <span className="ml-auto text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-lg truncate max-w-[200px]">{topic}</span>}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-br-md'
                    : 'bg-neutral-50 text-neutral-700 border border-neutral-100 rounded-bl-md'
                }`}>
                  {msg.content}
                  {/* Show outline suggestion card */}
                  {msg.outlinePart && (
                    <div className="mt-3 p-3 bg-white/80 rounded-xl border border-emerald-200/60 text-emerald-900">
                      <div className="flex items-center space-x-1.5 mb-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] font-bold uppercase">Gợi ý {msg.outlinePart.section === 'mobi' ? 'Mở bài' : msg.outlinePart.section === 'thanbi' ? 'Thân bài' : 'Kết bài'}</span>
                      </div>
                      <ul className="space-y-1">
                        {msg.outlinePart.content.map((item, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-emerald-500 mr-1.5">•</span>
                            <span className="text-[11px]">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-neutral-50 border border-neutral-100 rounded-2xl rounded-bl-md px-4 py-3 flex items-center space-x-2">
                <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                <span className="text-xs text-neutral-500">Cú Văn đang suy nghĩ...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-neutral-100">
          <div className="flex items-center space-x-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Gõ câu trả lời cho Cú Văn..."
              className="flex-1 py-2.5 px-4 text-xs rounded-xl border border-neutral-200 focus:border-amber-400 focus:outline-none bg-neutral-50 focus:bg-white transition placeholder-neutral-400"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="p-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl disabled:opacity-50 transition cursor-pointer hover:shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Collected Outline Sidebar */}
      <div className="lg:col-span-1 bg-white/90 backdrop-blur-sm rounded-2xl border border-emerald-100/30 shadow-sm p-5 space-y-4" style={{ maxHeight: '500px', overflowY: 'auto' }}>
        <div className="flex items-center space-x-2 border-b border-neutral-100 pb-3">
          <BookOpen className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-heading font-bold text-neutral-800 uppercase tracking-wider">Dàn ý đang xây</h3>
        </div>
        
        {!hasOutline ? (
          <div className="text-center py-8 text-neutral-400">
            <span className="text-3xl block mb-2">🏗️</span>
            <p className="text-[11px]">Hãy trò chuyện với Cú Văn để xây dàn ý từng bước!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {collectedOutline.mobi.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full uppercase">📖 Mở bài</span>
                <ul className="pl-3 border-l-2 border-blue-200 space-y-1">
                  {collectedOutline.mobi.map((item, i) => <li key={i} className="text-[11px] text-neutral-600">{item}</li>)}
                </ul>
              </div>
            )}
            {collectedOutline.thanbi.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase">✍️ Thân bài</span>
                <ul className="pl-3 border-l-2 border-emerald-200 space-y-1">
                  {collectedOutline.thanbi.map((item, i) => <li key={i} className="text-[11px] text-neutral-600">{item}</li>)}
                </ul>
              </div>
            )}
            {collectedOutline.ketbi.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full uppercase">🎯 Kết bài</span>
                <ul className="pl-3 border-l-2 border-purple-200 space-y-1">
                  {collectedOutline.ketbi.map((item, i) => <li key={i} className="text-[11px] text-neutral-600">{item}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
