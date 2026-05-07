package com.project.exe.common.ai;

import com.project.exe.common.constant.ErrorCodes;
import com.project.exe.common.exception.BadRequestException;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnMissingBean(AiClient.class)
public class NoOpAiClient implements AiClient {

    @Override
    public String generateText(String userPrompt) {
        throw new BadRequestException("AI is not configured. Set ai.provider and ai.api-key.", ErrorCodes.AI_SERVICE_ERROR);
    }

    @Override
    public String generateText(String systemPrompt, String userPrompt) {
        return generateText(userPrompt);
    }
}
