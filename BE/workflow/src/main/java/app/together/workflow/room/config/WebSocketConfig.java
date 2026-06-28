package app.together.workflow.room.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${app.websocket.allowed-origins:http://localhost:3000,http://localhost:5173}")
    private String allowedOrigins;


    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.setApplicationDestinationPrefixes("/app");
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] origins = allowedOrigins.split(",");
        registry.addEndpoint("/ws").setAllowedOriginPatterns(origins);
        registry.addEndpoint("/ws").setAllowedOriginPatterns(origins).withSockJS();
    }

    // Đưa khai báo @Bean lên trước để dễ nhìn
    @Bean
    public TopicSubscriptionInterceptor topicSubscriptionInterceptor() {
        return new TopicSubscriptionInterceptor();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Gọi TRỰC TIẾP hàm @Bean thay vì dùng biến @Autowired
        registration.interceptors(topicSubscriptionInterceptor());
    }
}