package app.together.common.auth.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record UserMetadata(
        List<String> skills,
        List<String> learningGoals
) {
}
