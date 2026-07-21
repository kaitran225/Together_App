package app.together.workflow.controller;

import app.together.common.ai.api.AiApplyRequest;
import app.together.common.ai.api.AiApplyResponse;
import app.together.workflow.service.AiToolApplyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/internal/ai-tools")
@RequiredArgsConstructor
@Tag(name = "AI tool apply")
public class AiToolInternalController {

    private final AiToolApplyService aiToolApplyService;

    @PostMapping("/apply")
    @Operation(summary = "Persist applied AI tool artifact (workflow Apply step)")
    public ResponseEntity<AiApplyResponse> apply(@Valid @RequestBody AiApplyRequest request) {
        return ResponseEntity.ok(aiToolApplyService.apply(request));
    }
}
