package app.together.common.ai.api;

import java.util.List;

public record AiActionDescriptor(String actionType, String description, List<String> tools) {
}
