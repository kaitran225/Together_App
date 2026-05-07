package com.project.exe.common.ai;

public interface AiClient {

    String generateText(String userPrompt);

    String generateText(String systemPrompt, String userPrompt);
}
