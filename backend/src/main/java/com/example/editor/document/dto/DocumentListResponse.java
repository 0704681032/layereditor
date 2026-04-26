package com.example.editor.document.dto;

import java.util.List;

/**
 * Paginated list of documents
 */
public record DocumentListResponse(
    List<DocumentListItemResponse> items,
    long total,
    int page,
    int size
) {}