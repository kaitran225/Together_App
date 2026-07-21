package app.together.workflow.room.config;

import app.together.common.workflow.enums.RoomType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.room.media")
public record RoomMediaProperties(
        @NotNull Profile social,
        @NotNull Profile team
) {

    public Profile profileFor(RoomType roomType) {
        if (RoomType.TEAM.equals(roomType)) {
            return team;
        }
        return social;
    }

    public record Profile(
            @NotNull Boolean audioEnabled,
            @NotNull Boolean videoEnabled,
            @NotNull Boolean chatEnabled,
            @NotNull Boolean micEnabled,
            @NotBlank String videoResolution,
            @NotNull Integer defaultMaxMembers
    ) {
    }
}
