package app.together.workflow.room.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.exception.BadRequestException;
import app.together.common.workflow.entity.Room;
import app.together.common.workflow.entity.RoomRequest;
import app.together.common.workflow.enums.RoomRequestStatus;
import app.together.common.workflow.enums.RoomStatus;
import app.together.common.workflow.enums.RoomType;
import app.together.common.workflow.repository.RoomRepository;
import app.together.common.workflow.repository.RoomRequestRepository;
import app.together.workflow.room.dto.RoomDtos.CreateRoomRequest;
import app.together.workflow.room.dto.RoomDtos.RoomResponse;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class RoomMatchingService {

    private final RoomRepository roomRepository;
    private final RoomRequestRepository roomRequestRepository;
    private final RoomService roomService;

    public RoomResponse matchOrCreateRoom(String userSso, CreateRoomRequest request) {
        if (request == null || request.goalDescription() == null || request.goalDescription().isBlank()) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_REQUEST_GOAL_REQUIRED);
        }

        // 1. Tạo và lưu phiếu yêu cầu tìm kiếm
        RoomRequest roomRequest = RoomRequest.builder()
                .userSso(userSso)
                .roomType(RoomType.SOCIAL)
                .goalDescription(request.goalDescription().trim())
                .goalDurationDays(request.goalDurationDays() == null ? 1 : request.goalDurationDays())
                .preferredSize(request.maxMembers() == null ? 10 : request.maxMembers())
                .status(RoomRequestStatus.PENDING.name())
                .expiresAt(Instant.now().plus(15, ChronoUnit.MINUTES)) // Phiếu ghép hết hạn sau 15 phút
                .build();
        roomRequestRepository.save(roomRequest);

        // 2. Tìm kiếm phòng học phù hợp đang hoạt động
        Optional<Room> matchedRoomOpt = findSuitableRoom(roomRequest);

        if (matchedRoomOpt.isPresent()) {
            Room matchedRoom = matchedRoomOpt.get();
            // Cập nhật trạng thái phiếu ghép phòng
            roomRequest.setStatus(RoomRequestStatus.MATCHED.name());
            roomRequest.setMatchedRoomId(matchedRoom.getRoomId());
            roomRequest.setMatchedAt(Instant.now());
            roomRequestRepository.save(roomRequest);

            // Tự động cho User tham gia phòng này
            return roomService.joinRoom(matchedRoom.getRoomId(), userSso, null);
        } else {
            // Không tìm thấy phòng nào phù hợp -> Tự động khởi tạo một phòng Social mới
            RoomResponse newRoom = roomService.createRoom(userSso, request);

            roomRequest.setStatus(RoomRequestStatus.MATCHED.name());
            roomRequest.setMatchedRoomId(newRoom.roomId());
            roomRequest.setMatchedAt(Instant.now());
            roomRequestRepository.save(roomRequest);

            return newRoom;
        }
    }

    private Optional<Room> findSuitableRoom(RoomRequest request) {
        // Tìm toàn bộ danh sách phòng Social đang mở và còn hoạt động
        List<Room> activeRooms = roomRepository.findByStatusAndRoomTypeAndDeletedAtIsNull(
                RoomStatus.OPEN.name(), RoomType.SOCIAL
        );

        return activeRooms.stream()
                .filter(room -> room.getInviteCode() == null) // Chỉ cho phép ghép vào các phòng Public không có mã mời
                .filter(room -> {
                    // Kiểm tra độ tương thích sơ bộ về mô tả mục tiêu học tập
                    String roomTitle = room.getTitle().toLowerCase();
                    String roomDesc = room.getDescription() != null ? room.getDescription().toLowerCase() : "";
                    String reqGoal = request.getGoalDescription().toLowerCase();
                    return roomTitle.contains(reqGoal) || roomDesc.contains(reqGoal) || reqGoal.contains(roomTitle);
                })
                .findFirst();
    }
}
