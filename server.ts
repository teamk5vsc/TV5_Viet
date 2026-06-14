import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
const PORT = 3000;

// Lazy initialization of Gemini SDK
let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(apiKeyOverride?: string): GoogleGenAI | null {
  const apiKey = apiKeyOverride || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    console.warn('GEMINI_API_KEY is not defined or is a placeholder. Using intelligent simulated grading engine.');
    return null;
  }
  // Create new instance per request when using override (different keys possible)
  if (apiKeyOverride) {
    return new GoogleGenAI({
      apiKey: apiKeyOverride,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });
  }
  return aiInstance;
}

// Model fallback chain as per AI_INSTRUCTIONS.md
const MODEL_FALLBACK_CHAIN = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'];

async function generateWithFallback(
  client: GoogleGenAI,
  requestedModel: string | undefined,
  contents: string,
  config: { responseMimeType?: string; temperature?: number }
): Promise<string> {
  const models = requestedModel 
    ? [requestedModel, ...MODEL_FALLBACK_CHAIN.filter(m => m !== requestedModel)]
    : MODEL_FALLBACK_CHAIN;
  
  let lastError: any = null;
  for (const model of models) {
    try {
      console.log(`Trying model: ${model}`);
      const response = await client.models.generateContent({
        model,
        contents,
        config,
      });
      return response.text || '';
    } catch (err: any) {
      console.warn(`Model ${model} failed:`, err.message || err);
      lastError = err;
      // If rate limited (429), try next model
      if (err.status === 429 || err.message?.includes('RESOURCE_EXHAUSTED')) {
        continue;
      }
      // For other errors, also try next model
      continue;
    }
  }
  throw lastError || new Error('All models failed');
}

function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();
  // Remove markdown code block markers
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
}

// Simulated data helpers for offline fallback so the application is instantly functional
function getMockOutline(topic: string, type: string) {
  const cleanTopic = topic || 'Tả cảnh giờ ra chơi';
  
  const genreData: Record<string, {
    genre: string;
    requirements: string[];
    outline: { mobi: string[]; thanbi: string[]; ketbi: string[] };
    keywords: string[];
    errorsToAvoid: string[];
  }> = {
    'ta-canh': {
      genre: 'Văn tả cảnh',
      requirements: [
        `Xác định đúng đối tượng tả cảnh: ${cleanTopic}`,
        'Phát triển ý theo trình tự hợp lý (không gian hoặc thời gian) mạch lạc',
        'Lựa chọn từ ngữ miêu tả biểu cảm phong phú (tính từ, từ láy)',
        'Đan xen cảm xúc cá nhân sâu sắc chân thành'
      ],
      outline: {
        mobi: [
          `Giới thiệu cảnh vật định miêu tả: ${cleanTopic} (Em quan sát trong hoàn cảnh nào? Trải nghiệm ra sao?)`,
          'Bộc lộ cảm xúc háo hức, ấn tượng bao quát ấm áp lúc ban đầu.'
        ],
        thanbi: [
          'Tả bao quát cảnh vật xung quanh (Thời tiết dịu mát, không khí trong trẻo thoáng đãng).',
          'Tả chi tiết nổi bật của sự vật chính: Cây cối rì rào đón gió, khoảng trời cao rộng tự nhiên.',
          'Lồng ghép các chi tiết âm thanh sinh động (Tiếng cười giòn tan, bước chân náo nức xôn xao).',
          'Miêu tả hành động biểu thị tâm lý nhân vật cụ thể nhằm tăng chiều sâu.'
        ],
        ketbi: [
          'Bộc lộ tình cảm gắn bó tha thiết, yêu mến sâu sắc sau trải nghiệm.',
          'Lời tự hứa hoặc thông điệp ý nghĩa thiết thực gửi gắm bạn bè.'
        ]
      },
      keywords: ['xanh mướt', 'rực rỡ', 'náo động', 'ấm áp', 'bừng sáng', 'xúc động', 'biết ơn'],
      errorsToAvoid: [
        'Tránh sa đà kể chuyện quá nhiều mà quên đặc trưng văn miêu tả.',
        'Tránh bố cục lộn xộn giữa tả không gian và thời gian.'
      ]
    },
    'ke-chuyen-sang-tao': {
      genre: 'Kể chuyện sáng tạo',
      requirements: [
        `Đóng vai kể chuyện sáng tạo dựa trên đề tài: ${cleanTopic}`,
        'Thay đổi ngôi kể hoặc sáng tạo thêm các biến cố, kết thúc mới sinh động',
        'Xây dựng các sự việc tiếp nối hợp lý, mạch lạc',
        'Rút ra thông điệp hoặc ý nghĩa sống nhân văn'
      ],
      outline: {
        mobi: [
          `Giới thiệu câu chuyện định kể sáng tạo: ${cleanTopic}`,
          'Xác định ngôi kể (vai kể của em) và hoàn cảnh xảy ra câu chuyện đặc biệt ban đầu.'
        ],
        thanbi: [
          'Sự việc khơi mào: Tình huống phát sinh yếu tố mới lạ, khác biệt truyện gốc.',
          'Diễn biến câu chuyện: Hành động của vai kể và các nhân vật phụ đối mặt với tình huống mới.',
          'Cao trào: Đỉnh điểm thử thách buộc nhân vật phải đưa ra lựa chọn hoặc hành động quyết định.'
        ],
        ketbi: [
          'Khép lại câu chuyện bằng một kết cục ý nghĩa, nhân văn.',
          'Nêu bài học cuộc sống sâu sắc hoặc thông điệp ý nghĩa gửi gắm người đọc.'
        ]
      },
      keywords: ['bí ẩn', 'kịch tính', 'dũng cảm', 'ngỡ ngàng', 'ấm áp', 'bất ngờ', 'nhân văn'],
      errorsToAvoid: [
        'Tránh chép lại y nguyên cốt truyện cũ, không có yếu tố sáng tạo riêng.',
        'Tránh diễn biến câu chuyện rời rạc, thiếu logic hành động.'
      ]
    },
    'cam-xuc-nhan-vat': {
      genre: 'Bày tỏ tình cảm về nhân vật',
      requirements: [
        `Bày tỏ tình cảm rõ ràng với nhân vật: ${cleanTopic}`,
        'Đưa ra các dẫn chứng (ngoại hình, lời nói, hành động) từ tác phẩm để làm rõ',
        'Lý giải vì sao nhân vật lại khơi gợi tình cảm đó của em',
        'Rút ra bài học ứng xử cho bản thân từ nhân vật'
      ],
      outline: {
        mobi: [
          `Giới thiệu nhân vật văn học định bày tỏ tình cảm: ${cleanTopic}`,
          'Khái quát cảm xúc mến mộ, yêu quý hoặc đồng cảm bao quát của em.'
        ],
        thanbi: [
          'Bày tỏ tình cảm về vẻ đẹp ngoại hình hoặc hành động đặc trưng đầu tiên của nhân vật.',
          'Cảm nhận sâu sắc về tính cách, phẩm chất cao đẹp của nhân vật qua các tình huống cụ thể.',
          'Đồng cảm với số phận, hoàn cảnh hoặc những suy tư tâm lý của nhân vật.'
        ],
        ketbi: [
          'Khẳng định lại sức sống của nhân vật và tình cảm yêu mến lâu bền của bản thân.',
          'Liên hệ thực tế hoặc nêu bài học tự rèn luyện rút ra.'
        ]
      },
      keywords: ['ngưỡng mộ', 'thấu hiểu', 'xúc động', 'đáng quý', 'hiền hậu', 'kiên cường', 'bài học'],
      errorsToAvoid: [
        'Tránh kể lại toàn bộ câu chuyện (tóm tắt truyện) thay vì biểu lộ tình cảm.',
        'Tránh viết cảm xúc hời hợt, chung chung không có dẫn chứng cụ thể.'
      ]
    },
    'cam-xuc-su-viec': {
      genre: 'Bày tỏ tình cảm về sự việc',
      requirements: [
        `Bày tỏ cảm nhận về sự việc, hoạt động: ${cleanTopic}`,
        'Miêu tả ngắn gọn diễn biến sự việc làm nền tảng bộc lộ cảm xúc',
        'Nhấn mạnh chi tiết/hoạt động gây ấn tượng sâu sắc nhất trong sự việc',
        'Liên hệ ý nghĩa của sự việc đối với cuộc sống học tập của bản thân'
      ],
      outline: {
        mobi: [
          `Giới thiệu sự việc, hoạt động ý nghĩa định bày tỏ cảm nghĩ: ${cleanTopic}`,
          'Khái quát ấn tượng và cảm xúc bao quát lúc ban đầu của em.'
        ],
        thanbi: [
          'Bày tỏ cảm xúc khi sự việc bắt đầu diễn ra (sự chuẩn bị, náo nức).',
          'Cảm nhận chi tiết về diễn biến sự việc, hình ảnh và con người tham gia.',
          'Nêu chi tiết hoặc khoảnh khắc ấn tượng nhất khơi dậy cảm xúc mạnh mẽ nhất.'
        ],
        ketbi: [
          'Khẳng định ý nghĩa lâu bền của sự việc đối với tâm hồn của em.',
          'Nêu lời tự hứa hoặc thông điệp tích cực lan tỏa tới mọi người.'
        ]
      },
      keywords: ['thiêng liêng', 'xúc động', 'tự hào', 'ấm áp', 'đáng nhớ', 'biết ơn', 'gắn kết'],
      errorsToAvoid: [
        'Tránh sa đà vào tường thuật sự việc từ đầu đến cuối như một bản tin.',
        'Tránh bộc lộ cảm xúc sáo rỗng, thiếu chân thật.'
      ]
    },
    'neu-y-kien': {
      genre: 'Nêu ý kiến đồng tình / phản đối',
      requirements: [
        `Nêu ý kiến lập luận rõ ràng về vấn đề: ${cleanTopic}`,
        'Khẳng định thái độ đồng tình hoặc phản đối cụ thể dứt khoát',
        'Đưa ra ít nhất 2 lý lẽ thuyết phục kèm dẫn chứng thực tế sinh động',
        'Đề xuất bài học nhận thức hoặc giải pháp hành động thiết thực'
      ],
      outline: {
        mobi: [
          `Nêu vấn đề cần bày tỏ ý kiến thảo luận: ${cleanTopic}`,
          'Khẳng định rõ quan điểm cá nhân (Đồng tình hoặc Phản đối ý kiến đó).'
        ],
        thanbi: [
          'Giải thích ngắn gọn ý nghĩa của vấn đề/ý kiến thảo luận.',
          'Lý lẽ 1: Trình bày lý do thứ nhất bảo vệ quan điểm cá nhân kèm dẫn chứng thực tế.',
          'Lý lẽ 2: Trình bày lý do thứ hai thuyết phục hơn kèm ví dụ cụ thể.',
          'Ý kiến phản biện: Bác bỏ các quan điểm lệch lạc, trái chiều để củng cố lập luận.'
        ],
        ketbi: [
          'Khẳng định lại tầm quan trọng của vấn đề và tính đúng đắn của quan điểm.',
          'Đưa ra lời khuyên hữu ích hoặc kêu gọi mọi người cùng hành động thiết thực.'
        ]
      },
      keywords: ['quan trọng', 'cần thiết', 'lợi ích', 'thực tế', 'lập luận', 'bảo vệ', 'thuyết phục'],
      errorsToAvoid: [
        'Tránh quan điểm mơ hồ, vừa đồng tình vừa phản đối không dứt khoát.',
        'Tránh lý lẽ suông, thiếu dẫn chứng thực tế từ học tập và đời sống.'
      ]
    },
    'cam-xuc-cau-chuyen': {
      genre: 'Bày tỏ cảm xúc về một câu chuyện',
      requirements: [
        `Bày tỏ tình cảm chân thành về câu chuyện: ${cleanTopic}`,
        'Lựa chọn dẫn chứng sự việc cảm động, ý nghĩa trong truyện',
        'Lý giải cảm xúc (yêu, ghét, thương cảm, tự hào) rõ nét',
        'Rút ra bài học nhân sinh sâu sắc cho bản thân'
      ],
      outline: {
        mobi: [
          `Giới thiệu câu chuyện định bày tỏ cảm xúc: ${cleanTopic}`,
          'Khái quát ấn tượng ban đầu và cảm xúc sâu đậm nhất của em.'
        ],
        thanbi: [
          'Tóm tắt ngắn gọn biến cố hay sự việc khơi nguồn cảm xúc chính.',
          'Bày tỏ cảm xúc với từng nhân vật nổi bật (Cảm phục lòng hiếu thảo, xót thương số phận lam lũ).',
          'Đánh giá ý nghĩa nhân văn hay thông điệp câu chuyện mang lại.',
          'Liên hệ thực tế bản thân: suy nghĩ và hành động sau khi đọc truyện.'
        ],
        ketbi: [
          'Khẳng định giá trị câu chuyện và tình cảm bền chặt dành cho tác phẩm.',
          'Lời khuyên hoặc thông điệp ý nghĩa gửi tới bạn bè cùng đọc.'
        ]
      },
      keywords: ['cảm động', 'xót thương', 'hiếu thảo', 'nhân văn', 'bài học', 'ý nghĩa', 'khắc sâu'],
      errorsToAvoid: [
        'Tránh kể lại toàn bộ câu chuyện từ đầu đến cuối mà quên biểu lộ cảm nghĩ.',
        'Tránh viết cảm xúc sáo rỗng, rập khuôn thiếu sự chân thành.'
      ]
    },
    'cam-xuc-bai-tho': {
      genre: 'Bày tỏ cảm xúc về một bài thơ',
      requirements: [
        `Bày tỏ cảm xúc về bài thơ: ${cleanTopic}`,
        'Cảm nhận cái hay của hình ảnh thơ nghệ thuật độc đáo',
        'Cảm nhận nhạc điệu, vần thơ réo rắt gợi cảm xúc',
        'Thể hiện sự đồng cảm sâu sắc với tình cảm của tác giả'
      ],
      outline: {
        mobi: [
          `Giới thiệu bài thơ và tác giả định bày tỏ cảm nghĩ: ${cleanTopic}`,
          'Nêu ấn tượng bao quát và nhạc điệu thơ đọng lại trong lòng em.'
        ],
        thanbi: [
          'Cảm xúc gợi lên từ những hình ảnh thơ đẹp và độc đáo nhất.',
          'Cảm nhận vần điệu, nhịp điệu bài thơ (êm đềm, giòn giã hay tha thiết).',
          'Phân tích những từ ngữ đắt giá bộc lộ tình thương, tình quê hương đất nước.',
          'Sự đồng điệu giữa tâm hồn em và tác giả gửi gắm qua trang thơ.'
        ],
        ketbi: [
          'Khẳng định lại tình yêu của em dành cho bài thơ và sức sống của tác phẩm.',
          'Ý nghĩa của bài thơ đối với đời sống tinh thần của tuổi thơ em.'
        ]
      },
      keywords: ['vần thơ', 'nhạc điệu', 'hình ảnh', 'tha thiết', 'đồng cảm', 'trân quý', 'ngọt ngào'],
      errorsToAvoid: [
        'Tránh việc chép lại nguyên văn bài thơ mà thiếu phân tích cảm xúc.',
        'Tránh viết lan man, không chỉ rõ được cái hay của từ ngữ nghệ thuật.'
      ]
    },
    'gioi-thieu-nhan-vat-sach': {
      genre: 'Giới thiệu nhân vật trong sách',
      requirements: [
        `Giới thiệu nhân vật văn học: ${cleanTopic}`,
        'Khái quát tính cách cốt lõi và nét ngoại hình đặc trưng phản ánh con người',
        'Nêu dẫn chứng hành động, lời nói cụ thể của nhân vật trong tác phẩm',
        'Bộc lộ suy nghĩ, bài học ứng xử noi gương nhân vật'
      ],
      outline: {
        mobi: [
          `Giới thiệu nhân vật và tên cuốn sách chứa nhân vật đó: ${cleanTopic}`,
          'Nêu lý do nhân vật gây ấn tượng mạnh mẽ nhất với em.'
        ],
        thanbi: [
          'Giới thiệu lai lịch, hoàn cảnh xuất hiện của nhân vật trong trang sách.',
          'Tả nét ngoại hình tiêu biểu (nếu có) phản ánh nội tâm nhân vật.',
          'Khắc họa phẩm chất tính cách (dũng cảm, tốt bụng, kiên trì) qua hành động cụ thể.',
          'Chi tiết/sự việc lay động nhất về nhân vật làm em nhớ mãi.'
        ],
        ketbi: [
          'Khẳng định giá trị nhân vật truyền cảm hứng tích cực cho bản thân em.',
          'Lời tự hứa học tập và noi theo gương tốt của nhân vật.'
        ]
      },
      keywords: ['quả cảm', 'tảo tần', 'kiên trì', 'hành động', 'truyền cảm hứng', 'ấn tượng', 'noi theo'],
      errorsToAvoid: [
        'Tránh sa đà kể tóm tắt lại toàn bộ cốt truyện sách.',
        'Tránh miêu tả nhân vật chung chung, không gắn liền chi tiết cụ thể trong sách.'
      ]
    },
    'gioi-thieu-nhan-vat-hoat-hinh': {
      genre: 'Giới thiệu nhân vật hoạt hình',
      requirements: [
        `Giới thiệu nhân vật hoạt hình yêu thích: ${cleanTopic}`,
        'Miêu tả hình ảnh, màu sắc, nét vẽ sinh động tinh nghịch',
        'Giới thiệu bảo bối, năng lực đặc biệt hoặc phép thuật độc đáo',
        'Nêu tính cách nhân vật và thông điệp giáo dục ý nghĩa'
      ],
      outline: {
        mobi: [
          `Giới thiệu nhân vật hoạt hình và bộ phim hoạt hình đó: ${cleanTopic}`,
          'Nêu cảm nhận yêu thích bao quát của em dành cho nhân vật.'
        ],
        thanbi: [
          'Miêu tả ngoại hình ngộ nghĩnh đặc trưng (hình dáng, trang phục, sắc thái cười vui).',
          'Giới thiệu năng lực đặc biệt, món bảo bối kỳ diệu gắn liền với nhân vật.',
          'Phân tích phẩm chất (Vui tính, trung thành, quả cảm, thông minh vượt khó).',
          'Sự việc/tập phim hài hước hoặc cảm động nhất của nhân vật khiến em thích thú.'
        ],
        ketbi: [
          'Khẳng định sự yêu mến của em và bài học ý nghĩa nhân vật mang lại.',
          'Mong ước hoặc thông điệp đáng yêu gửi tới bạn bè.'
        ]
      },
      keywords: ['ngộ nghĩnh', 'kỳ diệu', 'bảo bối', 'vui nhộn', 'trung thành', 'thông điệp', 'tuổi thơ'],
      errorsToAvoid: [
        'Tránh chỉ liệt kê các tập phim mà quên giới thiệu tính cách nhân vật.',
        'Tránh miêu tả khô khan, thiếu đi chất trẻ thơ sinh động của hoạt hình.'
      ]
    },
    'ta-nguoi': {
      genre: 'Văn tả người',
      requirements: [
        `Miêu tả người gần gũi kính yêu: ${cleanTopic}`,
        'Kết hợp hài hòa tả ngoại hình nổi bật phản ánh độ tuổi, công việc',
        'Tả hoạt động, cử chỉ, giọng nói bộc lộ tính cách cốt lõi',
        'Thể hiện tình cảm biết ơn, kính yêu thiết tha gắn bó'
      ],
      outline: {
        mobi: [
          `Giới thiệu người em định miêu tả: ${cleanTopic} (Là ai? Mối quan hệ thế nào?)`,
          'Nêu ấn tượng sâu sắc nhất về người đó đối với em.'
        ],
        thanbi: [
          'Tả bao quát dáng người, độ tuổi, trang phục thường ngày mộc mạc.',
          'Tả chi tiết khuôn mặt, mái tóc, làn da và đôi mắt ấm áp hiền hậu.',
          'Tả cử chỉ hoạt động: giọng nói nói năng, đôi bàn tay gầy guộc chăm lo gia đình.',
          'Khắc họa tính cách nổi bật (Hiền từ, chu đáo, vui tính, chăm chỉ) qua thói quen.',
          'Kỷ niệm đặc sắc sâu đậm thể hiện tình yêu thương giữa người đó và em.'
        ],
        ketbi: [
          'Bộc lộ tình yêu kính, biết ơn vô bờ bến của em dành cho người được tả.',
          'Lời tự hứa ngoan ngoãn và ước mong tốt đẹp nhất cho người đó.'
        ]
      },
      keywords: ['tảo tần', 'ấm áp', 'hiền hậu', 'nụ cười', 'chăm chỉ', 'kỷ niệm', 'kính yêu'],
      errorsToAvoid: [
        'Tránh việc tả người rập khuôn, liệt kê máy móc (tai hình lá mít, mũi dọc dừa...).',
        'Tránh tả quá sơ sài hoặc cường điệu hóa xa rời thực tế.'
      ]
    },
    'lap-chuong-trinh-hoat-dong': {
      genre: 'Lập chương trình hoạt động',
      requirements: [
        `Lập chương trình hoạt động tập thể: ${cleanTopic}`,
        'Đầy đủ cấu trúc 3 phần rõ ràng khoa học',
        'Nêu chuẩn bị đầy đủ dụng cụ, phương tiện cụ thể',
        'Phân công cụ thể chi tiết nhiệm vụ cho từng nhóm/cá nhân',
        'Xây dựng tiến trình thực hiện logic theo trình tự thời gian'
      ],
      outline: {
        mobi: [
          `Nêu tên hoạt động và mục đích ý nghĩa của buổi sinh hoạt: ${cleanTopic}`,
          'Xác định thời gian, địa điểm tổ chức chung.'
        ],
        thanbi: [
          '1. Công tác chuẩn bị: dụng cụ lao động, ban tổ chức, khánh tiết, phương tiện.',
          '2. Phân công cụ thể: Nhóm 1 làm gì, Nhóm 2 làm gì, vai trò trưởng nhóm chỉ đạo.',
          '3. Các bước tiến hành: Trình tự hoạt động diễn ra từ bắt đầu đến lúc cao trào và kết thúc.'
        ],
        ketbi: [
          'Khẳng định kết quả tốt đẹp và ý nghĩa hoạt động mang lại.',
          'Ý thức trách nhiệm và niềm vui gắn kết tinh thần đoàn kết tập thể.'
        ]
      },
      keywords: ['mục đích', 'chuẩn bị', 'phân công', 'tiến trình', 'đoàn kết', 'hiệu quả', 'trách nhiệm'],
      errorsToAvoid: [
        'Tránh viết theo phong cách văn kể chuyện, miêu tả cảm xúc tràn lan.',
        'Tránh phân công chung chung, kế hoạch mơ hồ thiếu tính khả thi.'
      ]
    }
  };

  return genreData[type] || genreData['ta-canh'];
}

