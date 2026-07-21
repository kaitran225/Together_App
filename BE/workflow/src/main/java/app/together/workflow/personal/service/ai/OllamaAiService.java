package app.together.workflow.personal.service.ai;

import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.ollama.OllamaChatModel;
import org.springframework.stereotype.Service;

/**
 * Service giao tiếp với Ollama (Qwen2.5:3b) qua Spring AI.
 * Cung cấp các chức năng: tạo Mindmap, tóm tắt tài liệu, tạo Quiz, trả lời câu
 * hỏi dựa trên tài liệu.
 */
@Slf4j
@Service
public class OllamaAiService {

  private final ChatClient chatClient;

  /**
   * Spring AI auto-configure OllamaChatModel từ application.properties.
   * ChatClient.Builder được inject tự động khi có starter trên classpath.
   */
  public OllamaAiService(OllamaChatModel ollamaChatModel) {
    this.chatClient = ChatClient.builder(ollamaChatModel).build();
  }

  /**
   * Tạo cấu trúc Mindmap JSON từ nội dung tài liệu.
   *
   * @param documentContent Nội dung text đã trích xuất từ tài liệu
   * @return JSON string chứa cấu trúc mindmap
   */
  public String generateMindmapFromText(String documentContent) {
    String truncatedContent = truncateContent(documentContent, 6000);

    String prompt = """
        Bạn là một trợ lý học tập thông minh. Hãy đọc nội dung tài liệu bên dưới và tạo một Mindmap tóm tắt.

        QUAN TRỌNG: Chỉ trả về JSON hợp lệ, KHÔNG kèm theo bất kỳ giải thích hay markdown nào.

        Cấu trúc JSON yêu cầu:
        {
          "title": "Tiêu đề chính của tài liệu",
          "nodes": [
            {
              "id": "1",
              "label": "Chủ đề chính 1",
              "children": [
                {
                  "id": "1.1",
                  "label": "Ý phụ 1.1"
                }
              ]
            }
          ]
        }

        Nội dung tài liệu:
        ---
        %s
        ---
        """.formatted(truncatedContent);

    log.info("Đang gửi request tạo Mindmap tới Ollama (nội dung: {} ký tự)...", truncatedContent.length());

    String response = chatClient.prompt()
        .user(prompt)
        .call()
        .content();

    log.info("Nhận phản hồi Mindmap từ Ollama thành công ({} ký tự)", response != null ? response.length() : 0);
    return response;
  }

  /**
   * Tóm tắt nội dung tài liệu.
   *
   * @param documentContent Nội dung text đã trích xuất
   * @return Bản tóm tắt dạng text
   */
  public String summarizeText(String documentContent) {
    String truncatedContent = truncateContent(documentContent, 6000);

    String prompt = """
        Bạn là một trợ lý học tập. Hãy tóm tắt nội dung tài liệu bên dưới một cách ngắn gọn, rõ ràng,
        giữ lại các ý chính quan trọng nhất. Viết bằng tiếng Việt.

        Nội dung tài liệu:
        ---
        %s
        ---
        """.formatted(truncatedContent);

    log.info("Đang gửi request tóm tắt tới Ollama (nội dung: {} ký tự)...", truncatedContent.length());

    String response = chatClient.prompt()
        .user(prompt)
        .call()
        .content();

    log.info("Nhận phản hồi tóm tắt từ Ollama thành công.");
    return response;
  }

