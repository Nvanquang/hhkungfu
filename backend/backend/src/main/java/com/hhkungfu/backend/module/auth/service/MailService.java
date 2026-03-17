package com.hhkungfu.backend.module.auth.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import com.hhkungfu.backend.module.user.entity.User;

import java.nio.charset.StandardCharsets;

@Slf4j
@Service
public class MailService {

    @Value("${spring.application.client-app-url:http://localhost:5173}")
    private String baseUrl;

    private final JavaMailSender javaMailSender;
    private final SpringTemplateEngine templateEngine;

    public MailService(JavaMailSender javaMailSender, SpringTemplateEngine templateEngine) {
        this.javaMailSender = javaMailSender;
        this.templateEngine = templateEngine;
    }

    @Async
    public void sendOtpEmail(User user, String otpCode, String titleKey) {
        if (user.getEmail() == null) {
            log.debug("Email doesn't exist for user '{}'", user.getId());
            return;
        }

        Context context = new Context();
        context.setVariable("user", user);
        context.setVariable("otpCode", otpCode);
        context.setVariable("baseUrl", baseUrl);

        String content = templateEngine.process("mail/otpEmail", context);

        try {
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper message = new MimeMessageHelper(mimeMessage, false, StandardCharsets.UTF_8.name());
            message.setTo(user.getEmail());
            message.setFrom("no-reply@hhkungfu.com");
            message.setSubject(titleKey);
            message.setText(content, true);
            javaMailSender.send(mimeMessage);
            log.debug("Sent email to User '{}'", user.getEmail());
        } catch (MessagingException e) {
            log.warn("Email could not be sent to user '{}'", user.getEmail(), e);
        }
    }
}
