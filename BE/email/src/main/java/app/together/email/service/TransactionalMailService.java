package app.together.email.service;

import app.together.common.email.api.EmailDispatchType;
import app.together.common.email.api.TransactionalEmailRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionalMailService {

    private final JavaMailSender emailSender;

    @Value("${spring.mail.username}")
    private String fromAddress;

    public void send(TransactionalEmailRequest req) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(req.toEmail());

        String base = req.linkBaseUrl().replaceAll("/+$", "");

        if (req.type() == EmailDispatchType.VERIFY_ACCOUNT) {
            String link = base + "/verify-email?token=" + req.rawToken();
            log.info("=== LOCAL DEV: Verification link for {} is: {} ===", req.toEmail(), link);
            System.out.println("=== LOCAL DEV: Verification link for " + req.toEmail() + " is: " + link + " ===");
            message.setSubject("Xác thực tài khoản của bạn - exe");
            message.setText("Chào bạn,\n\n"
                    + "Bạn đã đăng ký tài khoản tại exe.\n"
                    + "Vui lòng nhấp vào đường link bên dưới để xác thực tài khoản:\n"
                    + link + "\n\n"
                    + "Nếu bạn không yêu cầu, vui lòng bỏ qua email này.");
        } else if (req.type() == EmailDispatchType.PASSWORD_RESET) {
            String link = base + "/reset-password?token=" + req.rawToken();
            log.info("=== LOCAL DEV: Reset Password link for {} is: {} ===", req.toEmail(), link);
            System.out.println("=== LOCAL DEV: Reset Password link for " + req.toEmail() + " is: " + link + " ===");
            message.setSubject("Đặt lại mật khẩu.");
            message.setText("Chào bạn,\n\n"
                    + "Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng nhấn vào đường link bên dưới:\n"
                    + link + "\n\n"
                    + "Đường link này sẽ hết hạn sau 1 giờ.\n"
                    + "Nếu bạn không yêu cầu, vui lòng bỏ qua email này.");
        } else {
            throw new IllegalArgumentException("Unsupported email type: " + req.type());
        }

        try {
            emailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send SMTP email to {}, link printed above", req.toEmail(), e);
        }
    }
}