  /**
   * Tạo bộ Quiz trắc nghiệm từ nội dung tài liệu.
   * AI sẽ trả về JSON chứa danh sách câu hỏi với đáp án, giải thích.
   *
   * @param documentContent Nội dung text đã trích xuất
   * @return JSON string chứa cấu trúc quiz theo format AiQuizPayload
   */
  public String generateQuizFromText(String documentContent) {
    String truncatedContent = truncateContent(documentContent, 5000);

    String prompt = """
        Bạn là một giáo viên chuyên nghiệp. Hãy đọc nội dung tài liệu bên dưới và tạo một bộ đề trắc nghiệm ôn tập gồm 5-10 câu hỏi.

        QUAN TRỌNG: Chỉ trả về JSON hợp lệ, KHÔNG kèm theo bất kỳ giải thích hay markdown nào.

        Cấu trúc JSON yêu cầu:
        {
          "title": "Tiêu đề bộ đề",
          "description": "Mô tả ngắn gọn về bộ đề",
          "difficulty": "MEDIUM",
          "timeLimitMinutes": 15,
          "questions": [
            {
              "questionText": "Nội dung câu hỏi?",
              "questionType": "SINGLE_CHOICE",
              "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
              "correctAnswer": "Đáp án A",
              "explanation": "Giải thích tại sao đáp án đúng",
              "points": 10
            }
          ]
        }

        Lưu ý:
        - questionType chỉ nhận một trong: SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE
        - "correctAnswer" BẮT BUỘC phải là một chuỗi ký tự (String) đơn lẻ và KHỚP CHÍNH XÁC với một phần tử trong "options" (Ví dụ: "Đáp án A").
        - TUYỆT ĐỐI KHÔNG được phép trả về dạng mảng (Array) chứa dấu ngoặc vuông như ["Đáp án A"] hoặc ["Đáp án A", "Đáp án B"].
        - Ngay cả khi "questionType" là MULTIPLE_CHOICE, bạn vẫn bắt buộc chỉ được chọn duy nhất 1 đáp án đúng nhất và trả về dưới dạng chuỗi (String) đơn lẻ làm đại diện (không được trả về dạng mảng).
        - Mỗi câu hỏi phải có đúng 4 options (trừ TRUE_FALSE chỉ cần 2: "Đúng", "Sai")
        - Viết câu hỏi bằng tiếng Việt

        Nội dung tài liệu:
        ---
        %s
        ---
        """
        .formatted(truncatedContent);

    log.info("Đang gửi request tạo Quiz tới Ollama (nội dung: {} ký tự)...", truncatedContent.length());

    String response = chatClient.prompt()
        .user(prompt)
        .call()
        .content();

    log.info("Nhận phản hồi Quiz từ Ollama thành công ({} ký tự)", response != null ? response.length() : 0);
    return response;
  }

  /**
   * Trả lời câu hỏi dựa trên nội dung tài liệu (RAG đơn giản).
   *
   * @param documentContent Nội dung text của tài liệu
   * @param userQuestion    Câu hỏi của người dùng
   * @return Câu trả lời từ AI
   */
  public String answerQuestionFromDocument(String documentContent, String userQuestion) {
    String truncatedContent = truncateContent(documentContent, 5000);

    String prompt = """
        Nội dung tài liệu:
        ---
        %s
        ---

        Câu hỏi: %s
        """.formatted(truncatedContent, userQuestion);

    log.info("Đang gửi câu hỏi tới Ollama dựa trên tài liệu...");

    String response = chatClient.prompt()
        .system("""
            Bạn là một trợ lý học tập. Chỉ trả lời DỰA TRÊN nội dung tài liệu được cung cấp trong tin nhắn của người dùng,
            không dùng kiến thức ngoài tài liệu, không suy đoán, không tự bịa thêm chi tiết không có trong tài liệu.
            Nếu câu trả lời không có trong tài liệu, hãy trả lời chính xác câu: "Tài liệu không đề cập đến vấn đề này."
            Luôn trả lời bằng tiếng Việt.
            """)
        .user(prompt)
        .call()
        .content();

    log.info("Nhận phản hồi Q&A từ Ollama thành công.");
    return response;
  }

  /**
   * Tạo bộ Flashcard từ nội dung tài liệu.
   * AI trả về JSON chứa danh sách câu hỏi-đáp ngắn gọn phù hợp để ôn tập.
   *
   * @param documentContent Nội dung text đã trích xuất
   * @return JSON string chứa danh sách flashcards
   */
  public String generateFlashcardsFromText(String documentContent) {
    String truncatedContent = truncateContent(documentContent, 6000);

    String prompt = """
        Bạn là một giáo viên chuyên nghiệp. Hãy đọc nội dung tài liệu bên dưới và tạo một bộ Flashcard gồm 5-10 thẻ để ôn tập.

        QUAN TRỌNG: Chỉ trả về JSON hợp lệ, KHÔNG kèm theo bất kỳ giải thích hay markdown nào.

        Cấu trúc JSON yêu cầu:
        {
          "title": "Tiêu đề bộ Flashcard",
          "description": "Mô tả ngắn gọn",
          "difficulty": "MEDIUM",
          "timeLimitMinutes": 10,
          "questions": [
            {
              "questionText": "Câu hỏi ngắn gọn (mặt trước thẻ)?",
              "questionType": "SINGLE_CHOICE",
              "options": ["Đáp án đúng", "Sai 1", "Sai 2", "Sai 3"],
              "correctAnswer": "Đáp án đúng",
              "explanation": "Giải thích chi tiết cho câu trả lời",
              "points": 10
            }
          ]
        }

        Lưu ý:
        - Mỗi thẻ flashcard nên tập trung vào 1 khái niệm hoặc kiến thức cốt lõi
        - Câu hỏi ngắn gọn, dễ nhớ
        - correctAnswer phải là String đơn lẻ khớp chính xác với 1 phần tử trong options
        - Viết bằng tiếng Việt

        Nội dung tài liệu:
        ---
        %s
        ---
        """.formatted(truncatedContent);

    log.info("Đang gửi request tạo Flashcard tới Ollama (nội dung: {} ký tự)...", truncatedContent.length());

    String response = chatClient.prompt()
        .user(prompt)
        .call()
        .content();

    log.info("Nhận phản hồi Flashcard từ Ollama thành công ({} ký tự)", response != null ? response.length() : 0);
    return response;
  }

