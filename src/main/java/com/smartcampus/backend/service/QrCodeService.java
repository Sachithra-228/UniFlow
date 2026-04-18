package com.smartcampus.backend.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;

@Service
public class QrCodeService {

    public String generatePngDataUri(String payload, int width, int height) {
        if (payload == null || payload.isBlank()) {
            throw new IllegalArgumentException("QR payload is required");
        }

        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix matrix = qrCodeWriter.encode(payload, BarcodeFormat.QR_CODE, width, height);
            BufferedImage image = MatrixToImageWriter.toBufferedImage(matrix);

            try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
                ImageIO.write(image, "PNG", outputStream);
                String encoded = Base64.getEncoder().encodeToString(outputStream.toByteArray());
                return "data:image/png;base64," + encoded;
            }
        } catch (WriterException | IOException ex) {
            throw new IllegalStateException("Failed to generate QR code image", ex);
        }
    }
}
