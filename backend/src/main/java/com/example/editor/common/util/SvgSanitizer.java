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
import java.util.Set;

import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

/**
 * SVG sanitizer that strips dangerous elements and attributes
 * to prevent XSS and other security vulnerabilities.
 */
public final class SvgSanitizer {

    private SvgSanitizer() {}

    // Dangerous elements that should be completely removed
    private static final Set<String> DANGEROUS_ELEMENTS = Set.of(
            "script", "iframe", "object", "embed", "applet",
            "form", "input", "button", "textarea", "select",
            "link", "meta", "base", "noscript"
    );

    // Dangerous attributes (event handlers and security risks)
    private static final Set<String> DANGEROUS_ATTR_PREFIXES = Set.of(
            "on",      // onclick, onload, onerror, etc.
            "form",    // formaction, formtarget, etc.
            "xlink:"   // xlink:href with javascript:
    );

    // Safe xlink:href values (only data: URIs for inline SVG)
    private static final Set<String> SAFE_XLINK_NAMESPACES = Set.of(
            "href"
    );

    /**
     * Sanitize SVG content by removing dangerous elements and attributes.
     *
     * @param svgData Raw SVG string
     * @return Sanitized SVG string safe for storage and rendering
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
        } catch (Exception e) {
            // If parsing fails, return a safe empty SVG
            return "<svg xmlns=\"http://www.w3.org/2000/svg\"/>";
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
        var attrsToRemove = new java.util.ArrayList<Attr>();
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

        // Recursively clean children
        NodeList children = element.getChildNodes();
        // Collect elements to process first to avoid concurrent modification
        var childElements = new java.util.ArrayList<Element>();
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
