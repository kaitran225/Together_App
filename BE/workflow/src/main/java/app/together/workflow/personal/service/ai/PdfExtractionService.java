package app.together.workflow.personal.service.ai;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;

/**
 * Service trích xuất text từ các file tài liệu (PDF).
 * Sử dụng Apache PDFBox để đọc nội dung chữ từ file PDF.
 */
@Slf4j
@Service
public class PdfExtractionService {

    private static final int MAX_PAGES_PER_EXTRACTION = 200;

    /**
     * Trích xuất toàn bộ text từ một file PDF.
     *
     * @param filePath Đường dẫn tuyệt đối tới file PDF trên server
     * @return Nội dung text đã trích xuất
     */
    public ExtractionResult extractTextFromPdf(String filePath) {
        File file = new File(filePath);
        if (!file.exists()) {
            throw new IllegalArgumentException("File không tồn tại: " + filePath);
        }

        try (PDDocument document = Loader.loadPDF(file)) {
            int totalPages = document.getNumberOfPages();
            log.info("Bắt đầu trích xuất text từ file PDF: {} ({} trang)", file.getName(), totalPages);

            PDFTextStripper stripper = new PDFTextStripper();
            // Giới hạn số trang để tránh OOM với file quá lớn
            if (totalPages > MAX_PAGES_PER_EXTRACTION) {
                stripper.setEndPage(MAX_PAGES_PER_EXTRACTION);
                log.warn("File PDF có {} trang, chỉ trích xuất {} trang đầu tiên", totalPages, MAX_PAGES_PER_EXTRACTION);
            }

            String extractedText = stripper.getText(document);
            int wordCount = countWords(extractedText);

            log.info("Trích xuất thành công: {} ký tự, {} từ, {} trang từ file {}",
                    extractedText.length(), wordCount, totalPages, file.getName());

            return new ExtractionResult(extractedText, totalPages, wordCount);
        } catch (IOException e) {
            log.error("Lỗi khi đọc file PDF: {}", filePath, e);
            throw new RuntimeException("Không thể trích xuất text từ PDF: " + e.getMessage(), e);
        }
    }

    /**
     * Đếm số từ trong một đoạn text.
     */
    private int countWords(String text) {
        if (text == null || text.isBlank()) {
            return 0;
        }
        return text.trim().split("\\s+").length;
    }

    /**
     * Kết quả trích xuất chứa text, số trang và số từ.
     */
    public record ExtractionResult(
            String text,
            int pageCount,
            int wordCount
    ) {
    }
}
