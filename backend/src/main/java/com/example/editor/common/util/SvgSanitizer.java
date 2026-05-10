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

public final class SvgSanitizer {

    private SvgSanitizer() {}

    private static final Set<String> DANGEROUS_ELEMENTS = Set.of(
            "script", "iframe", "object", "embed", "applet",
            "form", "input", "button", "textarea", "select",
            "link", "meta", "base", "noscript",
            "use", "foreignobject", "image"
    );

    private static final Pattern DANGEROUS_CSS_PATTERN = Pattern.compile(
            "(?i)(expression\\s*\\(|url\\s*\\(\\s*['\"]?\\s*javascript:|" +
            "url\\s*\\(\\s*['\"]?\\s*data\\s*:\\s*text/html|" +
            "-moz-binding|@import|behavior\\s*:)"
    );

    public static String sanitize(String svgData) {
        if (svgData == null || svgData.isBlank()) {
            return svgData;
        }

        try {
            var factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(true);
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            factory.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
            factory.setXIncludeAware(false);
            factory.setExpandEntityReferences(false);

            var builder = factory.newDocumentBuilder();
            Document document = builder.parse(new InputSource(
                    new ByteArrayInputStream(svgData.getBytes(StandardCharsets.UTF_8))));

            cleanNode(document.getDocumentElement());

            return documentToString(document);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid SVG content: failed to parse", e);
        }
    }

    private static void cleanNode(Element element) {
        String localName = element.getLocalName() != null
                ? element.getLocalName().toLowerCase() : element.getTagName().toLowerCase();

        if (DANGEROUS_ELEMENTS.contains(localName)) {
            // Allow <use> and <image> only with same-document references (#id)
            if ("use".equals(localName) || "image".equals(localName)) {
                String href = element.getAttribute("href");
                String xlinkHref = element.getAttribute("xlink:href");
                if ((href.isEmpty() || href.startsWith("#")) &&
                    (xlinkHref.isEmpty() || xlinkHref.startsWith("#"))) {
                    cleanAttributes(element);
                    cleanChildren(element);
                    return;
                }
            }
            Node parent = element.getParentNode();
            if (parent != null) {
                parent.removeChild(element);
            }
            return;
        }

        cleanAttributes(element);
        cleanChildren(element);
    }

    private static void cleanAttributes(Element element) {
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

        Attr styleAttr = element.getAttributeNode("style");
        if (styleAttr != null && containsDangerousCss(styleAttr.getValue())) {
            element.removeAttributeNode(styleAttr);
        }
    }

    private static void cleanChildren(Element element) {
        NodeList children = element.getChildNodes();
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

        if (name.startsWith("on")) {
            return true;
        }

        if (name.equals("href") || name.equals("xlink:href")) {
            if (value.startsWith("javascript:") || value.startsWith("data:text/html") || value.startsWith("data:image/svg+xml")) {
                return true;
            }
        }

        if (name.startsWith("form")) {
            return true;
        }

        return false;
    }

    private static boolean containsDangerousCss(String styleValue) {
        if (styleValue == null || styleValue.isBlank()) {
            return false;
        }
        return DANGEROUS_CSS_PATTERN.matcher(styleValue).find();
    }

    private static String documentToString(Document document) throws Exception {
        TransformerFactory tf = TransformerFactory.newInstance();
        tf.setFeature("http://javax.xml.XMLConstants/feature/secure-processing", true);
        Transformer transformer = tf.newTransformer();
        transformer.setOutputProperty(OutputKeys.OMIT_XML_DECLARATION, "yes");
        transformer.setOutputProperty(OutputKeys.METHOD, "xml");
        transformer.setOutputProperty(OutputKeys.ENCODING, "UTF-8");

        StringWriter writer = new StringWriter();
        transformer.transform(new DOMSource(document), new StreamResult(writer));
        return writer.toString();
    }
}
