package app.together.workflow.personal.service;

import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.exception.BadRequestException;
import app.together.common.shared.exception.ResourceNotFoundException;
import app.together.common.workflow.entity.Schedule;
import app.together.common.workflow.entity.ScheduleCategory;
import app.together.common.workflow.enums.ScheduleStatus;
import app.together.common.workflow.repository.ScheduleCategoryRepository;
import app.together.common.workflow.repository.ScheduleRepository;
import app.together.workflow.personal.dto.PersonalScheduleDtos.*;
import app.together.workflow.personal.service.ai.OllamaAiService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class PersonalScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final ScheduleCategoryRepository scheduleCategoryRepository;
    private final OllamaAiService ollamaAiService;
    private final ObjectMapper objectMapper;

    // Quản lý lịch
    public CategoryResponse createCategory(String userSso, CreateCategoryRequest reqeust) {
        requireUserSso(userSso);
        if (reqeust.name() == null || reqeust.name().isBlank()) {
            throw new BadRequestException(MessageConstants.MESSAGE_SCHEDULE_TITLE_REQUIRED);
        }

        ScheduleCategory category = ScheduleCategory.builder()
                .userSso(userSso)
                .name(reqeust.name().trim())
                .color(reqeust.color())
                .icon(reqeust.icon())
                .isSystem(false)
                .build();

        ScheduleCategory savedCategory = scheduleCategoryRepository.save(category);

        return new CategoryResponse(
                savedCategory.getCategoryId(),
                savedCategory.getName(),
                savedCategory.getColor(),
                savedCategory.getIcon());
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getMyCategories(String userSso) {
        requireUserSso(userSso);
        return scheduleCategoryRepository.findByUserSso(userSso).stream()
                .map(c -> new CategoryResponse(
                        c.getCategoryId(),
                        c.getName(),
                        c.getColor(),
                        c.getIcon()
                )).toList();
    }

    // Quản lý lịch trình
    public ScheduleResponse createSchedule(String userSso, CreateScheduleRequest request) {
        requireUserSso(userSso);
        if (request.title() == null || request.title().isBlank()) {
            throw new BadRequestException(MessageConstants.MESSAGE_SCHEDULE_TITLE_REQUIRED);
        }

        if (request.categoryId() != null) {
            ScheduleCategory category = scheduleCategoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_SCHEDULE_CATEGORY_INVALID, request.categoryId()));

            if (!category.getUserSso().equals(userSso)) {
                throw new BadRequestException(MessageConstants.MESSAGE_PERMISSION_DENIED);
            }
        }

        Schedule schedule = Schedule.builder()
                .userSso(userSso)
                .categoryId(request.categoryId())
                .title(request.title().trim())
                .description(request.description())
                .startTime(request.startTime())
                .endTime(request.endTime())
                .isAllDay(Boolean.TRUE.equals(request.isAllDay()))
                .location(request.location())
                .status(ScheduleStatus.CONFIRMED.name())
                .build();

        Schedule saved = scheduleRepository.save(schedule);
        return toScheduleResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ScheduleResponse> getMySchedules(String userSso) {
        requireUserSso(userSso);
        return scheduleRepository.findByUserSsoAndDeletedAtIsNull(userSso).stream()
                .map(this::toScheduleResponse)
                .toList();
    }

    /**
     * Thêm / tóm tắt lịch bằng ngôn ngữ tự nhiên (Ollama).
     */
    public ScheduleAssistResponse assistWithPrompt(String userSso, ScheduleAssistRequest request) {
        requireUserSso(userSso);
        if (request == null || request.prompt() == null || request.prompt().isBlank()) {
            throw new BadRequestException(MessageConstants.MESSAGE_SCHEDULE_TITLE_REQUIRED);
        }

        String prompt = request.prompt().trim();
        List<ScheduleResponse> schedules = getMySchedules(userSso);
        String context = buildScheduleContext(schedules);

        try {
            String raw = ollamaAiService.assistCalendar(context, prompt, Instant.now().toString());
            JsonNode root = parseJsonObject(raw);
            if (root == null) {
                return new ScheduleAssistResponse(
                        "Tôi đã nhận yêu cầu nhưng chưa đọc được cấu trúc trả lời. Bạn thử lại với định dạng: \"Thêm sự kiện họp nhóm ngày mai 9h–10h\".",
                        null);
            }

            String action = textOr(root, "action", "NONE");
            String reply = textOr(root, "reply", "Đã xử lý yêu cầu lịch của bạn.");
            ScheduleResponse created = null;

            if ("CREATE".equalsIgnoreCase(action) && root.has("event") && !root.get("event").isNull()) {
                JsonNode event = root.get("event");
                String title = textOr(event, "title", null);
                Instant start = parseInstant(textOr(event, "startTime", null));
                Instant end = parseInstant(textOr(event, "endTime", null));
                String description = textOr(event, "description", "Created by Together AI");

                if (title != null && !title.isBlank() && start != null) {
                    if (end == null || !end.isAfter(start)) {
                        end = start.plusSeconds(3600);
                    }
                    created = createSchedule(userSso, new CreateScheduleRequest(
                            null, title.trim(), description, start, end, false, null));
                    if (reply == null || reply.isBlank()) {
                        reply = "Đã thêm \"" + created.title() + "\" vào lịch của bạn.";
                    }
                }
            }

            return new ScheduleAssistResponse(reply, created);
        } catch (Exception e) {
            log.error("Calendar AI assist failed", e);
            // Fallback nhẹ: nếu user nói thêm sự kiện nhưng AI lỗi
            return new ScheduleAssistResponse(
                    "Hiện AI lịch đang gặp sự cố. Bạn vẫn có thể thêm thủ công bằng nút \"+ Add Event\", "
                            + "hoặc thử lại: \"Thêm họp nhóm ngày mai 14:00–15:00\".",
                    null);
        }
    }

    /** Chuỗi ngữ cảnh lịch để inject vào Together AI chat. */
    @Transactional(readOnly = true)
    public String buildScheduleContextForUser(String userSso) {
        requireUserSso(userSso);
        return buildScheduleContext(getMySchedules(userSso));
    }

    public void deleteSchedule(String userSso, Long scheduleId) {
        requireUserSso(userSso);
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_SCHEDULE_INVALID, scheduleId));

        if (!schedule.getUserSso().equals(userSso)) {
            throw new BadRequestException(MessageConstants.MESSAGE_PERMISSION_DENIED);
        }

        schedule.setDeletedAt(Instant.now());
        scheduleRepository.save(schedule);
    }

    private String buildScheduleContext(List<ScheduleResponse> schedules) {
        if (schedules == null || schedules.isEmpty()) {
            return "(Chưa có sự kiện nào trên lịch)";
        }
        Instant from = Instant.now().minusSeconds(3L * 24 * 3600);
        Instant to = Instant.now().plusSeconds(14L * 24 * 3600);
        return schedules.stream()
                .filter(s -> s.startTime() == null || (!s.startTime().isBefore(from) && !s.startTime().isAfter(to)))
                .sorted(Comparator.comparing(ScheduleResponse::startTime, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(s -> String.format("- %s | %s → %s | %s",
                        s.title(),
                        s.startTime() != null ? s.startTime() : "?",
                        s.endTime() != null ? s.endTime() : "?",
                        s.description() != null ? s.description() : ""))
                .collect(Collectors.joining("\n"));
    }

    private JsonNode parseJsonObject(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            String clean = raw.replace("```json", "").replace("```", "").trim();
            int start = clean.indexOf('{');
            int end = clean.lastIndexOf('}');
            if (start < 0 || end <= start) {
                return null;
            }
            return objectMapper.readTree(clean.substring(start, end + 1));
        } catch (Exception e) {
            log.warn("Failed to parse calendar assist JSON: {}", e.getMessage());
            return null;
        }
    }

    private Instant parseInstant(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Instant.parse(value.trim());
        } catch (Exception ignored) {
            try {
                return java.time.OffsetDateTime.parse(value.trim()).toInstant();
            } catch (Exception e) {
                return null;
            }
        }
    }

    private String textOr(JsonNode node, String field, String fallback) {
        if (node == null || !node.has(field) || node.get(field).isNull()) {
            return fallback;
        }
        String v = node.get(field).asText();
        return v != null && !v.isBlank() ? v : fallback;
    }

    private void requireUserSso(String userSso) {
        if (userSso == null || userSso.isBlank()) {
            throw new BadRequestException(MessageConstants.MESSAGE_NOT_AUTHENTICATED);
        }
    }

    private ScheduleResponse toScheduleResponse(Schedule schedule) {
        return new ScheduleResponse(
                schedule.getScheduleId(),
                schedule.getTitle(),
                schedule.getDescription(),
                schedule.getStartTime(),
                schedule.getEndTime(),
                schedule.getIsAllDay(),
                schedule.getLocation(),
                schedule.getCategoryId()
        );
    }
}