function getMockEssay(topic: string, type: string, format: 'essay' | 'paragraph') {
  const cleanTopic = topic || 'Tả cảnh đồi chè quê em';
  
  const mockDatabase: Record<string, {
    essay: { content: string; highlights: any[]; analysis: string[] };
    paragraph: { content: string; highlights: any[]; analysis: string[] };
  }> = {
    'ta-canh': {
      essay: {
        content: `Quê hương em là một vùng trung du êm đềm, nơi có những đồi chè xanh mướt trải dài như những làn sóng xanh nối đuôi nhau đến tận chân trời. Mỗi buổi sớm mai, khi sương mù còn giăng mờ ảo trên những ngọn lá, cả đồi chè như khoác lên mình một chiếc áo choàng nhung mềm mại.\n\nKhi những tia nắng đầu tiên của ngày mới thức dậy, chúng tinh nghịch nhảy nhót qua từng kẽ lá, đánh thức những giọt sương đêm lấp lánh như những hạt ngọc nhỏ xíu. Những búp chè non tơ, xanh mướt mọc nhọn hoắt như những nét vẽ của thiên nhiên đang vươn vai đón lấy ánh sáng ấm áp. Hương chè thơm dịu nhẹ, thoang thoảng trong làn gió mát lành thổi từ đỉnh đồi khiến lòng người thư thái lạ kỳ. Thấp thoáng xa xa, bóng những cô bác công nhân đeo gùi trên vai, đôi bàn tay nhanh thoăn thoắt hái những búp chè non như những cánh bướm dập dờn nhảy múa.\n\nĐồi chè quê hương không chỉ mang lại cuộc sống ấm no cho người dân mà còn là bức tranh thiên nhiên tuyệt mỹ in đậm trong tâm trí em. Mỗi khi đứng trước khoảng trời cao rộng rực rỡ nắng mai ấy, lòng em lại tràn ngập niềm tự hào và tình yêu quê hương thiết tha.`,
        highlights: [
          { text: "xanh mướt trải dài như những làn sóng xanh", type: "rhetorical", explanation: "Biện pháp so sánh ví đồi chè với làn sóng xanh giúp người đọc hình dung được sự bao la, trập trùng của đồi chè quê hương." },
          { text: "tinh nghịch nhảy nhót qua từng kẽ lá, đánh thức những giọt sương", type: "rhetorical", explanation: "Biện pháp nhân hóa khiến ánh nắng và những giọt sương trở nên sống động, có hồn như những người bạn nhỏ đáng yêu." },
          { text: "lấp lánh như những hạt ngọc nhỏ xíu", type: "imagery", explanation: "Hình ảnh miêu tả giọt sương buổi sớm rất lung linh, tạo cảm giác trong trẻo, tinh khôi và giàu sức sống." },
          { text: "xanh mướt", type: "vocabulary", explanation: "Từ láy 'xanh mướt' gợi tả màu sắc đầy sức sống, tươi non mơn mởn của búp chè non." },
          { text: "lòng em lại tràn ngập niềm tự hào và tình yêu quê hương", type: "emotion", explanation: "Cảm xúc chân thành của người viết giúp bài văn tả cảnh đọng lại dư âm ấm áp trong lòng người đọc." }
        ],
        analysis: [
          "Bố cục 3 phần rõ ràng, mở bài gián tiếp cuốn hút và kết bài mở rộng tự nhiên giàu cảm xúc.",
          "Sử dụng linh hoạt các tính từ màu sắc phong phú và từ láy gợi hình gợi âm sinh động.",
          "Phối hợp thành công biện pháp nghệ thuật so sánh và nhân hóa khiến đồi chè tràn đầy sức sống."
        ]
      },
      paragraph: {
        content: `Buổi sáng trên đồi chè quê em đẹp như một bức tranh ngọc bích phẳng lặng. Những giọt sương đêm còn đọng lại trên búp chè non xanh mướt, lấp lánh dưới ánh nắng mai dịu ngọt như những hạt ngọc nhỏ xíu của đất trời. Gió thu mơn man luồn qua từng luống chè, đánh thức hương thơm thanh khiết, ngọt ngào lan tỏa khắp không gian rộng lớn. Từ trên cao nhìn xuống, những luống chè uốn lượn mềm mại tựa như những dải lụa xanh của đất, gợi lên một nhịp sống thanh bình, ấm no mỗi ngày.`,
        highlights: [
          { text: "đẹp như một bức tranh ngọc bích", type: "rhetorical", explanation: "So sánh đồi chè với bức tranh ngọc bích làm nổi bật vẻ đẹp quý giá, trong trẻo và đầy màu sắc của cảnh vật quê hương." },
          { text: "lấp lánh dưới ánh nắng mai", type: "imagery", explanation: "Chi tiết tả ánh sáng phản chiếu sương đêm lung linh làm bối cảnh thêm rực rỡ sắc màu." },
          { text: "Gió thu mơn man luồn qua", type: "rhetorical", explanation: "Nhân hóa làn gió 'mơn man luồn qua' mang lại cảm giác dễ chịu, gần gũi như những ngón tay vuốt ve nhẹ nhàng." }
        ],
        analysis: [
          "Đoạn văn tập trung tả cảnh đồi chè vào buổi sớm mai với các chi tiết tiêu biểu chọn lọc.",
          "Sử dụng ngôn từ khơi gợi xúc giác và khứu giác (mơn man, thanh khiết) để tăng tính sinh động.",
          "Nhịp điệu câu văn uyển chuyển, các câu văn có độ dài ngắn đan xen nhịp nhàng."
        ]
      }
    },
    'ke-chuyen-sang-tao': {
      essay: {
        content: `Tôi là Sơn Tinh, vị thần cai quản vùng núi Ba Vì linh thiêng đất Việt. Đã nhiều năm trôi qua kể từ ngày tôi đánh bại Thủy Tinh để rước Mị Nương về núi, nhưng tiếng sóng nước gầm vang và trận chiến kinh thiên động địa năm ấy vẫn luôn in đậm trong tâm trí tôi như vừa mới hôm qua.\n\nNgày ấy, khi lễ vật của tôi được dâng lên trước tiên, vua Hùng đã gả Mị Nương cho tôi. Vừa rước dâu ra khỏi kinh thành, đất trời bỗng tối sầm lại. Thủy Tinh đùng đùng nổi giận, hô mưa gọi gió, dâng nước cuồn cuộn đuổi theo hòng cướp lại công chúa. Sóng nước dâng cao ngập ruộng đồng, cuốn trôi nhà cửa, dìm cả thành Phong Châu trong biển nước mênh mông gầm rít dữ dội. Thấy người dân khóc than trong tai họa lũ lụt, lòng tôi đau xót khôn nguôi. Tôi vội vàng vung gậy thần bốc từng quả đồi, dựng nên những dãy núi đá sừng sững chắn sóng nước dâng trào. Thủy Tinh dâng nước cao bao nhiêu, tôi lại dùng thần phép nâng núi cao bấy nhiêu. Trận chiến kéo dài ròng rã nhiều tháng trời, sấm chớp đùng đoàng xé toạc bầu trời xám xịt. Cuối cùng, kiệt sức trước sự kiên cường của tôi, Thủy Tinh đành ngậm ngùi rút quân, trả lại sự bình yên cho bờ cõi.\n\nChiến thắng ấy không chỉ bảo vệ hạnh phúc gia đình tôi mà còn là minh chứng cho sức mạnh kiên cường bảo vệ nhân dân trước thiên tai. Dù mỗi năm Thủy Tinh vẫn dâng nước trả thù, tôi luôn vững vàng canh giữ núi non, giữ trọn lời thề che chở cho nhân dân Việt Nam.`,
        highlights: [
          { text: "Tôi là Sơn Tinh, vị thần cai quản", type: "rhetorical", explanation: "Đóng vai nhân vật (ngôi kể thứ nhất) giúp câu chuyện trở nên sống động, tăng sức thuyết phục và tính chân thực." },
          { text: "dãy núi đá sừng sững chắn sóng", type: "imagery", explanation: "Hình ảnh dãy núi 'sừng sững' gợi tả sự vững chãi, oai nghiêm của thần núi Ba Vì bảo vệ con người." },
          { text: "Thủy Tinh dâng nước cao bao nhiêu, tôi lại dùng thần phép nâng núi cao bấy nhiêu", type: "rhetorical", explanation: "Cấu trúc song hành đối xứng nhấn mạnh sức mạnh kiên cường, ý chí không bao giờ chịu khuất phục." },
          { text: "đùng đùng nổi giận", type: "vocabulary", explanation: "Từ láy 'đùng đùng' khắc họa sự phẫn nộ mãnh liệt, hung hãn của Thủy Tinh." },
          { text: "lòng tôi đau xót khôn nguôi", type: "emotion", explanation: "Cảm xúc thương xót nhân dân vùng lũ lụt thể hiện vẻ đẹp nhân ái, cao cả của Sơn Tinh." }
        ],
        analysis: [
          "Đóng vai nhân vật xuất sắc, ngôn ngữ kể chuyện giàu kịch tính, lôi cuốn.",
          "Diễn biến cốt truyện sáng tạo thêm yếu tố tâm lý nhân vật rõ nét, cuốn hút người đọc.",
          "Truyền tải thông điệp nhân văn về sự kiên cường và ý chí chiến thắng thiên tai lũ lụt của dân tộc."
        ]
      },
      paragraph: {
        content: `Lúc ấy, giữa biển nước gầm réo dữ dội của Thủy Tinh dâng lên, tôi đứng trên đỉnh núi cao lộng gió, dũng dũng khí phách. Nhìn xuống dòng nước đục ngầu cuồn cuộn cuốn trôi ruộng đồng nhà cửa của dân lành, lòng tôi đau như cắt. Tôi liền vung cây gậy thần, hô vang khẩu lệnh để đất trời chuyển động. Kỳ diệu thay, từng quả đồi khổng lồ dưới chân tôi tựa như những người lính khổng lồ, lập tức nối đuôi nhau dựng thành lũy vững chắc, chặn đứng cơn thịnh nộ bão giông của Thủy Tinh.`,
        highlights: [
          { text: "lòng tôi đau như cắt", type: "emotion", explanation: "Bộc lộ sự thấu cảm, xót thương của người anh hùng Sơn Tinh trước nỗi đau của nhân dân." },
          { text: "tựa như những người lính khổng lồ", type: "rhetorical", explanation: "Phép so sánh ví đồi núi với người lính khổng lồ tạo hình ảnh oai hùng, hùng vĩ bảo vệ làng xóm." }
        ],
        analysis: [
          "Đoạn văn kể lại khoảnh khắc cao trào oai hùng nhất trong trận chiến dâng núi.",
          "Ngôn từ giàu tính tạo hình mạnh mẽ, câu văn kết cấu sinh động."
        ]
      }
    },
    'cam-xuc-nhan-vat': {
      essay: {
        content: `Trong vô vàn bài thơ em đã học, bài thơ "Bếp lửa" của nhà thơ Bằng Việt luôn khơi gợi trong em những xúc cảm sâu sắc nhất về tình bà cháu ấm áp. Hình ảnh người bà tảo tần bên bếp lửa sương sớm đã in đậm vào trái tim em, trở thành biểu tượng thiêng liêng của tình yêu thương bao la.\n\nNgười bà hiện lên trong tâm trí em với gương mặt hiền từ, hằn sâu những nếp nhăn của thời gian và sương gió. Đôi bàn tay bà thô ráp, gầy guộc đầy những vết chai sần vì cả cuộc đời hy sinh nuôi nấng cháu con. Mỗi sớm mai, khi đất trời còn lạnh giá, bà đã thức dậy khơi lên ngọn lửa hồng ấm áp. Ngọn lửa ấy không chỉ luộc khoai, luộc sắn mà còn nhen nhóm lên những ước mơ, hy vọng khôn lớn của cháu. Dù trong hoàn cảnh chiến tranh gian khổ gieo neo, bà vẫn vững lòng gánh vác gia đình, trở thành chỗ dựa tinh thần vững chắc nhất cho cháu con vững lòng đi qua giông bão.\n\nTình yêu thương và đức hy sinh thầm lặng của bà như dòng nước mát lành tưới mát tâm hồn em. Đọc bài thơ, em thầm hứa với bản thân sẽ học tập thật chăm ngoan, rèn luyện thật tốt để xứng đáng với tình yêu thương vô bờ bến và bàn tay nâng đỡ đầy ấm áp của bà.`,
        highlights: [
          { text: "gương mặt hiền từ, hằn sâu những nếp nhăn", type: "imagery", explanation: "Chi tiết miêu tả ngoại hình chân thực lột tả sự lam lũ, vất vả của người bà suốt cuộc đời vì gia đình." },
          { text: "bàn tay nâng đỡ đầy ấm áp", type: "emotion", explanation: "Thể hiện tình cảm gắn bó thiêng liêng và cảm giác an toàn, che chở khi có bà đồng hành." },
          { text: "vững lòng", type: "vocabulary", explanation: "Từ 'vững lòng' biểu thị tinh thần kiên cường, gánh vác vượt qua gian khổ của người phụ nữ Việt Nam." },
          { text: "như dòng nước mát lành tưới mát tâm hồn em", type: "rhetorical", explanation: "So sánh tình yêu thương của bà với dòng nước mát để nhấn mạnh tác dụng nuôi dưỡng nhân cách cao đẹp của trẻ thơ." }
        ],
        analysis: [
          "Diễn tả cảm nghĩ rất chân thành, xúc động về một nhân vật giàu tính nhân văn.",
          "Dẫn chứng chi tiết (đôi bàn tay, bếp lửa, ngọn lửa sương sớm) liên kết mạch lạc với cảm xúc bộc lộ.",
          "Kết bài rút ra bài học ứng xử tự rèn luyện thiết thực, mang tính giáo dục sâu sắc."
        ]
      },
      paragraph: {
        content: `Đôi bàn tay gầy guộc, thô ráp của bà chính là minh chứng thiêng liêng nhất cho tình yêu thương vô điều kiện. Những vết chai sần cứng cáp trên da bà được dệt nên bởi biết bao mùa nắng mưa vất vả gieo neo. Mỗi lần được bà nắm lấy tay vỗ về, em bỗng cảm thấy một luồng hơi ấm dịu ngọt truyền thẳng vào tim, làm tan biến mọi sợ hãi ngây ngô của tuổi thơ, tiếp thêm cho em sức mạnh vững vàng bước đi.`,
        highlights: [
          { text: "dệt nên bởi biết bao mùa nắng mưa", type: "rhetorical", explanation: "Hình ảnh ẩn dụ dệt nên nỗi vất vả, khó nhọc của bà suốt những mùa mưa nắng." },
          { text: "luồng hơi ấm dịu ngọt truyền thẳng vào tim", type: "imagery", explanation: "Miêu tả cụ thể qua xúc giác để chuyển hóa tình thương thành cảm giác ấm áp thực tế." }
        ],
        analysis: [
          "Đoạn văn tập trung bày tỏ cảm xúc sâu sắc về đôi bàn tay gầy guộc của người bà.",
          "Kết cấu đoạn văn chặt chẽ, từ miêu tả ngoại hình chuyển hóa thành cảm xúc ấm áp."
        ]
      }
    },
    'cam-xuc-su-viec': {
      essay: {
        content: `Mỗi năm học mới bắt đầu bằng một ngày thu rực rỡ, nhưng buổi lễ khai giảng đầu tiên của năm học lớp 5 dưới mái trường Tiểu học mến yêu là sự việc để lại trong em những rung động thiêng liêng nhất. Tiếng trống trường ngân vang giòn giã hôm ấy như mở ra cánh cửa dẫn em bước vào thế giới tri thức đầy sắc màu đầy náo nức.\n\nSớm hôm ấy, bầu trời thu cao rộng, trong vắt như một bức tranh ngọc bích phẳng lặng. Gió thu nhè nhẹ thổi, làm tung bay những lá cờ đỏ thắm và dải hoa rực rỡ sắc màu treo khắp sân trường. Dưới làn nắng ấm áp, chúng em - những học sinh cuối cấp - đứng trang nghiêm làm lễ chào cờ. Khi bài Quốc ca vang lên hùng tráng, em ngước nhìn lá cờ Tổ quốc kiêu hãnh tung bay trong gió, lòng dấy lên niềm tự hào tự hào khôn tả. Khoảnh khắc xúc động nhất là khi thầy Hiệu trưởng gióng hồi trống khai trường vang dội. Tùng tiếng "Tùng! Tùng! Tùng!" vang rền, ngân vang xa xa, len lỏi vào lồng ngực làm tim em đập nhịp rộn ràng. Tiếng trống như thúc giục, cổ vũ chúng em quyết tâm rèn luyện chăm ngoan.\n\nBuổi lễ khai giảng thiêng liêng ấy đã thắp sáng ngọn lửa quyết tâm học tập trong lòng em. Hình ảnh mái trường hiền hòa cùng tiếng trống vang vọng sẽ mãi là hành trang quý giá nâng bước em bay cao, bay xa trên con đường tương lai rộng lớn phía trước.`,
        highlights: [
          { text: "cao rộng, trong vắt như một bức tranh ngọc bích", type: "rhetorical", explanation: "Phép so sánh miêu tả bầu trời thu đẹp tuyệt diệu, tạo bối cảnh phấn khởi cho buổi lễ." },
          { text: "len lỏi vào lồng ngực làm tim em đập nhịp rộn ràng", type: "emotion", explanation: "Bộc lộ cảm giác hồi hộp, náo nức chân thực từ bên trong lồng ngực khi nghe tiếng trống trường." },
          { text: "giòn giã", type: "vocabulary", explanation: "Từ láy 'giòn giã' gợi tả âm thanh tiếng trống vang, vang xa đầy hứng khởi và mạnh mẽ." },
          { text: "như thắp sáng ngọn lửa quyết tâm", type: "rhetorical", explanation: "Hình ảnh ẩn dụ ngọn lửa quyết tâm thúc đẩy học tập nâng tầm ý nghĩa của sự việc." }
        ],
        analysis: [
          "Tái hiện sinh động không khí ngày khai trường thông qua âm thanh và hình ảnh tiêu biểu.",
          "Cảm xúc phát triển tự nhiên đi cùng diễn biến sự việc (chuẩn bị, chào cờ, tiếng trống).",
          "Lời văn giàu nhạc điệu, sử dụng câu ghép nhịp nhàng và chọn lọc từ láy gợi cảm xuất sắc."
        ]
      },
      paragraph: {
        content: `Khi tiếng trống trường đầu tiên vang lên: "Tùng! Tùng! Tùng!", cả sân trường bỗng lặng đi trong không khí trang nghiêm thiêng liêng. Tiếng trống giòn giã, vang rền đập thẳng vào lồng ngực xôn xao của em, thúc giục những nhịp đập rộn ràng quyết tâm. Nhìn những cánh chim bồ câu trắng muốt tung cánh bay vút lên bầu trời thu cao rộng trong xanh, lòng em ngập tràn niềm tự hào kiêu hãnh và khát vọng chinh phục những chân trời tri thức mới.`,
        highlights: [
          { text: "thúc giục những nhịp đập rộn ràng", type: "rhetorical", explanation: "Nhân hóa tiếng trống biết thúc giục, làm tăng sự tương tác mãnh liệt giữa âm thanh và con người." },
          { text: "bầu trời thu cao rộng trong xanh", type: "imagery", explanation: "Chi tiết hình ảnh gợi không gian khoáng đạt, tự do đầy hy vọng rộng lớn." }
        ],
        analysis: [
          "Tập trung bắt trọn khoảnh khắc gióng trống khai trường linh thiêng xúc động của sự việc.",
          "Cách ngắt nhịp câu văn mô phỏng âm điệu dồn dập, mạnh mẽ của tiếng trống trường."
        ]
      }
    },
    'neu-y-kien': {
      essay: {
        content: `Trong thời đại công nghệ số bùng nổ hiện nay, nhiều bạn nhỏ mải mê với màn hình điện thoại thông minh mà quên đi những trang sách thơm tho. Thế nhưng, em hoàn toàn đồng tình với ý kiến cho rằng: "Đọc sách mỗi ngày là việc vô cùng cần thiết đối với học sinh Tiểu học". Cuốn sách nhỏ chính là người bạn hiền mở ra cho em những thế giới tri thức vô tận bồi đắp tâm hồn khôn lớn mỗi ngày.\n\nTrước hết, đọc sách giúp chúng em mở mang tri thức một cách diệu kỳ. Mỗi cuốn sách như một chiếc chìa khóa vàng mở ra kho tàng lịch sử hào hùng, thế giới khoa học huyền bí hay những vùng đất xa xôi mà em chưa từng đặt chân đến. Không chỉ vậy, sách còn là dòng sữa ngọt ngào nuôi dưỡng tâm hồn ta. Đọc câu chuyện về lòng hiếu thảo của bé Thủy, hay tình bạn ấm áp của Dế Mèn, em học được cách thấu cảm, biết yêu thương muôn loài xung quanh. Một dẫn chứng sinh động là từ khi rèn luyện thói quen đọc sách 20 phút mỗi ngày, vốn từ Tiếng Việt của em phong phú hơn hẳn, bài viết văn của em tràn ngập những câu từ sinh động, giàu hình ảnh. Dù có ý kiến lo ngại đọc sách tốn thời gian học tập khác, nhưng nếu biết phân bổ hợp lý, sách chính là phương pháp thư giãn lành mạnh nhất sau những giờ học căng thẳng.\n\nTóm lại, đọc sách mỗi ngày là một thói quen vàng nuôi dưỡng trí tuệ và tâm hồn. Em mong rằng mỗi bạn nhỏ chúng ta hãy cùng nhau mở sách ra mỗi ngày, để những trang giấy thơm tho chắp cánh cho những ước mơ của chúng ta bay cao, bay xa.`,
        highlights: [
          { text: "như một chiếc chìa khóa vàng mở ra kho tàng", type: "rhetorical", explanation: "So sánh sách với chiếc chìa khóa vàng làm nổi bật giá trị tri thức vô giá của sách sách đem lại." },
          { text: "sách còn là dòng sữa ngọt ngào nuôi dưỡng tâm hồn", type: "rhetorical", explanation: "Ẩn dụ ví sách như dòng sữa ngọt ngào nuôi dưỡng đời sống nội tâm tràn ngập tình yêu thương." },
          { text: "thói quen đọc sách 20 phút mỗi ngày", type: "imagery", explanation: "Dẫn chứng thực tế, thời gian cụ thể rõ ràng làm tăng sức thuyết phục cho lập luận." },
          { text: "những trang giấy thơm tho", type: "vocabulary", explanation: "Từ láy 'thơm tho' gợi tả mùi hương trang sách giấy truyền thống, đánh thức khứu giác yêu thích đọc sách." },
          { text: "em hoàn toàn đồng tình với ý kiến", type: "emotion", explanation: "Bộc lộ thái độ lập trường dứt khoát, tự tin thể hiện quan điểm của học sinh tiểu học." }
        ],
        analysis: [
          "Bố cục nghị luận 3 phần vững vàng, lý lẽ sắc bén đi từ mở mang tri thức đến bồi đắp tâm hồn.",
          "Dẫn chứng cụ thể, gần gũi từ hoạt động thực tế hàng ngày làm tăng sức thuyết phục cao.",
          "Có luận điểm phản biện thông minh giúp bảo vệ lập trường đọc sách một cách toàn diện."
        ]
      },
      paragraph: {
        content: `Việc đọc sách mỗi ngày chính là liều thuốc kỳ diệu nuôi dưỡng những hạt giống nhân văn trong tâm hồn học sinh Tiểu học. Qua từng trang sách thơm tho, em học được cách yêu thương loài vật từ câu chuyện Dế Mèn, biết hiếu thảo từ tấm gương cổ tích thiêng liêng. Những câu chuyện ấy nhẹ nhàng len lỏi vào tâm trí, đánh thức sự thấu cảm trong em, giúp em biết sẻ chia và sống tử tế hơn mỗi ngày với bạn bè, người thân xung quanh.`,
        highlights: [
          { text: "như liều thuốc kỳ diệu nuôi dưỡng", type: "rhetorical", explanation: "Ẩn dụ làm nổi bật tác dụng chữa lành và làm giàu cảm xúc của thói quen đọc sách." },
          { text: "hạt giống nhân văn", type: "rhetorical", explanation: "Ẩn dụ ví phẩm chất tốt đẹp như hạt giống cần được sách tưới tắm để nảy mầm." }
        ],
        analysis: [
          "Đoạn văn nghị luận mạch lạc, tập trung chứng minh khía cạnh bồi đắp tâm hồn của việc đọc sách.",
          "Câu văn diễn đạt trong sáng, liên kết logic chặt chẽ giữa sách và bài học đạo đức sống tử tế."
        ]
      }
    },
    'cam-xuc-cau-chuyen': {
      essay: {
        content: `Mỗi câu chuyện cổ tích đều thắp sáng những ước mơ trẻ thơ, nhưng câu chuyện "Bông hoa cúc trắng" là tác phẩm để lại trong em những rung động sâu sắc nhất về tình mẫu tử thiêng liêng. Hình ảnh cô bé hiếu thảo lặn lội tìm hoa cứu mẹ đã in đậm trong tâm trí em như một biểu tượng đẹp đẽ của lòng biết ơn.\n\nCâu chuyện kể về một cô bé nghèo sống cùng người mẹ ốm nặng. Thương mẹ, em đã vượt qua bao khó khăn để tìm gặp cụ già thầy thuốc và được chỉ lối tìm bông hoa cúc trắng làm thuốc. Khi biết mỗi cánh hoa tương ứng với một năm mẹ được sống thêm, cô bé đã không ngần ngại xé nhỏ từng cánh hoa thành muôn vàn sợi nhỏ. Hành động xé nhỏ cánh hoa ấy tuy giản dị nhưng chứa đựng một tấm lòng hiếu thảo vô hạn, một sự dũng cảm chiến thắng số phận. Nhờ tình thương yêu mãnh liệt của người con, người mẹ đã vượt qua bạo bệnh và sống hạnh phúc bên con.\n\nĐọc câu chuyện, em vô cùng xúc động trước tình thương vô điều kiện của cô bé dành cho mẹ. Tác phẩm đã dạy em bài học thấm thía về đạo làm con, nhắc nhở em phải luôn yêu quý, chăm sóc cha mẹ khi còn có thể.`,
        highlights: [
          { text: "thắp sáng những ước mơ trẻ thơ", type: "rhetorical", explanation: "Ẩn dụ ví câu chuyện như ngọn đèn thắp sáng ước mơ tâm hồn tuổi thơ." },
          { text: "xé nhỏ từng cánh hoa thành muôn vàn sợi nhỏ", type: "imagery", explanation: "Chi tiết miêu tả hành động xúc động bộc lộ trí thông minh và lòng hiếu thảo của cô bé." },
          { text: "em vô cùng xúc động trước tình thương", type: "emotion", explanation: "Bộc lộ trực tiếp cảm xúc nghẹn ngào, thương cảm chân thành của người đọc." },
          { text: "tảo tần", type: "vocabulary", explanation: "Từ ngữ gợi tả nét tính cách lo toan, hy sinh thầm lặng của người con hiếu thảo." }
        ],
        analysis: [
          "Bày tỏ cảm xúc chân thành, sâu lắng đi kèm tóm tắt chi tiết đắt giá nhất của truyện.",
          "Lối viết truyền cảm hứng, khơi gợi lòng hiếu kính đối với đấng sinh thành.",
          "Cấu trúc cân đối giữa cảm nhận nhân vật và liên hệ bài học đạo đức tự thân."
        ]
      },
      paragraph: {
        content: `Hành động cô bé xé nhỏ từng cánh hoa cúc trắng thành muôn vàn sợi nhỏ chính là biểu tượng đẹp đẽ nhất cho tình thương yêu vô bờ bến. Mỗi cánh hoa được xé ra như nối dài thêm sợi dây sự sống của người mẹ yêu kính. Chi tiết cảm động ấy len lỏi vào tâm hồn em, đánh thức lòng biết ơn sâu sắc và nhắc nhở em biết trân trọng mỗi phút giây được ở bên cạnh cha mẹ.`,
        highlights: [
          { text: "như nối dài thêm sợi dây sự sống", type: "rhetorical", explanation: "So sánh ẩn dụ biến cánh hoa thành nhịp cầu kết nối sự sống cho người mẹ." },
          { text: "len lỏi vào tâm hồn em", type: "emotion", explanation: "Mô tả cụ thể sự tác động nhẹ nhàng nhưng sâu sắc của bài học đạo đức vào tâm trí." }
        ],
        analysis: [
          "Đoạn văn tập trung phân tích một chi tiết đắt giá nhất của câu chuyện để bộc lộ cảm xúc sâu sắc.",
          "Từ ngữ chọn lọc tinh tế, câu văn biểu cảm cao."
        ]
      }
    },
    'cam-xuc-bai-tho': {
      essay: {
        content: `Quê hương Việt Nam luôn ngọt ngào qua những lời ru, và bài thơ "Hạt gạo làng ta" của nhà thơ Trần Đăng Khoa là tác phẩm khơi gợi trong em những xúc cảm ấm áp nhất về tình yêu quê hương đất nước. Từng vần thơ giản dị, mộc mạc đã vẽ nên bức tranh lao động tảo tần đầy nghĩa tình.\n\nBài thơ mở ra bằng hương vị thân thương của quê hương: "Hạt gạo làng ta / Có vị phù sa / Có hương sen thơm...". Những dòng thơ ngắn gọn nhưng chứa đựng nhạc điệu thiết tha như tiếng hát ru êm đềm của mẹ. Xúc động nhất là hình ảnh người mẹ cha lao động vất vả giữa trưa hè nắng gắt: "Giọt mồ hôi sa / Những trưa tháng sáu / Nước như ai nấu / Chết cả cá cờ". Biện pháp so sánh ví nước nóng như nấu và hình ảnh cá chết cờ lột tả sự khắc nghiệt của thời tiết, tôn vinh đức hy sinh thầm lặng để làm ra hạt ngọc đất trời. Em cảm nhận được tấm lòng kính yêu và lòng biết ơn vô hạn đối với người nông dân lao động.\n\nTác phẩm đã chắp cánh cho tình yêu quê hương trong em thêm lớn lao. Đọc bài thơ, em tự hứa sẽ trân trọng từng hạt cơm ăn mỗi ngày, trân quý sức lao động và nỗ lực học tập tốt để sau này xây dựng quê hương thêm giàu đẹp.`,
        highlights: [
          { text: "nhạc điệu thiết tha như tiếng hát ru", type: "rhetorical", explanation: "So sánh nhạc điệu thơ với khúc hát ru làm tăng tính biểu cảm, ngọt ngào của quê hương." },
          { text: "Giọt mồ hôi sa / Những trưa tháng sáu", type: "imagery", explanation: "Chi tiết thơ khắc họa sâu sắc nỗi vất vả, khó nhọc của người nông dân dưới nắng gắt." },
          { text: "vô cùng biết ơn và trân quý", type: "emotion", explanation: "Cảm xúc biết ơn trân trọng hạt gạo và công lao người lao động làm ra nó." },
          { text: "hạt ngọc", type: "vocabulary", explanation: "Từ ngữ ẩn dụ tôn vinh giá trị quý báu của hạt gạo quê hương Việt Nam." }
        ],
        analysis: [
          "Cảm thụ văn học xuất sắc, trích dẫn thơ hợp lý để làm điểm tựa bộc lộ tình cảm.",
          "Ngôn ngữ giàu nhạc điệu, sử dụng các hình ảnh đối chiếu sinh động.",
          "Liên hệ bài học thực hành tiết kiệm, trân trọng sức lao động rất thiết thực."
        ]
      },
      paragraph: {
        content: `Hình ảnh "Giọt mồ hôi sa / Những trưa tháng sáu" trong bài thơ khiến lòng em trào dâng một niềm thương cảm và biết ơn vô hạn. Giữa cái nắng như thiêu như đốt làm cá cờ cũng phải chết, người mẹ vẫn lặn lội trên đồng ruộng để làm nên những hạt gạo dẻo thơm. Vần thơ ấy như một lời nhắc nhở sâu sắc giúp em biết quý trọng từng hạt cơm mình ăn hằng ngày và thấu hiểu nỗi vất vả của cha mẹ.`,
        highlights: [
          { text: "lòng em trào dâng một niềm thương cảm", type: "emotion", explanation: "Thể hiện sự thấu cảm trực tiếp trước nỗi vất vả của người lao động." },
          { text: "như một lời nhắc nhở sâu sắc", type: "rhetorical", explanation: "Nhận định ý nghĩa giáo dục của câu thơ đối với lối sống của bản thân học sinh." }
        ],
        analysis: [
          "Đoạn văn tập trung bày tỏ cảm nghĩ về hình ảnh thơ lao động gian khổ của cha mẹ.",
          "Liên kết câu chặt chẽ, dẫn chứng thơ đan xen cảm xúc tự nhiên."
        ]
      }
    },
    'gioi-thieu-nhan-vat-sach': {
      essay: {
        content: `Trong thế giới sách rộng lớn em đã từng đọc, nhân vật chú Dế Mèn trong tác phẩm "Dế Mèn phiêu lưu ký" của nhà văn Tô Hoài là nhân vật để lại ấn tượng sâu đậm nhất trong lòng em. Hành trình từ một chàng dế kiêu căng đến người anh hùng nghĩa hiệp đã truyền cảm hứng mạnh mẽ về lòng dũng cảm.\n\nDế Mèn hiện lên ở đầu tác phẩm với vẻ ngoài vô cùng oai vệ: đôi càng mẫm bóng, sợi râu dài uốn cong đầy kiêu hãnh. Tuy nhiên, tính cách chú lúc ấy lại kiêu căng, ngạo mạn, coi thường mọi người xung quanh, dẫn đến cái chết thương tâm của người bạn Dế Choắt đáng thương. Khoảnh khắc Dế Mèn đứng lặng buồn trước mộ Dế Choắt và nhận ra bài học đường đời đầu tiên là bước ngoặt lay động lòng người nhất. Từ đó, chú quyết tâm lên đường phiêu lưu, kết bạn cùng dế Trũi và xả thân bảo vệ kẻ yếu chống lại chị Nhà Trò độc ác. Sự thay đổi tính cách ấy bộc lộ phẩm chất dũng cảm và tinh thần sửa sai đáng quý.\n\nNhân vật Dế Mèn đã dạy em bài học quý giá về cách cư xử khiêm tốn và biết nhận lỗi để tiến bộ. Em vô cùng quý mến chú dế nghĩa hiệp này và tự hứa sẽ luôn bao dung, sẵn sàng giúp đỡ bạn bè xung quanh mình.`,
        highlights: [
          { text: "đôi càng mẫm bóng, sợi râu dài uốn cong", type: "imagery", explanation: "Miêu tả ngoại hình dế Mèn sinh động, oai phong nhưng chứa vẻ kiêu hãnh." },
          { text: "đứng lặng buồn trước mộ Dế Choắt", type: "imagery", explanation: "Chi tiết đắt giá thể hiện sự hối lỗi, thức tỉnh nhân cách tốt đẹp trong nhân vật." },
          { text: "vô cùng quý mến chú dế nghĩa hiệp", type: "emotion", explanation: "Bộc lộ trực tiếp tình cảm mến yêu dành cho hành trình trưởng thành của nhân vật." },
          { text: "kiêu hãnh", type: "vocabulary", explanation: "Từ láy miêu tả nét tính cách kiêu căng lúc trẻ của nhân vật cần sửa đổi." }
        ],
        analysis: [
          "Giới thiệu nhân vật xuất sắc gắn liền tên sách, lột tả được hành trình biến đổi tâm lý nhân vật.",
          "Dẫn chứng tiêu biểu chọn lọc (ngoại hình kiêu hãnh, sự việc hối hận trước mộ Dế Choắt, hành động giúp Nhà Trò).",
          "Liên hệ bài học khiêm tốn ứng xử thực tế thiết thực cho lứa tuổi học trò."
        ]
      },
      paragraph: {
        content: `Sự thức tỉnh của Dế Mèn trước mộ người bạn Dế Choắt chính là chi tiết lay động trái tim em nhất. Nhìn giọt nước mắt hối hận của chú dế kiêu hãnh đứng lặng lẽ dưới ngọn cỏ tranh, em bỗng nhận ra giá trị to lớn của sự khiêm tốn và biết lỗi. Bài học ấy khuyên nhủ em không được kiêu căng, ngạo mạn làm tổn thương người khác mà phải sống yêu thương, chia sẻ cùng mọi người.`,
        highlights: [
          { text: "giọt nước mắt hối hận của chú dế kiêu hãnh", type: "imagery", explanation: "Hình ảnh chuyển tải cảm xúc sâu sắc bộc lộ lòng nhân hậu thức tỉnh của nhân vật." },
          { text: "nhận ra giá trị to lớn của sự khiêm tốn", type: "emotion", explanation: "Nhận thức suy nghĩ sau khi chứng kiến biến cố lỗi lầm của nhân vật." }
        ],
        analysis: [
          "Đoạn văn tập trung giới thiệu và cảm nhận về bài học đắt giá nhất của nhân vật trong tác phẩm.",
          "Ngôn từ chọn lọc sâu sắc, lập luận chặt chẽ."
        ]
      }
    },
    'gioi-thieu-nhan-vat-hoat-hinh': {
      essay: {
        content: `Mỗi buổi tối cuối tuần, em lại háo hức đón chờ những tập phim hoạt hình vui nhộn, và nhân vật chú mèo máy Doraemon trong bộ phim cùng tên là người bạn hoạt hình em yêu mến nhất. Vẻ ngoài ngộ nghĩnh và tấm lòng nhân hậu của chú đã mang lại cho em biết bao niềm vui tuổi thơ.\n\nDoraemon hiện lên thật đáng yêu với thân hình tròn xoe màu xanh lam, cái đầu trọc lóc không có tai và nụ cười rạng rỡ thân thiện. Điểm đặc biệt nhất của chú là chiếc túi thần kỳ chứa đựng muôn vàn bảo bối kỳ diệu như chong chóng tre, cánh cửa thần kỳ... Mỗi món bảo bối mở ra một thế giới tưởng tượng phong phú, kích thích óc sáng tạo của em. Hơn cả những phép thuật kỳ lạ, tình bạn gắn kết sâu đậm giữa Doraemon và Nobita mới là điều khiến em cảm kích nhất. Dù Nobita hậu đậu hay gặp rắc rối, Doraemon luôn bên cạnh chia sẻ, khuyên nhủ và bảo vệ bạn bằng một trái tim nhân hậu vô điều kiện.\n\nNhân vật Doraemon đã chắp cánh cho những ước mơ tuổi thơ em bay cao. Em vô cùng yêu quý chú mèo máy tốt bụng này và thầm hứa sẽ luôn đối xử tốt bụng, chân thành đối với bạn bè xung quanh giống như tấm lòng của Doraemon.`,
        highlights: [
          { text: "thân hình tròn xoe màu xanh lam đáng yêu", type: "imagery", explanation: "Miêu tả hình ảnh nhân vật hoạt hình quen thuộc, đầy màu sắc sinh động." },
          { text: "túi thần kỳ chứa đựng muôn vàn bảo bối", type: "imagery", explanation: "Đặc điểm bảo bối đặc trưng làm nên sự lôi cuốn của nhân vật hoạt hình Doraemon." },
          { text: "vô cùng yêu quý chú mèo máy tốt bụng", type: "emotion", explanation: "Tình cảm thương mến chân thành của bạn nhỏ dành cho nhân vật." },
          { text: "ngộ nghĩnh", type: "vocabulary", explanation: "Từ láy gợi tả nét vẽ ngộ nghĩnh, hài hước đáng yêu của nhân vật hoạt hình." }
        ],
        analysis: [
          "Giới thiệu sinh động phù hợp tính chất phim hoạt hình trẻ thơ, từ ngữ đầy màu sắc.",
          "Phân tích nét ngộ nghĩnh bên ngoài dẫn dắt khéo léo đến vẻ đẹp tình bạn bên trong.",
          "Rút ra thông điệp giáo dục nhẹ nhàng sâu sắc về tình bạn chân thành."
        ]
      },
      paragraph: {
        content: `Tấm lòng nhân hậu, bao dung của chú mèo máy Doraemon dành cho Nobita hậu đậu chính là bài học ý nghĩa nhất về tình bạn. Dù Nobita có làm hỏng việc hay gây rắc rối thế nào, Doraemon vẫn luôn sát cánh kề vai vỗ về và giúp bạn sửa lỗi bằng chiếc túi bảo bối thần kỳ. Sự gắn kết bền chặt và bao dung ấy đã dạy em biết sống chân thành, biết lắng nghe chia sẻ để gìn giữ những tình bạn đẹp dưới mái trường mến yêu.`,
        highlights: [
          { text: "luôn sát cánh kề vai vỗ về", type: "rhetorical", explanation: "Nhân hóa cử chỉ chăm sóc, vỗ về bảo vệ bạn của nhân vật." },
          { text: "dạy em biết sống chân thành, biết lắng nghe", type: "emotion", explanation: "Bài học tình bạn sâu sắc mà nhân vật hoạt hình truyền tải cho học sinh tiểu học." }
        ],
        analysis: [
          "Đoạn văn giới thiệu nét tính cách đáng quý nhất của nhân vật hoạt hình: sự trung thành và bao dung.",
          "Diễn đạt trôi chảy, giàu cảm xúc trong sáng."
        ]
      }
    },
    'ta-nguoi': {
      essay: {
        content: `Trong cuộc đời mỗi người, gia đình là bến đỗ bình yên nhất, và người mẹ kính yêu chính là ngọn lửa ấm áp sưởi ấm tâm hồn em mỗi ngày. Hình ảnh mẹ tảo tần sớm hôm chăm lo cho gia đình luôn là bức tranh đẹp nhất khắc ghi sâu đậm trong trái tim em.\n\nMẹ em năm nay đã ngoài bốn mươi tuổi. Dáng người mẹ nhỏ nhắn, hơi gầy vì bao năm tháng lo toan vất vả gánh vác việc nhà. Mái tóc mẹ dài, điểm xuyết vài sợi bạc lòa xòa trên trán mỗi khi mẹ cười hiền hậu. Đôi mắt mẹ ấm áp, biết nói, luôn nhìn em với tình yêu thương bao la vô điều kiện. Đẹp nhất là đôi bàn tay mẹ - đôi tay thô ráp, chai sần vì nắng mưa sương gió nhưng lại vô cùng khéo léo khâu vá manh áo, nấu những bữa cơm dẻo thơm ngọt lành nuôi nấng em khôn lớn. Mỗi sớm mai, giọng nói dịu dàng của mẹ cất lên đánh thức em đi học như tiếng ru ngọt ngào xua tan mọi mỏi mệt.\n\nTình yêu thương bao la và đức hy sinh thầm lặng của mẹ như dòng nước mát tưới tắm tâm hồn em. Nhìn đôi tay gầy hao của mẹ, lòng em ngập tràn lòng biết ơn vô hạn. Em tự hứa sẽ học tập thật chăm ngoan, vâng lời cha mẹ để mang lại nụ cười rạng rỡ rực rỡ nhất trên đôi môi ấm áp của mẹ kính yêu.`,
        highlights: [
          { text: "ngọn lửa ấm áp sưởi ấm tâm hồn em", type: "rhetorical", explanation: "Phép ẩn dụ ví mẹ như ngọn lửa ấm áp làm nổi bật tình thương gia đình thiêng liêng." },
          { text: "đôi tay thô ráp, chai sần vì nắng mưa sương gió", type: "imagery", explanation: "Hình ảnh miêu tả đôi bàn tay lam lũ lột tả đức hy sinh cao cả của người mẹ." },
          { text: "lòng em ngập tràn lòng biết ơn vô hạn", type: "emotion", explanation: "Bộc lộ tình cảm hiếu kính sâu sắc của người con dành cho cha mẹ." },
          { text: "tảo tần", type: "vocabulary", explanation: "Từ láy đặc sắc Tiếng Việt lớp 5 gợi sự lo toan chăm chỉ, chịu thương chịu khó của mẹ." }
        ],
        analysis: [
          "Bố cục văn tả người chuẩn mực 3 phần, kết hợp nhuần nhuyễn tả ngoại hình nổi bật và tả hoạt động tính cách.",
          "Sử dụng nhiều từ láy và tính từ biểu cảm cao gợi liên tưởng sâu sắc.",
          "Cảm xúc chân thành lay động lòng người bộc lộ tự nhiên qua từng chi tiết."
        ]
      },
      paragraph: {
        content: `Đôi bàn tay thô ráp, chai sần đầy những vết hằn thời gian của mẹ chính là hình ảnh khiến lòng em rưng rưng xúc động nhất. Đôi bàn tay ấy đã thức khuya dậy sớm khâu từng chiếc cúc áo bị đứt, nấu từng bát cháo nóng hổi vỗ về mỗi khi em bị ốm đau. Sự ấm áp, khéo léo từ đôi bàn tay lam lũ của mẹ truyền cho em một sức mạnh diệu kỳ, sưởi ấm lòng em và nhắc nhở em phải luôn nỗ lực học tập để đền đáp công ơn biển trời đó.`,
        highlights: [
          { text: "đôi bàn tay lam lũ của mẹ truyền cho em một sức mạnh", type: "imagery", explanation: "Miêu tả cụ thể qua xúc giác để chuyển hóa hành động của mẹ thành nguồn động lực tinh thần." },
          { text: "khiến lòng em rưng rưng xúc động", type: "emotion", explanation: "Bộc lộ trực tiếp cảm xúc yêu thương, xót xa khi ngắm nhìn tay mẹ." }
        ],
        analysis: [
          "Đoạn văn tả chi tiết đôi bàn tay mẹ tiêu biểu để bộc lộ tính cách chu đáo và tình thương bao la.",
          "Cách sắp xếp câu văn uyển chuyển nhịp nhàng."
        ]
      }
    },
    'lap-chuong-trinh-hoat-dong': {
      essay: {
        content: `Để chuẩn bị đón chào năm học mới thật sạch sẽ khang trang, chi đội lớp 5A chúng em đã cùng nhau thống nhất lập kế hoạch cho buổi lao động dọn vệ sinh lớp học. Bản chương trình hoạt động khoa học khoa học dưới đây đã giúp cả lớp phối hợp ăn ý để dọn dẹp lớp học thơm tho ngăn nắp chỉ trong một buổi sáng.\n\nMục đích của buổi dọn vệ sinh là làm sạch lớp học, bảo vệ sức khỏe và rèn luyện ý thức giữ gìn vệ sinh chung cho học sinh. Về công tác chuẩn bị, cả lớp tập trung lúc 7 giờ 30 phút sáng chủ nhật tại phòng học. Tổ 1 mang chổi quét nhà và xô nước, Tổ 2 mang khăn lau và nước lau kính, Tổ 3 mang chổi quét trần và nước lau sàn. Phân công nhiệm vụ chi tiết: Tổ 1 chịu trách nhiệm quét mạng nhện trần nhà và lau bảng đen; Tổ 2 tiến hành lau dọn toàn bộ hệ thống cửa sổ, kính hành lang; Tổ 3 quét rác sàn nhà và lau chùi bàn ghế gỗ. Mọi người cùng hăng hái thực hiện nhịp nhàng theo sự hướng dẫn của lớp trưởng.\n\nKết quả, chỉ sau hơn hai tiếng lao động hăng say, phòng học lớp 5A đã sạch sẽ tinh tươm, cửa kính sáng bóng lấp lánh nắng thu. Buổi lao động lập kế hoạch dọn dẹp chu đáo ấy không chỉ mang lại không gian học tập tuyệt đẹp mà còn chắp cánh cho tình đoàn kết bạn bè thêm thắt chặt ấm áp.`,
        highlights: [
          { text: "dọn dẹp lớp học thơm tho ngăn nắp", type: "vocabulary", explanation: "Từ láy 'ngăn nắp' gợi tả trạng thái sạch sẽ, gọn gàng khoa học của lớp học sau khi lao động." },
          { text: "Tổ 1 chịu trách nhiệm quét mạng nhện... Tổ 2 lau dọn... Tổ 3 quét rác", type: "imagery", explanation: "Chi tiết lập kế hoạch phân công nhiệm vụ cụ thể rõ ràng cho từng nhóm." },
          { text: "cả lớp phối hợp ăn ý... chắp cánh tình đoàn kết", type: "emotion", explanation: "Thể hiện niềm vui gắn kết đoàn kết bạn bè thông qua hoạt động tập thể." },
          { text: "sạch sẽ tinh tươm", type: "vocabulary", explanation: "Từ láy 'tinh tươm' miêu tả mức độ sạch sẽ tuyệt đối của phòng học mới." }
        ],
        analysis: [
          "Bố cục rõ ràng gồm Mục đích, Chuẩn bị & Phân công và Tiến trình thực hiện kết quả rõ rệt.",
          "Văn phong lập kế hoạch ngắn gọn, súc tích khoa học nhưng vẫn giàu cảm xúc tập thể ấm áp.",
          "Tính khả thi cao, có thể áp dụng trực tiếp cho hoạt động thực tế lớp học lớp 5."
        ]
      },
      paragraph: {
        content: `Việc lập chương trình hoạt động phân công cụ thể cho buổi dọn vệ sinh lớp học là vô cùng cần thiết để buổi lao động đạt hiệu quả cao. Nhờ phân chia rõ ràng Tổ 1 quét trần nhà, Tổ 2 lau cửa kính sáng bóng, và Tổ 3 lau chùi bàn ghế học sinh, cả lớp đã bắt tay làm việc một cách nhịp nhàng khoa học. Sự phối hợp ăn ý ấy giúp tiết kiệm thời gian lao động và nhân lên niềm vui gắn kết tập thể của chúng em dưới mái trường mến yêu.`,
        highlights: [
          { text: "cả lớp đã bắt tay làm việc một cách nhịp nhàng", type: "rhetorical", explanation: "Nhân hóa không khí làm việc hăng say chung sức đồng lòng của tập thể." },
          { text: "Tổ 1 quét trần nhà, Tổ 2 lau cửa kính... Tổ 3 lau chùi bàn ghế", type: "imagery", explanation: "Nêu các đầu việc phân công rõ ràng chi tiết mang tính lập kế hoạch cao." }
        ],
        analysis: [
          "Đoạn văn tập trung chứng minh lợi ích và sự cần thiết của việc lập kế hoạch phân công cụ thể.",
          "Câu từ mạch lạc, diễn đạt rõ ràng."
        ]
      }
    }
  };

  const genreEntry = mockDatabase[type] || mockDatabase['ta-canh'];
  const essayResult = genreEntry[format] || genreEntry['essay'];
  return { ...essayResult, isSimulated: true };
}

