package app.together.workflow.team.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import app.together.common.shared.dto.ApiResponse;
import app.together.common.shared.util.SecurityUtils;
import app.together.workflow.team.dto.ProjectDtos.CreateProjectRequest;
import app.together.workflow.team.dto.ProjectDtos.ProjectResponse;
import app.together.workflow.team.dto.ProjectDtos.UpdateProjectRequest;
import app.together.workflow.team.service.ProjectsService;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequestMapping("/api/v1/workflow")
@RequiredArgsConstructor
public class ProjectController {
    
    private final ProjectsService projectsService;

    @PostMapping("/teams/{teamId}/projects")
    public ApiResponse<ProjectResponse> createProject(
        @PathVariable Long teamId,
        @RequestBody CreateProjectRequest request
    ){
        String currentUserSso = SecurityUtils.getCurrentUserSsoOrNull();
        return ApiResponse.ok(projectsService.createProject(teamId, currentUserSso, request));
    }

    @GetMapping("/teams/{teamId}/projects")
    public ApiResponse<List<ProjectResponse>> getProjectsByTeam(
        @PathVariable Long teamId
    ){
        String currentUserSso = SecurityUtils.getCurrentUserSsoOrNull();
        return ApiResponse.ok(projectsService.getProjectsByTeam(teamId, currentUserSso));
    }
    
    @GetMapping("/projects/{projectId}")
    public ApiResponse<ProjectResponse> getProject(@PathVariable Long projectId) {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(projectsService.getProjectById(projectId, currentUserSso));
    }

    @PutMapping("/projects/{projectId}")
    public ApiResponse<ProjectResponse> updateProject(
            @PathVariable Long projectId,
            @RequestBody UpdateProjectRequest request) {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(projectsService.updateProject(projectId, currentUserSso, request));
    }

    @DeleteMapping("/projects/{projectId}")
    public ApiResponse<Void> deleteProject(@PathVariable Long projectId) {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        projectsService.deleteProject(projectId, currentUserSso);
        return ApiResponse.ok(null);
    }

    @GetMapping("/projects/{projectId}/export")
    public org.springframework.http.ResponseEntity<byte[]> exportProjectTasks(@PathVariable Long projectId) {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        byte[] csvData = projectsService.exportProjectTasksCsv(projectId, currentUserSso);

        String filename = "project_" + projectId + "_tasks.csv";
        return org.springframework.http.ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(org.springframework.http.MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvData);
    }
}
