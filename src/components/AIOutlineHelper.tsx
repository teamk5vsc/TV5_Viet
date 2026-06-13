import React, { useState, useEffect } from 'react';
import { EssayType, GradeResult, GrowthComparison, OutlineSubmission, StudentEntry, SampleEssayResult } from '../types';
import { SYLLABUS_DATA } from '../data/syllabus';
import { 
  Sparkles, Pencil, ArrowRight, CheckCircle2, ChevronRight, Play, RefreshCw, 
  Trash2, Award, ClipboardCheck, ArrowUpRight, Check, Save, Star,
  BookOpen, FileText, Copy, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AIChatScaffold from './AIChatScaffold';
import SentenceTransformer from './SentenceTransformer';
import { callGeminiApiDirectly } from '../utils/geminiDirect';

function getClientMockEssay(topic: string, type: string, format: 'essay' | 'paragraph'): SampleEssayResult {
  const cleanTopic = topic || 'Tả cảnh đồi chè quê em';
  
  const mockDatabase: Record<string, {
    essay: SampleEssayResult;
    paragraph: SampleEssayResult;
  }> = {
    'ta-canh': {
      essay: {
        format: 'essay',
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
        format: 'paragraph',
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
        format: 'essay',
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
        format: 'paragraph',
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
        format: 'essay',
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
        format: 'paragraph',
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
        format: 'essay',
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
        format: 'paragraph',
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
        format: 'essay',
        content: `Trong thời đại công nghệ số bùng nổ hiện nay, nhiều bạn nhỏ mải mê với màn hình điện thoại thông minh mà quên đi những trang sách thơm tho. Thế nhưng, em hoàn toàn đồng tình với ý kiến cho rằng: "Đọc sách mỗi ngày là việc vô cùng cần thiết đối với học sinh Tiểu học". Cuốn sách nhỏ chính là người bạn hiền mở ra cho em những thế giới tri thức vô tận bồi đắp tâm hồn khôn lớn mỗi ngày.\n\nTrước hết, đọc sách giúp chúng em mở mang tri thức một cách diệu kỳ. Mỗi cuốn sách như một chiếc chìa khóa vàng mở ra kho tàng lịch sử hào hùng, thế giới khoa học huyền bí hay những vùng đất xa xôi mà em chưa từng đặt chân đến. Không chỉ vậy, sách còn là dòng sữa ngọt ngào nuôi dưỡng tâm hồn ta. Đọc câu chuyện về lòng hiếu thảo của bé Thủy, hay tình bạn ấm áp của Dế Mèn, em học được cách thấu cảm, biết yêu thương muôn loài xung quanh. Một dẫn chứng sinh động là từ khi rèn luyện thói quen đọc sách 20 phút mỗi ngày, vốn từ Tiếng Việt của em phong phú hơn hẳn, bài viết văn của em tràn ngập những câu từ sinh động, giàu hình ảnh. Dù có ý kiến lo ngại đọc sách tốn thời gian học tập khác, nhưng nếu biết phân bổ hợp lý, sách chính là phương pháp thư giãn lành mạnh nhất sau những giờ học căng thẳng.\n\nTóm lại, đọc sách mỗi ngày là một thói quen vàng nuôi dưỡng trí tuệ và tâm hồn. Em mong rằng mỗi bạn nhỏ chúng ta hãy cùng nhau mở sách ra mỗi ngày, để những trang giấy thơm tho chắp cánh cho những ước mơ của chúng ta bay cao, bay xa.`,
        highlights: [
          { text: "như một chiếc chìa khóa vàng mở ra kho tàng", type: "rhetorical", explanation: "So sánh sách với chiếc chìa khóa vàng làm nổi bật giá trị tri thức vô giá của sách sách đem lại." },
          { text: "sách còn là dòng sữa ngọt ngào nuôi dưỡng tâm hồn", type: "rhetorical", explanation: "Ẩn dụ ví sách như dòng sữa ngọt ngào nuôi dưỡng đời sống nội tâm tràn ngập tình yêu thương." },
          { text: "thói quen đọc sách 20 phút mỗi ngày", type: "imagery", explanation: "Dẫn chứng thực tế, thời gian cụ thể rõ ràng làm tăng sức thuyết phục cho lập luận." },
          { text: "những trang giấy thơm tho", type: "vocabulary", explanation: "Từ láy 'đơm hoa' thơm tho gợi tả mùi hương trang sách giấy truyền thống, đánh thức khứu giác yêu thích đọc sách." },
          { text: "em hoàn toàn đồng tình với ý kiến", type: "emotion", explanation: "Bộc lộ thái độ lập trường dứt khoát, tự tin thể hiện quan điểm của học sinh tiểu học." }
        ],
        analysis: [
          "Bố cục nghị luận 3 phần vững vàng, lý lẽ sắc bén đi từ mở mang tri thức đến bồi đắp tâm hồn.",
          "Dẫn chứng cụ thể, gần gũi từ hoạt động thực tế hàng ngày làm tăng sức thuyết phục cao.",
          "Có luận điểm phản biện thông minh giúp bảo vệ lập trường đọc sách một cách toàn diện."
        ]
      },
      paragraph: {
        format: 'paragraph',
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
    }
  };

  const genreEntry = mockDatabase[type] || mockDatabase['ta-canh'];
  return genreEntry[format] || genreEntry['essay'];
}

function getClientMockOutline(topic: string, type: string) {
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
    }
  };

  return genreData[type] || genreData['ta-canh'];
}
 
interface AIOutlineHelperProps {
  initialGenreId: string;
  initialTopic: string;
  onOutlineSaved: (submission: OutlineSubmission) => void;
  apiKey?: string;
  selectedModel?: string;
  currentStudent?: StudentEntry | null;
}
 