// 1. AI Outline Generation Endpoint
app.post('/api/gemini/generate', async (req, res) => {
  const { topic, type, model } = req.body;
  if (!topic) {
    return res.status(400).json({ error: 'Chủ đề đề bài (topic) không được để trống' });
  }

  const clientApiKey = req.headers['x-api-key'] as string | undefined;
  const client = getGeminiClient(clientApiKey);
  if (!client) {
    // Return high-quality mock data when key is missing so development preview never stays stuck
    return res.json(getMockOutline(topic, type));
  }

  try {
    const prompt = `Bạn là chuyên gia giáo dục tiểu học hỗ trợ dạy Tiếng Việt viết văn lớp 5.
Hãy phân tích đề bài sau và trả về phản hồi dưới dạng JSON chính xác:
Đề bài: "${topic}"
Dạng bài tương ứng: ${type} (Có thể là: ta-canh, ke-chuyen-sang-tao, cam-xuc-nhan-vat, cam-xuc-su-viec, neu-y-kien, cam-xuc-cau-chuyen, cam-xuc-bai-tho, gioi-thieu-nhan-vat-sach, gioi-thieu-nhan-vat-hoat-hinh, ta-nguoi, lap-chuong-trinh-hoat-dong)

Hãy trả về một đối tượng JSON có cấu trúc chính xác sau đây (không có markdown khác ngoài văn bản bên trong thuộc tính JSON):
{
  "genre": "Tên tiếng Việt hiển thị của dạng bài (ví dụ: Văn tả cảnh)",
  "requirements": ["Danh sách 3-4 yêu cầu quan trọng cần có khi làm đề bài này"],
  "outline": {
    "mobi": ["Danh sách 2-3 ý chính của phần Mở bài"],
    "thanbi": ["Danh sách 4-5 ý chính của phần Thân bài, có thể bắt đầu bằng chữ số"],
    "ketbi": ["Danh sách 1-2 ý chính của phần Kết bài"]
  },
  "keywords": ["Danh sách 5-8 từ khóa, từ láy miêu tả hoặc bày tỏ cảm xúc đắt giá cần dùng"],
  "errorsToAvoid": ["Danh sách 2-3 lỗi học sinh hay mắc phải đối với đề tài này"]
}`;

    const textRes = await generateWithFallback(client, model, prompt, {
      responseMimeType: 'application/json',
      temperature: 0.7,
    });
    const cleanedJson = cleanJsonResponse(textRes);
    const data = JSON.parse(cleanedJson);
    return res.json(data);
  } catch (err: any) {
    console.error('Gemini Generate Outline Error:', err);
    const hasApiKey = !!(clientApiKey || process.env.GEMINI_API_KEY);
    if (hasApiKey) {
      return res.status(500).json({ error: `Gemini API Error: ${err.message || err}` });
    }
    return res.status(200).json(getMockOutline(topic, type));
  }
});

