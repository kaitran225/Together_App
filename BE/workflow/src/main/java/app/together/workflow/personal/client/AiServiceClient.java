package app.together.workflow.personal.client;

import app.together.workflow.personal.dto.ChatDtos.*;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "ai-service", url = "${app.ai.server-url}")
public interface AiServiceClient {

    // 1. Hàm getMessage(String msg) trong sơ đồ
    @PostMapping("/api/v1/ai/chat")
    AiServiceResponse getMessage(@RequestParam("msg") String msg);

    // 2. Hàm getMessage(String msg, List<Attachment> att) hỗ trợ gửi kèm tài liệu đính kèm
    @PostMapping("/api/v1/ai/chat/attachments")
    AiServiceResponse getMessageWithAttachments(
            @RequestParam("msg") String msg,
            @RequestBody List<String> attachments // Chuyển đổi tệp đính kèm thành dạng chuỗi/token
    );

    // 3. Hàm getEventList(Object Calendar) gửi thông tin lịch trình sang AI phân tích
    @PostMapping("/api/v1/ai/calendar")
    List<String> getEventList(@RequestBody Object calendar);

    // 4. Hàm actionList() lấy danh sách các hành động/tool khả dụng từ AI Service
    @GetMapping("/api/v1/ai/actions")
    List<String> actionList();
}
