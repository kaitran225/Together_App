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
        Bạn là một trợ lý học tập thông minh. Dựa trên nội dung tài liệu bên dưới, hãy trả lời câu hỏi của người dùng.
        Nếu câu trả lời không có trong tài liệu, hãy nói rõ là "Tài liệu không đề cập đến vấn đề này."

        Nội dung tài liệu:
        ---
        %s
        ---

        Câu hỏi: %s
        """.formatted(truncatedContent, userQuestion);

    log.info("Đang gửi câu hỏi tới Ollama dựa trên tài liệu...");

    String response = chatClient.prompt()
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
    log.info("Đang gửi tin nhắn chat tới Ollama...");
    String response = chatClient.prompt()
        .system(
            "Bạn là một trợ lý ảo học tập thông minh. Yêu cầu BẮT BUỘC: Luôn luôn trả lời bằng Tiếng Việt một cách tự nhiên, thân thiện và chính xác. Tuyệt đối không dùng tiếng Trung hay tiếng Anh trừ khi người dùng yêu cầu.")
        .user(userMessage)
        .call()
        .content();

    log.info("Nhận phản hồi chat từ Ollama thành công.");
    return new app.together.workflow.personal.dto.ChatDtos.AiServiceResponse(response, "CHAT", "{}");
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