// 1.5. AI Exemplary Essay/Paragraph Generation Endpoint
app.post('/api/gemini/essay', async (req, res) => {
  const { topic, type, format, outline, model } = req.body;
  if (!topic) {
    return res.status(400).json({ error: 'Chủ đề đề bài không được để trống' });
  }

  const clientApiKey = req.headers['x-api-key'] as string | undefined;
  const client = getGeminiClient(clientApiKey);
  if (!client) {
    return res.json(getMockEssay(topic, type, format || 'essay'));
  }

  try {
    const prompt = `Bạn là một nhà văn thiếu nhi đoạt giải thưởng lớn và là chuyên gia giáo dục Tiếng Việt lớp 5 ưu tú.
Hãy viết một bài văn mẫu hoàn chỉnh hoặc một đoạn văn ngắn đạt loại xuất sắc (điểm 10/10 tuyệt đối) dựa trên chủ đề và dàn ý cho trước.

Yêu cầu về chất lượng bài viết:
1. Chuẩn mực về ngữ pháp Tiếng Việt lớp 5, hành văn trong sáng, giàu nhạc điệu, giàu cảm xúc chân thành và hình ảnh sống động phù hợp lứa tuổi học sinh tiểu học.
2. Thể hiện rõ các biện pháp tu từ tiêu biểu (So sánh, Nhân hóa, Điệp từ/điệp ngữ) và sử dụng từ láy đắt giá để tăng chiều sâu nghệ thuật.
3. Nếu định dạng là 'essay' (bài văn), bắt buộc phải có đầy đủ 3 phần (Mở bài, Thân bài, Kết bài) phân đoạn rõ ràng bằng ký tự xuống dòng.
4. Nếu định dạng là 'paragraph' (đoạn văn), viết một đoạn văn liền mạch duy nhất không xuống dòng, tập trung thể hiện sâu sắc một khía cạnh nổi bật.
5. Nếu có dàn ý của học sinh ('outline') kèm theo, hãy lấy cảm hứng viết bám sát theo các ý chính trong dàn ý đó nhưng nâng tầm ngôn từ lên loại giỏi để học sinh noi theo.

Chủ đề: "${topic}"
Dạng bài tương ứng: ${type}
Định dạng yêu cầu: ${format === 'essay' ? 'Bài văn hoàn chỉnh' : 'Đoạn văn ngắn'}
Dàn ý của học sinh (nếu có): "${outline || 'Không có dàn ý, hãy viết tự do theo chủ đề'}"

BẮT BUỘC TRẢ VỀ kết quả duy nhất dưới dạng một đối tượng JSON chính xác (không chứa bất kỳ chữ hay markdown nào khác ngoài khối JSON):
{
  "format": "${format || 'essay'}",
  "content": "Nội dung bài viết mẫu viết bằng Tiếng Việt. Để hiển thị tốt, hãy giữ các ký tự xuống dòng '\\\\n\\\\n' phân đoạn rõ ràng nếu là bài văn.",
  "highlights": [
    {
      "text": "cụm từ hoặc câu văn cụ thể có trong nội dung trên cần được tô sáng",
      "type": "imagery" (từ gợi hình, hình ảnh) hoặc "emotion" (từ/câu biểu đạt cảm xúc) hoặc "rhetorical" (biện pháp nghệ thuật so sánh, nhân hóa, điệp từ) hoặc "vocabulary" (từ láy hoặc từ vựng đắt giá),
      "explanation": "Lời giải thích sư phạm ngắn gọn, dễ hiểu của Cú Văn giải thích vì sao câu/từ này lại hay và học sinh nên học hỏi điều gì."
    }
  ],
  "analysis": [
    "Nhận xét tinh hoa thứ 1: ví dụ về bố cục, sự dẫn dắt cảm xúc...",
    "Nhận xét tinh hoa thứ 2: ví dụ về việc sử dụng các từ láy và biện pháp nghệ thuật...",
    "Nhận xét tinh hoa thứ 3: ví dụ về bài học/thông điệp nhân văn đọng lại..."
  ]
}`;

    const textRes = await generateWithFallback(client, model, prompt, {
      responseMimeType: 'application/json',
      temperature: 0.7,
    });
    const cleanedJson = cleanJsonResponse(textRes);
    const data = JSON.parse(cleanedJson);
    return res.json(data);
  } catch (err: any) {
    console.error('Gemini Generate Essay Error:', err);
    const hasApiKey = !!(clientApiKey || process.env.GEMINI_API_KEY);
    if (hasApiKey) {
      return res.status(500).json({ error: `Gemini API Error: ${err.message || err}` });
    }
    return res.status(200).json(getMockEssay(topic, type, format || 'essay'));
  }
});

