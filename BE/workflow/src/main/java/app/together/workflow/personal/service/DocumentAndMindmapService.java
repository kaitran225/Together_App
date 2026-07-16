package app.together.workflow.personal.service;

import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.exception.BadRequestException;
import app.together.common.shared.exception.ResourceNotFoundException;
import app.together.common.workflow.entity.Document;
import app.together.common.workflow.entity.Mindmap;
import app.together.common.workflow.enums.ProcessingStatus;
import app.together.common.workflow.repository.DocumentRepository;
import app.together.common.workflow.repository.MindmapRepository;
import app.together.workflow.payment.service.FeatureUsageService;
import app.together.workflow.personal.dto.DocumentAndMindmapDtos.*;
import app.together.workflow.personal.service.ai.DocumentProcessingWorker;
import app.together.workflow.personal.service.ai.OllamaAiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class DocumentAndMindmapService {

    private final DocumentRepository documentRepository;
    private final MindmapRepository mindmapRepository;
    private final DocumentProcessingWorker documentProcessingWorker;
    private final OllamaAiService ollamaAiService;
    private final FeatureUsageService featureUsageService;

    // Quản lý tài liệu
    public DocumentResponse uploadDocumentFile(String userSso, org.springframework.web.multipart.MultipartFile file, String title) throws java.io.IOException {
        requireUserSso(userSso);
        featureUsageService.chargeIfFree(userSso, "PDF_UPLOAD", 0);

        long fileSize = file.getSize();
        String originalFilename = file.getOriginalFilename();
        String contentType = file.getContentType();
        
        // Save file locally to a temp directory
        java.nio.file.Path tempFile = java.nio.file.Files.createTempFile("upload_", "_" + originalFilename);
        file.transferTo(tempFile.toFile());
        
        String actualTitle = title != null && !title.isEmpty() ? title : originalFilename;
        
        Document document = Document.builder()
                .userSso(userSso)
                .title(actualTitle)
                .filePath(tempFile.toAbsolutePath().toString())
                .fileName(originalFilename)
                .fileSize(fileSize)
                .fileType("PDF")
                .mimeType(contentType != null ? contentType : "application/pdf")
                .processingStatus(ProcessingStatus.PROCESSING.toString())
                .lastAccessedAt(Instant.now())
                .build();

        Document saved = documentRepository.save(document);

        // Kích hoạt xử lý bất đồng bộ: trích xuất text PDF + tạo Mindmap bằng AI
        if (isPdfFile(document.getMimeType()) || (originalFilename != null && originalFilename.toLowerCase().endsWith(".pdf"))) {
            log.info("File PDF detected, kích hoạt xử lý AI bất đồng bộ cho document ID: {}", saved.getDocumentId());
            documentProcessingWorker.processDocumentAsync(saved.getDocumentId());
        } else {
            log.warn("File không phải PDF ({}), chưa hỗ trợ trích xuất nội dung nên đánh dấu FAILED thay vì COMPLETED giả.", document.getMimeType());
            saved.setProcessingStatus(ProcessingStatus.FAILED.toString());
            documentRepository.save(saved);
        }

        return toDocumentResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> getMyDocuments(String userSso) {
        requireUserSso(userSso);
        return documentRepository.findByUserSsoAndDeletedAtIsNull(userSso).stream()
                .map(this::toDocumentResponse)
                .toList();
    }

    public void deleteDocument(Long documentId, String userSso) {
        requireUserSso(userSso);
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_DOCUMENT_NOT_FOUND, documentId));

        if (!document.getUserSso().equals(userSso)) {
            throw new BadRequestException(MessageConstants.MESSAGE_DELETE_DOCUMENT_NOT_ALLOWED);
        }

        document.setDeletedAt(Instant.now());
        documentRepository.save(document);
    }

    // Quản lý Mindmap
    public MindmapResponse saveMindmap(String userSso, SaveMindmapRequest request) {
        requireUserSso(userSso);
        if (request.documentId() != null) {
            Document doc = documentRepository.findById(request.documentId())
                    .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_DOCUMENT_NOT_FOUND, request.documentId()));
            if (!doc.getUserSso().equals(userSso)) {
                throw new BadRequestException(MessageConstants.MESSAGE_SAVE_MINDMAP_NOT_ALLOWED);
            }
        }

        Mindmap mindmap = Mindmap.builder()
                .documentId(request.documentId())
                .userSso(userSso)
                .title(request.title().trim())
                .content(request.content())
                .build();

        Mindmap saved = mindmapRepository.save(mindmap);
        return toMindmapResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<MindmapResponse> getMindmaps(String userSso) {
        requireUserSso(userSso);
        return mindmapRepository.findByUserSso(userSso).stream()
                .map(this::toMindmapResponse)
                .toList();
    }

    /**
     * Hỏi đáp dựa trên nội dung tài liệu đã trích xuất.
     * Sử dụng Ollama (Qwen2.5) để trả lời câu hỏi dựa trên extractedText.
     */
    @Transactional(readOnly = true)
    public String askDocumentQuestion(Long documentId, String userSso, AskDocumentQuestionRequest request) {
        requireUserSso(userSso);
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_DOCUMENT_NOT_FOUND, documentId));

        if (!document.getUserSso().equals(userSso)) {
            throw new BadRequestException(MessageConstants.MESSAGE_PERMISSION_DENIED);
        }

        if (document.getExtractedText() == null || document.getExtractedText().isBlank()) {
            throw new BadRequestException("Tài liệu chưa được trích xuất nội dung hoặc đang trong quá trình xử lý.");
        }

        return ollamaAiService.answerQuestionFromDocument(document.getExtractedText(), request.question());
    }

    private void requireUserSso(String userSso) {
        if (userSso == null || userSso.isBlank()) {
            throw new BadRequestException(MessageConstants.MESSAGE_NOT_AUTHENTICATED);
        }
    }

    private boolean isPdfFile(String mimeType) {
        return mimeType != null && mimeType.equalsIgnoreCase("application/pdf");
    }

    private DocumentResponse toDocumentResponse(Document document) {
        return new DocumentResponse(
                document.getDocumentId(),
                document.getTitle(),
                document.getFilePath(),
                document.getFileName(),
                document.getFileSize(),
                document.getFileType(),
                document.getProcessingStatus(),
                document.getErrorMessage(),
                document.getPageCount(),
                document.getWordCount(),
                document.getLastAccessedAt()
        );
    }

    private MindmapResponse toMindmapResponse(Mindmap mindmap) {
        return new MindmapResponse(
                mindmap.getMindmapId(),
                mindmap.getDocumentId(),
                mindmap.getTitle(),
                mindmap.getContent(),
                mindmap.getThumbnailUrl()
        );
    }
}
