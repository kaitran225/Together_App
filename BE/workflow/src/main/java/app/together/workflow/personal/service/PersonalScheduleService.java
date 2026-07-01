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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class PersonalScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final ScheduleCategoryRepository scheduleCategoryRepository;

    // Quản lý lịch
    public CategoryResponse createCategory(String userSso, CreateCategoryRequest reqeust){
        requireUserSso(userSso);
        if(reqeust.name() == null || reqeust.name().isBlank()){
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
    public List<CategoryResponse> getMyCategories(String userSso){
        requireUserSso(userSso);
        return scheduleCategoryRepository.findByUserSso(userSso).stream()
                .map(c -> new CategoryResponse(
                        c.getCategoryId(),
                        c.getName(),
                        c.getColor(),
                        c.getIcon()
                )).toList();
    }

    // Quản lý lịch trình
    public ScheduleResponse createSchedule(String userSso, CreateScheduleRequest request){
        requireUserSso(userSso);
        if(request.title() == null || request.title().isBlank()){
            throw new BadRequestException(MessageConstants.MESSAGE_SCHEDULE_TITLE_REQUIRED);
        }

        if(request.categoryId() != null){
            ScheduleCategory category = scheduleCategoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_SCHEDULE_CATEGORY_INVALID, request.categoryId()));

            if(!category.getUserSso().equals(userSso)){
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
    public List<ScheduleResponse> getMySchedules(String userSso){
        requireUserSso(userSso);
        return scheduleRepository.findByUserSsoAndDeletedAtIsNull(userSso).stream()
                .map(this::toScheduleResponse)
                .toList();
    }

    public void deleteSchedule(String userSso, Long scheduleId){
        requireUserSso(userSso);
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_SCHEDULE_INVALID, scheduleId));

        if(!schedule.getUserSso().equals(userSso)){
            throw new BadRequestException(MessageConstants.MESSAGE_PERMISSION_DENIED);
        }

        schedule.setDeletedAt(Instant.now());
        scheduleRepository.save(schedule);

    }

    private void requireUserSso(String userSso) {
        if (userSso == null || userSso.isBlank()) {
            throw new BadRequestException(MessageConstants.MESSAGE_NOT_AUTHENTICATED);
        }
    }

    private ScheduleResponse toScheduleResponse(Schedule schedule){
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
