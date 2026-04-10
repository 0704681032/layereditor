package com.example.editor.revision.entity;

import lombok.Data;
import java.time.OffsetDateTime;

@Data
public class EditorDocumentRevision {
    private Long id;
    private Long documentId;
    private Integer versionNo;
    private String snapshot;
    private String message;
    private Long createdBy;
    private OffsetDateTime createdAt;
}
