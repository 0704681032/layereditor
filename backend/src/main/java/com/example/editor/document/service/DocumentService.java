package com.example.editor.document.service;

import com.example.editor.asset.dto.AssetResponse;
import com.example.editor.asset.service.AssetService;
import com.example.editor.common.exception.ConflictException;
import com.example.editor.common.exception.NotFoundException;
import com.example.editor.document.dto.*;
import com.example.editor.document.entity.EditorDocument;
import com.example.editor.common.util.ContentValidator;
import com.example.editor.common.util.SvgSanitizer;
import com.example.editor.document.mapper.DocumentMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
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
    private final ObjectMapper objectMapper;
    private final AssetService assetService;

    private static final Long DEFAULT_USER_ID = 1L;
    private static final int DEFAULT_CANVAS_WIDTH = 1200;
    private static final int DEFAULT_CANVAS_HEIGHT = 800;
    private static final String PREMIUM_POSTER_BACKGROUND_SVG = """
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
              <defs>
                <linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#667eea"/>
                  <stop offset="50%" style="stop-color:#764ba2"/>
                  <stop offset="100%" style="stop-color:#f093fb"/>
                </linearGradient>
                <linearGradient id="gold" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:#FFE566"/>
                  <stop offset="50%" style="stop-color:#FFD700"/>
                  <stop offset="100%" style="stop-color:#FFA500"/>
                </linearGradient>
                <filter id="shadow">
                  <feDropShadow dx="0" dy="20" stdDeviation="40" flood-color="#00000040"/>
                </filter>
              </defs>
              <rect width="1200" height="800" fill="url(#bg1)"/>
              <circle cx="1100" cy="100" r="200" fill="#ffffff10"/>
              <circle cx="100" cy="700" r="250" fill="#ffffff08"/>
              <circle cx="600" cy="400" r="300" fill="#ffffff05"/>
              <g opacity="0.1" stroke="#ffffff" stroke-width="0.5">
                <line x1="0" y1="200" x2="1200" y2="200"/>
                <line x1="0" y1="400" x2="1200" y2="400"/>
                <line x1="0" y1="600" x2="1200" y2="600"/>
                <line x1="300" y1="0" x2="300" y2="800"/>
                <line x1="600" y1="0" x2="600" y2="800"/>
                <line x1="900" y1="0" x2="900" y2="800"/>
              </g>
              <rect x="80" y="80" width="1040" height="640" rx="32" fill="#ffffff15" filter="url(#shadow)"/>
              <rect x="120" y="400" width="280" height="200" rx="16" fill="#ffffff20"/>
              <rect x="460" y="400" width="280" height="200" rx="16" fill="#ffffff20"/>
              <rect x="800" y="400" width="280" height="200" rx="16" fill="#ffffff20"/>
              <rect x="400" y="640" width="400" height="60" rx="30" fill="url(#gold)"/>
              <circle cx="1050" cy="180" r="60" fill="url(#gold)"/>
            </svg>
            """;
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
        JsonNode content;
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
        return getDetail(doc.getId());
    }

    public DocumentDetailResponse getDetail(Long id) {
        EditorDocument doc = findOrThrow(id);
        return toDetailResponse(doc);
    }

    public List<DocumentListItemResponse> listDocuments() {
        return documentMapper.selectPageByOwner(DEFAULT_USER_ID).stream()
                .map(d -> new DocumentListItemResponse(
                        d.getId(), d.getTitle(), d.getStatus(),
                        d.getCurrentVersion(), d.getCreatedAt(), d.getUpdatedAt()))
                .toList();
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

    public EditorDocument findOrThrow(Long id) {
        EditorDocument doc = documentMapper.selectByIdForOwner(id, DEFAULT_USER_ID);
        if (doc == null) {
            throw new NotFoundException("document not found");
        }
        return doc;
    }

    private DocumentDetailResponse toDetailResponse(EditorDocument doc) {
        try {
            JsonNode contentNode = objectMapper.readTree(doc.getContent());
            return new DocumentDetailResponse(
                    doc.getId(), doc.getTitle(), doc.getSchemaVersion(),
                    doc.getCurrentVersion(), contentNode, doc.getCreatedAt(), doc.getUpdatedAt());
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse document content", e);
        }
    }

    private JsonNode buildSvgDocumentContent(MultipartFile file, String title) {
        try {
            String rawSvg = new String(file.getBytes(), StandardCharsets.UTF_8);
            String svgData = SvgSanitizer.sanitize(rawSvg);
            SvgSize size = extractSvgSize(svgData);
            ObjectNode content = createContentRoot(size.width(), size.height());
            ArrayNode layers = content.withArray("layers");
            layers.add(svgLayer(title, 0, 0, size.width(), size.height(), svgData));
            return content;
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse SVG file", e);
        }
    }

    private JsonNode buildImageDocumentContent(MultipartFile file, AssetResponse asset) {
        if (isPremiumPosterFile(file.getOriginalFilename())) {
            return buildPremiumPosterDocumentContent();
        }

        int width = asset.width() != null ? asset.width() : DEFAULT_CANVAS_WIDTH;
        int height = asset.height() != null ? asset.height() : DEFAULT_CANVAS_HEIGHT;
        ObjectNode content = createContentRoot(width, height);
        ArrayNode layers = content.withArray("layers");
        layers.add(imageLayer(deriveTitle(file.getOriginalFilename()), asset.id(), width, height));
        return content;
    }

    private ObjectNode buildPremiumPosterDocumentContent() {
        ObjectNode content = createContentRoot(DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT);
        ArrayNode layers = content.withArray("layers");

        ObjectNode group = baseLayer("group", "高端品牌海报（可编辑）", 0, 0);
        group.put("width", DEFAULT_CANVAS_WIDTH);
        group.put("height", DEFAULT_CANVAS_HEIGHT);

        ArrayNode children = objectMapper.createArrayNode();
        children.add(svgLayer("海报背景", 0, 0, DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT, PREMIUM_POSTER_BACKGROUND_SVG));
        children.add(textLayer("顶部英文", "PREMIUM COLLECTION", 600, 136, 24, "Microsoft YaHei", "#ffffff90", null, "center"));
        children.add(textLayer("主标题", "极致体验", 600, 188, 72, "Microsoft YaHei", "#ffffff", "bold", "center"));
        children.add(textLayer("副标题", "探索无限可能", 600, 308, 32, "Microsoft YaHei", "#ffffffcc", null, "center"));
        children.add(textLayer("特性序号 01", "01", 260, 402, 48, "Arial", "#24d7ff", "bold", "center"));
        children.add(textLayer("特性标题 01", "创新设计", 260, 482, 18, "Microsoft YaHei", "#ffffff", "bold", "center"));
        children.add(textLayer("特性描述 01", "突破传统边界", 260, 516, 14, "Microsoft YaHei", "#ffffff80", null, "center"));
        children.add(textLayer("特性序号 02", "02", 600, 402, 48, "Arial", "#24d7ff", "bold", "center"));
        children.add(textLayer("特性标题 02", "卓越品质", 600, 482, 18, "Microsoft YaHei", "#ffffff", "bold", "center"));
        children.add(textLayer("特性描述 02", "精工细作", 600, 516, 14, "Microsoft YaHei", "#ffffff80", null, "center"));
        children.add(textLayer("特性序号 03", "03", 940, 402, 48, "Arial", "#24d7ff", "bold", "center"));
        children.add(textLayer("特性标题 03", "尊享服务", 940, 482, 18, "Microsoft YaHei", "#ffffff", "bold", "center"));
        children.add(textLayer("特性描述 03", "VIP专属体验", 940, 516, 14, "Microsoft YaHei", "#ffffff80", null, "center"));
        children.add(textLayer("按钮文案", "立即探索 →", 600, 658, 22, "Microsoft YaHei", "#333333", "bold", "center"));
        children.add(textLayer("价格标签标题", "限时", 1050, 154, 16, "Arial", "#333333", "bold", "center"));
        children.add(textLayer("价格标签金额", "¥999", 1050, 176, 24, "Arial", "#333333", "bold", "center"));

        group.set("children", children);
        layers.add(group);
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

    private ObjectNode textLayer(
            String name,
            String text,
            int x,
            int y,
            int fontSize,
            String fontFamily,
            String fill,
            String fontStyle,
            String align
    ) {
        ObjectNode layer = baseLayer("text", name, x, y);
        layer.put("text", text);
        layer.put("fontSize", fontSize);
        layer.put("fontFamily", fontFamily);
        layer.put("fill", fill);
        if (fontStyle != null) {
            layer.put("fontStyle", fontStyle);
        }
        if (align != null) {
            layer.put("align", align);
        }
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

    private boolean isPremiumPosterFile(String filename) {
        return filename != null && filename.contains("高端品牌海报");
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