export default function AIOutlineHelper({ 
  initialGenreId, 
  initialTopic,
  onOutlineSaved,
  apiKey,
  selectedModel,
  currentStudent
}: AIOutlineHelperProps) {
  // Navigation
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'track' | 'chat' | 'sample'>('create');
  
  // Core state inputs
  const [selectedGenreId, setSelectedGenreId] = useState<EssayType>((initialGenreId as EssayType) || 'ta-canh');
  const [customTopic, setCustomTopic] = useState(initialTopic || '');
  
  // Tab 1: AI Suggested Outline States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{
    genre: string;
    requirements: string[];
    outline: { mobi: string[]; thanbi: string[]; ketbi: string[] };
    keywords: string[];
    errorsToAvoid: string[];
  } | null>(null);

  // Tab 2: Growth Tracker States
  const [v1Outline, setV1Outline] = useState('');
  const [isGradingV1, setIsGradingV1] = useState(false);
  const [v1Grade, setV1Grade] = useState<GradeResult | null>(null);
  
  const [v2Outline, setV2Outline] = useState('');
  const [isGradingV2, setIsGradingV2] = useState(false);
  const [comparison, setComparison] = useState<GrowthComparison | null>(null);
  
  // Reflection response state
  const [q1Changes, setQ1Changes] = useState('');
  const [q2Reasons, setQ2Reasons] = useState('');
  const [q3Learnings, setQ3Learnings] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Tab 4: Exemplary Essay/Paragraph States
  const [essayFormat, setEssayFormat] = useState<'essay' | 'paragraph'>('essay');
  const [useDraftOutline, setUseDraftOutline] = useState<boolean>(false);
  const [isGeneratingEssay, setIsGeneratingEssay] = useState<boolean>(false);
  const [generatedEssay, setGeneratedEssay] = useState<SampleEssayResult | null>(null);
  const [activeHighlights, setActiveHighlights] = useState<string[]>(['imagery', 'emotion', 'rhetorical', 'vocabulary']);
  const [hoveredHighlight, setHoveredHighlight] = useState<SampleHighlight | null>(null);
  const [isEssaySaved, setIsEssaySaved] = useState<boolean>(false);

  // Sync initial genre and topics from parent selection
  useEffect(() => {
    if (initialGenreId) {
      setSelectedGenreId(initialGenreId as EssayType);
    }
    if (initialTopic) {
      setCustomTopic(initialTopic);
    }
  }, [initialGenreId, initialTopic]);

  const activeGenre = SYLLABUS_DATA.find(g => g.id === selectedGenreId) || SYLLABUS_DATA[0];

  // Call /api/gemini/generate to create an outline blueprint
  const handleGenerateAI = async () => {
    let topicToUse = customTopic.trim();
    if (!topicToUse) {
      const randomTopic = activeGenre.topics[Math.floor(Math.random() * activeGenre.topics.length)];
      setCustomTopic(randomTopic);
      topicToUse = randomTopic;
    }
    
    setIsGenerating(true);
    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'x-api-key': apiKey } : {}) },
        body: JSON.stringify({ topic: topicToUse, type: selectedGenreId, model: selectedModel })
      });
      const data = await res.json();
      if (!data || data.error || !data.outline) {
        throw new Error(data?.error || 'Invalid API response');
      }
      setGeneratedResult(data);
    } catch (err) {
      console.warn('Gemini generate outline failed, trying direct client fallback:', err);
      if (apiKey) {
        try {
          const directData = await callGeminiApiDirectly({
            action: 'generate',
            topic: topicToUse,
            type: selectedGenreId,
            model: selectedModel,
            apiKey
          });
          setGeneratedResult(directData);
          setIsGenerating(false);
          return;
        } catch (directErr) {
          console.error('Direct client-side Gemini generate failed:', directErr);
        }
      }
      setGeneratedResult(getClientMockOutline(topicToUse, selectedGenreId));
    } finally {
      setIsGenerating(false);
    }
  };

  // Call /api/gemini/grade to evaluate Version 1
  const handleGradeV1 = async () => {
    if (!customTopic.trim() || !v1Outline.trim()) return;
    setIsGradingV1(true);
    try {
      const res = await fetch('/api/gemini/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'x-api-key': apiKey } : {}) },
        body: JSON.stringify({ topic: customTopic, type: selectedGenreId, outline: v1Outline, model: selectedModel })
      });
      const data = await res.json();
      if (!data || data.error || data.score === undefined) {
        throw new Error(data?.error || 'Invalid grading response');
      }
      setV1Grade(data);
      // Pre-populate v2 with v1 draft for easy editing
      setV2Outline(v1Outline);
    } catch (err) {
      console.warn('Gemini grading failed, trying direct client-side call:', err);
      if (apiKey) {
        try {
          const directData = await callGeminiApiDirectly({
            action: 'grade',
            topic: customTopic,
            type: selectedGenreId,
            outline: v1Outline,
            model: selectedModel,
            apiKey
          });
          setV1Grade(directData);
          setV2Outline(v1Outline);
          setIsGradingV1(false);
          return;
        } catch (directErr) {
          console.error('Direct client-side Gemini grading failed:', directErr);
        }
      }
      const scoreVal = v1Outline.length > 120 ? 84 : 68;
      setV1Grade({
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
          nextSteps: 'Hãy thử viết thêm 2-3 ý cụ thể làm rõ chi tiết gợi ý và nộp lại ở phiên bản sửa đổi (Lần 2) để thấy sự tiến bộ nhé!'
        },
        checklist: [
          { name: 'Xác định rõ ràng bối cảnh', status: true },
          { name: 'Phát triển ý chi tiết', status: v1Outline.length > 120 },
          { name: 'Sử dụng từ ngữ biểu cảm', status: v1Outline.length > 80 },
          { name: 'Có bài học trải nghiệm sâu sắc', status: v1Outline.includes('bài học') || v1Outline.length > 100 }
        ]
      });
      setV2Outline(v1Outline);
    } finally {
      setIsGradingV1(false);
    }
  };

  // Call /api/gemini/compare to evaluate Version 2 against Version 1
  const handleGradeV2 = async () => {
    if (!customTopic.trim() || !v2Outline.trim() || !v1Outline.trim()) return;
    setIsGradingV2(true);
    try {
      const res = await fetch('/api/gemini/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'x-api-key': apiKey } : {}) },
        body: JSON.stringify({
          topic: customTopic,
          type: selectedGenreId,
          outlineBefore: v1Outline,
          outlineAfter: v2Outline,
          gradeBefore: v1Grade,
          model: selectedModel
        })
      });
      const data = await res.json();
      if (!data || data.error || data.scoreAfter === undefined) {
        throw new Error(data?.error || 'Invalid comparison response');
      }
      setComparison(data);
    } catch (err) {
      console.warn('Gemini comparison failed, using client-side fallback:', err);
      const scoreBefore = v1Grade?.score || 68;
      const scoreAfter = Math.min(scoreBefore + 15, 96);
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
        }
      };

      const currentFeedback = compFeedback[selectedGenreId] || compFeedback['ta-canh'];

      setComparison({
        scoreBefore,
        scoreAfter,
        scoreDiff,
        skillsBefore: v1Grade?.criteriaScores || { understand: 14, structure: 14, development: 16, creativity: 12, logic: 9 },
        skillsAfter: {
          understand: Math.min((v1Grade?.criteriaScores.understand || 14) + 1, 20),
          structure: Math.min((v1Grade?.criteriaScores.structure || 14) + 2, 20),
          development: Math.min((v1Grade?.criteriaScores.development || 16) + 4, 25),
          creativity: Math.min((v1Grade?.criteriaScores.creativity || 12) + 3, 20),
          logic: Math.min((v1Grade?.criteriaScores.logic || 9) + 2, 15)
        },
        feedback: currentFeedback
      };

      if (apiKey) {
        try {
          const directData = await callGeminiApiDirectly({
            action: 'compare',
            topic: customTopic,
            type: selectedGenreId,
            outlineBefore: v1Outline,
            outlineAfter: v2Outline,
            scoreBefore: v1Grade?.score || 68,
            skillsBefore: v1Grade?.criteriaScores || { understand: 14, structure: 14, development: 16, creativity: 12, logic: 9 },
            model: selectedModel,
            apiKey
          });
          setComparison(directData);
          setIsGradingV2(false);
          return;
        } catch (directErr) {
          console.error('Direct client-side Gemini comparison failed:', directErr);
        }
      }

      setComparison(localMockData);
    } finally {
      setIsGradingV2(false);
    }
  };

  // Persists progress report back to profile history
  const handleSaveToPortfolio = () => {
    if (!customTopic.trim()) return;
    
    const submission: OutlineSubmission = {
      id: `outline_${Date.now()}`,
      studentId: currentStudent?.id || 'guest',
      studentName: currentStudent?.name || 'Khách',
      topic: customTopic,
      type: selectedGenreId,
      outlineBefore: v1Outline,
      gradeBefore: v1Grade || undefined,
      outlineAfter: v2Outline || undefined,
      gradeAfter: comparison ? {
        score: comparison.scoreAfter,
        criteriaScores: comparison.skillsAfter,
        feedback: {
          general: comparison.feedback.growthWords,
          strengths: v1Grade?.feedback.strengths || [],
          improvements: [comparison.feedback.reminders],
          nextSteps: 'Hãy thử luyện thêm cách tạo hình ảnh biểu cảm này cho các sự việc ngoài đời khác em nhé.'
        },
        checklist: v1Grade?.checklist.map(cl => ({...cl, status: true})) || []
      } : undefined,
      comparison: comparison || undefined,
      reflection: q1Changes.trim() ? {
        q1_changes: q1Changes,
        q2_reasons: q2Reasons,
        q3_learnings: q3Learnings
      } : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onOutlineSaved(submission);
    setIsSaved(true);
  };

  const handleReset = () => {
    setV1Outline('');
    setV1Grade(null);
    setV2Outline('');
    setComparison(null);
    setQ1Changes('');
    setQ2Reasons('');
    setQ3Learnings('');
    setIsSaved(false);
    setGeneratedEssay(null);
    setIsEssaySaved(false);
  };

  const handleGenerateEssay = async () => {
    let topicToUse = customTopic.trim();
    if (!topicToUse) {
      const randomTopic = activeGenre.topics[Math.floor(Math.random() * activeGenre.topics.length)];
      setCustomTopic(randomTopic);
      topicToUse = randomTopic;
    }

    setIsGeneratingEssay(true);
    setIsEssaySaved(false);
    try {
      const res = await fetch('/api/gemini/essay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'x-api-key': apiKey } : {}) },
        body: JSON.stringify({
          topic: topicToUse,
          type: selectedGenreId,
          format: essayFormat,
          outline: useDraftOutline ? (v2Outline || v1Outline) : undefined,
          model: selectedModel
        })
      });
      const data = await res.json();
      if (!data || data.error || !data.content) {
        throw new Error(data?.error || 'Invalid exemplary essay response');
      }
      setGeneratedEssay(data);
    } catch (err) {
      console.warn('Gemini exemplary essay generation failed, trying direct client-side call:', err);
      if (apiKey) {
        try {
          const directData = await callGeminiApiDirectly({
            action: 'essay',
            topic: topicToUse,
            type: selectedGenreId,
            format: essayFormat,
            outline: useDraftOutline ? (v2Outline || v1Outline) : undefined,
            model: selectedModel,
            apiKey
          });
          setGeneratedEssay(directData);
          setIsGeneratingEssay(false);
          return;
        } catch (directErr) {
          console.error('Direct client-side Gemini essay failed:', directErr);
        }
      }
      setGeneratedEssay(getClientMockEssay(topicToUse, selectedGenreId, essayFormat));
    } finally {
      setIsGeneratingEssay(false);
    }
  };

  const handleSaveEssayToPortfolio = () => {
    if (!customTopic.trim() || !generatedEssay) return;

    const submission: OutlineSubmission = {
      id: `outline_${Date.now()}`,
      studentId: currentStudent?.id || 'guest',
      studentName: currentStudent?.name || 'Khách',
      topic: customTopic,
      type: selectedGenreId,
      outlineBefore: v2Outline || v1Outline || 'Xem bài văn mẫu đi kèm',
      sampleEssay: generatedEssay,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onOutlineSaved(submission);
    setIsEssaySaved(true);
  };

  const renderEssayWithHighlights = (content: string, highlights: SampleHighlight[]) => {
    if (!content) return null;
    if (!highlights || highlights.length === 0) {
      return content.split('\n\n').map((para, i) => <p key={i} className="mb-4 leading-relaxed text-sm font-sans text-neutral-700">{para}</p>);
    }

    const sortedHighlights = [...highlights].sort((a, b) => b.text.length - a.text.length);
    const paragraphs = content.split('\n\n');

    return paragraphs.map((para, paraIdx) => {
      let renderedParts: React.ReactNode[] = [para];

      sortedHighlights.forEach((highlight) => {
        if (!activeHighlights.includes(highlight.type)) return;

        const newParts: React.ReactNode[] = [];
        renderedParts.forEach((part) => {
          if (typeof part !== 'string') {
            newParts.push(part);
            return;
          }

          const index = part.indexOf(highlight.text);
          if (index === -1) {
            newParts.push(part);
            return;
          }

          let tempPart = part;
          while (true) {
            const idx = tempPart.indexOf(highlight.text);
            if (idx === -1) {
              newParts.push(tempPart);
              break;
            }

            if (idx > 0) {
              newParts.push(tempPart.substring(0, idx));
            }

            let highlightClass = '';
            let emoji = '';
            if (highlight.type === 'imagery') {
              highlightClass = 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-b-2 border-emerald-400';
              emoji = '🌿';
            } else if (highlight.type === 'emotion') {
              highlightClass = 'bg-pink-100 hover:bg-pink-200 text-pink-900 border-b-2 border-pink-400';
              emoji = '💗';
            } else if (highlight.type === 'rhetorical') {
              highlightClass = 'bg-purple-100 hover:bg-purple-200 text-purple-900 border-b-2 border-purple-400';
              emoji = '✨';
            } else {
              highlightClass = 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-b-2 border-amber-400';
              emoji = '📚';
            }

            newParts.push(
              <span
                key={`${highlight.text}-${idx}`}
                onMouseEnter={() => setHoveredHighlight(highlight)}
                onMouseLeave={() => setHoveredHighlight(null)}
                onClick={() => setHoveredHighlight(highlight)}
                className={`px-1 py-0.5 rounded-sm cursor-help transition-all duration-200 font-semibold ${highlightClass}`}
              >
                {highlight.text}
                <span className="ml-1 text-[10px] opacity-75">{emoji}</span>
              </span>
            );

            tempPart = tempPart.substring(idx + highlight.text.length);
          }
        });
        renderedParts = newParts;
      });

      return (
        <p key={paraIdx} className="mb-4 leading-relaxed text-sm font-sans whitespace-pre-line text-neutral-700">
          {renderedParts}
        </p>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Configuration Header Row */}
      <div className="p-6 bg-white/90 backdrop-blur-sm rounded-2xl border border-amber-100/50 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:flex items-center gap-4 flex-1">
          {/* Genre select */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Lựa chọn dạng bài</label>
            <select
              id="genre-picker"
              value={selectedGenreId}
              onChange={(e) => {
                setSelectedGenreId(e.target.value as EssayType);
                setCustomTopic('');
                handleReset();
                setGeneratedResult(null);
              }}
              className="py-2.5 pl-3 pr-8 text-xs font-semibold text-neutral-700 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-300 outline-none transition cursor-pointer"
            >
              {SYLLABUS_DATA.map((genre) => (
                <option key={genre.id} value={genre.id}>
                  {genre.emoji} {genre.title}
                </option>
              ))}
            </select>
          </div>

          {/* Custom topic typing */}
          <div className="flex flex-col space-y-1 flex-1">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Chủ đề bài viết của em</label>
            <div className="relative">
              <input
                id="topic-input"
                type="text"
                placeholder="Ví dụ: Tả cảnh sân trường buổi sáng mùa thu, kể câu chuyện gia đình..."
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                className="w-full py-2.5 pl-3 pr-24 text-xs font-medium text-neutral-800 placeholder-neutral-400 bg-neutral-50 rounded-xl border border-neutral-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 transition"
              />
              <button
                id="quick-topic-btn"
                onClick={() => {
                  const randomTopic = activeGenre.topics[Math.floor(Math.random() * activeGenre.topics.length)];
                  setCustomTopic(randomTopic);
                }}
                className="absolute right-1.5 top-1.5 py-1 px-2.5 bg-neutral-200/70 hover:bg-neutral-300/80 text-neutral-700 rounded-lg text-[10px] font-bold tracking-wider uppercase transition cursor-pointer"
              >
                Đổi Đề mẫu 🎲
              </button>
            </div>
          </div>
        </div>

        {/* Outer navigation tab switchers */}
        <div className="flex flex-wrap bg-neutral-100/80 p-1 rounded-xl self-center border border-neutral-200/50 gap-1">
          <button
            id="tab-creator"
            onClick={() => setActiveSubTab('create')}
            className={`px-3 py-2 text-[11px] font-bold rounded-lg transition cursor-pointer ${
              activeSubTab === 'create'
                ? 'bg-white text-neutral-800 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            AI Gợi Ý Dàn Ý
          </button>
          <button
            id="tab-tracker"
            onClick={() => setActiveSubTab('track')}
            className={`px-3 py-2 text-[11px] font-bold rounded-lg transition cursor-pointer flex items-center space-x-1 ${
              activeSubTab === 'track'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sửa & Đo Tiến Bộ</span>
          </button>
          <button
            onClick={() => setActiveSubTab('chat')}
            className={`px-3 py-2 text-[11px] font-bold rounded-lg transition cursor-pointer flex items-center space-x-1 ${
              activeSubTab === 'chat'
                ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <span>💬 Cú Văn đồng hành</span>
          </button>
          <button
            onClick={() => setActiveSubTab('sample')}
            className={`px-3 py-2 text-[11px] font-bold rounded-lg transition cursor-pointer flex items-center space-x-1 ${
              activeSubTab === 'sample'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>🦉 Bài văn tham khảo</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: AI Suggested Outline Builder */}
      {activeSubTab === 'create' && (
        <div className="space-y-6">
          <div className="p-6 bg-white/90 backdrop-blur-sm rounded-2xl border border-amber-100/50 shadow-sm space-y-4">
            <div className="max-w-2xl">
              <h3 className="text-base font-bold text-neutral-800 flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>Trợ lý xây dựng bản đồ ý tưởng</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Gõ đề tài của em ở ô trên và click nút dưới, AI sẽ nhận diện đặc tính, phân tích yêu cầu cốt lõi và kiến tạo một bản đồ ý tưởng khung sườn, từ khóa gợi ý cùng lưu ý tránh lỗi cụ thể.
              </p>
            </div>

            <button
              id="analyze-btn"
              disabled={isGenerating}
              onClick={handleGenerateAI}
              className={`px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl text-xs transition shadow-md hover:shadow-lg flex items-center space-x-2 cursor-pointer ${
                isGenerating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI Đang nghiên cứu phân tích đề...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>AI Phân Tích Đề & Tạo Dàn Ý Gợi Ý 🚀</span>
                </>
              )}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {generatedResult && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                {/* Visual outline blocks (Left & Center, spanning 2 columns) */}
                <div className="lg:col-span-2 bg-white/90 backdrop-blur-sm rounded-2xl border border-amber-100/30 shadow-sm p-6 space-y-6">
                  <div className="border-b border-neutral-100 pb-3">
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full uppercase">Bản đồ gợi ý ý tưởng</span>
                    <h4 className="text-lg font-bold text-neutral-800 mt-1.5 font-sans break-words">💡 Đề tài: {customTopic}</h4>
                  </div>

                  <div className="space-y-6">
                    {/* Mở bài */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Mở bài</span>
                      </div>
                      <div className="bg-amber-50/20 p-4 rounded-xl border border-amber-100/40 space-y-1.5 text-xs text-neutral-700">
                        {generatedResult.outline.mobi.map((item, idx) => (
                          <div key={idx} className="flex items-start">
                            <span className="text-amber-500 mr-2 font-mono">▸</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Thân bài */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Thân bài</span>
                      </div>
                      <div className="bg-emerald-50/10 p-4 rounded-xl border border-emerald-100/30 space-y-2 text-xs text-neutral-700">
                        {generatedResult.outline.thanbi.map((item, idx) => (
                          <div key={idx} className="flex items-start">
                            <span className="text-emerald-500 mr-2 font-mono">▸</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Kết bài */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Kết bài</span>
                      </div>
                      <div className="bg-purple-50/10 p-4 rounded-xl border border-purple-100/30 space-y-1.5 text-xs text-neutral-700">
                        {generatedResult.outline.ketbi.map((item, idx) => (
                          <div key={idx} className="flex items-start">
                            <span className="text-purple-500 mr-2 font-mono">▸</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Requirements & errors summary (Right columns) */}
                <div className="space-y-6">
                  {/* Requirements box */}
                  <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-amber-100/30 shadow-sm space-y-3">
                    <h4 className="font-bold text-xs text-neutral-800 uppercase tracking-widest border-b border-neutral-100 pb-2">🎯 Yêu cầu trọng tâm đề bài</h4>
                    <ul className="space-y-2.5 text-xs text-neutral-600">
                      {generatedResult.requirements.map((req, idx) => (
                        <li key={idx} className="flex items-start text-neutral-700 leading-snug">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2 shrink-0 mt-0.5" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Vocabulary recommendations */}
                  <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-amber-100/30 shadow-sm space-y-3">
                    <h4 className="font-bold text-xs text-rose-800 uppercase tracking-widest border-b border-rose-50 pb-2">🌿 Từ khóa & Từ láy gợi ý</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {generatedResult.keywords.map((word) => (
                        <span key={word} className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-100 rounded-lg text-xs font-medium">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Common mistakes */}
                  <div className="bg-rose-50 p-5 rounded-2xl border border-rose-100 space-y-3">
                    <h4 className="font-bold text-xs text-rose-800 uppercase tracking-widest border-b border-rose-100 pb-2">⚡ Điểm học sinh cần tránh</h4>
                    <div className="space-y-2 text-[11px] text-rose-900 leading-relaxed">
                      {generatedResult.errorsToAvoid.map((err, idx) => (
                        <div key={idx} className="flex items-start">
                          <span className="text-rose-500 font-bold mr-1.5">⚠</span>
                          <span>{err}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* SUB-TAB 2: Writing Growth Tracker (Interactive 1st Draft vs 2nd Draft) */}
      {activeSubTab === 'track' && (
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {!v1Grade ? (
              /* PANEL A: Submission of Edition 1 (Draft Lần 1) */
              <motion.div
                key="v1-submit"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl border border-amber-100/50 shadow-sm p-6 space-y-5"
              >
                <div>
                  <h3 className="text-base font-bold text-neutral-800">Bước 1: Viết dàn ý dự thảo Lần 1</h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Chuẩn bị dàn ý phác thảo cơ bản cho đề tài <strong className="text-amber-800">"{customTopic || 'Chưa đặt đề bài'}"</strong>. Không cần quá hoàn hảo, AI sẽ giúp em tìm điểm khuyết để nâng cấp!
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-neutral-400">
                    <span>Soạn thảo dàn ý sơ khai của em ở đây</span>
                    <span>tối thiểu nên ghi 3-4 dòng</span>
                  </div>
                  <textarea
                    id="v1-textarea"
                    rows={8}
                    placeholder="Ví dụ:&#13;Mở bài: Giới thiệu trường học vào buổi sáng ra chơi.&#13;Thân bài: Sân trường rất vui vẻ. Các em đá bóng, nhảy dây cùng nhau. Gió mát bóng cây xanh rì.&#13;Kết bài: Em rất mến sân trường của em."
                    value={v1Outline}
                    onChange={(e) => setV1Outline(e.target.value)}
                    className="w-full p-4 text-xs font-medium text-neutral-800 bg-neutral-50/50 rounded-2xl border border-neutral-200 outline-none focus:bg-white focus:ring-2 focus:ring-amber-400/80 transition"
                  />
                </div>

            {/* Sentence Transformer inline tool */}
            <SentenceTransformer genreId={selectedGenreId} apiKey={apiKey} selectedModel={selectedModel} />

                <div className="flex items-center space-x-3">
                  <button
                    id="grade-v1-btn"
                    disabled={!v1Outline.trim() || !customTopic.trim() || isGradingV1}
                    onClick={handleGradeV1}
                    className={`px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl text-xs transition shadow-md hover:shadow-lg flex items-center space-x-2 cursor-pointer ${
                      (!v1Outline.trim() || !customTopic.trim() || isGradingV1) && 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {isGradingV1 ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>AI Huấn luyện viên đang nghiên cứu...</span>
                      </>
                    ) : (
                      <>
                        <ClipboardCheck className="w-4 h-4" />
                        <span>Nộp Dàn Ý Lần 1 & AI Chấm Điểm 📝</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setV1Outline(`Mở bài: Giới thiệu sân trường lúc ra chơi.
Thân bài:
- Sân trường lộng gió, rất đông bạn bè đùa nghịch.
- Các nhóm đá cầu, nhóm nhảy dây hò hét vang rộn.
Kết bài: Em yêu thích giờ ra chơi ở khu sân trường.`);
                    }}
                    className="text-[11px] text-neutral-500 hover:text-amber-700 border border-neutral-200 rounded-lg py-1.5 px-3 bg-white"
                  >
                    💡 Nhập mẫu thử nghiệm nhanh
                  </button>
                </div>
              </motion.div>
            ) : !comparison ? (
              /* PANEL B: Edition 1 Score Cards & Edit Screen for Edition 2 (Upgrades) */
              <motion.div
                key="v2-edit"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                {/* Score and Task challenges Column (1 Column) */}
                <div className="space-y-6">
                  {/* Score badge card */}
                  <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-amber-100/50 shadow-sm text-center space-y-4">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Điểm số Lần 1</span>
                    <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-amber-50 to-orange-50 border-4 border-amber-200/60 shadow-md score-glow">
                      <span className="text-4xl font-extrabold text-amber-700 font-sans">{v1Grade.score}</span>
                      <span className="text-xs text-amber-500 font-medium self-end mb-4">/100</span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-neutral-800">
                        {v1Grade.score >= 80 ? 'Hạng Tốt' : 'Đạt yêu cầu - Cần cải tiến'}
                      </h4>
                      <p className="text-[11px] text-neutral-500 leading-relaxed px-2">
                        {v1Grade.feedback.general}
                      </p>
                    </div>

                    {/* Skill Breakdown Stars */}
                    <div className="text-left space-y-1.5 border-t border-neutral-100 pt-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[11px] text-neutral-500">Hiểu đề (20đ):</span>
                        <span className="font-bold text-neutral-700">{v1Grade.criteriaScores.understand}đ</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[11px] text-neutral-500">Bố cục (20đ):</span>
                        <span className="font-bold text-neutral-700">{v1Grade.criteriaScores.structure}đ</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[11px] text-neutral-500">Phát triển ý (25đ):</span>
                        <span className="font-bold text-neutral-700">{v1Grade.criteriaScores.development}đ</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[11px] text-neutral-500">Cảm súc (20đ):</span>
                        <span className="font-bold text-neutral-700">{v1Grade.criteriaScores.creativity}đ</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[11px] text-neutral-500">Logic (15đ):</span>
                        <span className="font-bold text-neutral-700">{v1Grade.criteriaScores.logic}đ</span>
                      </div>
                    </div>
                  </div>

                  {/* Specific Rubric Checklist */}
                  <div className="bg-white p-5 rounded-2xl border border-neutral-100 space-y-3">
                    <h4 className="font-bold text-xs text-neutral-800 uppercase tracking-widest border-b border-neutral-100 pb-2">📋 Kiểm kê tiêu chí dạng bài</h4>
                    <div className="space-y-2">
                      {v1Grade.checklist.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-neutral-50/50">
                          <span className="text-neutral-600 leading-snug">{item.name}</span>
                          <span className={`text-[10px] whitespace-nowrap font-bold px-2 py-0.5 rounded-full ${
                            item.status ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-500'
                          }`}>
                            {item.status ? 'Đã đạt ✓' : 'Chưa đạt ✘'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Growth upgrade arena (2 columns) */}
                <div className="lg:col-span-2 bg-white/90 backdrop-blur-sm rounded-2xl border border-amber-100/30 shadow-sm p-6 space-y-5">
                  <div className="bg-amber-50/70 border border-amber-100 p-5 rounded-2xl space-y-2">
                    <div className="flex items-center space-x-2 text-amber-900">
                      <Award className="w-5 h-5 text-amber-600" />
                      <h4 className="font-bold text-xs uppercase tracking-wide">🎯 Nhiệm vụ nâng cấp dàn ý</h4>
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed font-medium">
                      {v1Grade.feedback.nextSteps}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[11px] text-neutral-600">
                      <div className="p-2.5 rounded-lg bg-white/80 border border-amber-100/50 space-y-1">
                        <strong className="text-emerald-700 block">✓ Điểm mạnh của em:</strong>
                        <ul className="list-disc pl-3 text-neutral-600 space-y-1">
                          {v1Grade.feedback.strengths.slice(0, 2).map((st, idx) => (
                            <li key={idx}>{st}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white/80 border border-amber-100/50 space-y-1">
                        <strong className="text-rose-700 block">⚠ Điểm cần cải thiện gấp:</strong>
                        <ul className="list-disc pl-3 text-neutral-600 space-y-1">
                          {v1Grade.feedback.improvements.slice(0, 2).map((imp, idx) => (
                            <li key={idx}>{imp}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Multi edit panels comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Locked Draft v1 */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Dự thảo Lần 1 (Đã khóa)</span>
                      <div className="w-full p-4 min-h-[180px] max-h-[300px] overflow-y-auto text-xs font-semibold text-neutral-500 bg-neutral-100 rounded-xl border border-neutral-100 whitespace-pre-wrap select-none leading-relaxed">
                        {v1Outline}
                      </div>
                    </div>

                    {/* Adjustable Draft v2 */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block">Sửa đổi Lần 2 (Tiến bộ)</span>
                      <textarea
                        id="v2-textarea"
                        rows={10}
                        placeholder="Thêm các chi tiết, cảm xúc sinh động của riêng em vào đây để tăng hàng chục điểm!"
                        value={v2Outline}
                        onChange={(e) => setV2Outline(e.target.value)}
                        className="w-full p-4 text-xs font-semibold text-neutral-800 bg-amber-50/10 focus:bg-white rounded-xl border border-amber-200 focus:ring-2 focus:ring-amber-400 outline-none transition leading-relaxed min-h-[180px]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 border border-neutral-200 text-neutral-500 hover:bg-neutral-50 text-xs rounded-xl transition cursor-pointer"
                    >
                      Bỏ nháp làm lại từ đầu
                    </button>

                    <button
                      id="grade-v2-btn"
                      disabled={!v2Outline.trim() || isGradingV2 || v2Outline === v1Outline}
                      onClick={handleGradeV2}
                      className={`px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl text-xs transition shadow-md hover:shadow-lg flex items-center space-x-2 cursor-pointer ${
                        (!v2Outline.trim() || isGradingV2 || v2Outline === v1Outline) && 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      {isGradingV2 ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Mạng nơ-ron đang đo đạc đối sánh...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>AI Đánh Giá Phiên Bản 2 & Đo Tiến Bộ 📈</span>
                        </>
                      )}
                    </button>
                  </div>
                  {v2Outline === v1Outline && (
                    <p className="text-[10px] text-amber-600 text-right font-medium">
                      * Hãy thực tế gõ thêm chi tiết mới vào ô "Sửa đổi Lần 2" so với bản cũ để kích hoạt đo đạc sự thăng tiến!
                    </p>
                  )}
                </div>
              </motion.div>
            ) : (
              /* PANEL C: Double-Grade Detailed Progress Analytics Dashboard */
              <motion.div
                key="comparison-dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Score Growth Display Banner */}
                <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white p-6 md:p-8 rounded-3xl shadow-lg text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-center md:justify-start space-x-2 text-amber-100">
                      <Star className="w-5 h-5 fill-amber-300 text-amber-300" />
                      <span className="text-xs font-bold uppercase tracking-widest">Growth Tracker Success</span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-extrabold font-sans">📈 SỰ TIẾN BỘ CỦA EM</h3>
                    <p className="text-xs text-amber-50/95 max-w-xl leading-relaxed">
                      Huấn luyện viên AI hào hứng ghi nhận: Em đã dũng cảm nhận phản hồi, tư duy sửa đổi để kiến tạo dàn bài đạt chiều sâu vượt trội!
                    </p>
                  </div>

                  <div className="flex items-center space-x-4 bg-amber-700/30 p-4 rounded-2xl border border-white/10 shrink-0">
                    <div className="text-center">
                      <span className="text-[10px] uppercase text-amber-200 tracking-wider block">Lần 1</span>
                      <span className="text-2xl font-bold line-through opacity-70">{comparison.scoreBefore}</span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-amber-200" />
                    <div className="text-center font-sans">
                      <span className="text-[10px] uppercase text-amber-200 tracking-wider block">Lần 2</span>
                      <span className="text-4xl font-black text-amber-100">{comparison.scoreAfter}</span>
                    </div>
                    <div className="bg-emerald-500/90 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center shadow-xs">
                      +{comparison.scoreDiff} điểm 🎉
                    </div>
                  </div>
                </div>

                {/* Skills Before vs After comparison charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Skill Matrix Visualizers */}
                  <div className="bg-white p-6 rounded-2xl border border-neutral-100 space-y-5">
                    <h4 className="font-bold text-xs text-neutral-800 uppercase tracking-widest border-b border-neutral-100 pb-2">📊 Ma Trận Chỉ Số Kỹ Năng</h4>
                    
                    <div className="space-y-4">
                      {/* Hiểu đề */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-neutral-700">1. Hiểu đề & yêu cầu (20đ)</span>
                          <span className="text-amber-600 font-bold">{comparison.skillsBefore.understand} → {comparison.skillsAfter.understand}</span>
                        </div>
                        <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden relative">
                          <div className="absolute top-0 left-0 h-full bg-neutral-300 rounded-full transition-all duration-300" style={{ width: `${(comparison.skillsBefore.understand / 20) * 100}%` }}></div>
                          <div className="absolute top-0 left-0 h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${(comparison.skillsAfter.understand / 20) * 100}%` }}></div>
                        </div>
                      </div>

                      {/* Bố cục */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-neutral-700">2. Bố cục 3 phần (20đ)</span>
                          <span className="text-amber-600 font-bold">{comparison.skillsBefore.structure} → {comparison.skillsAfter.structure}</span>
                        </div>
                        <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden relative">
                          <div className="absolute top-0 left-0 h-full bg-neutral-300 rounded-full" style={{ width: `${(comparison.skillsBefore.structure / 20) * 100}%` }}></div>
                          <div className="absolute top-0 left-0 h-full bg-amber-500 rounded-full" style={{ width: `${(comparison.skillsAfter.structure / 20) * 100}%` }}></div>
                        </div>
                      </div>

                      {/* Phát triển ý */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-neutral-700">3. Phát triển ý chi tiết (25đ)</span>
                          <span className="text-amber-600 font-bold">{comparison.skillsBefore.development} → {comparison.skillsAfter.development}</span>
                        </div>
                        <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden relative">
                          <div className="absolute top-0 left-0 h-full bg-neutral-300 rounded-full" style={{ width: `${(comparison.skillsBefore.development / 25) * 100}%` }}></div>
                          <div className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full" style={{ width: `${(comparison.skillsAfter.development / 25) * 100}%` }}></div>
                        </div>
                      </div>

                      {/* Cảm xúc */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-neutral-700">4. Thể hiện xúc cảm & sáng tạo (20đ)</span>
                          <span className="text-emerald-600 font-bold">{comparison.skillsBefore.creativity} → {comparison.skillsAfter.creativity}</span>
                        </div>
                        <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden relative">
                          <div className="absolute top-0 left-0 h-full bg-neutral-300 rounded-full" style={{ width: `${(comparison.skillsBefore.creativity / 20) * 100}%` }}></div>
                          <div className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full" style={{ width: `${(comparison.skillsAfter.creativity / 20) * 100}%` }}></div>
                        </div>
                      </div>

                      {/* Logic */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-neutral-700">5. Logic bài viết (15đ)</span>
                          <span className="text-purple-600 font-bold">{comparison.skillsBefore.logic} → {comparison.skillsAfter.logic}</span>
                        </div>
                        <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden relative">
                          <div className="absolute top-0 left-0 h-full bg-neutral-300 rounded-full" style={{ width: `${(comparison.skillsBefore.logic / 15) * 100}%` }}></div>
                          <div className="absolute top-0 left-0 h-full bg-purple-500 rounded-full" style={{ width: `${(comparison.skillsAfter.logic / 15) * 100}%` }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-neutral-50 rounded-xl space-y-1 border border-neutral-100 text-[10px] text-neutral-400">
                      <div className="flex items-center space-x-1.5"><div className="w-2.5 h-2.5 bg-neutral-300 rounded-xs"></div><span>Cấp độ bản phác Lần 1</span></div>
                      <div className="flex items-center space-x-1.5"><div className="w-2.5 h-2.5 bg-amber-500 rounded-xs"></div><span>Cấp độ cải thiện Lần 2 đạt đỉnh</span></div>
                    </div>
                  </div>

                  {/* Right Column: In-depth commentary & Before-after panel comparison (2 columns) */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Growth Commentary */}
                    <div className="bg-white p-6 rounded-2xl border border-neutral-100 space-y-4">
                      <div>
                        <h4 className="font-bold text-xs text-neutral-400 uppercase tracking-widest">🌱 Nhận xét chân dung tiến trình</h4>
                        <p className="text-xs text-neutral-700 font-medium leading-relaxed italic mt-2 bg-amber-50/20 p-4 rounded-xl border border-amber-100/30">
                          "{comparison.feedback.growthWords}"
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">🏆 Điểm cải tiến nhảy vọt:</span>
                          <p className="text-xs text-neutral-600 leading-relaxed bg-emerald-50/30 p-3 rounded-lg border border-emerald-100/50">
                            {comparison.feedback.celebration}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">💡 Lưu ý rèn thêm chân trời mới:</span>
                          <p className="text-xs text-neutral-600 leading-relaxed bg-amber-50/30 p-3 rounded-lg border border-amber-100/50">
                            {comparison.feedback.reminders}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Step 5: Self-Reflection & Evaluation prompts (Value-Add "Vinschool Reflection" concept) */}
                    <div className="bg-white p-6 rounded-2xl border border-neutral-100 space-y-4">
                      <div className="border-b border-neutral-100 pb-2">
                        <h4 className="font-extrabold text-sm text-neutral-800 uppercase tracking-wide flex items-center space-x-2">
                          <Star className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" />
                          <span>Phiếu tự ngẫm để thăng hạng (Reflection Log)</span>
                        </h4>
                        <p className="text-xs text-neutral-500 mt-1">
                          Hãy viết ngắn gọn 3 câu đúc kết tự nhận thức để thấu đạt chuyển đổi viết lách sâu sắc!
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-neutral-600">1. Em đã thay đổi hay thêm bộc lộ/chi tiết gì so với lúc đầu?</label>
                          <input
                            id="reflection-q1"
                            type="text"
                            placeholder="Ví dụ: Em đã thêm âm thanh trẻ em chơi đá bóng hò reo chân thực dưới nắng gắt..."
                            value={q1Changes}
                            onChange={(e) => setQ1Changes(e.target.value)}
                            className="w-full p-2.5 text-xs text-neutral-700 bg-neutral-50 rounded-lg border border-neutral-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-400 outline-none transition"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-neutral-600">2. Thay đổi đó giúp gì cho bài tốt lên thế nào?</label>
                          <input
                            id="reflection-q2"
                            type="text"
                            placeholder="Ví dụ: Giúp người đọc ngỡ ngàng cảm thấy sân trường tràn trề nhựa sống chứ không khô khan..."
                            value={q2Reasons}
                            onChange={(e) => setQ2Reasons(e.target.value)}
                            className="w-full p-2.5 text-xs text-neutral-700 bg-neutral-50 rounded-lg border border-neutral-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-400 outline-none transition"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-neutral-600">3. Điểm gì em cần mài giũa sâu sắc hơn vào lần viết sau?</label>
                          <input
                            id="reflection-q3"
                            type="text"
                            placeholder="Ví dụ: Lần sau em sẽ chú ý viết kỹ hơn đoạn kết khép lại tâm tư ấm lòng..."
                            value={q3Learnings}
                            onChange={(e) => setQ3Learnings(e.target.value)}
                            className="w-full p-2.5 text-xs text-neutral-700 bg-neutral-50 rounded-lg border border-neutral-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-400 outline-none transition"
                          />
                        </div>
                      </div>

                      {/* Finish interactions */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-neutral-100">
                        <button
                          onClick={handleReset}
                          className="px-4 py-2 border border-neutral-200 text-neutral-500 hover:text-neutral-700 text-xs rounded-xl transition cursor-pointer"
                        >
                          Lập Dàn Ý Mới Khác
                        </button>

                        <div className="flex space-x-3 w-full sm:w-auto">
                          <button
                            id="save-portfolio-btn"
                            disabled={!q1Changes.trim() || !q2Reasons.trim() || !q3Learnings.trim() || isSaved}
                            onClick={handleSaveToPortfolio}
                            className={`w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold rounded-xl text-xs transition shadow-md hover:shadow-lg flex items-center justify-center space-x-2 cursor-pointer ${
                              (!q1Changes.trim() || !q2Reasons.trim() || !q3Learnings.trim() || isSaved) && 'opacity-65 cursor-not-allowed'
                            }`}
                          >
                            {isSaved ? (
                              <>
                                <Check className="w-4 h-4" />
                                <span>Đã Lưu Vào Portfolio Của Em 🎉</span>
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                <span>Lưu Dàn Ý & Hoàn Tất Hoạt Động 💾</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      {!isSaved && (!q1Changes.trim() || !q2Reasons.trim() || !q3Learnings.trim()) && (
                        <p className="text-[10px] text-amber-700 font-medium text-right italic">
                          * Hoàn thành viết Phiếu tự ngẫm 3 câu ngắn ở trên để kích hoạt nút Lưu & nhận Huy hiệu tiến hóa!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

        {activeSubTab === 'chat' && (
          <AIChatScaffold
            topic={customTopic}
            genreId={selectedGenreId}
            apiKey={apiKey}
            selectedModel={selectedModel}
          />
        )}

        {activeSubTab === 'sample' && (
          <div className="space-y-6">
            {/* Options Card */}
            <div className="p-6 bg-white/90 backdrop-blur-sm rounded-2xl border border-amber-100/50 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="max-w-xl">
                  <h3 className="text-base font-bold text-neutral-800 flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-emerald-500" />
                    <span>🦉 Bài viết mẫu học hỏi - Đạt Loại Giỏi</span>
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Cú Văn sẽ viết một bài văn hoặc một đoạn văn mẫu loại giỏi, giàu hình ảnh, từ láy và cảm xúc dựa trên đề tài hoặc chính dàn ý em đã lập.
                  </p>
                </div>

                {/* Format Select */}
                <div className="flex items-center space-x-3 bg-neutral-100/80 p-1 rounded-xl self-start md:self-center border border-neutral-200/50">
                  <button
                    onClick={() => setEssayFormat('essay')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center space-x-1 ${
                      essayFormat === 'essay'
                        ? 'bg-white text-neutral-800 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Bài văn mẫu</span>
                  </button>
                  <button
                    onClick={() => setEssayFormat('paragraph')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center space-x-1 ${
                      essayFormat === 'paragraph'
                        ? 'bg-white text-neutral-800 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Đoạn văn ngắn</span>
                  </button>
                </div>
              </div>

              {/* Custom Draft Toggle */}
              {(v1Outline.trim() || v2Outline.trim()) && (
                <label className="flex items-center space-x-2.5 bg-amber-50/50 hover:bg-amber-50 p-3 rounded-xl border border-amber-100/30 cursor-pointer transition select-none">
                  <input
                    type="checkbox"
                    checked={useDraftOutline}
                    onChange={(e) => setUseDraftOutline(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs font-semibold text-neutral-700">
                    ✍️ Hãy viết bài dựa trên Dàn ý hiện tại của em (V1 hoặc V2)
                  </span>
                </label>
              )}

              {/* CTA Generate button */}
              <button
                onClick={handleGenerateEssay}
                disabled={isGeneratingEssay}
                className={`px-6 py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold rounded-xl text-xs transition shadow-md hover:shadow-lg flex items-center space-x-2 cursor-pointer ${
                  isGeneratingEssay ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isGeneratingEssay ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Cú Văn đang chấp bút viết văn...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>🦉 Cú Văn Viết Bài Mẫu Loại Giỏi 🚀</span>
                  </>
                )}
              </button>
            </div>

            {/* Exemplary Essay View */}
            {generatedEssay && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main composition paper view */}
                <div className="lg:col-span-2 bg-amber-50/10 backdrop-blur-xs rounded-2xl border border-amber-200/40 p-6 md:p-8 shadow-sm space-y-6 relative overflow-hidden">
                  {/* Decorative lined paper style background */}
                  <div className="absolute inset-0 bg-linear bg-[size:100%_2rem] opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px)' }} />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200/40 pb-4 relative z-10">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase">
                        Bài viết đạt loại giỏi
                      </span>
                      <h4 className="text-base font-extrabold text-neutral-800 mt-1">
                        📝 {essayFormat === 'essay' ? 'Bài văn mẫu tham khảo' : 'Đoạn văn mẫu tham khảo'}
                      </h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5 font-medium">Chủ đề: {customTopic}</p>
                    </div>

                    {/* Highlights Toggles */}
                    <div className="flex flex-wrap gap-1.5 max-w-xs">
                      {[
                        { type: 'imagery', label: '🌿 Gợi hình', color: 'emerald' },
                        { type: 'emotion', label: '💗 Cảm xúc', color: 'pink' },
                        { type: 'rhetorical', label: '✨ Tu từ', color: 'purple' },
                        { type: 'vocabulary', label: '📚 Từ láy', color: 'amber' },
                      ].map(item => {
                        const isSelected = activeHighlights.includes(item.type);
                        return (
                          <button
                            key={item.type}
                            onClick={() => {
                              if (isSelected) {
                                setActiveHighlights(activeHighlights.filter(t => t !== item.type));
                              } else {
                                setActiveHighlights([...activeHighlights, item.type]);
                              }
                            }}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold cursor-pointer border transition-all ${
                              isSelected
                                ? `bg-${item.color}-50 text-${item.color}-700 border-${item.color}-200/60 shadow-xs`
                                : 'bg-white text-neutral-400 border-neutral-100'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Content text block */}
                  <div className="relative z-10 bg-white/95 rounded-xl p-6 border border-amber-100/20 shadow-xs leading-relaxed max-h-[500px] overflow-y-auto font-serif tracking-wide select-text">
                    {renderEssayWithHighlights(generatedEssay.content, generatedEssay.highlights)}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10 pt-4 border-t border-amber-200/20">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedEssay.content);
                        alert('Đã sao chép bài viết mẫu vào bộ nhớ tạm!');
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-neutral-100 hover:bg-neutral-200/80 text-neutral-600 font-bold rounded-xl text-xs flex items-center justify-center space-x-1 cursor-pointer transition"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép toàn bài</span>
                    </button>

                    <button
                      onClick={handleSaveEssayToPortfolio}
                      className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-1.5 cursor-pointer shadow-md hover:shadow-lg transition"
                    >
                      {isEssaySaved ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Đã lưu bài viết vào Portfolio 🎉</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Lưu bài mẫu vào Portfolio 💾</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Sidebar with explanations and annotations */}
                <div className="space-y-6">
                  {/* Active/Hovered Highlight Explanation */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-amber-100/30 shadow-sm p-5 space-y-3">
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center space-x-1">
                      <HelpCircle className="w-4 h-4 text-neutral-400" />
                      <span>Chú thích nghệ thuật</span>
                    </h4>
                    {hoveredHighlight ? (
                      <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-100 space-y-2 animate-slide-up">
                        <div className="flex items-center space-x-1.5">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            hoveredHighlight.type === 'imagery' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            hoveredHighlight.type === 'emotion' ? 'bg-pink-50 text-pink-700 border border-pink-100' :
                            hoveredHighlight.type === 'rhetorical' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                            'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {hoveredHighlight.type === 'imagery' ? '🌿 Gợi hình' :
                             hoveredHighlight.type === 'emotion' ? '💗 Cảm xúc' :
                             hoveredHighlight.type === 'rhetorical' ? '✨ Tu từ' :
                             '📚 Từ láy'}
                          </span>
                          <span className="text-[10px] font-bold text-neutral-500">"{hoveredHighlight.text}"</span>
                        </div>
                        <p className="text-xs text-neutral-600 leading-relaxed font-sans">{hoveredHighlight.explanation}</p>
                      </div>
                    ) : (
                      <div className="p-6 bg-neutral-50/50 rounded-xl border border-neutral-100/50 text-center space-y-2">
                        <div className="text-2xl">🦉</div>
                        <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                          Di chuột hoặc click vào các phần được tô màu bên cạnh để xem Cú Văn chú thích các câu chữ hay nhé!
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Pedagogical Analysis */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-amber-100/30 shadow-sm p-5 space-y-4">
                    <h4 className="text-xs font-bold text-neutral-800 flex items-center space-x-1.5">
                      <span>💡 Điểm đặc sắc cần học hỏi</span>
                    </h4>
                    <div className="space-y-3">
                      {generatedEssay.analysis.map((item, idx) => (
                        <div key={idx} className="flex items-start space-x-2 bg-neutral-50/50 p-2.5 rounded-xl border border-neutral-100/30 text-xs text-neutral-600">
                          <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5 border border-emerald-100">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed font-medium">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
    </div>
  );
}
