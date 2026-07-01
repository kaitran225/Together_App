package app.together.workflow.personal.service;

import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.exception.BadRequestException;
import app.together.common.shared.exception.ResourceNotFoundException;
import app.together.common.workflow.entity.Document;
import app.together.common.workflow.entity.Summary;
import app.together.common.workflow.repository.DocumentRepository;
import app.together.common.workflow.repository.SummaryRepository;
import app.together.workflow.personal.client.AiServiceClient;
import app.together.workflow.personal.dto.ChatDtos.AiServiceResponse;
import app.together.workflow.personal.dto.SummaryDtos.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SummarizationService {

    private static final String DEFAULT_SUMMARY_TYPE = "GENERAL";
    private static final String DEFAULT_MODEL = "ai-service";

    private final DocumentRepository documentRepository;
    private final SummaryRepository summaryRepository;
    private final AiServiceClient aiServiceClient;

    public SummaryResponse summarizeDocument(String userSso, Long documentId, SummarizeDocumentRequest request) {
        Document document = getOwnedDocument(userSso, documentId);

        String summaryType = request != null && hasText(request.summaryType())
                ? request.summaryType().trim().toUpperCase()
                : DEFAULT_SUMMARY_TYPE;
        String prompt = request != null && hasText(request.prompt())
                ? request.prompt().trim()
                : "Summarize this document for study review.";

        AiServiceResponse aiResponse = aiServiceClient.getMessageWithAttachments(prompt, List.of(document.getFilePath()));
        String content = aiResponse.replyText();
        if (!hasText(content)) {
            throw new BadRequestException(MessageConstants.MESSAGE_AI_NOT_FOUND);
        }

        Summary summary = Summary.builder()
                .documentId(documentId)
                .summaryType(summaryType)
                .content(content.trim())
                .modelUsed(DEFAULT_MODEL)
                .generatedAt(Instant.now())
                .build();

        return toSummaryResponse(summaryRepository.save(summary), document.getTitle());
    }

    @Transactional(readOnly = true)
    public List<SummaryResponse> getSummaryHistory(String userSso) {
        List<Summary> summaries = summaryRepository.findHistoryByUserSso(userSso);
        Map<Long, Document> documentsById = documentRepository.findByUserSsoAndDeletedAtIsNull(userSso).stream()
                .collect(Collectors.toMap(Document::getDocumentId, Function.identity()));

        return summaries.stream()
                .map(summary -> toSummaryResponse(
                        summary,
                        documentsById.get(summary.getDocumentId()) != null
                                ? documentsById.get(summary.getDocumentId()).getTitle()
                                : null))
                .toList();
    }

    private Document getOwnedDocument(String userSso, Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_DOCUMENT_NOT_FOUND, documentId));
        if (document.getDeletedAt() != null || !document.getUserSso().equals(userSso)) {
            throw new BadRequestException(MessageConstants.MESSAGE_PERMISSION_DENIED);
        }
        return document;
    }

    private SummaryResponse toSummaryResponse(Summary summary, String documentTitle) {
        return new SummaryResponse(
                summary.getSummaryId(),
                summary.getDocumentId(),
                documentTitle,
                summary.getSummaryType(),
                summary.getContent(),
                summary.getModelUsed(),
                summary.getGeneratedAt()
        );
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
