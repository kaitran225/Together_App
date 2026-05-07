package com.project.exe.common.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender emailSender;

    @Value("${spring.mail.username}")
    private String mailSend;

    @Async
    public void sendResetPasswordEmail(String toEmail, String rawToken){
        String resetLink = "http://localhost:5173/reset-password?token=" + rawToken;

        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom(mailSend);
        message.setTo(toEmail);
        message.setSubject("Đặt lại mật khẩu.");
        message.setText("Chào bạn,\n\n" +
                "Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng nhấn vào đường link bên dưới để thực hiện:\n" +
                resetLink + "\n\n" +
                "Đường link này sẽ hết hạn sau 1 giờ.\n" +
                "Nếu bạn không yêu cầu, vui lòng bỏ qua email này.");

        emailSender.send(message);
    }

    @Async
    public void sendVerifycationEmail(String toEmail, String rawToken){
        // react link
        String verifycationLink = "http://localhost:5173/verify-email?token=" + rawToken;

        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom(mailSend);
        message.setTo(toEmail);
        message.setSubject("Xác thực tài khoản của bạn - exe");
        message.setText("Chào bạn,\n\n" +
                "Xin chào! Bạn đã đăng ký tài khoản tại exe.\n" +
                "Vui lòng nhấp vào đường link bên dưới để xác thực tài khoản của bạn:\n" +
                verifycationLink + "\n\n" +
                "Nếu bạn không yêu cầu, vui lòng bỏ qua email này.");

        emailSender.send(message);
    }
}