// 2. AI Grading Rubric Evaluation Endpoint
app.post('/api/gemini/grade', async (req, res) => {
  const { topic, type, outline, model } = req.body;
  if (!topic || !outline) {
    return res.status(400).json({ error: 'Chủ đề đề bài và Dàn ý không được để trống' });
  }

  const clientApiKey = req.headers['x-api-key'] as string | undefined;
  const client = getGeminiClient(clientApiKey);
  if (!client) {
    // Return high-quality mock evaluation
    const scoreVal = outline.length > 100 ? 84 : 68;
    return res.json({
      score: scoreVal,
      criteriaScores: {
        understand: Math.round(scoreVal * 0.2),
        structure: Math.round(scoreVal * 0.2),
        development: Math.round(scoreVal * 0.25),
        creativity: Math.round(scoreVal * 0.2),
        logic: Math.round(scoreVal * 0.15)
      },
      feedback: {
        general: scoreVal >= 80 
          ? 'Ý tưởng bài viết của em khá phong phú, bộc lộ được xúc cảm sâu sắc và chân thực của lứa tuổi học sinh lớp 5.' 
          : 'Dàn ý của em đã có đủ 3 phần cơ bản nhưng cần phát triển thêm những chi tiết miêu tả và cảm thụ sinh động hơn.',
        strengths: [
          'Đã xác định đúng kiểu bài học sinh lớp 5.',
          'Bố cục ba phần rành mạch vững chãi.',
          'Bộc lộ cảm xúc tự nhiên, mộc mạc.'
        ],
        improvements: [
          'Cần bổ sung thêm các hình ảnh chi tiết giàu liên tưởng.',
          'Hãy đa dạng hóa các tính từ màu sắc hoặc âm thanh đặc tả để bài viết sinh động hơn.'
        ],
        nextSteps: 'Hãy thử viết thêm 2-3 ý cụ thể làm rõ chi tiết "âm thanh xôn xao" và nộp lại ở phiên bản sửa đổi (Lần 2) để thấy sự tiến bộ nhé!'
      },
      checklist: [
        { name: 'Xác định rõ ràng bối cảnh', status: true },
        { name: 'Phát triển ý chi tiết', status: outline.length > 120 },
        { name: 'Sử dụng từ ngữ biểu cảm', status: outline.length > 80 },
        { name: 'Có bài học trải nghiệm sâu sắc', status: outline.includes('bài học') || outline.includes('em hứa') || outline.length > 100 }
      ]
    });
  }

  try {
    const prompt = `Bạn là huấn luyện viên viết văn Tiếng Việt lớp 5 thông thái.
Hãy chấm điểm dàn ý của học sinh theo thang điểm 100 dựa trên rubric này:
1. Hiểu đề và xác định đúng yêu cầu (tối đa 20 điểm)
2. Cấu trúc, bố cục dàn ý 3 phần (tối đa 20 điểm)
3. Phát triển ý chính, ý phụ, mức độ chi tiết (tối đa 25 điểm)
4. Sự xuất hiện của cảm xúc / quan điểm / sáng tạo (tối đa 20 điểm)
5. Tính logic và khả năng triển khai thành bài viết (tối đa 15 điểm)

Đề bài: "${topic}"
Dạng bài tương ứng: ${type}
Nội dung dàn ý học sinh nhập:
"${outline}"

Hãy đánh giá cẩn thận và trả về cấu trúc JSON duy nhất sau (không chứa các khối markdown hay chữ khác ngoài thuộc tính JSON):
{
  "score": 85, // Tổng điểm thực tế (chỉ số integer từ 0 đến 100)
  "criteriaScores": {
    "understand": 18, // điểm thực tế cột 1 (tối đa 20)
    "structure": 17, // điểm thực tế cột 2 (tối đa 20)
    "development": 20, // điểm thực tế cột 3 (tối đa 25)
    "creativity": 16, // điểm thực tế cột 4 (tối đa 20)
    "logic": 14 // điểm thực tế cột 5 (tối đa 15)
  },
  "feedback": {
    "general": "Lời nhận xét tổng quan khích lệ tinh thần, súc tích dành cho học sinh lớp 5.",
    "strengths": ["Điểm mạnh 1 rõ nét", "Điểm mạnh 2 rõ nét"],
    "improvements": ["Nội dung cần bổ sung 1", "Nội dung cần bổ sung 2"],
    "nextSteps": "Gợi ý nhiệm vụ nâng cấp cụ thể để sửa đổi cho bài viết tốt hơn"
  },
  "checklist": [
    {"name": "Tiêu chí checklist 1 liên đới riêng biệt dạng bài (ví dụ: Tả bao quát cảnh)", "status": true},
    {"name": "Tiêu chí checklist 2 (ví dụ: Sử dụng từ láy, biện pháp so sánh)", "status": false},
    {"name": "Tiêu chí checklist 3 (ví dụ: Thể hiện cảm xúc chân thực)", "status": true}
  ]
}`;

    const textRes = await generateWithFallback(client, model, prompt, {
      responseMimeType: 'application/json',
      temperature: 0.6,
    });
    const data = JSON.parse(cleanJsonResponse(textRes));
    return res.json(data);
  } catch (err: any) {
    console.error('Gemini grading error:', err);
    const hasApiKey = !!(clientApiKey || process.env.GEMINI_API_KEY);
    if (hasApiKey) {
      return res.status(500).json({ error: `Gemini API Error: ${err.message || err}` });
    }
    return res.json({
      score: 75,
      criteriaScores: { understand: 16, structure: 16, development: 18, creativity: 14, logic: 11 },
      feedback: {
        general: 'Bài của em có ý hay nhưng cần bổ sung các cụm từ đắt giá.',
        strengths: ['Đúng dạng bài', 'Bố cục rõ ràng'],
        improvements: ['Bổ sung thêm từ láy, hình ảnh so sánh', 'Nêu rõ cảm nghĩ ở kết bài'],
        nextSteps: 'Hãy bổ sung từ láy và hình ảnh miêu tả để bài viết cuốn hút hơn.'
      },
      checklist: [{ name: 'Có mở bài', status: true }, { name: 'Thân bài chi tiết', status: false }]
    });
  }
});

