package com.example.editor.revision.service;

import com.example.editor.common.exception.NotFoundException;
import com.example.editor.document.entity.EditorDocument;
import com.example.editor.document.service.DocumentService;
import com.example.editor.revision.dto.CreateRevisionRequest;
import com.example.editor.revision.dto.RevisionDetailResponse;
import com.example.editor.revision.dto.RevisionResponse;
import com.example.editor.revision.entity.EditorDocumentRevision;
import com.example.editor.revision.mapper.RevisionMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RevisionService {

    private final RevisionMapper revisionMapper;
    private final DocumentService documentService;
    private final ObjectMapper objectMapper;

    private static final Long DEFAULT_USER_ID = 1L;

    @Transactional
    public RevisionResponse createRevision(Long documentId, CreateRevisionRequest request) {
        EditorDocument doc = documentService.findOrThrow(documentId);

        EditorDocumentRevision revision = new EditorDocumentRevision();
        revision.setDocumentId(documentId);
        revision.setVersionNo(doc.getCurrentVersion());
        revision.setSnapshot(doc.getContent());
        revision.setMessage(request.message());
        revision.setCreatedBy(DEFAULT_USER_ID);
        revisionMapper.insert(revision);

        return new RevisionResponse(
                revision.getId(), revision.getDocumentId(),
                revision.getVersionNo(), revision.getMessage(), revision.getCreatedAt());
    }

    public List<RevisionResponse> listRevisions(Long documentId) {
        documentService.findOrThrow(documentId);
        return revisionMapper.selectByDocumentId(documentId).stream()
                .map(r -> new RevisionResponse(
                        r.getId(), r.getDocumentId(),
                        r.getVersionNo(), r.getMessage(), r.getCreatedAt()))
                .toList();
    }

    public RevisionDetailResponse getRevisionDetail(Long documentId, Long revisionId) {
        documentService.findOrThrow(documentId);
        EditorDocumentRevision revision = revisionMapper.selectById(revisionId, documentId);
        if (revision == null) {
            throw new NotFoundException("revision not found");
        }
        return toDetailResponse(revision);
    }

    @Transactional
    public RevisionResponse restoreRevision(Long documentId, int versionNo) {
        EditorDocument doc = documentService.findOrThrow(documentId);

        EditorDocumentRevision revision = revisionMapper.selectByDocumentIdAndVersion(documentId, versionNo);
        if (revision == null) {
            throw new NotFoundException("revision not found for version " + versionNo);
        }

        documentService.restoreContent(documentId, revision.getSnapshot());

        return new RevisionResponse(
                revision.getId(), revision.getDocumentId(),
                revision.getVersionNo(), revision.getMessage(), revision.getCreatedAt());
    }

    private RevisionDetailResponse toDetailResponse(EditorDocumentRevision revision) {
        try {
            JsonNode snapshotNode = objectMapper.readTree(revision.getSnapshot());
            return new RevisionDetailResponse(
                    revision.getId(), revision.getDocumentId(),
                    revision.getVersionNo(), snapshotNode,
                    revision.getMessage(), revision.getCreatedAt());
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse revision snapshot", e);
        }
    }
}
