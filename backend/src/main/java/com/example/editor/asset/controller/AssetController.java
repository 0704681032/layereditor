package com.example.editor.asset.controller;

import com.example.editor.asset.dto.AssetListResponse;
import com.example.editor.asset.dto.AssetResponse;
import com.example.editor.asset.service.AssetService;
import com.example.editor.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/assets")
@RequiredArgsConstructor
public class AssetController {

    private final AssetService assetService;

    @PostMapping
    public ApiResponse<AssetResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "documentId", required = false) Long documentId,
            @RequestParam(value = "kind", defaultValue = "image") String kind) {
        return ApiResponse.ok(assetService.upload(file, documentId, kind));
    }

    @GetMapping("/{id}")
    public ApiResponse<AssetResponse> getAsset(@PathVariable Long id) {
        return ApiResponse.ok(assetService.getAsset(id));
    }

    @GetMapping
    public ApiResponse<AssetListResponse> listAssets(
            @RequestParam(value = "documentId", required = false) Long documentId,
            @RequestParam(value = "kind", required = false) String kind,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        return ApiResponse.ok(assetService.listAssets(documentId, kind, page, size));
    }
}
