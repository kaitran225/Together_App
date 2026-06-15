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

    @PostMapping("/documents")
    public ApiResponse<DocumentResponse> uploadDocument(@RequestBody UploadDocumentRequest request) {
        String currentUserSso = SecurityUtils.getCurrentUserSsoOrNull();
        return ApiResponse.ok(documentAndMindmapService.uploadDocument(currentUserSso, request));
    }

    @GetMapping("/documents")
    public ApiResponse<List<DocumentResponse>> getMyDocuments() {
        String currentUserSso = SecurityUtils.getCurrentUserSsoOrNull();
        return ApiResponse.ok(documentAndMindmapService.getMyDocuments(currentUserSso));
    }

    @DeleteMapping("/documents/{documentId}")
    public ApiResponse<Void> deleteDocument(@PathVariable Long documentId) {
        String currentUserSso = SecurityUtils.getCurrentUserSsoOrNull();
        documentAndMindmapService.deleteDocument(documentId, currentUserSso);
        return ApiResponse.ok(null);
    }

    @PostMapping("/mindmaps")
    public ApiResponse<MindmapResponse> saveMindmap(@RequestBody SaveMindmapRequest request) {
        String currentUserSso = SecurityUtils.getCurrentUserSsoOrNull();
        return ApiResponse.ok(documentAndMindmapService.saveMindmap(currentUserSso, request));
    }

    @GetMapping("/mindmaps")
    public ApiResponse<List<MindmapResponse>> getMyMindmaps() {
        String currentUserSso = SecurityUtils.getCurrentUserSsoOrNull();
        return ApiResponse.ok(documentAndMindmapService.getMindmaps(currentUserSso));
    }
}
