package app.together.workflow.team.service;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.exception.BadRequestException;
import app.together.common.shared.exception.ForbiddenException;
import app.together.common.shared.exception.ResourceNotFoundException;
import app.together.common.shared.security.Permission;
import app.together.common.shared.security.PermissionCheckService;
import app.together.common.workflow.entity.Project;
import app.together.common.workflow.entity.TeamMember;
import app.together.common.workflow.entity.TeamMemberId;
import app.together.common.workflow.enums.ProjectStatus;
import app.together.common.workflow.repository.ProjectRepository;
import app.together.common.workflow.repository.TeamMemberRepository;
import app.together.common.workflow.repository.TeamRepository;
import app.together.workflow.team.dto.ProjectDtos.CreateProjectRequest;
import app.together.workflow.team.dto.ProjectDtos.ProjectResponse;
import app.together.workflow.team.dto.ProjectDtos.UpdateProjectRequest;
import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class ProjectsService {

    private final ProjectRepository projectRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TeamRepository teamRepository;
    private final ScrumBoardService scrumBoardService;
    private final PermissionCheckService permissionCheckService;

    /*
     * tạo dự án
     * - kiểm tra team có tồn tại
     * - kiểm tra user có quyền truy cập
     * - kiểm tra tên dự án có tồn tại
     * - tạo dự án
     * - khởi tạo scrum board
     * - trả về dự án
     * Todo: sau này thêm điều kiện cho user Free và có mua gói PRO để tạo
     * dự án
     * - sau này thêm điều kiện cho user Free và có mua gói PRO để tạo dự
     * án
     * - Free mua coin để tạo dự án (có giới hạn tạo dự án)
     */
    public ProjectResponse createProject(Long teamId, String userSso, CreateProjectRequest request) {
        teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_TEAM_NOT_FOUND, teamId));

        TeamMember teamMember = getActiveTeamMember(teamId, userSso);
        // kiểm tra quyền truy cập
        permissionCheckService.requireTeamRole(Permission.TEAM_EDIT, teamMember.getRole());

        if (request.name() == null || request.name().isBlank()) {
            throw new BadRequestException(MessageConstants.MESSAGE_PROJECT_NAME_REQUIRED);
        }

        Project project = Project.builder()
                .teamId(teamId)
                .name(request.name().trim())
                .description(request.description().trim())
                .status(ProjectStatus.PLANNING.name() != null ? ProjectStatus.PLANNING.name() : null)
                .startDate(request.startDate())
                .dueDate(request.dueDate())
                .build();
        project.setCreatedBy(userSso);
        project.setUpdatedBy(userSso);

        Project savedProject = projectRepository.save(project);

        scrumBoardService.initializeScrumBoard(savedProject.getProjectId());

        return toProjectResponse(savedProject);
    }

    /*
     * lấy danh sách dự án của 1 team
     * Yêu cầu quyền: TEAM_EDIT (Chỉ OWNER được chỉnh sửa)
     */

    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjectsByTeam(Long teamId, String userSso) {
        teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_TEAM_NOT_FOUND, teamId));

        TeamMember teamMember = getActiveTeamMember(teamId, userSso);

        permissionCheckService.requireTeamRole(Permission.WORKFLOW_READ, teamMember.getRole());

        return projectRepository.findByTeamId(teamId).stream()
                .filter(project -> project.getDeletedAt() == null) // bỏ qua dự án đã xóa mềm
                .map(this::toProjectResponse)
                .toList();
    }

    /*
     * lấy dự án theo id
     * Yêu cầu quyền: WORKFLOW_READ (Chấp nhận MEMBER và OWNER)
     */
    @Transactional(readOnly = true)
    public ProjectResponse getProjectById(Long projectId, String userSso) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        if (project.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Project", projectId);
        }

        TeamMember member = getActiveTeamMember(project.getTeamId(), userSso);
        permissionCheckService.requireTeamRole(Permission.WORKFLOW_READ, member.getRole());

        return toProjectResponse(project);
    }

    /*
     * cập nhật dự án
     * Yêu cầu quyền: TEAM_EDIT (Chỉ OWNER được chỉnh sửa)
     */
    public ProjectResponse updateProject(Long projectId, String userSso, UpdateProjectRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        if (project.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Project", projectId);
        }

        TeamMember member = getActiveTeamMember(project.getTeamId(), userSso);
        permissionCheckService.requireTeamRole(Permission.TEAM_EDIT, member.getRole());

        if (request.name() != null && !request.name().isBlank()) {
            project.setName(request.name().trim());
        }
        project.setDescription(request.description() != null ? request.description().trim() : project.getDescription());
        project.setStartDate(request.startDate() != null ? request.startDate() : project.getStartDate());
        project.setDueDate(request.dueDate() != null ? request.dueDate() : project.getDueDate());

        // Nghiệp vụ hoàn thành dự án
        if (request.status() != null) {
            project.setStatus(request.status().trim().toUpperCase());
            if (ProjectStatus.COMPLETED.name().equalsIgnoreCase(request.status().trim())) {
                project.setCompletedAt(Instant.now());
            } else {
                project.setCompletedAt(null);
            }
        }
        project.setUpdatedBy(userSso);

        return toProjectResponse(projectRepository.save(project));
    }

    /*
     * xóa dự án
     * Yêu cầu quyền: TEAM_DELETE (Chỉ OWNER mới được xóa dự án của nhóm)
     */
    public void deleteProject(Long projectId, String userSso) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        if (project.getDeletedAt() != null) {
            return; // Đã xóa từ trước
        }

        TeamMember member = getActiveTeamMember(project.getTeamId(), userSso);
        permissionCheckService.requireTeamRole(Permission.TEAM_DELETE, member.getRole());

        project.setDeletedAt(Instant.now());
        project.setUpdatedBy(userSso);
        projectRepository.save(project);
    }

    // lấy team member hoạt động
    public TeamMember getActiveTeamMember(Long teamId, String userSso) {
        if (userSso == null || userSso.isBlank()) {
            throw new ForbiddenException(MessageConstants.MESSAGE_PERMISSION_DENIED);
        }
        return teamMemberRepository.findById(new TeamMemberId(teamId, userSso))
                .filter(m -> m.getLeftAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException(
                        MessageConstants.MESSAGE_TEAM_MEMBER_NOT_FOUND,
                        new TeamMemberId(teamId, userSso)));
    }

    public ProjectResponse toProjectResponse(Project project) {
        return new ProjectResponse(
                project.getProjectId(),
                project.getTeamId(),
                project.getName(),
                project.getDescription(),
                project.getStatus(),
                project.getStartDate(),
                project.getDueDate(),
                project.getCompletedAt());
    }
}
