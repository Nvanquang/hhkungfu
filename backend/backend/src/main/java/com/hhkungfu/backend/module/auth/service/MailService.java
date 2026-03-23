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

import com.hhkungfu.backend.module.auth.dto.OtpEmailPayload;

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

    public void sendOtpEmailAsync(OtpEmailPayload payload) {
        if (payload.getEmail() == null) {
            log.debug("Email doesn't exist for user '{}'", payload.getEmail());
            return;
        }

        Context context = new Context();
        context.setVariable("username", payload.getUsername());
        context.setVariable("otpCode", payload.getOtp());
        context.setVariable("baseUrl", baseUrl);

        String content = templateEngine.process("mail/otpEmail", context);

        try {
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper message = new MimeMessageHelper(mimeMessage, false, StandardCharsets.UTF_8.name());
            message.setTo(payload.getEmail());
            message.setFrom("no-reply@hhkungfu.com");
            message.setSubject(payload.getTitleKey());
            message.setText(content, true);
            javaMailSender.send(mimeMessage);
            log.debug("Sent email to User '{}'", payload.getEmail());
        } catch (MessagingException e) {
            log.warn("Email could not be sent to user '{}'", payload.getEmail(), e);
        }
    }

    @Async
    public void sendOtpEmail(OtpEmailPayload payload) {
        log.debug("Sending activation email to '{}'", payload.getEmail());
        this.sendOtpEmailAsync(payload);
    }
}