// 3. AI Growth Tracker Comparison Endpoint (Before vs After)
app.post('/api/gemini/compare', async (req, res) => {
  const { topic, type, outlineBefore, outlineAfter, gradeBefore, model } = req.body;
  if (!topic || !outlineBefore || !outlineAfter) {
    return res.status(400).json({ error: 'Thiếu dữ liệu để so sánh dàn ý trước sau' });
  }

  const scoreBefore = gradeBefore?.score || 65;
  const skillsBefore = gradeBefore?.criteriaScores || {
    understand: 14,
    structure: 14,
    development: 16,
    creativity: 12,
    logic: 9
  };

  const clientApiKey = req.headers['x-api-key'] as string | undefined;
  const client = getGeminiClient(clientApiKey);
  if (!client) {
    // Generate high-quality growth comparison mock
    const scoreAfter = Math.min(scoreBefore + 18, 98);
    const scoreDiff = scoreAfter - scoreBefore;

    const compFeedback: Record<string, { celebration: string; reminders: string; growthWords: string }> = {
      'ta-canh': {
        celebration: `Tuyệt vời quá! Em đã tăng tận ${scoreDiff} điểm! Thân bài của em từ chỗ chỉ giới thiệu sơ sài giờ đã sống động hơn hẳn nhờ bổ sung các hình ảnh tả cảnh sắc nét, âm thanh rộn ràng và màu sắc tự nhiên.`,
        reminders: 'Em hãy lưu ý sắp xếp thứ tự miêu tả theo một trình tự hợp lý (không gian hoặc thời gian) để chuyển ý mượt mà hơn nhé.',
        growthWords: 'Em đã trưởng thành từ việc quan sát cảnh vật chung chung thành một người quan sát nhạy bén, biết tả chi tiết sinh động.'
      },
      'ke-chuyen-sang-tao': {
        celebration: `Quá xuất sắc! Dàn ý của em đã tăng tận ${scoreDiff} điểm! Câu chuyện sáng tạo của em trở nên lôi cuốn và kịch tính hơn rất nhiều nhờ sự xuất hiện của các tình huống bất ngờ và lời thoại sinh động.`,
        reminders: 'Đừng quên nhấn mạnh hành động giải quyết thử thách của nhân vật chính ở phần cao trào để câu chuyện thêm phần thuyết phục nhé.',
        growthWords: 'Em có trí tưởng tượng rất phong phú và biết cách sắp xếp diễn biến câu chuyện hợp lý để tạo sự tò mò cho người đọc.'
      },
      'cam-xuc-nhan-vat': {
        celebration: `Tuyệt vời quá! Em đã tăng tận ${scoreDiff} điểm! Dàn ý đã sâu sắc hơn rất nhiều nhờ bổ sung các dẫn chứng cụ thể về ngoại hình, lời nói của nhân vật và lý giải rõ tình cảm mến mộ của mình.`,
        reminders: 'Hãy liên hệ thực tế một cách tự nhiên hơn, rút ra bài học ứng xử gần gũi với cuộc sống của chính em từ nhân vật nhé.',
        growthWords: 'Em đã thể hiện khả năng cảm nhận văn học tinh tế, biết đồng cảm và trân trọng những phẩm chất tốt đẹp của nhân vật.'
      },
      'cam-xuc-su-viec': {
        celebration: `Thật đáng khen! Em đã tăng tận ${scoreDiff} điểm! Dàn ý của em đã truyền tải được trọn vẹn cảm xúc xúc động, tự hào hay biết ơn về sự việc thông qua các khoảnh khắc ấn tượng đặc trưng.`,
        reminders: 'Lưu ý cân đối giữa phần tường thuật sự việc và biểu lộ cảm nghĩ, tránh sa vào kể lể chi tiết quá nhiều em nhé.',
        growthWords: 'Cách em bày tỏ tình cảm chân thành qua từng chi tiết nhỏ cho thấy em có một trái tim ấm áp và khả năng diễn đạt cảm xúc rất tốt.'
      },
      'neu-y-kien': {
        celebration: `Chúc mừng em! Điểm dàn ý của em đã tăng tận ${scoreDiff} điểm! Lập luận lần này vô cùng sắc bén và thuyết phục nhờ em đã nêu rõ quan điểm cá nhân, có ít nhất 2 lý lẽ kèm dẫn chứng thực tế rõ ràng.`,
        reminders: 'Cần chú ý bổ sung ý kiến phản biện ngắn gọn để bài viết thêm phần toàn diện và bác bỏ các quan điểm chưa chính xác nhé.',
        growthWords: 'Tư duy phản biện và khả năng lập luận của em rất tốt. Em đã biết dùng lý lẽ và dẫn chứng thực tế để bảo vệ quan điểm của mình một cách khoa học.'
      },
      'cam-xuc-cau-chuyen': {
        celebration: `Tuyệt vời quá! Em đã tăng tận ${scoreDiff} điểm! Dàn ý của em đã sâu sắc hơn rất nhiều nhờ bổ sung cảm nhận chân thành về các sự việc xúc động trong truyện và rút ra bài học sâu sắc.`,
        reminders: 'Em nên chú ý làm nổi bật những khoảnh khắc làm thay đổi suy nghĩ của nhân vật chính hơn nữa nhé.',
        growthWords: 'Em đã biết kết hợp hài hòa giữa việc tóm tắt câu chuyện và bày tỏ cảm xúc, tạo nên một bài cảm nhận giàu tính nhân văn.'
      },
      'cam-xuc-bai-tho': {
        celebration: `Rất đáng khen! Điểm dàn ý của em đã tăng tận ${scoreDiff} điểm! Em đã cảm nhận sâu sắc cái hay của hình ảnh thơ độc đáo, nhạc điệu réo rắt và ngôn từ nghệ thuật đặc sắc.`,
        reminders: 'Nhớ trích dẫn thơ hoặc chỉ rõ những câu thơ đắt giá khi triển khai thành bài viết để tạo điểm nhấn nhé.',
        growthWords: 'Em đã có sự tiến bộ vượt bậc trong việc cảm thụ nghệ thuật ngôn từ, biết trân trọng những vần thơ tình cảm ngọt ngào.'
      },
      'gioi-thieu-nhan-vat-sach': {
        celebration: `Tuyệt vời quá! Em đã tăng tận ${scoreDiff} điểm! Dàn ý giới thiệu nhân vật trong sách đã chi tiết hơn hẳn nhờ bổ sung các dẫn chứng sinh động về hành động, lời nói và tính cách trong cuốn sách.`,
        reminders: 'Lưu ý tránh sa đà kể lại toàn bộ câu chuyện mà hãy tập trung giới thiệu và nhận xét về nhân vật nhé.',
        growthWords: 'Em đã nắm rõ phương pháp giới thiệu nhân vật văn học, biết cách phân tích phẩm chất tốt đẹp để làm tấm gương noi theo.'
      },
      'gioi-thieu-nhan-vat-hoat-hinh': {
        celebration: `Chúc mừng bạn nhỏ! Dàn ý của em đã tăng tận ${scoreDiff} điểm! Nhân vật hoạt hình hiện lên vô cùng ngộ nghĩnh, đáng yêu qua việc miêu tả nét vẽ, sắc màu và cả những bảo bối kỳ diệu.`,
        reminders: 'Em hãy chú ý nêu rõ hơn bài học ý nghĩa hay niềm vui mà nhân vật mang lại cho trẻ thơ nhé.',
        growthWords: 'Cách em giới thiệu nhân vật hoạt hình rất sinh động, mang đậm chất trẻ thơ và giữ được sự cuốn hút đặc trưng của phim ảnh.'
      },
      'ta-nguoi': {
        celebration: `Quá xuất sắc! Dàn ý của em đã tăng tận ${scoreDiff} điểm! Em đã kết hợp rất hài hòa giữa miêu tả ngoại hình tiêu biểu và các hoạt động, cử chỉ bộc lộ tính cách ấm áp của người được tả.`,
        reminders: 'Nhớ đan xen những kỷ niệm đáng nhớ cùng người đó để bài viết giàu cảm xúc và tự nhiên hơn nhé.',
        growthWords: 'Em đã chuyển từ tả người một cách máy móc sang tả người giàu tình cảm, biết dùng chi tiết ngoại hình để lột tả vẻ đẹp tâm hồn.'
      },
      'lap-chuong-trinh-hoat-dong': {
        celebration: `Chúc mừng em! Điểm dàn ý lập chương trình đã tăng tận ${scoreDiff} điểm! Bố cục 3 phần rõ ràng, phân công nhiệm vụ cụ thể cho từng tổ và các bước tiến hành sắp xếp vô cùng khoa học.`,
        reminders: 'Hãy giữ ngôn từ ngắn gọn, rõ ý, tránh viết lan man như văn kể chuyện thông thường nhé.',
        growthWords: 'Tư duy tổ chức và lập kế hoạch của em rất tốt. Bản chương trình hoạt động của em có tính khả thi cao và phân công rất hợp lý.'
      }
    };

    const currentFeedback = compFeedback[type] || compFeedback['ta-canh'];

    return res.json({
      scoreBefore,
      scoreAfter,
      scoreDiff,
      skillsBefore,
      skillsAfter: {
        understand: Math.min(skillsBefore.understand + 2, 20),
        structure: Math.min(skillsBefore.structure + 3, 20),
        development: Math.min(skillsBefore.development + 5, 25),
        creativity: Math.min(skillsBefore.creativity + 4, 20),
        logic: Math.min(skillsBefore.logic + 4, 15)
      },
      feedback: currentFeedback
    });
  }

  try {
    const prompt = `Bạn là huấn luyện viên viết văn Tiếng Việt lớp 5.
Học sinh đã nhận phản hồi từ dàn ý ban đầu (Dàn ý 1), sau đó tự tay điều chỉnh cải tiến thành Dàn ý cải thiện (Dàn ý 2).
Hãy chấm điểm lại Dàn ý 2 và so sánh sự tiến bộ cụ thể giữa hai phiên bản để tôn vinh sự học hỏi và chỉ ra kỹ năng em đã làm tốt lên.

Chủ đề đề bài: "${topic}"
Dạng bài tương ứng: ${type}

Phiên bản Dàn ý 1 (Trước):
"${outlineBefore}"
Điểm của Dàn ý 1 dã chấm trước đó: ${scoreBefore}/100

Phiên bản Dàn ý 2 (Sau cải thiện):
"${outlineAfter}"

Bây giờ bạn hãy đánh giá Dàn ý 2 và lập báo cáo so sánh trước - sau.
Lưu ý: Dàn ý 2 sẽ cải thiện dựa trên các ý gợi ý nên điểm thường cao hơn Dàn ý 1, phản ánh sự tự điều chỉnh và tiếp thu phản hồi của học sinh.

Hãy gửi kết quả cấu trúc JSON duy nhất sau (không có các chữ nằm ngoài JSON):
{
  "scoreBefore": ${scoreBefore}, // Giữ nguyên điểm cũ
  "scoreAfter": 86, // Chấm điểm Dàn ý 2 (thông thường cao hơn Dàn ý 1, tối đa 100)
  "scoreDiff": 21, // Hiệu số tăng điểm thực tế (scoreAfter - scoreBefore)
  "skillsBefore": {
    "understand": ${skillsBefore.understand},
    "structure": ${skillsBefore.structure},
    "development": ${skillsBefore.development},
    "creativity": ${skillsBefore.creativity},
    "logic": ${skillsBefore.logic}
  },
  "skillsAfter": {
    "understand": 18, // Chấm điểm từng cột cho Dàn ý 2 (max 20)
    "structure": 19, // (max 20)
    "development": 22, // (max 25)
    "creativity": 18, // (max 20)
    "logic": 13 // (max 15)
  },
  "feedback": {
    "celebration": "Lời chúc mừng đầy hào hứng, nêu đích xác từ ngữ/chi tiết em đã thêm vào Dàn ý 2 tạo sự cải tiến bất ngờ.",
    "reminders": "Một lưu ý nhỏ để em chú trọng hơn cho bài văn thật sau này.",
    "growthWords": "Chân dung người viết: Nhận xét tóm gọn em đã chuyển mình thế nào (Ví dụ: Từ việc mô tả chung chung sang việc sử dụng xúc cảm và hình tượng tả chi tiết sinh động)."
  }
}`;

    const textRes = await generateWithFallback(client, model, prompt, {
      responseMimeType: 'application/json',
      temperature: 0.5,
    });
    const data = JSON.parse(cleanJsonResponse(textRes));
    return res.json(data);
  } catch (err: any) {
    console.error('Gemini compare error:', err);
    const hasApiKey = !!(clientApiKey || process.env.GEMINI_API_KEY);
    if (hasApiKey) {
      return res.status(500).json({ error: `Gemini API Error: ${err.message || err}` });
    }
    // Graceful fallback
    const mockAfter = Math.min(scoreBefore + 15, 96);
    return res.json({
      scoreBefore,
      scoreAfter: mockAfter,
      scoreDiff: mockAfter - scoreBefore,
      skillsBefore,
      skillsAfter: {
        understand: Math.min(skillsBefore.understand + 1, 20),
        structure: Math.min(skillsBefore.structure + 2, 20),
        development: Math.min(skillsBefore.development + 4, 25),
        creativity: Math.min(skillsBefore.creativity + 3, 20),
        logic: Math.min(skillsBefore.logic + 2, 15)
      },
      feedback: {
        celebration: 'Chúc mừng sự nỗ lực vượt khó tuyệt vời của em! Dàn ý lần 2 đã bổ sung những câu miêu tả sống động, nhiều từ láy và âm thanh vang vui.',
        reminders: 'Em cần liên kết hai đoạn tả hoạt động tự nhiên hơn nữa để chuyển cảnh thật mượt nhé.',
        growthWords: 'Em đã học được thói quen lắng nghe phản hồi và biến ý tưởng còn sơ sài thành bức tranh văn học giàu sắc thái.'
      }
    });
  }
});

