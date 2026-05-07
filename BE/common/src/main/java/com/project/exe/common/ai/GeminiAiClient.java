package com.project.exe.common.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.exe.common.constant.ErrorCodes;
import com.project.exe.common.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "ai.provider", havingValue = "gemini")
public class GeminiAiClient implements AiClient {

    private final AiProperties properties;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String generateText(String userPrompt) {
        return generateText(null, userPrompt);
    }

    @Override
    public String generateText(String systemPrompt, String userPrompt) {
        if (!properties.isEnabled() || userPrompt == null || userPrompt.isBlank()) {
            throw new BadRequestException("AI prompt is required", ErrorCodes.BAD_REQUEST);
        }
        String url = properties.getBaseUrl() + "/v1beta/models/" + properties.getModel() + ":generateContent?key=" + properties.getApiKey();
        Map<String, Object> body = buildRequestBody(systemPrompt, userPrompt);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            return parseTextFromResponse(response.getBody());
        } catch (Exception e) {
            log.warn("Gemini AI call failed: {}", e.getMessage());
            throw new BadRequestException("AI service temporarily unavailable", ErrorCodes.AI_SERVICE_ERROR);
        }
    }

    private Map<String, Object> buildRequestBody(String systemPrompt, String userPrompt) {
        Map<String, Object> part = Map.of("text", userPrompt);
        Map<String, Object> content = Map.of(
            "role", "user",
            "parts", List.of(part)
        );
        Map<String, Object> body = new java.util.HashMap<>(Map.of("contents", List.of(content)));
        if (systemPrompt != null && !systemPrompt.isBlank()) {
            body.put("systemInstruction", Map.of("parts", List.of(Map.of("text", systemPrompt))));
        }
        return body;
    }

    private String parseTextFromResponse(String json) {
        try {
            JsonNode root = objectMapper.readTree(json);
            JsonNode candidates = root.path("candidates");
            if (candidates.isEmpty() || !candidates.get(0).has("content")) return "";
            JsonNode content = candidates.get(0).path("content").path("parts");
            if (content.isEmpty()) return "";
            return content.get(0).path("text").asText("");
        } catch (Exception e) {
            log.debug("Parse Gemini response failed: {}", e.getMessage());
            return "";
        }
    }
}
