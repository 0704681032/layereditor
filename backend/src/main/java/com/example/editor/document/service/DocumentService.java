package com.example.editor.document.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.example.editor.asset.dto.AssetResponse;
import com.example.editor.asset.service.AssetService;
import com.example.editor.common.exception.ConflictException;
import com.example.editor.common.exception.NotFoundException;
import com.example.editor.document.dto.*;
import com.example.editor.document.entity.EditorDocument;
import com.example.editor.common.util.ContentValidator;
import com.example.editor.common.util.SvgSanitizer;
import com.example.editor.asset.mapper.AssetMapper;
import com.example.editor.document.mapper.DocumentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.w3c.dom.Element;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentMapper documentMapper;
    private final AssetMapper assetMapper;
    private final AssetService assetService;
    private final ObjectMapper objectMapper;

    private static final Long DEFAULT_USER_ID = 1L;
    private static final int DEFAULT_CANVAS_WIDTH = 1200;
    private static final int DEFAULT_CANVAS_HEIGHT = 800;
    private static final Pattern NUMBER_PATTERN = Pattern.compile("-?\\d+(?:\\.\\d+)?");

    @Transactional
    public DocumentDetailResponse create(CreateDocumentRequest request) {
        JsonNode sanitized = ContentValidator.validateAndSanitize(request.content());
        EditorDocument doc = new EditorDocument();
        doc.setOwnerId(DEFAULT_USER_ID);
        doc.setTitle(request.title().trim());
        doc.setStatus("draft");
        doc.setSchemaVersion(request.schemaVersion());
        doc.setCurrentVersion(1);
        doc.setContent(sanitized.toString());
        documentMapper.insert(doc);
        return getDetail(doc.getId());
    }

    @Transactional
    public DocumentDetailResponse importFromFile(MultipartFile file, String title) {
        String resolvedTitle = (title == null || title.isBlank())
                ? deriveTitle(file.getOriginalFilename())
                : title.trim();
        boolean isSvg = isSvgFile(file);
        AssetResponse asset = assetService.upload(file, null, isSvg ? "svg" : "image");
        ObjectNode content;
        if (isSvg) {
            content = buildSvgDocumentContent(file, resolvedTitle);
        } else {
            content = buildImageDocumentContent(file, asset);
        }

        EditorDocument doc = new EditorDocument();
        doc.setOwnerId(DEFAULT_USER_ID);
        doc.setTitle(resolvedTitle);
        doc.setStatus("draft");
        doc.setSchemaVersion(1);
        doc.setCurrentVersion(1);
        doc.setContent(content.toString());
        documentMapper.insert(doc);

        // Link asset to the newly created document
        assetMapper.updateDocumentId(asset.id(), doc.getId());

        return getDetail(doc.getId());
    }

    public DocumentDetailResponse getDetail(Long id) {
        EditorDocument doc = findOrThrow(id);
        return toDetailResponse(doc);
    }

    /**
     * List documents with pagination
     */
    public DocumentListResponse listDocuments(int page, int size) {
        int offset = page * size;
        List<EditorDocument> docs = documentMapper.selectPageByOwner(DEFAULT_USER_ID, offset, size);
        long total = documentMapper.countByOwner(DEFAULT_USER_ID);
        List<DocumentListItemResponse> items = docs.stream()
                .map(d -> new DocumentListItemResponse(
                        d.getId(), d.getTitle(), d.getStatus(),
                        d.getCurrentVersion(), d.getCreatedAt(), d.getUpdatedAt(),
                        parseContentSummary(d.getContent())))
                .toList();
        return new DocumentListResponse(items, total, page, size);
    }

    /**
     * Legacy method for backward compatibility (returns all documents)
     * @deprecated Use listDocuments(int page, int size) instead
     */
    @Deprecated
    public List<DocumentListItemResponse> listDocuments() {
        return documentMapper.selectPageByOwner(DEFAULT_USER_ID, null, null).stream()
                .map(d -> new DocumentListItemResponse(
                        d.getId(), d.getTitle(), d.getStatus(),
                        d.getCurrentVersion(), d.getCreatedAt(), d.getUpdatedAt(),
                        parseContentSummary(d.getContent())))
                .toList();
    }

    private DocumentListItemResponse.ContentSummary parseContentSummary(String contentJson) {
        if (contentJson == null || contentJson.isBlank()) return null;
        try {
            JsonNode root = objectMapper.readTree(contentJson);
            JsonNode canvas = root.get("canvas");
            DocumentListItemResponse.Canvas canvasSummary = null;
            if (canvas != null) {
                canvasSummary = new DocumentListItemResponse.Canvas(
                    canvas.get("width").asInt(),
                    canvas.get("height").asInt(),
                    canvas.has("background") ? canvas.get("background").asText() : null
                );
            }
            JsonNode layers = root.get("layers");
            int layerCount = layers != null && layers.isArray() ? layers.size() : 0;
            String thumbnail = root.has("thumbnail") ? root.get("thumbnail").asText() : null;
            return new DocumentListItemResponse.ContentSummary(canvasSummary, layerCount, thumbnail);
        } catch (Exception e) {
            return null;
        }
    }

    @Transactional
    public DocumentUpdateResponse update(Long id, UpdateDocumentRequest request) {
        EditorDocument current = documentMapper.selectByIdForOwner(id, DEFAULT_USER_ID);
        if (current == null) {
            throw new NotFoundException("document not found");
        }
        if (!current.getCurrentVersion().equals(request.currentVersion())) {
            throw new ConflictException("document version conflict");
        }

        // Validate and sanitize content
        JsonNode sanitized = ContentValidator.validateAndSanitize(request.content());

        int updated = documentMapper.updateDocument(
                id, DEFAULT_USER_ID, request.title().trim(),
                request.schemaVersion(), sanitized.toString(), request.currentVersion());
        if (updated == 0) {
            throw new ConflictException("document version conflict");
        }

        EditorDocument refreshed = findOrThrow(id);
        return new DocumentUpdateResponse(refreshed.getId(), refreshed.getCurrentVersion(), refreshed.getUpdatedAt());
    }

    @Transactional
    public void updateTitle(Long id, String title) {
        int updated = documentMapper.updateTitle(id, DEFAULT_USER_ID, title);
        if (updated == 0) {
            throw new NotFoundException("document not found");
        }
    }

    @Transactional
    public void delete(Long id) {
        int deleted = documentMapper.softDelete(id, DEFAULT_USER_ID);
        if (deleted == 0) {
            throw new NotFoundException("document not found");
        }
    }

    @Transactional
    public void restoreContent(Long id, String content) {
        EditorDocument doc = findOrThrow(id);
        int updated = documentMapper.updateDocument(
                id, DEFAULT_USER_ID, doc.getTitle(),
                doc.getSchemaVersion(), content, doc.getCurrentVersion());
        if (updated == 0) {
            throw new ConflictException("document version conflict during restore");
        }
    }

    public EditorDocument findOrThrow(Long id) {
        EditorDocument doc = documentMapper.selectByIdForOwner(id, DEFAULT_USER_ID);
        if (doc == null) {
            throw new NotFoundException("document not found");
        }
        return doc;
    }

    private DocumentDetailResponse toDetailResponse(EditorDocument doc) {
        JsonNode contentNode;
        try {
            contentNode = objectMapper.readTree(doc.getContent());
        } catch (Exception e) {
            contentNode = objectMapper.createObjectNode();
        }
        return new DocumentDetailResponse(
                doc.getId(), doc.getTitle(), doc.getSchemaVersion(),
                doc.getCurrentVersion(), contentNode, doc.getCreatedAt(), doc.getUpdatedAt());
    }

    private ObjectNode buildSvgDocumentContent(MultipartFile file, String title) {
        try {
            String rawSvg = new String(file.getBytes(), StandardCharsets.UTF_8);
            String svgData = SvgSanitizer.sanitize(rawSvg);
            SvgSize size = extractSvgSize(svgData);
            ObjectNode content = createContentRoot(size.width(), size.height());
            ArrayNode layers = (ArrayNode) content.get("layers");
            layers.add(svgLayer(title, 0, 0, size.width(), size.height(), svgData));
            return content;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse SVG file", e);
        }
    }

    private ObjectNode buildImageDocumentContent(MultipartFile file, AssetResponse asset) {
        int width = asset.width() != null ? asset.width() : DEFAULT_CANVAS_WIDTH;
        int height = asset.height() != null ? asset.height() : DEFAULT_CANVAS_HEIGHT;
        ObjectNode content = createContentRoot(width, height);
        ArrayNode layers = (ArrayNode) content.get("layers");
        layers.add(imageLayer(deriveTitle(file.getOriginalFilename()), asset.id(), width, height));
        return content;
    }

    private ObjectNode createContentRoot(int width, int height) {
        ObjectNode content = objectMapper.createObjectNode();
        content.put("schemaVersion", 1);
        ObjectNode canvas = objectMapper.createObjectNode();
        canvas.put("width", width);
        canvas.put("height", height);
        canvas.put("background", "#FFFFFF");
        content.set("canvas", canvas);
        content.set("layers", objectMapper.createArrayNode());
        return content;
    }

    private ObjectNode imageLayer(String name, Long assetId, int width, int height) {
        ObjectNode layer = baseLayer("image", name, 0, 0);
        layer.put("width", width);
        layer.put("height", height);
        layer.put("assetId", assetId);
        return layer;
    }

    private ObjectNode svgLayer(String name, int x, int y, int width, int height, String svgData) {
        ObjectNode layer = baseLayer("svg", name, x, y);
        layer.put("width", width);
        layer.put("height", height);
        layer.put("svgData", svgData);
        return layer;
    }

    private ObjectNode baseLayer(String type, String name, int x, int y) {
        ObjectNode layer = objectMapper.createObjectNode();
        layer.put("id", generateLayerId());
        layer.put("type", type);
        layer.put("name", name);
        layer.put("x", x);
        layer.put("y", y);
        layer.put("visible", true);
        layer.put("locked", false);
        return layer;
    }

    private boolean isSvgFile(MultipartFile file) {
        String contentType = file.getContentType();
        String filename = file.getOriginalFilename();
        return "image/svg+xml".equalsIgnoreCase(contentType)
                || (filename != null && filename.toLowerCase().endsWith(".svg"));
    }

    private String deriveTitle(String filename) {
        if (filename == null || filename.isBlank()) {
            return "Imported Document";
        }
        int dotIndex = filename.lastIndexOf('.');
        return dotIndex > 0 ? filename.substring(0, dotIndex) : filename;
    }

    private String generateLayerId() {
        return "layer_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    private SvgSize extractSvgSize(String svgData) {
        try {
            var factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(true);
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            var builder = factory.newDocumentBuilder();
            var document = builder.parse(new ByteArrayInputStream(svgData.getBytes(StandardCharsets.UTF_8)));
            Element root = document.getDocumentElement();

            String viewBox = root.getAttribute("viewBox");
            if (viewBox != null && !viewBox.isBlank()) {
                String[] parts = viewBox.trim().split("[,\\s]+");
                if (parts.length == 4) {
                    return new SvgSize(
                            Math.max(1, (int) Math.round(Double.parseDouble(parts[2]))),
                            Math.max(1, (int) Math.round(Double.parseDouble(parts[3])))
                    );
                }
            }

            int width = parseSvgLength(root.getAttribute("width"), DEFAULT_CANVAS_WIDTH);
            int height = parseSvgLength(root.getAttribute("height"), DEFAULT_CANVAS_HEIGHT);
            return new SvgSize(width, height);
        } catch (Exception e) {
            return new SvgSize(DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT);
        }
    }

    private int parseSvgLength(String rawValue, int fallback) {
        if (rawValue == null || rawValue.isBlank()) {
            return fallback;
        }

        Matcher matcher = NUMBER_PATTERN.matcher(rawValue);
        if (!matcher.find()) {
            return fallback;
        }

        try {
            return Math.max(1, (int) Math.round(Double.parseDouble(matcher.group())));
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    private record SvgSize(int width, int height) {}
}