function getGenreSpecificMockChat(messages: any[], topic: string, type: string) {
  const userMessages = (messages || []).filter((m: any) => m.role === 'user');
  const userMsgCount = userMessages.length;

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

  const currentReplies = genreReplies[type] || genreReplies['ta-canh'];
  const replyIndex = Math.min(Math.max(userMsgCount - 1, 0), currentReplies.length - 1);
  return currentReplies[replyIndex];
}

// 4. AI Chat Scaffolding Endpoint (Cú Văn đồng hành)
app.post('/api/gemini/chat', async (req, res) => {
  const { messages, topic, type, model } = req.body;
  const clientApiKey = req.headers['x-api-key'] as string | undefined;
  
  if (!topic) {
    return res.status(400).json({ error: 'Chủ đề không được để trống' });
  }

  const client = getGeminiClient(clientApiKey);
  if (!client) {
    return res.json(getGenreSpecificMockChat(messages, topic, type));
  }

  try {
    const chatHistory = (messages || []).map((m: any) => `${m.role === 'user' ? 'Học sinh' : 'Cú Văn'}: ${m.content}`).join('\n');
    const prompt = `Bạn là Cú Văn 🦉 — một chú cú thông thái, hài hước, thân thiện. Bạn là huấn luyện viên viết văn lớp 5.
Quy tắc:
- Xưng "mình", gọi học sinh là "bạn nhỏ"
- Mỗi lượt chỉ hỏi MỘT câu hỏi gợi mở
- Dẫn dắt học sinh xây dựng dàn ý từng bước (Mở bài → Thân bài → Kết bài)
- Khuyến khích dùng từ ngữ miêu tả, cảm xúc
- Sau 2-3 câu trả lời, tổng hợp thành một phần dàn ý

Đề bài: "${topic}"
Dạng bài: ${type}

Lịch sử hội thoại:
${chatHistory}

Hãy trả lời bằng JSON:
{
  "reply": "Câu trả lời của Cú Văn (có emoji 🦉 đầu câu)",
  "suggestedOutlinePart": null hoặc { "section": "mobi|thanbi|ketbi", "content": ["ý 1", "ý 2"] }
}`;

    const textRes = await generateWithFallback(client, model, prompt, {
      responseMimeType: 'application/json',
      temperature: 0.8,
    });
    return res.json(JSON.parse(cleanJsonResponse(textRes)));
  } catch (err: any) {
    console.error('Chat error:', err);
    return res.json(getGenreSpecificMockChat(messages, topic, type));
  }
});

