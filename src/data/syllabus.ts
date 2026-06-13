import { EssayMetadata } from '../types';

export const SYLLABUS_DATA: EssayMetadata[] = [
  {
    id: 'ta-canh',
    title: 'Văn tả cảnh',
    emoji: '🌳',
    iconName: 'camera',
    iconBg: 'from-emerald-100 to-teal-100',
    iconColor: 'text-emerald-600',
    description: 'Miêu tả một cảnh đẹp quê hương, trường học, công viên, cảnh sinh hoạt thiên nhiên giúp người đọc hình dung rõ nét không gian.',
    topics: [
      'Tả một cảnh đẹp quê hương em (con sông, cánh đồng, bãi biển...)',
      'Tả cảnh trường học mến yêu của em trước buổi học',
      'Tả cảnh một công viên xanh mát vào một buổi sáng ấm áp',
      'Tả cảnh sân trường giờ ra chơi sôi động náo nhiệt',
      'Tả một buổi chiều hoàng hôn rực rỡ trên quê hương em'
    ],
    template: {
      mobi: [
        'Giới thiệu cảnh đẹp định miêu tả (Là cảnh gì? Ở đâu? Em quan sát vào lúc nào?)',
        'Cảm xúc, ấn tượng chung ban đầu (Cảnh đó đẹp ra sao? Vì sao em tả?)'
      ],
      thanbi: [
        '1. Tả bao quát: Tầm nhìn bao quát toàn bộ cảnh vật (Không gian, thời gian, thời tiết, ấn tượng lớn nhất).',
        '2. Tả chi tiết theo trình tự hợp lý (Từ xa đến gần hoặc từ cao xuống thấp):',
        '- Bầu trời (Mây, nắng, gió...), âm thanh xung quanh.',
        '- Cảnh vật chính: Cây cối, những con đường, dòng nước, màu sắc nổi bật.',
        '- Hoạt động của con người hoặc con vật góp phần làm cảnh sống động.',
        '3. Điểm đặc sắc nổi bật nhất (Chi tiết đắt giá, màu sắc hay âm thanh đặc trưng gây thương nhớ).'
      ],
      ketbi: [
        'Khẳng định lại tình cảm tinh tế của em với cảnh đẹp đó (Yêu quý, tự hào, gắn bó).',
        'Mong muốn hoặc hành động thiết thực để tiếp tục gìn giữ, bảo vệ vẻ đẹp thiên nhiên.'
      ]
    },
    aiRules: {
      mustHave: [
        'Xác định rõ cảnh vật cần tả',
        'Có miêu tả bao quát không gian',
        'Có miêu tả chi tiết bằng nhiều giác quan (thị giác, thính giác...)',
        'Sử dụng các từ ngữ miêu tả sinh động (tính từ chỉ màu sắc, hình dáng)',
        'Thể hiện cảm xúc tinh tế gắn bó với cảnh vật'
      ],
      shouldAvoid: [
        'Sa đà kể chuyện, liệt kê hoạt động quá nhiều mà quên đặc trưng tả cảnh',
        'Bố cục lộn xộn, không tả theo trình tự thời gian hoặc không gian',
        'Dàn ý quá sơ sài, chỉ gạch vài dòng chung chung phi thực tế'
      ]
    }
  },
  {
    id: 'ke-chuyen-sang-tao',
    title: 'Kể chuyện sáng tạo',
    emoji: '📖',
    iconName: 'book-open',
    iconBg: 'from-purple-100 to-violet-100',
    iconColor: 'text-purple-600',
    description: 'Tập trung kể lại một câu truyện quen thuộc bằng cách đổi vai nhân vật, thêm nhân vật mới, đổi kết cục hoặc viết tiếp hành trình bất ngờ.',
    topics: [
      'Trong vai Chiếc hộp bí mật dưới gốc cây kể lại hành trình phiêu lưu cùng Minh',
      'Thay đổi kết thúc của câu chuyện "Trí khôn của ta đây" theo hướng nhân văn hơn',
      'Đóng vai người cháu kể bài thơ "Bếp lửa" thành một câu chuyện sáng tạo',
      'Viết tiếp câu chuyện sáng tạo: Một buổi sáng, Minh phát hiện chiếc hộp kỳ lạ chứa bí mật...',
      'Đại diện cho chú Dế Mèn kể về bài học đường đời đầu tiên bằng một góc nhìn mới'
    ],
    template: {
      mobi: [
        'Giới thiệu câu chuyện định kể (Tên chuyện gốc là gì? Nhân vật chính là ai?)',
        'Hoàn cảnh xảy ra câu chuyện và lý do sáng tạo (Em nhập vai ai? Bắt đầu thế nào?)'
      ],
      thanbi: [
        '1. Sự việc khơi mào kích thích sự tò mò.',
        '2. Diễn biến câu chuyện sáng tạo:',
        '- Sự việc thứ nhất dẫn đến tình huống đặc biệt.',
        '- Sự việc thứ hai tiếp nối cùng các nhân vật mới hoặc hành động khác biệt chuyện cũ.',
        '- Xuất hiện tình huống bất ngờ hoặc nút thắt đột phá.',
        '3. Cao trào kịch tính: Đỉnh điểm vấn đề đặt ra và cách giải quyết khéo léo của nhân vật.',
        '4. Kết quả của những thay đổi sáng tạo đó.'
      ],
      ketbi: [
        'Từ câu chuyện rút ra ý nghĩa sâu sắc hoặc bài học cuộc sống đáng suy ngẫm.',
        'Thể hiện nét suy nghĩ riêng hoặc thông điệp sáng tạo muốn gửi gắm.'
      ]
    },
    aiRules: {
      mustHave: [
        'Giới thiệu rõ ràng hoàn cảnh câu chuyện',
        'Tạo ra nhân vật mới hoặc đột phá về vai kể khác biệt chuyện gốc',
        'Có sự việc mở đầu đầy hứa hẹn',
        'Xây dựng các chi tiết thắt nút và mở nút (cao trào và giải quyết ổn thỏa)',
        'Kết thúc câu chuyện sáng tạo mang ý nghĩa sâu sắc'
      ],
      shouldAvoid: [
        'Chép y nguyên cốt truyện cũ, không có yếu tố sáng tạo riêng',
        'Kể quá vắn tắt, diễn biến rời rạc như bản kiểm điểm',
        'Thời gian lỗi nhịp, thiếu logic hành động nhân vật'
      ]
    }
  },
  {
    id: 'cam-xuc-nhan-vat',
    title: 'Bày tỏ tình cảm về nhân vật',
    emoji: '🎬',
    iconName: 'heart-handshake',
    iconBg: 'from-pink-100 to-rose-100',
    iconColor: 'text-pink-600',
    description: 'Bày tỏ những tình cảm chân thành, chân dung tính cách ấn tượng về nhân vật trong các cuốn sách đã đọc hoặc phim hoạt hình mà em kính yêu.',
    topics: [
      'Bày tỏ cảm xúc của em về nhân vật Dế Mèn kiêu hãnh và bài học sau đó',
      'Tình cảm của em đối với nhân vật bé Thu trong truyện "Chiếc lược ngà"',
      'Chia sẻ suy nghĩ sâu sắc về nhân vật Doraemon - người bạn tinh nghịch sáng tạo',
      'Tình cảm đối với một người anh hùng nhỏ tuổi (Lượm, Kim Đồng...) trong truyện lịch sử',
      'Nêu cảm nghĩ về một nhân vật giàu nghị lực vượt lên số phận trong bộ phim hoạt hình yêu thích'
    ],
    template: {
      mobi: [
        'Giới thiệu nhân vật gây ấn tượng mạnh (Nhân vật nào? Thuộc tác phẩm hay bộ phim nào?)',
        'Cảm nhận bao quát của em về sự thu hút của nhân vật đó.'
      ],
      thanbi: [
        '1. Ấn tượng chung đầu tiên: Hoàn cảnh em tiếp cận nhân vật này (Từ câu chuyện đọc đêm mưa hay cùng bố xem phim?).',
        '2. Những nét đặc sắc cuốn hút nhất ở nhân vật:',
        '- Vẻ ngoài đặc trưng hoặc hành động phi thường.',
        '- Lời nói hoặc suy nghĩ độc đáo bộc lộ bản lĩnh tâm hồn.',
        '- Tính cách cốt lõi: nhân hậu, dũng cảm, thông minh vượt khó.',
        '3. Chi tiết em tâm đắc và lay động nhất ở nhân vật (Điều gì khiến trái tim em rung động?).',
        '4. Ảnh hưởng tốt đẹp của nhân vật đến suy nghĩ, hành động thực tế của chính em.'
      ],
      ketbi: [
        'Khẳng định tình cảm chân thành, sự trân quý của em với nhân vật.',
        'Rút ra bài học đạo đức hay lẽ sống tự hứa với bản thân để noi theo.'
      ]
    },
    aiRules: {
      mustHave: [
        'Nêu tên nhân vật và nguồn gốc tác phẩm',
        'Lựa chọn dẫn chứng cụ thể thể hiện nét tính cách nhân vật',
        'Lời bình luận sâu sắc về hành động đáng quý của nhân vật',
        'Thể hiện cảm xúc yêu ghét hoặc kính phục rõ rệt qua từ ngữ chân thật',
        'Bài học tự thân thấm thía tinh nghịch'
      ],
      shouldAvoid: [
        'Lệch sang kể tóm tắt lại toàn bộ nội dung tác phẩm, truyện kể mà quên biểu lộ cảm xúc',
        'Khen ngợi hời hợt chung chung không có dẫn chứng sự việc cụ thể',
        'Thiếu liên hệ thực tế xem nhân vật dạy em làm việc tốt gì'
      ]
    }
  },
  {
    id: 'cam-xuc-su-viec',
    title: 'Bày tỏ tình cảm, cảm xúc về một sự việc',
    emoji: '❤️',
    iconName: 'heart',
    iconBg: 'from-red-100 to-orange-100',
    iconColor: 'text-red-500',
    description: 'Thể hiện rung động, suy nghĩ và kỉ niệm sâu sắc của bản thân về một việc làm tốt, một kì nghỉ đáng nhớ hay một hoạt động thi đua xã hội thiết thực.',
    topics: [
      'Nêu cảm nghĩ về một kỉ niệm ấm áp đáng nhớ cùng người thân trong gia đình',
      'Viết về một hành động bảo vệ môi trường chung sức làm sạch bãi biển em tham gia',
      'Bày tỏ cảm xúc của em về một buổi quyên góp thiện nguyện giúp bạn vùng bão lũ',
      'Cảm xúc sau khi nỗ lực hoàn thành xuất sắc giải bơi lội hoặc thể chất của lớp',
      'Nêu cảm xúc sâu đậm về một sự việc tốt đẹp bất ngờ em chứng kiến trên đường đi học'
    ],
    template: {
      mobi: [
        'Giới thiệu sơ lược về sự việc đáng nhớ (Sự việc gì? Diễn ra khi nào? Ai tham gia?)',
        'Cảm xúc bao quát ban đầu về trải nghiệm này (Hồi hộp, tự hào hay đầy xúc động?)'
      ],
      thanbi: [
        '1. Diễn biến chân thực của sự việc:',
        '- Hoàn cảnh khởi đầu đầy thách thức khó quên.',
        '- Hoạt động chính diễn ra theo tiến trình từ đầu đến lúc sôi nổi nhất.',
        '- Mọi người xung quanh đã đóng góp công sức và tương tác thế nào?',
        '2. Cảm xúc sâu sắc trong suốt quá trình trải nghiệm:',
        '- Hồi hộp lo lắng trước giờ G.',
        '- Niềm vui vỡ òa, hăng say khi bắt tay thực hiện chung vai sát cánh.',
        '- Sự xúc động sâu xa lắng đọng sau khi sự việc hoàn tất.',
        '3. Điểm sáng hay hình ảnh ấn tượng nhất (Một ánh mắt cảm ơn, một nụ cười rạng rỡ của bạn ấm áp).'
      ],
      ketbi: [
        'Khẳng định giá trị nhân văn mà sự việc mang lại cho bản thân.',
        'Hứa hẹn thay đổi hành vi tích cực hoặc mong ước duy trì những hoạt động tuyệt đẹp đó.'
      ]
    },
    aiRules: {
      mustHave: [
        'Nêu rõ sự việc và thời điểm diễn ra',
        'Kết cấu logic trước - trong - sau của diễn biến',
        'Sử dụng nhiều từ ngữ tả cảm xúc nội tâm tinh tế (xúc động, nghẹn ngào, bừng sáng)',
        'Bật lên được ý nghĩa nhân bản thiết thực của việc làm đó',
        'Có bài học trải nghiệm sâu sắc đúc rút riêng'
      ],
      shouldAvoid: [
        'Chương trình hóa sự việc như lịch trình khô khan không chút cảm xúc',
        'Bịa đặt chi tiết không có thật khiến bài viết trở nên giả tạo',
        'Kể lể tràn lan nhưng không thể hiện được kỉ niệm đáng yêu nào'
      ]
    }
  },
  {
    id: 'neu-y-kien',
    title: 'Nêu ý kiến đồng tình / phản đối',
    emoji: '💡',
    iconName: 'scale',
    iconBg: 'from-blue-100 to-sky-100',
    iconColor: 'text-blue-600',
    description: 'Sử dụng tư duy biện luận đơn giản để đồng tình hoặc phản đối một quan điểm xã hội gần gũi như sử dụng điện thoại, đọc sách, bảo vệ động vật.',
    topics: [
      'Nêu ý kiến của em về việc: Học sinh lớp 5 có nên sử dụng điện thoại thông minh ở trường?',
      'Trình bày quan điểm tán thành việc: Đọc sách giấy mỗi ngày tốt hơn lướt mạng xã hội',
      'Kiến nghị bảo vệ động vật hoang dã và không đồng tình với việc sử dụng đồ da thú',
      'Nêu ý kiến đồng tình hay phản đối việc: Học sinh tiểu học có bắt buộc phải học thêm không?',
      'Phát biểu suy nghĩ về ý kiến: Trẻ em cần tham gia làm việc nhà phụ giúp cha mẹ'
    ],
    template: {
      mobi: [
        'Dẫn dắt nêu vấn đề nghị luận trong đời sống (Vấn đề gì đang được chú ý?)',
        'Khẳng định rõ ràng lập trường cá nhân: Em Tán thành đồng ý hay Phản đối không đồng tình.'
      ],
      thanbi: [
        '1. Lý lẽ 1 chứng minh quan điểm của em (Giải thích cốt lõi vấn đề): Vì sao em có quan điểm này?',
        '2. Lý lẽ 2 tăng tính thuyết phục (Dẫn chứng thực tế):',
        '- Nêu ra một ví dụ rất cụ thể sinh động từ đời sống học tập hằng ngày.',
        '- Phân tích lợi ích nếu làm theo hoặc tác hại nguy hại nếu vi phạm.',
        '3. Đưa ra lập luận phản biện nhẹ nhàng (Giải đáp ý kiến trái chiều): Một số bạn có thể cho rằng... Tuy nhiên, thực tế là...',
        '4. Bài học liên hệ bản thân sáng suốt.'
      ],
      ketbi: [
        'Khẳng định đinh thép ý kiến tán thành hoặc bác bỏ một lần nữa.',
        'Đề xuất giải pháp hành động thông điệp thiết thực, kêu gọi bạn bè cùng hưởng ứng.'
      ]
    },
    aiRules: {
      mustHave: [
        'Bày tỏ rõ ràng ngay ở mở bài là tán thành hay phản đối',
        'Có ít nhất 2 lý lẽ sâu sắc để chứng minh',
        'Có dẫn chứng cụ thể thực tế làm điểm tựa lập luận',
        'Có bước tranh biện giải quyết ý kiến trái chiều',
        'Lời văn khúc chiết mang tính thuyết phục cao'
      ],
      shouldAvoid: [
        'Ba phải mơ hồ lúc đồng ý lúc lại bác bỏ khiến bài văn mất trọng tâm',
        'Toàn diễn giải đao to búa lớn thiếu ví dụ sinh động lứa tuổi tiểu học',
        'Công kích gay gắt thô bạo ý kiến khác, thiếu tôn trọng quan điểm đa chiều'
      ]
    }
  },
  {
    id: 'cam-xuc-cau-chuyen',
    title: 'Bày tỏ cảm xúc về một câu chuyện',
    emoji: '📖',
    iconName: 'book-open',
    iconBg: 'from-blue-100 to-indigo-100',
    iconColor: 'text-blue-600',
    description: 'Bày tỏ những rung động, cảm nghĩ chân thành của em về một câu chuyện đầy ý nghĩa đã đọc hoặc được nghe kể.',
    topics: [
      'Nêu cảm nghĩ của em về câu chuyện "Sự tích hồ Ba Bể" và tấm lòng của mẹ con bà góa',
      'Bày tỏ tình cảm, cảm xúc của em sau khi đọc câu chuyện "Một phát minh nho nhỏ"',
      'Nêu cảm nghĩ về câu chuyện "Bông hoa cúc trắng" và lòng hiếu thảo của người con',
      'Chia sẻ cảm nhận của em về câu chuyện "Hạt giống tâm hồn" mà em yêu thích nhất'
    ],
    template: {
      mobi: [
        'Giới thiệu câu chuyện em định bày tỏ cảm xúc (Tên truyện, hoàn cảnh em đọc/nghe)',
        'Nêu cảm xúc, ấn tượng bao quát nhất'
      ],
      thanbi: [
        '1. Tóm tắt ngắn gọn sự việc chính khơi gợi cảm xúc mạnh mẽ nhất.',
        '2. Cảm xúc chi tiết của em đối với từng nhân vật hoặc tình huống trong câu chuyện (Cảm kích, thương xót, vui sướng, hay tiếc nuối).',
        '3. Ý nghĩa sâu sắc của câu chuyện lay động đến tâm hồn em.',
        '4. Những liên hệ thực tế, bài học bản thân tự rút ra.'
      ],
      ketbi: [
        'Khẳng định lại tình cảm của em đối với câu chuyện và giá trị của câu chuyện đó theo thời gian.'
      ]
    },
    aiRules: {
      mustHave: [
        'Nêu rõ tên câu chuyện',
        'Thể hiện cảm xúc chân thành xuyên suốt',
        'Rút ra được bài học sâu sắc từ câu chuyện',
        'Lập luận rõ ràng về ý nghĩa câu chuyện'
      ],
      shouldAvoid: [
        'Kể lại toàn bộ câu chuyện từ đầu đến cuối mà quên bày tỏ cảm xúc',
        'Nhận xét chung chung không có dẫn chứng sự việc cụ thể'
      ]
    }
  },
  {
    id: 'cam-xuc-bai-tho',
    title: 'Bày tỏ cảm xúc về một bài thơ',
    emoji: '📜',
    iconName: 'pen-tool',
    iconBg: 'from-amber-100 to-yellow-100',
    iconColor: 'text-amber-600',
    description: 'Bày tỏ những suy ngẫm, cảm xúc sâu lắng về nhịp điệu, hình ảnh và tình cảm chứa đựng trong một bài thơ em yêu thích.',
    topics: [
      'Bày tỏ cảm xúc của em sau khi học bài thơ "Hạt gạo làng ta" của Trần Đăng Khoa',
      'Cảm xúc của em về tình quê hương ấm áp trong bài thơ "Quê hương"',
      'Nêu cảm nhận của em về hình ảnh người chiến sĩ trong bài thơ "Tre Việt Nam"',
      'Chia sẻ rung động của em khi đọc bài thơ "Cánh diều tuổi thơ"'
    ],
    template: {
      mobi: [
        'Giới thiệu bài thơ (Tên bài thơ, tác giả) và hoàn cảnh tiếp xúc.',
        'Bộc lộ cảm nghĩ chung nhất về bài thơ.'
      ],
      thanbi: [
        '1. Cảm nhận về hình ảnh thơ đẹp và độc đáo (Hình ảnh thiên nhiên, con người).',
        '2. Cảm nhận về nhạc điệu, vần điệu của bài thơ gợi cảm giác gì.',
        '3. Phân tích từ ngữ gợi cảm xúc chân thật, lay động lòng người của bài thơ.',
        '4. Tình cảm của tác giả gửi gắm và sự đồng cảm của chính em.'
      ],
      ketbi: [
        'Khẳng định giá trị của bài thơ trong lòng em và sự trân trọng đối với tác giả.'
      ]
    },
    aiRules: {
      mustHave: [
        'Nêu tên bài thơ và tác giả',
        'Trích dẫn hoặc chỉ rõ những hình ảnh, từ ngữ đặc sắc trong bài thơ',
        'Bộc lộ tình cảm sâu sắc của người viết'
      ],
      shouldAvoid: [
        'Chép lại bài thơ mà không phân tích cảm xúc',
        'Viết lan man không tập trung vào cái hay của ngôn từ nghệ thuật thơ'
      ]
    }
  },
  {
    id: 'gioi-thieu-nhan-vat-sach',
    title: 'Giới thiệu nhân vật trong sách',
    emoji: '📘',
    iconName: 'book',
    iconBg: 'from-teal-100 to-emerald-100',
    iconColor: 'text-teal-600',
    description: 'Giới thiệu vẻ đẹp ngoại hình, tính cách đáng quý và những hành động ấn tượng của một nhân vật trong cuốn sách em đã đọc.',
    topics: [
      'Giới thiệu nhân vật chú dế Mèn kiêu hãnh nhưng biết sửa sai trong cuốn "Dế Mèn phiêu lưu ký"',
      'Giới thiệu cậu bé Lượm dũng cảm, hồn nhiên trong tập thơ/truyện cùng tên',
      'Giới thiệu nhân vật Harry Potter - cậu bé phù thủy quả cảm vượt khó',
      'Giới thiệu nhân vật bé Thu đầy cá tính và tình yêu cha mãnh liệt trong cuốn sách em đã đọc'
    ],
    template: {
      mobi: [
        'Giới thiệu nhân vật và cuốn sách chứa nhân vật đó (Tên sách, tác giả).',
        'Nêu ấn tượng sâu sắc nhất về nhân vật.'
      ],
      thanbi: [
        '1. Giới thiệu sơ lược về hoàn cảnh xuất hiện của nhân vật trong sách.',
        '2. Miêu tả đặc điểm ngoại hình nổi bật (nếu có) phản ánh tính cách.',
        '3. Phân tích tính cách và phẩm chất tốt đẹp thông qua hành động, lời nói cụ thể.',
        '4. Chi tiết ấn tượng nhất về nhân vật khiến em nhớ mãi.',
        '5. Cảm xúc và suy nghĩ của em dành cho nhân vật.'
      ],
      ketbi: [
        'Khẳng định lại ý nghĩa của nhân vật đó đối với độc giả và tình cảm của em.'
      ]
    },
    aiRules: {
      mustHave: [
        'Chỉ rõ tên nhân vật và tên cuốn sách',
        'Nêu được đặc điểm tính cách nổi bật của nhân vật',
        'Có ví dụ về hành động hoặc lời nói của nhân vật trong sách để minh họa'
      ],
      shouldAvoid: [
        'Tóm tắt cả cuốn sách mà không tập trung vào nhân vật',
        'Miêu tả chung chung không gắn liền với chi tiết trong sách'
      ]
    }
  },
  {
    id: 'gioi-thieu-nhan-vat-hoat-hinh',
    title: 'Giới thiệu nhân vật hoạt hình',
    emoji: '🦄',
    iconName: 'video',
    iconBg: 'from-rose-100 to-pink-100',
    iconColor: 'text-rose-500',
    description: 'Giới thiệu những nét vẽ sinh động, phép thuật kỳ diệu, tính cách dễ thương hay bài học ý nghĩa từ nhân vật hoạt hình em yêu thích.',
    topics: [
      'Giới thiệu nhân vật chú mèo máy Doraemon thông minh, tốt bụng và những bảo bối kỳ diệu',
      'Giới thiệu chú chuột Mickey vui nhộn, lạc quan trong bộ phim hoạt hình kinh điển',
      'Giới thiệu nhân vật Elsa - nữ hoàng băng giá xinh đẹp và giàu tình yêu thương em gái',
      'Giới thiệu nhân vật chú gấu Po vụng về nhưng kiên trì trong "Kung Fu Panda"'
    ],
    template: {
      mobi: [
        'Giới thiệu tên nhân vật hoạt hình và bộ phim hoạt hình đó.',
        'Nêu lý do em yêu thích nhân vật.'
      ],
      thanbi: [
        '1. Miêu tả đặc điểm hình dáng bên ngoài đầy sắc màu sinh động (màu sắc, trang phục, biểu cảm).',
        '2. Giới thiệu năng lực đặc biệt hoặc các món bảo bối, phép thuật (nếu có).',
        '3. Phân tích tính cách cốt lõi (Vui vẻ, tốt bụng, quả cảm, kiên trì).',
        '4. Kể lại một tình huống hài hước hoặc cảm động nhất của nhân vật trong phim.'
      ],
      ketbi: [
        'Nêu cảm nghĩ của em về nhân vật và bài học bổ ích nhân vật mang lại cho trẻ thơ.'
      ]
    },
    aiRules: {
      mustHave: [
        'Nêu rõ tên nhân vật và phim',
        'Miêu tả hình ảnh sinh động phù hợp với phim hoạt hình',
        'Nêu được tính cách hoặc thông điệp giáo dục từ nhân vật'
      ],
      shouldAvoid: [
        'Liệt kê các tập phim mà không tập trung giới thiệu nhân vật',
        'Miêu tả thiếu sinh động sinh động trẻ thơ'
      ]
    }
  },
  {
    id: 'ta-nguoi',
    title: 'Văn tả người',
    emoji: '🧑',
    iconName: 'user',
    iconBg: 'from-orange-100 to-amber-100',
    iconColor: 'text-orange-500',
    description: 'Miêu tả ngoại hình, cử chỉ, giọng nói và tính cách ấm áp của một người thân, cô giáo, người bạn hay một người lao động em kính yêu.',
    topics: [
      'Tả người mẹ kính yêu luôn tảo tần chăm sóc gia đình em',
      'Tả hình ảnh thầy giáo/cô giáo dạy lớp 5 của em đang say sưa giảng bài',
      'Tả người bạn thân thiết nhất của em ở trường tiểu học',
      'Tả bác nông dân đang chăm chỉ gặt lúa trên đồng quê hương',
      'Tả một em bé chập chững biết đi, biết nói vô cùng đáng yêu'
    ],
    template: {
      mobi: [
        'Giới thiệu người định tả (Ai? Quan hệ với em thế nào? Ấn tượng bao quát nhất).'
      ],
      thanbi: [
        '1. Tả ngoại hình nổi bật: Vóc dáng, khuôn mặt, mái tóc, đôi mắt, nụ cười, làn da, trang phục.',
        '2. Tả hoạt động, tính cách: Giọng nói nói năng, cử chỉ điệu bộ, đôi bàn tay lao động, tính cách (Hiền hậu, chu đáo, vui tính, chăm chỉ).',
        '3. Kỷ niệm đáng nhớ hoặc việc làm cụ thể của người đó thể hiện tình cảm với em.'
      ],
      ketbi: [
        'Bộc lộ tình cảm yêu mến, kính trọng sâu sắc và mong ước, lời hứa đối với người được tả.'
      ]
    },
    aiRules: {
      mustHave: [
        'Xác định rõ đối tượng tả người',
        'Kết hợp hài hòa giữa tả ngoại hình và tả hoạt động, tính cách',
        'Sử dụng từ ngữ miêu tả biểu cảm chân thực',
        'Thể hiện tình cảm sâu sắc của em'
      ],
      shouldAvoid: [
        'Liệt kê các bộ phận cơ thể một cách máy móc rập khuôn',
        'Miêu tả quá cường điệu xa rời thực tế học sinh lớp 5'
      ]
    }
  },
  {
    id: 'lap-chuong-trinh-hoat-dong',
    title: 'Lập chương trình hoạt động',
    emoji: '📅',
    iconName: 'calendar',
    iconBg: 'from-cyan-100 to-sky-100',
    iconColor: 'text-cyan-600',
    description: 'Lập kế hoạch chi tiết, phân công cụ thể các bước chuẩn bị cho một hoạt động tập thể như dọn vệ sinh, hội diễn văn nghệ hay cắm trại.',
    topics: [
      'Lập chương trình hoạt động cho buổi lao động dọn vệ sinh lớp học, sân trường',
      'Lập chương trình hoạt động tổ chức buổi chúc mừng Ngày Nhà giáo Việt Nam 20-11',
      'Lập chương trình cho buổi quyên góp sách vở ủng hộ học sinh vùng khó khăn',
      'Lập kế hoạch tổ chức một buổi sinh hoạt lớp cuối tuần vui tươi, gắn kết'
    ],
    template: {
      mobi: [
        'Nêu mục đích của chương trình hoạt động (Hoạt động tập thể gì? Nhằm mục đích gì?)'
      ],
      thanbi: [
        '1. Công tác chuẩn bị: Dụng cụ cần mang theo, địa điểm tập trung, thời gian.',
        '2. Phân công nhiệm vụ cụ thể cho từng cá nhân hoặc nhóm (Ai quét dọn, ai lau bảng, ai nhổ cỏ; hoặc ban văn nghệ, ban khánh tiết...).',
        '3. Chương trình cụ thể (Các bước tiến hành): Trình tự các hoạt động diễn ra từ đầu đến cuối một cách logic.'
      ],
      ketbi: [
        'Nêu ý nghĩa của hoạt động tập thể (Gắn kết tình bạn, nâng cao ý thức trách nhiệm và niềm vui sau khi hoàn thành).'
      ]
    },
    aiRules: {
      mustHave: [
        'Bố cục rõ ràng gồm 3 phần (Mục đích, Chuẩn bị & Phân công, Các bước tiến hành)',
        'Phân công nhiệm vụ cụ thể, rõ ràng cho từng nhóm',
        'Các hoạt động sắp xếp theo trình tự thời gian hợp lý',
        'Từ ngữ ngắn gọn, rõ ý'
      ],
      shouldAvoid: [
        'Viết như bài văn miêu tả thông thường',
        'Lập kế hoạch quá sơ sài chung chung không thể thực hiện được thực tế'
      ]
    }
  }
];

