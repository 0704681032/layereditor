package com.example.editor.document.entity;

import lombok.Data;
import java.time.OffsetDateTime;

@Data
public class EditorDocument {
    private Long id;
    private Long ownerId;
    private String title;
    private String status;
    private Integer schemaVersion;
    private Integer currentVersion;
    private String content;
    private Long coverAssetId;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private OffsetDateTime deletedAt;
}
