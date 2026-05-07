package com.project.exe.common.ai;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "ai")
public class AiProperties {

    private String provider = "gemini";
    private String model = "gemini-2.0-flash";
    private String apiKey = "";
    private String baseUrl = "https://generativelanguage.googleapis.com";
    private boolean enabled = true;
}
