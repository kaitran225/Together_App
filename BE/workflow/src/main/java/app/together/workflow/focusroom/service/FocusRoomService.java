package app.together.workflow.focusroom.service;

import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.exception.BadRequestException;
import app.together.common.shared.exception.ResourceNotFoundException;
import app.together.common.workflow.entity.FocusRoomTask;
import app.together.common.workflow.repository.FocusRoomTaskRepository;
import app.together.workflow.focusroom.dto.FocusRoomDtos.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FocusRoomService {

    private final FocusRoomTaskRepository taskRepository;

    @Transactional(readOnly = true)
    public List<FocusRoomTaskResponse> getTasksForUser(String userSso) {
        requireUserSso(userSso);
        return taskRepository.findByUserSsoOrderByDueDateAsc(userSso).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public FocusRoomTaskResponse createTask(String userSso, CreateFocusRoomTaskRequest request) {
        requireUserSso(userSso);
        FocusRoomTask task = FocusRoomTask.builder()
                .userSso(userSso)
                .title(request.title())
                .dueDate(request.dueDate())
                .isCompleted(false)
                .build();
        task = taskRepository.save(task);
        return toResponse(task);
    }

    @Transactional
    public FocusRoomTaskResponse updateTask(Long taskId, String userSso, UpdateFocusRoomTaskRequest request) {
        FocusRoomTask task = getOwnedTask(taskId, userSso);

        if (request.title() != null) {
            task.setTitle(request.title());
        }
        if (request.dueDate() != null) {
            task.setDueDate(request.dueDate());
        }
        if (request.isCompleted() != null) {
            task.setCompleted(request.isCompleted());
        }

        task = taskRepository.save(task);
        return toResponse(task);
    }

    @Transactional
    public void deleteTask(Long taskId, String userSso) {
        FocusRoomTask task = getOwnedTask(taskId, userSso);
        taskRepository.delete(task);
    }

    private FocusRoomTask getOwnedTask(Long taskId, String userSso) {
        requireUserSso(userSso);
        FocusRoomTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("FOCUS_ROOM_TASK_NOT_FOUND", taskId));

        if (!task.getUserSso().equals(userSso)) {
            throw new BadRequestException(MessageConstants.MESSAGE_PERMISSION_DENIED);
        }
        return task;
    }

    private void requireUserSso(String userSso) {
        if (userSso == null || userSso.isBlank()) {
            throw new BadRequestException(MessageConstants.MESSAGE_NOT_AUTHENTICATED);
        }
    }

    private FocusRoomTaskResponse toResponse(FocusRoomTask task) {
        return FocusRoomTaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .dueDate(task.getDueDate())
                .isCompleted(task.isCompleted())
                .build();
    }
}