// 5. Sentence Transformer Endpoint (Biến hóa câu văn)
app.post('/api/gemini/transform', async (req, res) => {
  const { sentence, type, model } = req.body;
  const clientApiKey = req.headers['x-api-key'] as string | undefined;
  
  if (!sentence) {
    return res.status(400).json({ error: 'Câu văn không được để trống' });
  }

  const client = getGeminiClient(clientApiKey);
  if (!client) {
    return res.json({
      original: sentence,
      variations: [
        { style: 'Nhân hóa', text: sentence.replace(/rất/, 'như một người bạn hiền, luôn').replace(/\./, ', vươn mình đón nắng sớm mai.'), explanation: 'Biến sự vật thành con người có cảm xúc, hành động sống động.' },
        { style: 'So sánh', text: sentence.replace(/rất/, '').replace(/\./, '') + ', tựa như một bức tranh thiên nhiên tuyệt đẹp.', explanation: 'Dùng hình ảnh quen thuộc để người đọc hình dung rõ hơn.' },
        { style: 'Từ láy & Giác quan', text: sentence.replace(/rất/, 'lừng lững, xanh mướt mát,').replace(/\./, ', tỏa bóng mát rượi cho sân trường.'), explanation: 'Từ láy gợi hình ảnh, âm thanh, xúc giác sinh động hơn.' }
      ]
    });
  }

  try {
    const prompt = `Bạn là huấn luyện viên viết văn lớp 5. Học sinh viết một câu đơn giản, hãy biến hóa thành 3 phiên bản hay hơn.

Câu gốc: "${sentence}"
Dạng bài: ${type || 'ta-canh'}

Trả về JSON:
{
  "original": "${sentence}",
  "variations": [
    { "style": "Nhân hóa", "text": "Câu đã biến hóa bằng nhân hóa", "explanation": "Giải thích ngắn biện pháp tu từ" },
    { "style": "So sánh", "text": "Câu đã biến hóa bằng so sánh", "explanation": "Giải thích" },
    { "style": "Từ láy & Giác quan", "text": "Câu đã biến hóa bằng từ láy", "explanation": "Giải thích" }
  ]
}`;

    const textRes = await generateWithFallback(client, model, prompt, {
      responseMimeType: 'application/json',
      temperature: 0.85,
    });
    return res.json(JSON.parse(cleanJsonResponse(textRes)));
  } catch (err: any) {
    console.error('Transform error:', err);
    // Graceful fallback to mock variations
    return res.json({
      original: sentence,
      variations: [
        { style: 'Nhân hóa', text: sentence.replace(/rất/, 'như một người bạn hiền, luôn').replace(/\./, ', vươn mình đón nắng sớm mai.'), explanation: 'Biến sự vật thành con người có cảm xúc, hành động sống động.' },
        { style: 'So sánh', text: sentence.replace(/rất/, '').replace(/\./, '') + ', tựa như một bức tranh thiên nhiên tuyệt đẹp.', explanation: 'Dùng hình ảnh quen thuộc để người đọc hình dung rõ hơn.' },
        { style: 'Từ láy & Giác quan', text: sentence.replace(/rất/, 'lừng lững, xanh mướt mát,').replace(/\./, ', tỏa bóng mát rượi cho sân trường.'), explanation: 'Từ láy gợi hình ảnh, âm thanh, xúc giác sinh động hơn.' }
      ]
    });
  }
});

// 6. Detective Game Endpoint (Thám tử bắt lỗi)
app.post('/api/gemini/detective', async (req, res) => {
  const { topic, type, errorType, model } = req.body;
  const clientApiKey = req.headers['x-api-key'] as string | undefined;
  
  const client = getGeminiClient(clientApiKey);
  if (!client) {
    return res.json({
      passage: 'Sáng nay em đi học. Trường em rất đẹp. Cây bàng rất to. Hôm qua em ăn phở. Bạn bè rất vui. Trường em có sân rộng. Em thích đi học. Cô giáo dạy toán rất hay. Em rất thích trường em.',
      errors: [
        { location: 'Câu 4', type: 'Lạc đề', suggestion: 'Câu "Hôm qua em ăn phở" không liên quan đến tả trường học. Nên thay bằng chi tiết về cảnh trường.' },
        { location: 'Toàn bài', type: 'Thiếu cảm xúc', suggestion: 'Bài viết liệt kê như danh sách, thiếu từ ngữ miêu tả cảm xúc sinh động.' },
        { location: 'Câu 1-3', type: 'Câu ngắn đơn điệu', suggestion: 'Các câu quá ngắn và đơn giản. Cần dùng từ láy, tính từ để tả chi tiết hơn.' }
      ],
      difficulty: 'easy'
    });
  }

  try {
    const prompt = `Bạn là giáo viên Tiếng Việt lớp 5. Hãy viết một đoạn văn ngắn (5-8 câu) có LỖI CHỦ ĐÍCH để học sinh luyện tập phát hiện lỗi.

Đề bài: "${topic || 'Tả cảnh trường em'}"
Dạng bài: ${type || 'ta-canh'}
Loại lỗi cần cài: ${errorType || 'thiếu cảm xúc, lạc đề nhẹ'}

Trả về JSON:
{
  "passage": "Đoạn văn có lỗi chủ đích (5-8 câu)",
  "errors": [
    { "location": "Vị trí lỗi (VD: Câu 3)", "type": "Loại lỗi", "suggestion": "Gợi ý sửa" }
  ],
  "difficulty": "easy|medium|hard"
}`;

    const textRes = await generateWithFallback(client, model, prompt, {
      responseMimeType: 'application/json',
      temperature: 0.9,
    });
    return res.json(JSON.parse(cleanJsonResponse(textRes)));
  } catch (err: any) {
    console.error('Detective error:', err);
    // Graceful fallback to mock detective passage
    return res.json({
      passage: 'Sáng nay em đi học. Trường em rất đẹp. Cây bàng rất to. Hôm qua em ăn phở. Bạn bè rất vui. Trường em có sân rộng. Em thích đi học. Cô giáo dạy toán rất hay. Em rất thích trường em.',
      errors: [
        { location: 'Câu 4', type: 'Lạc đề', suggestion: 'Câu "Hôm qua em ăn phở" không liên quan đến tả trường học. Nên thay bằng chi tiết về cảnh trường.' },
        { location: 'Toàn bài', type: 'Thiếu cảm xúc', suggestion: 'Bài viết liệt kê như danh sách, thiếu từ ngữ miêu tả cảm xúc sinh động.' },
        { location: 'Câu 1-3', type: 'Câu ngắn đơn điệu', suggestion: 'Các câu quá ngắn và đơn giản. Cần dùng từ láy, tính từ để tả chi tiết hơn.' }
      ],
      difficulty: 'easy'
    });
  }
});

interface TelemetryRecord {
  teacherId: string;
  schoolName: string;
  className: string;
  studentCount: number;
  useCount: number;
  lastActive: string;
}

const KV_REST_API_URL = process.env.KV_REST_API_URL;
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN;

async function getTelemetryStats(): Promise<Record<string, TelemetryRecord>> {
  if (KV_REST_API_URL && KV_REST_API_TOKEN) {
    try {
      const response = await fetch(`${KV_REST_API_URL}/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${KV_REST_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['HGETALL', 'vm5_telemetry']),
      });
      if (response.ok) {
        const data = await response.json();
        const list = data.result || [];
        const records: Record<string, TelemetryRecord> = {};
        for (let i = 0; i < list.length; i += 2) {
          const key = list[i];
          const val = list[i + 1];
          try {
            records[key] = JSON.parse(val);
          } catch {
            // Ignore corrupted JSON
          }
        }
        return records;
      } else {
        console.warn(`Vercel KV REST response not ok: ${response.statusText}`);
      }
    } catch (err) {
      console.error('Failed to get stats from Vercel KV, falling back to local file:', err);
    }
  }

  // Local file fallback
  const filePath = path.join(process.cwd(), 'data', 'admin_stats.json');
  try {
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(fileContent);
    }
  } catch (err) {
    console.error('Failed to read local stats file:', err);
  }
  return {};
}

async function saveTelemetryRecord(record: TelemetryRecord): Promise<void> {
  if (KV_REST_API_URL && KV_REST_API_TOKEN) {
    try {
      const response = await fetch(`${KV_REST_API_URL}/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${KV_REST_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['HSET', 'vm5_telemetry', record.teacherId, JSON.stringify(record)]),
      });
      if (response.ok) return;
      console.warn('Failed to save to Vercel KV, writing to local file instead.');
    } catch (err) {
      console.error('Failed to save to Vercel KV:', err);
    }
  }

  // Local file fallback
  const dirPath = path.join(process.cwd(), 'data');
  const filePath = path.join(dirPath, 'admin_stats.json');
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    const records = await getTelemetryStats(); // fallback check
    records[record.teacherId] = record;
    fs.writeFileSync(filePath, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write local stats file:', err);
  }
}

// 7. Track teacher usage endpoint
app.post('/api/admin/track-use', async (req, res) => {
  const { teacherId, schoolName, className, studentCount } = req.body;
  if (!teacherId) {
    return res.status(400).json({ error: 'Mã định danh Giáo viên (teacherId) không được trống' });
  }

  try {
    const records = await getTelemetryStats();
    const existing = records[teacherId] || {
      teacherId,
      schoolName: '',
      className: '',
      studentCount: 0,
      useCount: 0,
      lastActive: ''
    };

    const updated: TelemetryRecord = {
      teacherId,
      schoolName: schoolName || existing.schoolName || 'Chưa cập nhật',
      className: className || existing.className || 'Chưa cập nhật',
      studentCount: typeof studentCount === 'number' ? studentCount : (existing.studentCount || 0),
      useCount: (existing.useCount || 0) + 1,
      lastActive: new Date().toISOString()
    };

    await saveTelemetryRecord(updated);
    return res.json({ success: true, record: updated });
  } catch (err: any) {
    console.error('Error in /api/admin/track-use:', err);
    return res.status(500).json({ error: err.message || 'Lỗi server' });
  }
});

// 8. Get telemetry stats for admin
app.get('/api/admin/stats', async (req, res) => {
  const adminKey = req.headers['x-admin-key'] as string | undefined;
  if (adminKey !== 'admin9999') {
    return res.status(401).json({ error: 'Mã xác thực Admin không hợp lệ' });
  }

  try {
    const records = await getTelemetryStats();
    const list = Object.values(records);
    return res.json({
      success: true,
      stats: list
    });
  } catch (err: any) {
    console.error('Error in /api/admin/stats:', err);
    return res.status(500).json({ error: err.message || 'Lỗi server' });
  }
});

// ===== CENTRALIZED DATABASE HELPERS =====
async function getClassInfo(teacherId: string): Promise<any | null> {
  if (KV_REST_API_URL && KV_REST_API_TOKEN) {
    try {
      const response = await fetch(`${KV_REST_API_URL}/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${KV_REST_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['HGET', 'vm5_classes', teacherId]),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.result) {
          return JSON.parse(data.result);
        }
      }
    } catch (err) {
      console.error('Failed to get class info from Vercel KV, falling back to local file:', err);
    }
  }

  // Local file fallback
  const filePath = path.join(process.cwd(), 'data', 'classes.json');
  try {
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const db = JSON.parse(fileContent);
      return db[teacherId] || null;
    }
  } catch (err) {
    console.error('Failed to read local classes file:', err);
  }
  return null;
}

async function saveClassInfo(teacherId: string, classInfo: any): Promise<void> {
  if (KV_REST_API_URL && KV_REST_API_TOKEN) {
    try {
      const response = await fetch(`${KV_REST_API_URL}/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${KV_REST_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['HSET', 'vm5_classes', teacherId, JSON.stringify(classInfo)]),
      });
      if (response.ok) return;
      console.warn('Failed to save class to Vercel KV, writing to local file instead.');
    } catch (err) {
      console.error('Failed to save class to Vercel KV:', err);
    }
  }

  // Local file fallback
  const dirPath = path.join(process.cwd(), 'data');
  const filePath = path.join(dirPath, 'classes.json');
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    let db: Record<string, any> = {};
    if (fs.existsSync(filePath)) {
      db = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    db[teacherId] = classInfo;
    fs.writeFileSync(filePath, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write local classes file:', err);
  }
}

async function getAllSubmissions(teacherId: string): Promise<Record<string, any[]>> {
  if (KV_REST_API_URL && KV_REST_API_TOKEN) {
    try {
      const response = await fetch(`${KV_REST_API_URL}/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${KV_REST_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['HGET', 'vm5_submissions', teacherId]),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.result) {
          return JSON.parse(data.result);
        }
      }
    } catch (err) {
      console.error('Failed to get submissions from Vercel KV, falling back to local file:', err);
    }
  }

  // Local file fallback
  const filePath = path.join(process.cwd(), 'data', 'submissions.json');
  try {
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const db = JSON.parse(fileContent);
      return db[teacherId] || {};
    }
  } catch (err) {
    console.error('Failed to read local submissions file:', err);
  }
  return {};
}

async function saveStudentSubmissions(teacherId: string, studentId: string, studentSubmissions: any[]): Promise<void> {
  const db = await getAllSubmissions(teacherId);
  db[studentId] = studentSubmissions;

  if (KV_REST_API_URL && KV_REST_API_TOKEN) {
    try {
      const response = await fetch(`${KV_REST_API_URL}/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${KV_REST_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['HSET', 'vm5_submissions', teacherId, JSON.stringify(db)]),
      });
      if (response.ok) return;
      console.warn('Failed to save submissions to Vercel KV, writing to local file instead.');
    } catch (err) {
      console.error('Failed to save submissions to Vercel KV:', err);
    }
  }

  // Local file fallback
  const dirPath = path.join(process.cwd(), 'data');
  const filePath = path.join(dirPath, 'submissions.json');
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    let fullDb: Record<string, any> = {};
    if (fs.existsSync(filePath)) {
      fullDb = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    fullDb[teacherId] = db;
    fs.writeFileSync(filePath, JSON.stringify(fullDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write local submissions file:', err);
  }
}

// ===== CENTRALIZED DATABASE SYNC ENDPOINTS =====

// 1. Get Class Info
app.get('/api/sync/class-info', async (req, res) => {
  const teacherId = req.query.teacherId as string;
  if (!teacherId) {
    return res.status(450).json({ error: 'Mã giáo viên (teacherId) là bắt buộc' });
  }
  try {
    const classInfo = await getClassInfo(teacherId);
    return res.json({ success: true, classInfo });
  } catch (err: any) {
    console.error('Error in GET /api/sync/class-info:', err);
    return res.status(500).json({ error: err.message || 'Lỗi server' });
  }
});

// 2. Save Class Info
app.post('/api/sync/class-info', async (req, res) => {
  const { teacherId, classInfo } = req.body;
  if (!teacherId || !classInfo) {
    return res.status(450).json({ error: 'Mã giáo viên và thông tin lớp học là bắt buộc' });
  }
  try {
    await saveClassInfo(teacherId, classInfo);
    return res.json({ success: true });
  } catch (err: any) {
    console.error('Error in POST /api/sync/class-info:', err);
    return res.status(500).json({ error: err.message || 'Lỗi server' });
  }
});

// 3. Get Student Submissions
app.get('/api/sync/submissions', async (req, res) => {
  const teacherId = req.query.teacherId as string;
  const studentId = req.query.studentId as string;
  if (!teacherId) {
    return res.status(450).json({ error: 'Mã giáo viên (teacherId) là bắt buộc' });
  }
  try {
    const allSubs = await getAllSubmissions(teacherId);
    if (studentId) {
      return res.json({ success: true, submissions: allSubs[studentId] || [] });
    }
    return res.json({ success: true, submissions: allSubs });
  } catch (err: any) {
    console.error('Error in GET /api/sync/submissions:', err);
    return res.status(500).json({ error: err.message || 'Lỗi server' });
  }
});

// 4. Save Student Submissions
app.post('/api/sync/submissions', async (req, res) => {
  const { teacherId, studentId, submissions } = req.body;
  if (!teacherId || !studentId || !submissions) {
    return res.status(450).json({ error: 'Mã giáo viên, mã học sinh và danh sách bài viết là bắt buộc' });
  }
  try {
    await saveStudentSubmissions(teacherId, studentId, submissions);
    return res.json({ success: true });
  } catch (err: any) {
    console.error('Error in POST /api/sync/submissions:', err);
    return res.status(500).json({ error: err.message || 'Lỗi server' });
  }
});

// Configure Vite middleware in development or express static server in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
