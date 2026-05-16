package com.example.editor.common.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 内容验证器测试
 */
class ContentValidatorTest {

    private ObjectMapper objectMapper;

    @BeforeEach
    void setup() {
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("有效内容应通过验证")
    void testValidContent() {
        ObjectNode content = createValidContent();
        JsonNode result = ContentValidator.validateAndSanitize(content);
        assertNotNull(result);
        assertTrue(result.has("canvas"));
        assertTrue(result.has("layers"));
    }

    @Test
    @DisplayName("null内容应抛出异常")
    void testNullContent() {
        assertThrows(IllegalArgumentException.class,
            () -> ContentValidator.validateAndSanitize(null));
    }

    @Test
    @DisplayName("缺少canvas字段应抛出异常")
    void testMissingCanvas() {
        ObjectNode content = objectMapper.createObjectNode();
        content.set("layers", objectMapper.createArrayNode());

        assertThrows(IllegalArgumentException.class,
            () -> ContentValidator.validateAndSanitize(content));
    }

    @Test
    @DisplayName("缺少layers字段应抛出异常")
    void testMissingLayers() {
        ObjectNode content = objectMapper.createObjectNode();
        ObjectNode canvas = objectMapper.createObjectNode();
        canvas.put("width", 800);
        canvas.put("height", 600);
        content.set("canvas", canvas);

        assertThrows(IllegalArgumentException.class,
            () -> ContentValidator.validateAndSanitize(content));
    }

    @Test
    @DisplayName("canvas尺寸过小应抛出异常")
    void testCanvasTooSmall() {
        ObjectNode content = objectMapper.createObjectNode();
        ObjectNode canvas = objectMapper.createObjectNode();
        canvas.put("width", 5);
        canvas.put("height", 5);
        content.set("canvas", canvas);
        content.set("layers", objectMapper.createArrayNode());

        assertThrows(IllegalArgumentException.class,
            () -> ContentValidator.validateAndSanitize(content));
    }

    @Test
    @DisplayName("canvas尺寸过大应抛出异常")
    void testCanvasTooLarge() {
        ObjectNode content = objectMapper.createObjectNode();
        ObjectNode canvas = objectMapper.createObjectNode();
        canvas.put("width", 20000);
        canvas.put("height", 20000);
        content.set("canvas", canvas);
        content.set("layers", objectMapper.createArrayNode());

        assertThrows(IllegalArgumentException.class,
            () -> ContentValidator.validateAndSanitize(content));
    }

    @Test
    @DisplayName("layers不是数组应抛出异常")
    void testLayersNotArray() {
        ObjectNode content = objectMapper.createObjectNode();
        ObjectNode canvas = objectMapper.createObjectNode();
        canvas.put("width", 800);
        canvas.put("height", 600);
        content.set("canvas", canvas);
        content.set("layers", objectMapper.createObjectNode());

        assertThrows(IllegalArgumentException.class,
            () -> ContentValidator.validateAndSanitize(content));
    }

    @Test
    @DisplayName("无效图层类型应抛出异常")
    void testInvalidLayerType() {
        ObjectNode content = createValidContent();
        ArrayNode layers = (ArrayNode) content.get("layers");
        ObjectNode layer = objectMapper.createObjectNode();
        layer.put("type", "invalid_type");
        layers.add(layer);

        assertThrows(IllegalArgumentException.class,
            () -> ContentValidator.validateAndSanitize(content));
    }

    @Test
    @DisplayName("有效图层类型应通过验证")
    void testValidLayerTypes() {
        String[] validTypes = {"image", "svg", "text", "group", "shape", "rect", "ellipse", "line"};

        for (String type : validTypes) {
            ObjectNode content = createValidContent();
            ArrayNode layers = (ArrayNode) content.get("layers");
            ObjectNode layer = objectMapper.createObjectNode();
            layer.put("type", type);
            layers.add(layer);

            JsonNode result = ContentValidator.validateAndSanitize(content);
            assertNotNull(result);
        }
    }

    @Test
    @DisplayName("group类型应递归验证子图层")
    void testGroupLayerRecursion() {
        ObjectNode content = createValidContent();
        ArrayNode layers = (ArrayNode) content.get("layers");

        ObjectNode groupLayer = objectMapper.createObjectNode();
        groupLayer.put("type", "group");
        ArrayNode children = objectMapper.createArrayNode();

        ObjectNode childLayer = objectMapper.createObjectNode();
        childLayer.put("type", "image");
        children.add(childLayer);

        groupLayer.set("children", children);
        layers.add(groupLayer);

        JsonNode result = ContentValidator.validateAndSanitize(content);
        assertNotNull(result);
    }

    @Test
    @DisplayName("文本过长应抛出异常")
    void testTextTooLong() {
        ObjectNode content = createValidContent();
        ArrayNode layers = (ArrayNode) content.get("layers");

        ObjectNode textLayer = objectMapper.createObjectNode();
        textLayer.put("type", "text");
        textLayer.put("text", "a".repeat(60000));
        layers.add(textLayer);

        assertThrows(IllegalArgumentException.class,
            () -> ContentValidator.validateAndSanitize(content));
    }

    @Test
    @DisplayName("SVG数据过大应抛出异常")
    void testSvgTooLarge() {
        ObjectNode content = createValidContent();
        ArrayNode layers = (ArrayNode) content.get("layers");

        ObjectNode svgLayer = objectMapper.createObjectNode();
        svgLayer.put("type", "svg");
        svgLayer.put("svgData", "<svg>" + "a".repeat(3 * 1024 * 1024) + "</svg>");
        layers.add(svgLayer);

        assertThrows(IllegalArgumentException.class,
            () -> ContentValidator.validateAndSanitize(content));
    }

    @Test
    @DisplayName("内容大小验证 - null字符串应抛出异常")
    void testContentSizeNull() {
        assertThrows(IllegalArgumentException.class,
            () -> ContentValidator.validateContentSize(null));
    }

    @Test
    @DisplayName("内容大小验证 - 有效大小应通过")
    void testContentSizeValid() {
        String smallContent = "test content";
        ContentValidator.validateContentSize(smallContent);
        // 无异常即通过
    }

    private ObjectNode createValidContent() {
        ObjectNode content = objectMapper.createObjectNode();

        ObjectNode canvas = objectMapper.createObjectNode();
        canvas.put("width", 800);
        canvas.put("height", 600);
        canvas.put("background", "#FFFFFF");
        content.set("canvas", canvas);

        content.set("layers", objectMapper.createArrayNode());

        return content;
    }
}