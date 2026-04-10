package com.example.editor.asset.entity;

import lombok.Data;
import java.time.OffsetDateTime;

@Data
public class EditorAsset {
    private Long id;
    private Long ownerId;
    private Long documentId;
    private String kind;
    private String filename;
    private String mimeType;
    private String bucket;
    private String storageKey;
    private Long fileSize;
    private Integer width;
    private Integer height;
    private String sha256;
    private OffsetDateTime createdAt;
    private OffsetDateTime deletedAt;
}
