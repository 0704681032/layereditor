package com.example.editor.document.controller;

import com.example.editor.common.response.ApiResponse;
import com.example.editor.document.dto.*;
import com.example.editor.document.service.DocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping
    public ApiResponse<DocumentDetailResponse> create(@Valid @RequestBody CreateDocumentRequest request) {
        return ApiResponse.ok(documentService.create(request));
    }

    @PostMapping(value = "/import-file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<DocumentDetailResponse> importFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "title", required = false) String title) {
        return ApiResponse.ok(documentService.importFromFile(file, title));
    }

    @GetMapping("/{id}")
    public ApiResponse<DocumentDetailResponse> getDetail(@PathVariable Long id) {
        return ApiResponse.ok(documentService.getDetail(id));
    }

    @GetMapping
    public ApiResponse<List<DocumentListItemResponse>> list() {
        return ApiResponse.ok(documentService.listDocuments());
    }

    @PutMapping("/{id}")
    public ApiResponse<DocumentUpdateResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDocumentRequest request) {
        return ApiResponse.ok(documentService.update(id, request));
    }

    @PatchMapping("/{id}/title")
    public ApiResponse<Void> updateTitle(
            @PathVariable Long id,
            @RequestBody UpdateTitleRequest request) {
        documentService.updateTitle(id, request.title());
        return ApiResponse.ok(null);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        documentService.delete(id);
        return ApiResponse.ok(null);
    }
}
