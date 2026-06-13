// Client-side direct call helper for Google Gemini API when the local Express server is down.

const MODEL_FALLBACK_CHAIN = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'];

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

// Map frontend mock/custom model names to real valid Gemini API model IDs
function mapModelName(model: string): string {
  if (model === 'gemini-3-flash-preview') return 'gemini-2.5-flash';
  if (model === 'gemini-3-pro-preview') return 'gemini-2.5-pro';
  if (!model) return 'gemini-2.5-flash';
  return model;
}

export interface DirectGeminiParams {
  action: 'generate' | 'essay' | 'grade' | 'compare' | 'chat' | 'transform' | 'detective';
  topic?: string;
  type?: string; // genreId
  format?: 'essay' | 'paragraph';
  outline?: string;
  outlineBefore?: string;
  outlineAfter?: string;
  scoreBefore?: number;
  skillsBefore?: {
    understand: number;
    structure: number;
    development: number;
    creativity: number;
    logic: number;
  };
  messages?: any[];
  sentence?: string;
  errorType?: string;
  model?: string;
  apiKey: string;
}

export async function callGeminiApiDirectly(params: DirectGeminiParams): Promise<any> {
  const { action, apiKey, model } = params;
  
  // 1. Construct prompt based on action
  let prompt = '';
  let responseMimeType = 'text/plain'; // default

  if (action === 'generate') {
    responseMimeType = 'application/json';
    prompt = `Bạn là chuyên gia giáo dục tiểu học hỗ trợ dạy Tiếng Việt viết văn lớp 5.
Hãy phân tích đề bài sau và trả về phản hồi dưới dạng JSON chính xác:
Đề bài: "${params.topic}"
Dạng bài tương ứng: ${params.type} (Có thể là: ta-canh, ke-chuyen-sang-tao, cam-xuc-nhan-vat, cam-xuc-su-viec, neu-y-kien)

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
  } else if (action === 'essay') {
    responseMimeType = 'application/json';
    prompt = `Bạn là một nhà văn thiếu nhi đoạt giải thưởng lớn và là chuyên gia giáo dục Tiếng Việt lớp 5 ưu tú.
Hãy viết một bài văn mẫu hoàn chỉnh hoặc một đoạn văn ngắn đạt loại xuất sắc (điểm 10/10 tuyệt đối) dựa trên chủ đề và dàn ý cho trước.

Yêu cầu về chất lượng bài viết:
1. Chuẩn mực về ngữ pháp Tiếng Việt lớp 5, hành văn trong sáng, giàu nhạc điệu, giàu cảm xúc chân thành và hình ảnh sống động phù hợp lứa tuổi học sinh tiểu học.
2. Thể hiện rõ các biện pháp tu từ tiêu biểu (So sánh, Nhân hóa, Điệp từ/điệp ngữ) và sử dụng từ láy đắt giá để tăng chiều sâu nghệ thuật.
3. Nếu định dạng là 'essay' (bài văn), bắt buộc phải có đầy đủ 3 phần (Mở bài, Thân bài, Kết bài) phân đoạn rõ ràng bằng ký tự xuống dòng.
4. Nếu định dạng là 'paragraph' (đoạn văn), viết một đoạn văn liền mạch duy nhất không xuống dòng, tập trung thể hiện sâu sắc một khía cạnh nổi bật.
5. Nếu có dàn ý của học sinh ('outline') kèm theo, hãy lấy cảm hứng viết bám sát theo các ý chính trong dàn ý đó nhưng nâng tầm ngôn từ lên loại giỏi để học sinh noi theo.

Chủ đề: "${params.topic}"
Dạng bài tương ứng: ${params.type}
Định dạng yêu cầu: ${params.format === 'essay' ? 'Bài văn hoàn chỉnh' : 'Đoạn văn ngắn'}
Dàn ý của học sinh (nếu có): "${params.outline || 'Không có dàn ý, hãy viết tự do theo chủ đề'}"

BẮT BUỘC TRẢ VỀ kết quả duy nhất dưới dạng một đối tượng JSON chính xác (không chứa bất kỳ chữ hay markdown nào khác ngoài khối JSON):
{
  "format": "${params.format || 'essay'}",
  "content": "Nội dung bài viết mẫu viết bằng Tiếng Việt. Để hiển thị tốt, hãy giữ các ký tự xuống dòng '\\n\\n' phân đoạn rõ ràng nếu là bài văn.",
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
  } else if (action === 'grade') {
    responseMimeType = 'application/json';
    prompt = `Bạn là huấn luyện viên viết văn Tiếng Việt lớp 5 thông thái.
Hãy chấm điểm dàn ý của học sinh theo thang điểm 100 dựa trên rubric này:
1. Hiểu đề và xác định đúng yêu cầu (tối đa 20 điểm)
2. Cấu trúc, bố cục dàn ý 3 phần (tối đa 20 điểm)
3. Phát triển ý chính, ý phụ, mức độ chi tiết (tối đa 25 điểm)
4. Sự xuất hiện của cảm xúc / quan điểm / sáng tạo (tối đa 20 điểm)
5. Tính logic và khả năng triển khai thành bài viết (tối đa 15 điểm)

Đề bài: "${params.topic}"
Dạng bài tương ứng: ${params.type}
Nội dung dàn ý học sinh nhập:
"${params.outline}"

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
  } else if (action === 'compare') {
    responseMimeType = 'application/json';
    prompt = `Bạn là huấn luyện viên viết văn Tiếng Việt lớp 5.
Học sinh đã nhận phản hồi từ dàn ý ban đầu (Dàn ý 1), sau đó tự tay điều chỉnh cải tiến thành Dàn ý cải thiện (Dàn ý 2).
Hãy chấm điểm lại Dàn ý 2 và so sánh sự tiến bộ cụ thể giữa hai phiên bản để tôn vinh sự học hỏi và chỉ ra kỹ năng em đã làm tốt lên.

Chủ đề đề bài: "${params.topic}"
Dạng bài tương ứng: ${params.type}

Phiên bản Dàn ý 1 (Trước):
"${params.outlineBefore}"
Điểm của Dàn ý 1 dã chấm trước đó: ${params.scoreBefore}/100

Phiên bản Dàn ý 2 (Sau cải thiện):
"${params.outlineAfter}"

Bây giờ bạn hãy đánh giá Dàn ý 2 và lập báo cáo so sánh trước - sau.
Lưu ý: Dàn ý 2 sẽ cải thiện dựa trên các ý gợi ý nên điểm thường cao hơn Dàn ý 1, phản ánh sự tự điều chỉnh và tiếp thu phản hồi của học sinh.

Hãy gửi kết quả cấu trúc JSON duy nhất sau (không có các chữ nằm ngoài JSON):
{
  "scoreBefore": ${params.scoreBefore},
  "scoreAfter": 86, // Chấm điểm Dàn ý 2 (thông thường cao hơn Dàn ý 1, tối đa 100)
  "scoreDiff": 21, // Hiệu số tăng điểm thực tế (scoreAfter - scoreBefore)
  "skillsBefore": {
    "understand": ${params.skillsBefore?.understand || 0},
    "structure": ${params.skillsBefore?.structure || 0},
    "development": ${params.skillsBefore?.development || 0},
    "creativity": ${params.skillsBefore?.creativity || 0},
    "logic": ${params.skillsBefore?.logic || 0}
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
  } else if (action === 'chat') {
    responseMimeType = 'application/json';
    const chatHistory = (params.messages || []).map((m: any) => `${m.role === 'user' ? 'Học sinh' : 'Cú Văn'}: ${m.content}`).join('\n');
    prompt = `Bạn là Cú Văn 🦉 — một chú cú thông thái, hài hước, thân thiện. Bạn là huấn luyện viên viết văn lớp 5.
Quy tắc:
- Xưng "mình", gọi học sinh là "bạn nhỏ"
- Mỗi lượt chỉ hỏi MỘT câu hỏi gợi mở
- Dẫn dắt học sinh xây dựng dàn ý từng bước (Mở bài → Thân bài → Kết bài)
- Khuyến khích dùng từ ngữ miêu tả, cảm xúc
- Sau 2-3 câu trả lời, tổng hợp thành một phần dàn ý

Đề bài: "${params.topic}"
Dạng bài: ${params.type}

Lịch sử hội thoại:
${chatHistory}

Hãy trả lời bằng JSON:
{
  "reply": "Câu trả lời của Cú Văn (có emoji 🦉 đầu câu)",
  "suggestedOutlinePart": null hoặc { "section": "mobi|thanbi|ketbi", "content": ["ý 1", "ý 2"] }
}`;
  } else if (action === 'transform') {
    responseMimeType = 'application/json';
    prompt = `Bạn là huấn luyện viên viết văn lớp 5. Học sinh viết một câu đơn giản, hãy biến hóa thành 3 phiên bản hay hơn.

Câu gốc: "${params.sentence}"
Dạng bài: ${params.type || 'ta-canh'}

Trả về JSON:
{
  "original": "${params.sentence}",
  "variations": [
    { "style": "Nhân hóa", "text": "Câu đã biến hóa bằng nhân hóa", "explanation": "Giải thích ngắn biện pháp tu từ" },
    { "style": "So sánh", "text": "Câu đã biến hóa bằng so sánh", "explanation": "Giải thích" },
    { "style": "Từ láy & Giác quan", "text": "Câu đã biến hóa bằng từ láy", "explanation": "Giải thích" }
  ]
}`;
  } else if (action === 'detective') {
    responseMimeType = 'application/json';
    prompt = `Bạn là giáo viên Tiếng Việt lớp 5. Hãy viết một đoạn văn ngắn (5-8 câu) có LỖI CHỦ ĐÍCH để học sinh luyện tập phát hiện lỗi.

Đề bài: "${params.topic || 'Tả cảnh trường em'}"
Dạng bài: ${params.type || 'ta-canh'}
Loại lỗi cần cài: ${params.errorType || 'thiếu cảm xúc, lạc đề nhẹ'}

Trả về JSON:
{
  "passage": "Đoạn văn có lỗi chủ đích (5-8 câu)",
  "errors": [
    { "location": "Vị trí lỗi (VD: Câu 3)", "type": "Loại lỗi", "suggestion": "Gợi ý sửa" }
  ],
  "difficulty": "easy|medium|hard"
}`;
  }

  // 2. Resolve models to try (fallback chain)
  const mappedModel = mapModelName(model || 'gemini-3-flash-preview');
  const modelsToTry = [mappedModel, ...MODEL_FALLBACK_CHAIN.filter(m => m !== mappedModel)];

  let lastError: any = null;
  
  // 3. Loop through models and fetch
  for (const modelId of modelsToTry) {
    try {
      console.log(`Direct Gemini API - Trying model: ${modelId}`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: responseMimeType,
              temperature: 0.75
            }
          })
        }
      );

      const resData = await response.json();
      
      if (!response.ok) {
        throw new Error(resData?.error?.message || `API error (${response.status})`);
      }

      const text = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('API returned an empty content body');
      }

      if (responseMimeType === 'application/json') {
        const cleaned = cleanJsonResponse(text);
        return JSON.parse(cleaned);
      }
      
      return text;
      
    } catch (err: any) {
      console.warn(`Direct Gemini API - Model ${modelId} failed:`, err);
      lastError = err;
      // Continue to next model on failure
      continue;
    }
  }

  throw lastError || new Error('Tất cả các model của Gemini đều không phản hồi.');
}
