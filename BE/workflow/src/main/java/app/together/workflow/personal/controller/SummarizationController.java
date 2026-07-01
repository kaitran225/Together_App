package app.together.workflow.personal.controller;

import app.together.common.shared.dto.ApiResponse;
import app.together.common.shared.util.SecurityUtils;
import app.together.workflow.personal.dto.SummaryDtos.*;
import app.together.workflow.personal.service.SummarizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/workflow/personal")
@RequiredArgsConstructor
public class SummarizationController {

    private final SummarizationService summarizationService;

    @PostMapping("/documents/{documentId}/summarize")
    public ApiResponse<SummaryResponse> summarizeDocument(
            @PathVariable Long documentId,
            @RequestBody(required = false) SummarizeDocumentRequest request) {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(summarizationService.summarizeDocument(currentUserSso, documentId, request));
    }

    @GetMapping("/summaries/history")
    public ApiResponse<List<SummaryResponse>> getSummaryHistory() {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(summarizationService.getSummaryHistory(currentUserSso));
    }
}
