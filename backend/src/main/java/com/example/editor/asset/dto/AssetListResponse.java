package com.example.editor.asset.dto;

import java.util.List;

public record AssetListResponse(
    List<AssetResponse> items,
    long total,
    int page,
    int size
) {}