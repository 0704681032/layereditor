package com.example.editor.revision.controller;

import com.example.editor.common.response.ApiResponse;
import com.example.editor.revision.dto.CreateRevisionRequest;
import com.example.editor.revision.dto.RevisionDetailResponse;
import com.example.editor.revision.dto.RevisionResponse;
import com.example.editor.revision.service.RevisionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/documents/{documentId}/revisions")
@RequiredArgsConstructor
public class RevisionController {

    private final RevisionService revisionService;

    @PostMapping
    public ApiResponse<RevisionResponse> createRevision(
            @PathVariable Long documentId,
            @RequestBody(required = false) CreateRevisionRequest request) {
        return ApiResponse.ok(revisionService.createRevision(documentId,
                request != null ? request : new CreateRevisionRequest(null)));
    }

    @GetMapping
    public ApiResponse<List<RevisionResponse>> listRevisions(@PathVariable Long documentId) {
        return ApiResponse.ok(revisionService.listRevisions(documentId));
    }

    @GetMapping("/{revisionId}")
    public ApiResponse<RevisionDetailResponse> getRevisionDetail(
            @PathVariable Long documentId,
            @PathVariable Long revisionId) {
        return ApiResponse.ok(revisionService.getRevisionDetail(documentId, revisionId));
    }

    @PostMapping("/{versionNo}/restore")
    public ApiResponse<RevisionResponse> restoreRevision(
            @PathVariable Long documentId,
            @PathVariable int versionNo) {
        return ApiResponse.ok(revisionService.restoreRevision(documentId, versionNo));
    }
}
