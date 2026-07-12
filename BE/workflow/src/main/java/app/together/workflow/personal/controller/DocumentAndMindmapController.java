package app.together.workflow.personal.controller;

import app.together.common.shared.dto.ApiResponse;
import app.together.common.shared.util.SecurityUtils;
import app.together.workflow.personal.dto.DocumentAndMindmapDtos.*;
import app.together.workflow.personal.service.DocumentAndMindmapService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/workflow/personal")
@RequiredArgsConstructor
public class DocumentAndMindmapController {

    private final DocumentAndMindmapService documentAndMindmapService;

    @PostMapping(value = "/documents", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<DocumentResponse> uploadDocument(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam(value = "title", required = false) String title) throws java.io.IOException {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(documentAndMindmapService.uploadDocumentFile(currentUserSso, file, title));
    }

    @GetMapping("/documents")
    public ApiResponse<List<DocumentResponse>> getMyDocuments() {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(documentAndMindmapService.getMyDocuments(currentUserSso));
    }

    @DeleteMapping("/documents/{documentId}")
    public ApiResponse<Void> deleteDocument(@PathVariable Long documentId) {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        documentAndMindmapService.deleteDocument(documentId, currentUserSso);
        return ApiResponse.ok(null);
    }

    /**
     * Hỏi đáp dựa trên nội dung tài liệu.
     * Gửi câu hỏi kèm documentId, hệ thống sẽ dùng nội dung đã trích xuất
     * để trả lời thông qua model Qwen2.5 (Ollama).
     */
    @PostMapping("/documents/{documentId}/ask")
    public ApiResponse<String> askDocumentQuestion(
            @PathVariable Long documentId,
            @RequestBody AskDocumentQuestionRequest request) {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        String answer = documentAndMindmapService.askDocumentQuestion(documentId, currentUserSso, request);
        return ApiResponse.ok(answer);
    }

    @PostMapping("/mindmaps")
    public ApiResponse<MindmapResponse> saveMindmap(@RequestBody SaveMindmapRequest request) {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(documentAndMindmapService.saveMindmap(currentUserSso, request));
    }

    @GetMapping("/mindmaps")
    public ApiResponse<List<MindmapResponse>> getMyMindmaps() {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(documentAndMindmapService.getMindmaps(currentUserSso));
    }
}