  /**
   * Chat tự do (Conversational Chat)
   *
   * @param userMessage Tin nhắn của người dùng
   * @return AiServiceResponse (mock structure để khớp với service cũ)
   */
  public app.together.workflow.personal.dto.ChatDtos.AiServiceResponse chat(String userMessage) {
    return chatWithContext(null, userMessage);
  }

  /**
   * Chat kèm ngữ cảnh bổ sung (ví dụ lịch cá nhân để tóm tắt / tìm thời gian rảnh).
   */
  public app.together.workflow.personal.dto.ChatDtos.AiServiceResponse chatWithContext(String contextBlock, String userMessage) {
    log.info("Đang gửi tin nhắn chat tới Ollama...");
    String system = """
        Bạn là Together AI — trợ lý học tập thông minh.
        Yêu cầu BẮT BUỘC: Luôn trả lời bằng Tiếng Việt, tự nhiên, thân thiện và chính xác.
        Không dùng tiếng Trung. Chỉ dùng tiếng Anh khi người dùng yêu cầu.
        Nếu có dữ liệu lịch cá nhân trong ngữ cảnh, hãy dùng để tóm tắt lịch và chỉ ra khung giờ rảnh một cách cụ thể (ngày + giờ).
        """;
    if (contextBlock != null && !contextBlock.isBlank()) {
      system = system + "\n\nNgữ cảnh lịch cá nhân của người dùng:\n" + truncateContent(contextBlock, 4000);
    }
    String response = chatClient.prompt()
        .system(system)
        .user(userMessage)
        .call()
        .content();

    log.info("Nhận phản hồi chat từ Ollama thành công.");
    return new app.together.workflow.personal.dto.ChatDtos.AiServiceResponse(response, "CHAT", "{}");
  }

  /**
   * Phân tích prompt lịch: tạo event hoặc tóm tắt / tìm giờ rảnh.
   * Trả về JSON thô từ model (caller parse).
   */
  public String assistCalendar(String scheduleContext, String userPrompt, String nowIso) {
    String prompt = """
        Bạn là trợ lý lịch Together AI. Hiện tại (ISO): %s

        Lịch hiện có của người dùng:
        ---
        %s
        ---

        Yêu cầu người dùng: %s

        Chỉ trả về JSON hợp lệ (không markdown), đúng một trong các dạng:
        1) Tạo sự kiện:
        {"action":"CREATE","reply":"câu trả lời tiếng Việt","event":{"title":"...","startTime":"ISO-8601","endTime":"ISO-8601","description":"..."}}
        2) Tóm tắt / tìm giờ rảnh / tư vấn (không tạo):
        {"action":"SUMMARIZE","reply":"câu trả lời tiếng Việt đầy đủ về lịch và thời gian rảnh","event":null}
        3) Không liên quan lịch:
        {"action":"NONE","reply":"câu trả lời ngắn bằng tiếng Việt","event":null}

        Quy tắc:
        - startTime/endTime phải là Instant ISO-8601 (ví dụ 2026-07-16T09:00:00Z).
        - Nếu người dùng nói giờ Việt Nam mà không có timezone, giả định +07:00 rồi đổi sang Z.
        - Nếu không nói thời lượng, mặc định 1 giờ.
        - Trong reply SUMMARIZE hãy nêu rõ các khung giờ rảnh trong tuần tới nếu có thể.
        """.formatted(nowIso, truncateContent(scheduleContext, 3500), userPrompt);

    log.info("Đang gửi calendar assist tới Ollama...");
    String response = chatClient.prompt()
        .user(prompt)
        .call()
        .content();
    log.info("Nhận calendar assist từ Ollama ({} ký tự)", response != null ? response.length() : 0);
    return response;
  }

  /**
   * Cắt ngắn nội dung text để vừa với context window của model.
   * Qwen2.5:3b có context window khoảng 8K tokens (~6000 ký tự cho nội dung).
   */
  private String truncateContent(String content, int maxChars) {
    if (content == null) {
      return "";
    }
    if (content.length() <= maxChars) {
      return content;
    }
    log.warn("Nội dung tài liệu quá dài ({} ký tự), cắt ngắn còn {} ký tự", content.length(), maxChars);
    return content.substring(0, maxChars) + "\n\n[... nội dung bị cắt ngắn ...]";
  }
}
