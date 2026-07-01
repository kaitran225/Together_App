package app.together.workflow.personal.controller;

import app.together.common.shared.dto.ApiResponse;
import app.together.common.shared.util.SecurityUtils;
import app.together.workflow.personal.dto.PersonalScheduleDtos.*;
import app.together.workflow.personal.service.PersonalScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/workflow/personal/schedules")
@RequiredArgsConstructor
public class PersonalScheduleController {

    private final PersonalScheduleService personalScheduleService;

    @PostMapping("/categories")
    public ApiResponse<CategoryResponse> createCategory(@RequestBody CreateCategoryRequest request){
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(personalScheduleService.createCategory(currentUserSso, request));
    }

    @GetMapping("/categories")
    public ApiResponse<List<CategoryResponse>> getMyCategories(){
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(personalScheduleService.getMyCategories(currentUserSso));
    }

    @PostMapping
    public ApiResponse<ScheduleResponse> createSchedule(@RequestBody CreateScheduleRequest request){
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(personalScheduleService.createSchedule(currentUserSso, request));
    }

    @GetMapping
    public ApiResponse<List<ScheduleResponse>> getMySchedules(){
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(personalScheduleService.getMySchedules(currentUserSso));
    }

    @DeleteMapping("/{scheduleId}")
    public ApiResponse<Void> deleteSchedule(@PathVariable Long scheduleId){
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        personalScheduleService.deleteSchedule(currentUserSso, scheduleId);
        return ApiResponse.ok(null);
    }
}
