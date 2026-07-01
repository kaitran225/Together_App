package app.together.workflow.personal.service;

import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.exception.BadRequestException;
import app.together.common.shared.exception.ResourceNotFoundException;
import app.together.common.workflow.entity.Document;
import app.together.common.workflow.entity.Mindmap;
import app.together.common.workflow.enums.ProcessingStatus;
import app.together.common.workflow.repository.DocumentRepository;
import app.together.common.workflow.repository.MindmapRepository;
import app.together.workflow.personal.dto.DocumentAndMindmapDtos.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class DocumentAndMindmapService {

    private final DocumentRepository documentRepository;
    private final MindmapRepository mindmapRepository;

    // Quản lý tài liệu
    public DocumentResponse uploadDocument(String userSso, UploadDocumentRequest request) {
        requireUserSso(userSso);
        Document document = Document.builder()
                .userSso(userSso)
                .title(request.title().trim())
                .filePath(request.filePath().trim())
                .fileName(request.fileName().trim())
                .fileSize(request.fileSize())
                .fileType(request.fileType())
                .mimeType(request.mimeType())
                .processingStatus(ProcessingStatus.PROCESSING.toString())
                .lastAccessedAt(Instant.now())
                .build();

        Document saved = documentRepository.save(document);
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

    // Quản lý Mindmap
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

    private void requireUserSso(String userSso) {
        if (userSso == null || userSso.isBlank()) {
            throw new BadRequestException(MessageConstants.MESSAGE_NOT_AUTHENTICATED);
        }
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
                document.getPageCount(),
                document.getWordCount(),
                document.getLastAccessedAt()
        );
    }

    private MindmapResponse toMindmapResponse(Mindmap mindmap) {
        return new MindmapResponse(
                mindmap.getMindmapId(),
                mindmap.getDocumentId(),
                mindmap.getUserSso(),
                mindmap.getContent(),
                mindmap.getThumbnailUrl()
        );
    }
}
