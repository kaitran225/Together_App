package app.together.workflow.room.service;

import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.exception.BadRequestException;
import app.together.common.workflow.entity.Room;
import app.together.common.workflow.enums.RoomStatus;
import app.together.common.workflow.repository.RoomRepository;
import app.together.workflow.room.config.RoomMediaProperties;
import app.together.workflow.room.dto.RoomDtos.IceServerResponse;
import app.together.workflow.room.dto.RoomDtos.RoomWebRtcConfigResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomWebRtcConfigService {

    private final RoomRepository roomRepository;
    private final RoomMediaProperties roomMediaProperties;

    @Value("${app.webrtc.stun-urls:stun:stun.l.google.com:19302}")
    private String stunUrls;

    @Value("${app.webrtc.turn-urls:}")
    private String turnUrls;

    @Value("${app.webrtc.turn-username:}")
    private String turnUsername;

    @Value("${app.webrtc.turn-credential:}")
    private String turnCredential;

    public RoomWebRtcConfigResponse getConfig(Long roomId) {
        if (roomId == null) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID));

        if (room.getDeletedAt() != null || RoomStatus.CLOSED.name().equals(room.getStatus())) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }

        RoomMediaProperties.Profile profile = roomMediaProperties.profileFor(room.getRoomType());
        return new RoomWebRtcConfigResponse(
                room.getRoomId(),
                room.getRoomType() == null ? null : room.getRoomType().name(),
                profile.audioEnabled(),
                profile.videoEnabled(),
                profile.chatEnabled(),
                profile.micEnabled(),
                room.getMaxMembers(),
                profile.videoResolution(),
                buildIceServers());
    }

    private List<IceServerResponse> buildIceServers() {
        List<IceServerResponse> servers = new ArrayList<>();
        if (stunUrls != null && !stunUrls.isBlank()) {
            servers.add(new IceServerResponse(parseUrls(stunUrls), null, null));
        }
        if (turnUrls != null && !turnUrls.isBlank()) {
            servers.add(new IceServerResponse(parseUrls(turnUrls), turnUsername, turnCredential));
        }
        return servers;
    }

    private List<String> parseUrls(String raw) {
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .toList();
    }
}
