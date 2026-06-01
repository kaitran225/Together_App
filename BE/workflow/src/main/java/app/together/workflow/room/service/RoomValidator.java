package app.together.workflow.room.service;

import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.exception.BadRequestException;
import app.together.common.shared.exception.ForbiddenException;
import app.together.common.workflow.enums.RoomType;
import app.together.common.workflow.repository.UserRoomSlotRepository;
import app.together.workflow.room.dto.RoomDtos.CreateRoomRequest;
import app.together.workflow.room.dto.RoomDtos.RoomMemberActionRequest;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;


import java.util.Locale;

@Component
@RequiredArgsConstructor
public class RoomValidator {

    private final UserRoomSlotRepository userRoomSlotRepository;

    @Value("${app.room.media.social.default-members:10}")
    private int minimumSlots;

    public void validateCreateRoomRequest(String userSso, CreateRoomRequest request) {
        if (userSso == null || userSso.isBlank()) {
            throw new ForbiddenException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
        if (request == null) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
        if (request.title() == null || request.title().isBlank()) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
    }

    public void validateRoomAction(Long roomId, String userSso) {
        if (roomId == null) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
        if (userSso == null || userSso.isBlank()) {
            throw new ForbiddenException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
    }

    public String validateTargetUserSso(RoomMemberActionRequest request) {
        if (request == null || request.targetUserSso() == null || request.targetUserSso().isBlank()) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
        return request.targetUserSso().trim();
    }

    public RoomType resolveRoomType(CreateRoomRequest request) {
        if (request == null || request.roomType() == null || request.roomType().isBlank()) {
            return RoomType.SOCIAL;
        }

        try {
            return RoomType.valueOf(request.roomType().trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
    }

    public void validateAndReserveSlot(String userSso) {
        app.together.common.workflow.entity.UserRoomSlot slot = userRoomSlotRepository.findById(userSso)
                .orElseGet(() -> userRoomSlotRepository.save(app.together.common.workflow.entity.UserRoomSlot.builder()
                        .userSso(userSso)
                        .totalSlots(3) // Mặc định gói FREE được tạo tối đa 3 phòng
                        .usedSlots(minimumSlots)
                        .build()));

        if (slot.getUsedSlots() >= slot.getTotalSlots()) {
            throw new BadRequestException("Bạn đã dùng hết giới hạn số lượng phòng có thể tạo cùng lúc.");
        }

        slot.setUsedSlots(slot.getUsedSlots() + 1);
        userRoomSlotRepository.save(slot);
    }

    public void releaseSlot(String userSso) {
        userRoomSlotRepository.findById(userSso).ifPresent(slot -> {
            if (slot.getUsedSlots() > 0) {
                slot.setUsedSlots(slot.getUsedSlots() - 1);
                userRoomSlotRepository.save(slot);
            }
        });
    }

    // public void ValidateUserSlot(String userSso) {
    //     UserRoomSlot slot = userRoomSlotRepository.findById(userSso)
    //             .orElseThrow(() -> new BadRequestException(MessageConstants.MESSAGE_USER_ROOM_SLOT_NOT_FOUND));
    //     if(slot.getUsedSlots() >= slot.getTotalSlots()){
    //         throw new BadRequestException(MessageConstants.MESSAGE_USER_ROOM_SLOT_INVALID);
    //     }

    // }

}
