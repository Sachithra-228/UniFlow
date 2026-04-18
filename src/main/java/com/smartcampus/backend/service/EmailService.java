package com.smartcampus.backend.service;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

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
        String html = buildInvitationHtml(inviteeName, activationLink);

        sendHtmlEmail(inviteeEmail, subject, html, text);
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

        sendPlainTextEmail(adminNotificationEmail, subject, text);
    }

    private void sendPlainTextEmail(String to, String subject, String text) {
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

    private void sendHtmlEmail(String to, String subject, String html, String plainTextFallback) {
        if (mailHost == null || mailHost.isBlank()) {
            throw new IllegalStateException("MAIL_HOST is not configured. Set SMTP environment variables to enable email sending.");
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(plainTextFallback, html);
            mailSender.send(mimeMessage);
        } catch (Exception ex) {
            log.error("Failed to send HTML email to {} using host {}", to, mailHost, ex);
            throw new RuntimeException("Unable to send invitation email", ex);
        }
    }

    private String buildInvitationHtml(String inviteeName, String activationLink) {
        String safeName = HtmlUtils.htmlEscape(inviteeName == null ? "there" : inviteeName);
        String safeLink = HtmlUtils.htmlEscape(activationLink);

        return "<!DOCTYPE html>"
                + "<html lang=\"en\">"
                + "<head>"
                + "<meta charset=\"UTF-8\" />"
                + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />"
                + "<title>Smart Campus Invitation</title>"
                + "</head>"
                + "<body style=\"margin:0;padding:0;background:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;\">"
                + "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"padding:28px 14px;\">"
                + "<tr><td align=\"center\">"
                + "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:640px;background:#ffffff;border:1px solid #dbe4f0;border-radius:14px;overflow:hidden;\">"
                + "<tr><td style=\"padding:20px 24px;background:linear-gradient(135deg,#0f2b6a,#153f99);\">"
                + "<p style=\"margin:0;font-size:12px;letter-spacing:0.18em;font-weight:700;color:#b9d6ff;\">UNIFLOW</p>"
                + "<h1 style=\"margin:10px 0 0;font-size:22px;line-height:1.35;color:#ffffff;\">Smart Campus Operations Hub</h1>"
                + "</td></tr>"
                + "<tr><td style=\"padding:26px 24px 10px;\">"
                + "<p style=\"margin:0 0 12px;font-size:15px;line-height:1.6;\">Hello <strong>" + safeName + "</strong>,</p>"
                + "<p style=\"margin:0 0 12px;font-size:15px;line-height:1.6;color:#334155;\">Your account has been created. Please activate your access to start using Smart Campus Operations Hub.</p>"
                + "<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin:20px 0 18px;\"><tr><td>"
                + "<a href=\"" + safeLink + "\" style=\"display:inline-block;padding:12px 20px;border-radius:10px;background:#1747b6;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;\">Activate Account</a>"
                + "</td></tr></table>"
                + "<p style=\"margin:0 0 8px;font-size:13px;line-height:1.6;color:#475569;\">If the button does not work, copy and paste this link into your browser:</p>"
                + "<p style=\"margin:0 0 16px;word-break:break-all;font-size:13px;line-height:1.6;\"><a href=\"" + safeLink + "\" style=\"color:#1747b6;text-decoration:underline;\">" + safeLink + "</a></p>"
                + "<p style=\"margin:0;font-size:13px;line-height:1.6;color:#475569;\">If you did not expect this invitation, contact your administrator.</p>"
                + "</td></tr>"
                + "<tr><td style=\"padding:14px 24px 22px;border-top:1px solid #e2e8f0;\">"
                + "<p style=\"margin:0;font-size:12px;line-height:1.5;color:#64748b;\">This is an automated email from Smart Campus Operations Hub. Please do not reply.</p>"
                + "</td></tr>"
                + "</table>"
                + "</td></tr>"
                + "</table>"
                + "</body>"
                + "</html>";
    }
}