export const VOCABULARY_BANK = {
  'ta-canh': {
    title: '🌿 Từ vựng Văn Tả Cảnh',
    categories: [
      { name: 'Màu sắc thiên nhiên', words: ['xanh mướt', 'vàng óng', 'độ ánh bạc', 'xanh rì', 'khói lam chiều', 'hồng hào đầy sức sống', 'nhuộm vàng rực rỡ'] },
      { name: 'Âm thanh không gian', words: ['xào xạc lá rơi', 'líu lo thánh thót', 'rầm rì tiếng sóng', 'náo nhiệt rộn rã', 'tĩnh lặng khẽ khàng'] },
      { name: 'Giác quan, xúc giác', words: ['ấm áp ngọt lành', 'mát rượi lộng gió', 'thoang thoảng hương sen', 'ngào ngạt hương rơm', 'se se lạnh'] }
    ]
  },
  'ke-chuyen-sang-tao': {
    title: '📖 Từ vựng Kể Chuyện Sáng Tạo',
    categories: [
      { name: 'Từ nối cuốn hút', words: ['bất thình lình', 'thật kỳ lạ là', 'kể từ khoảnh khắc đó', 'như có một phép màu', 'sau bao thử thách'] },
      { name: 'Khêu gợi sự tò mò', words: ['chiếc hộp bí mật', 'gốc cây sần sùi', 'bản đồ sờn rách', 'ánh sáng huyền hoặc', 'thì thầm rỉ tai'] },
      { name: 'Bài học triết lý', words: ['bài học khắc cốt', 'thấu hiểu tấm lòng', 'gắn kết sẻ chia', 'mở rộng vòng tay', 'vượt qua giới hạn'] }
    ]
  },
  'cam-xuc-nhan-vat': {
    title: '🎬 Từ vựng Cảm Cực về Nhân Vật',
    categories: [
      { name: 'Ngoại hình/Tính cách', words: ['kiêu hãnh tự tin', 'dung dị chân chất', 'oai vệ kiêu hùng', 'nhỏ nhắn hoạt bát', 'tinh nghịch đáng yêu'] },
      { name: 'Cảm xúc kính phục', words: ['vô cùng xúc động', 'ngưỡng mộ thiết tha', 'khâm phục vô ngần', 'ấp áp thương xót', 'no gương sáng ngời'] },
      { name: 'Hành động lay động', words: ['dũng cảm can trường', 'hy sinh thầm lặng', 'bảo vệ chở che', 'mỉm cười rạng rỡ', 'gạt nước mắt đứng lên'] }
    ]
  },
  'cam-xuc-su-viec': {
    title: '❤️ Từ vựng Cảm Xúc sự việc',
    categories: [
      { name: 'Rung động ban đầu', words: ['hồi hộp khôn nguôi', 'rạo rực mong chờ', 'lòng ngập tràn háo hức', 'ngỡ ngàng khôn tả', 'chộn rộn bâng khuâng'] },
      { name: 'Xúc cảm quá trình', words: ['thấm đậm nghĩa tình', 'ấm áp lan tỏa', 'niềm vui vỡ òa', 'bừng ngời nhiệt huyết', 'sát cánh kề vai'] },
      { name: 'Ý nghĩa sâu xa', words: ['biết ơn trân trọng', 'trưởng thành sâu sắc', 'ký ức ngọt ngào', 'khắc ghi muôn đời', 'ấm lòng tình người'] }
    ]
  },
  'neu-y-kien': {
    title: '💡 Từ vựng Biện Luận Nêu Ý Kiến',
    categories: [
      { name: 'Bày tỏ lập trường', words: ['hoàn toàn tán thành', 'gạt đi ý kiến bất cập', 'tin tưởng vững chắc', 'kiên quyết phản đối', 'đồng quan điểm với'] },
      { name: 'Từ nối lập luận', words: ['trước hết ta cần thấy', 'hơn thế nữa', 'đặc biệt đáng chú ý', 'ví dụ minh chứng rõ nhất', 'trái lại, trái chiều là'] },
      { name: 'Khẳng định đề xuất', words: ['chìa khóa vững bước', 'hướng tới lối sống đẹp', 'chúng ta hãy cùng nhau', 'đáng trân quý biết bao', 'trao thông điệp vàng'] }
    ]
  },
  'cam-xuc-cau-chuyen': {
    title: '📖 Từ vựng Cảm cảm về Câu chuyện',
    categories: [
      { name: 'Rung động sâu sắc', words: ['cảm động nghẹn ngào', 'xót xa thương cảm', 'lòng đầy khâm phục', 'thấu hiểu sâu sắc', 'ký ức ùa về'] },
      { name: 'Đặc điểm câu chuyện', words: ['cốt truyện nhân văn', 'chi tiết đắt giá', 'bất ngờ cảm động', 'kết thúc viên mãn', 'giàu tính giáo dục'] },
      { name: 'Bài học kết nối', words: ['hiếu thảo kính yêu', 'sống đẹp sẻ chia', 'lan tỏa tình thương', 'biết ơn trân trọng', 'nuôi dưỡng tâm hồn'] }
    ]
  },
  'cam-xuc-bai-tho': {
    title: '📜 Từ vựng Cảm xúc về Bài thơ',
    categories: [
      { name: 'Hình ảnh, ngôn từ', words: ['hình ảnh thơ mộng', 'ngôn từ trau chuốt', 'giản dị mộc mạc', 'giàu sức gợi hình', 'so sánh độc đáo'] },
      { name: 'Nhạc điệu, vần thơ', words: ['vần điệu uyển chuyển', 'nhịp thơ dồn dập', 'êm đềm sâu lắng', 'âm vang giòn giã', 'nhạc điệu thiết tha'] },
      { name: 'Cảm xúc khơi gợi', words: ['bâng khuâng xao xuyến', 'dâng trào cảm xúc', 'ấm áp tình quê', 'khắc khoải nhớ thương', 'thắp sáng niềm tin'] }
    ]
  },
  'gioi-thieu-nhan-vat-sach': {
    title: '📘 Từ vựng Giới thiệu nhân vật trong Sách',
    categories: [
      { name: 'Ngoại hình tính cách', words: ['kiêu hãnh tự tin', 'nhỏ nhắn tinh nghịch', 'dũng cảm quả cảm', 'hiền từ nhân hậu', 'học thức uyên bác'] },
      { name: 'Hoàn cảnh & Hành động', words: ['phiêu lưu mạo hiểm', 'đối đầu thử thách', 'giúp bạn vượt khó', 'sửa sai nhận lỗi', 'đồng cam cộng khổ'] },
      { name: 'Tình cảm độc giả', words: ['yêu mến khôn nguôi', 'khâm phục vô ngần', 'đồng cảm sâu sắc', 'nhân vật truyền cảm hứng', 'ấn tượng sâu đậm'] }
    ]
  },
  'gioi-thieu-nhan-vat-hoat-hinh': {
    title: '🦄 Từ vựng Giới thiệu nhân vật Hoạt hình',
    categories: [
      { name: 'Ngoại hình nét vẽ', words: ['ngộ nghĩnh đáng yêu', 'tròn xoe màu sắc', 'nét vẽ sinh động', 'đáng yêu ngây ngô', 'vẻ ngoài đặc trưng'] },
      { name: 'Bảo bối phép thuật', words: ['phép thuật kỳ diệu', 'bảo bối thần kỳ', 'biến hóa khôn lường', 'sức mạnh phi thường', 'khám phá ước mơ'] },
      { name: 'Tính cách hành động', words: ['tốt bụng ấm áp', 'vui vẻ lạc quan', 'vụng về tinh nghịch', 'kề vai sát cánh', 'tinh thần đồng đội'] }
    ]
  },
  'ta-nguoi': {
    title: '🧑 Từ vựng Văn Tả Người',
    categories: [
      { name: 'Ngoại hình khuôn mặt', words: ['mái tóc bạc phơ', 'đôi mắt biết nói', 'gương mặt phúc hậu', 'làn da rám nắng', 'nụ cười tỏa nắng'] },
      { name: 'Cử chỉ hành động', words: ['bàn tay chai sần', 'giọng nói truyền cảm', 'tảo tần khuya sớm', 'chăm chỉ miệt mài', 'ân cần chu đáo'] },
      { name: 'Tình cảm gắn kết', words: ['kính yêu vô bờ', 'biết ơn sâu sắc', 'trân quý thiêng liêng', 'kỷ niệm ấm áp', 'khắc ghi công ơn'] }
    ]
  },
  'lap-chuong-trinh-hoat-dong': {
    title: '📅 Từ vựng Lập chương trình Hoạt động',
    categories: [
      { name: 'Mục đích chuẩn bị', words: ['nâng cao ý thức', 'khang trang sạch đẹp', 'tri ân thầy cô', 'chuẩn bị chu đáo', 'phân công cụ thể'] },
      { name: 'Hoạt động phân công', words: ['ban khánh tiết', 'nhóm lao động', 'hăng hái thực hiện', 'phối hợp nhịp nhàng', 'phân công trách nhiệm'] },
      { name: 'Kết quả ý nghĩa', words: ['hoàn thành xuất sắc', 'gắn kết tinh thần', 'vui tươi lành mạnh', 'trải nghiệm bổ ích', 'đoàn kết một lòng'] }
    ]
  }
};
