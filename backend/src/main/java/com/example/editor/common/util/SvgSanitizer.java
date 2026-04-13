package com.example.editor.common.util;

import org.w3c.dom.Attr;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Set;
import java.util.regex.Pattern;

import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

/**
 * SVG sanitizer that strips dangerous elements and attributes
 * to prevent XSS and other security vulnerabilities.
 *
 * <p>This sanitizer uses a fail-closed approach: any SVG that fails to parse
 * is rejected with an exception rather than silently replaced.</p>
 */
public final class SvgSanitizer {

    private SvgSanitizer() {}

    // Dangerous elements that should be completely removed
    private static final Set<String> DANGEROUS_ELEMENTS = Set.of(
            "script", "iframe", "object", "embed", "applet",
            "form", "input", "button", "textarea", "select",
            "link", "meta", "base", "noscript"
    );

    // Patterns for dangerous CSS values in style attributes
    // expression() — IE CSS expression injection
    // url(javascript:...) — CSS-based JS execution
    // url(data:text/html...) — CSS-based HTML injection
    // -moz-binding — Firefox XBL injection
    // @import — CSS import of external resources
    // behavior: — IE HTC behavior
    private static final Pattern DANGEROUS_CSS_PATTERN = Pattern.compile(
            "(?i)(expression\\s*\\(|url\\s*\\(\\s*['\"]?\\s*javascript:|" +
            "url\\s*\\(\\s*['\"]?\\s*data\\s*:\\s*text/html|" +
            "-moz-binding|@import|behavior\\s*:)"
    );

    /**
     * Sanitize SVG content by removing dangerous elements and attributes.
     *
     * @param svgData Raw SVG string
     * @return Sanitized SVG string safe for storage and rendering
     * @throws IllegalArgumentException if the SVG fails to parse (fail-closed)
     */
    public static String sanitize(String svgData) {
        if (svgData == null || svgData.isBlank()) {
            return svgData;
        }

        try {
            var factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(true);
            // Disable external entities to prevent XXE
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            factory.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
            factory.setXIncludeAware(false);

            var builder = factory.newDocumentBuilder();
            Document document = builder.parse(new InputSource(
                    new ByteArrayInputStream(svgData.getBytes(StandardCharsets.UTF_8))));

            cleanNode(document.getDocumentElement());

            return documentToString(document);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            // Fail-closed: reject malformed SVG instead of returning a safe placeholder
            throw new IllegalArgumentException("Invalid SVG content: failed to parse", e);
        }
    }

    private static void cleanNode(Element element) {
        String tagName = element.getTagName().toLowerCase();
        String localName = element.getLocalName() != null
                ? element.getLocalName().toLowerCase() : tagName;

        // Remove dangerous elements entirely
        if (DANGEROUS_ELEMENTS.contains(localName) || DANGEROUS_ELEMENTS.contains(tagName)) {
            Node parent = element.getParentNode();
            if (parent != null) {
                parent.removeChild(element);
            }
            return;
        }

        // Clean attributes
        var attrsToRemove = new ArrayList<Attr>();
        var attributes = element.getAttributes();
        for (int i = 0; i < attributes.getLength(); i++) {
            Attr attr = (Attr) attributes.item(i);
            if (isDangerousAttribute(attr)) {
                attrsToRemove.add(attr);
            }
        }
        for (Attr attr : attrsToRemove) {
            element.removeAttributeNode(attr);
        }

        // Sanitize style attribute value if present and not already removed
        Attr styleAttr = element.getAttributeNode("style");
        if (styleAttr != null && containsDangerousCss(styleAttr.getValue())) {
            element.removeAttributeNode(styleAttr);
        }

        // Recursively clean children
        NodeList children = element.getChildNodes();
        // Collect elements to process first to avoid concurrent modification
        var childElements = new ArrayList<Element>();
        for (int i = 0; i < children.getLength(); i++) {
            Node child = children.item(i);
            if (child instanceof Element childElem) {
                childElements.add(childElem);
            }
        }
        for (Element child : childElements) {
            cleanNode(child);
        }
    }

    private static boolean isDangerousAttribute(Attr attr) {
        String name = attr.getName().toLowerCase();
        String value = attr.getValue().trim().toLowerCase();

        // Event handler attributes (onclick, onload, onerror, etc.)
        if (name.startsWith("on")) {
            return true;
        }

        // xlink:href or href with javascript: or data:text/html
        if (name.equals("href") || name.equals("xlink:href")) {
            if (value.startsWith("javascript:") || value.startsWith("data:text/html")) {
                return true;
            }
        }

        // formaction, formtarget, etc.
        if (name.startsWith("form")) {
            return true;
        }

        return false;
    }

    /**
     * Check if a CSS style value contains dangerous patterns.
     */
    private static boolean containsDangerousCss(String styleValue) {
        if (styleValue == null || styleValue.isBlank()) {
            return false;
        }
        return DANGEROUS_CSS_PATTERN.matcher(styleValue).find();
    }

    private static String documentToString(Document document) throws Exception {
        TransformerFactory tf = TransformerFactory.newInstance();
        Transformer transformer = tf.newTransformer();
        transformer.setOutputProperty(OutputKeys.OMIT_XML_DECLARATION, "yes");
        transformer.setOutputProperty(OutputKeys.METHOD, "xml");
        transformer.setOutputProperty(OutputKeys.ENCODING, "UTF-8");

        StringWriter writer = new StringWriter();
        transformer.transform(new DOMSource(document), new StreamResult(writer));
        return writer.toString();
    }
}
