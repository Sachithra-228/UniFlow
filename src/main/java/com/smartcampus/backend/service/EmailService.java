package com.smartcampus.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {
    // SMTP sender used for invitation and admin notifications.
    // NOTE: keep this service lightweight; failures are surfaced to invite flows.

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:no-reply@smartcampus.local}")
    private String fromAddress;

    @Value("${app.admin.notification-email:}")
    private String adminNotificationEmail;

    @Value("${spring.mail.host:}")
    private String mailHost;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendInvitationEmail(String inviteeEmail, String inviteeName, String activationLink) {
        String subject = "Smart Campus Account Invitation";
        String text = "Hello " + inviteeName + ",\n\n"
                + "Your account has been created in Smart Campus Operations Hub.\n"
                + "Activate your account using the link below:\n"
                + activationLink + "\n\n"
                + "If you did not expect this, contact your administrator.";

        sendEmail(inviteeEmail, subject, text);
    }

    public void notifyAdminAboutLinkRequest(String googleEmail, String displayName) {
        if (adminNotificationEmail == null || adminNotificationEmail.isBlank()) {
            log.warn("Admin notification email not configured; skipped link-request notification for {}", googleEmail);
            return;
        }

        String subject = "Smart Campus: New Google account link request";
        String text = "A Google account link request needs approval.\n\n"
                + "Google Email: " + googleEmail + "\n"
                + "Display Name: " + (displayName == null ? "" : displayName) + "\n\n"
                + "Review it in the admin link-request endpoint.";

        sendEmail(adminNotificationEmail, subject, text);
    }

    private void sendEmail(String to, String subject, String text) {
        if (mailHost == null || mailHost.isBlank()) {
            throw new IllegalStateException("MAIL_HOST is not configured. Set SMTP environment variables to enable email sending.");
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);

        try {
            mailSender.send(message);
        } catch (Exception ex) {
            log.error("Failed to send email to {} using host {}", to, mailHost, ex);
            throw ex;
        }
    }
}
