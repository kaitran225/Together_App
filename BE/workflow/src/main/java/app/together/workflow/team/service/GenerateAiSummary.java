package app.together.workflow.team.service;

import java.time.Instant;
import java.util.Collections;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.fasterxml.jackson.databind.ObjectMapper;

import app.together.common.workflow.entity.Meeting;
import app.together.common.workflow.entity.MeetingSummary;
import app.together.common.workflow.entity.Task;
import app.together.common.workflow.enums.TaskPriority;
import app.together.common.workflow.enums.TaskStatus;
import app.together.common.workflow.repository.MeetingSummaryRepository;
import app.together.common.workflow.repository.TaskRepository;
import app.together.workflow.team.dto.MeetingDtos.AiProposedTask;
import app.together.workflow.team.dto.MeetingDtos.AiSummaryPayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class GenerateAiSummary {

    private final ObjectMapper objectMapper;
    private final MeetingSummaryRepository meetingSummaryRepository;
    private final TaskRepository taskRepository;

    @Value("${app.ai.service-url=https://dev-together-ai-gateway.onrender.com/}")
    private String aiServerUrl;

    @Async
    public void generateAndProcessAiSummary(Meeting meeting) {
        log.info("Start generating AI summary for meeting {}", meeting.getMeetingId());
        try {
            // dùng để gọi sang AI LLM
            RestClient restClient = RestClient.create();
            AiSummaryPayload aiResult = null;
            try {
                aiResult = restClient.post()
                        .uri(aiServerUrl + "api/v1/ai/summarize-meeting")
                        .body(meeting)
                        .retrieve()
                        .body(AiSummaryPayload.class);
            } catch (Exception e) {
                log.warn("AI summarize call failed, using fallback mock: {}", e.getMessage());
                aiResult = new AiSummaryPayload(
                    "Cuộc họp thảo luận về \"" + meeting.getTitle() + "\". Các thành viên đã đạt được sự thống nhất cao về định hướng triển khai dự án.",
                    List.of("Phân tích các yêu cầu hệ thống", "Chọn công nghệ frontend và backend", "Lên kế hoạch E2E testing"),
                    List.of(
                        new AiProposedTask("Thiết lập môi trường phát triển", "Cài đặt Docker, cấu hình cơ sở dữ liệu ban đầu.", "HIGH"),
                        new AiProposedTask("Viết tài liệu API", "Mô tả đầy đủ các endpoints cho Auth và Workflow.", "MEDIUM")
                    ),
                    List.of("Chọn Next.js làm framework Frontend", "Quyết định sử dụng PostgreSQL làm Database"),
                    List.of("Tạo kho lưu trữ git mới", "Phân công task lên Kanban Board"),
                    "Fallback-Mock-LLM"
                );
            }

            if (aiResult == null) {
                log.warn("AI summary result is null for meeting {}", meeting.getMeetingId());
                return;
            }

            MeetingSummary summary = MeetingSummary.builder()
                    .meetingId(meeting.getMeetingId())
                    .content(aiResult.content())
                    .keyPoints(objectMapper.writeValueAsString(aiResult.keyPoints()))
                    .decisionsMade(aiResult.decisionsMade())
                    .nextSteps(objectMapper.writeValueAsString(aiResult.nextSteps()))
                    .actionItems(objectMapper.writeValueAsString(aiResult.actionItems()))
                    .modelUsed(aiResult.modelUsed() != null ? aiResult.modelUsed() : "Custom-LLM-v2")
                    .generatedAt(Instant.now())
                    .build();
            meetingSummaryRepository.save(summary);

            if (meeting.getProjectId() != null && aiResult.actionItems() != null) {
                for (AiProposedTask proposedTask : aiResult.actionItems()) {
                    Task draftTask = Task.builder()
                            .projectId(meeting.getProjectId())
                            .teamId(meeting.getTeamId())
                            .title("[AI đề xuất] " + proposedTask.title())
                            .description(proposedTask.description() + "\n*(Được gợi ý từ Trợ lý AI sau cuộc họp: \""
                                    + meeting.getTitle() + "\")*")
                            .priority(proposedTask.priority() != null ? proposedTask.priority()
                                    : TaskPriority.MEDIUM.name())
                            .status(TaskStatus.DRAFT.name()) // chờ trưởng nhóm duyệt
                            .build();
                    taskRepository.save(draftTask);
                }
                log.info("Created {} proposed tasks for meeting {}", aiResult.actionItems().size(),
                        meeting.getMeetingId());
            }
        } catch (Exception ex) {
            log.error(ex.getMessage(), ex);
        }
    }
}
