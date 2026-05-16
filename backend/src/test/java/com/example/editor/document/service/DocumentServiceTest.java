package com.example.editor.document.service;

import com.example.editor.document.dto.CreateDocumentRequest;
import com.example.editor.document.dto.DocumentDetailResponse;
import com.example.editor.document.dto.DocumentListResponse;
import com.example.editor.document.entity.EditorDocument;
import com.example.editor.document.mapper.DocumentMapper;
import com.example.editor.common.exception.NotFoundException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * DocumentService单元测试
 */
@ExtendWith(MockitoExtension.class)
class DocumentServiceTest {

    @Mock
    private DocumentMapper documentMapper;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private DocumentService documentService;

    @BeforeEach
    void setup() {
        // 设置默认行为
    }

    @Test
    @DisplayName("根据ID获取文档详情 - 存在时返回响应")
    void testGetDetailFound() {
        EditorDocument doc = createTestDocument(1L, "Test Document");
        when(documentMapper.selectByIdForOwner(anyLong(), anyLong())).thenReturn(doc);

        DocumentDetailResponse response = documentService.getDetail(1L);

        assertNotNull(response);
        assertEquals(1L, response.id());
        assertEquals("Test Document", response.title());
    }

    @Test
    @DisplayName("根据ID获取文档详情 - 不存在时抛出NotFoundException")
    void testGetDetailNotFound() {
        when(documentMapper.selectByIdForOwner(anyLong(), anyLong())).thenReturn(null);

        assertThrows(NotFoundException.class, () -> documentService.getDetail(1L));
    }

    @Test
    @DisplayName("列出文档 - 返回分页响应")
    void testListDocuments() {
        List<EditorDocument> docs = List.of(
            createTestDocument(1L, "Doc 1"),
            createTestDocument(2L, "Doc 2")
        );

        when(documentMapper.selectPageByOwner(anyLong(), anyInt(), anyInt())).thenReturn(docs);
        when(documentMapper.countByOwner(anyLong())).thenReturn(2L);

        DocumentListResponse response = documentService.listDocuments(0, 20);

        assertNotNull(response);
        assertEquals(2, response.items().size());
        assertEquals(2L, response.total());
        assertEquals(0, response.page());
        assertEquals(20, response.size());
    }

    @Test
    @DisplayName("列出文档 - 无效分页参数应抛出异常")
    void testListDocumentsInvalidPagination() {
        assertThrows(IllegalArgumentException.class, () -> documentService.listDocuments(-1, 20));
        assertThrows(IllegalArgumentException.class, () -> documentService.listDocuments(0, 0));
    }

    @Test
    @DisplayName("删除文档 - 存在时删除成功")
    void testDeleteDocumentFound() {
        when(documentMapper.softDelete(anyLong(), anyLong())).thenReturn(1);

        documentService.delete(1L);

        verify(documentMapper).softDelete(anyLong(), anyLong());
    }

    @Test
    @DisplayName("删除文档 - 不存在时抛出NotFoundException")
    void testDeleteDocumentNotFound() {
        when(documentMapper.softDelete(anyLong(), anyLong())).thenReturn(0);

        assertThrows(NotFoundException.class, () -> documentService.delete(1L));
    }

    @Test
    @DisplayName("更新标题 - 空标题应抛出异常")
    void testUpdateTitleEmpty() {
        assertThrows(IllegalArgumentException.class, () -> documentService.updateTitle(1L, null));
        assertThrows(IllegalArgumentException.class, () -> documentService.updateTitle(1L, ""));
        assertThrows(IllegalArgumentException.class, () -> documentService.updateTitle(1L, "   "));
    }

    @Test
    @DisplayName("更新标题 - 过长标题应抛出异常")
    void testUpdateTitleTooLong() {
        String longTitle = "a".repeat(300);
        assertThrows(IllegalArgumentException.class, () -> documentService.updateTitle(1L, longTitle));
    }

    private EditorDocument createTestDocument(Long id, String title) {
        EditorDocument doc = new EditorDocument();
        doc.setId(id);
        doc.setTitle(title);
        doc.setStatus("draft");
        doc.setSchemaVersion(1);
        doc.setCurrentVersion(1);

        ObjectNode content = objectMapper.createObjectNode();
        ObjectNode canvas = objectMapper.createObjectNode();
        canvas.put("width", 800);
        canvas.put("height", 600);
        content.set("canvas", canvas);
        content.set("layers", objectMapper.createArrayNode());
        doc.setContent(content.toString());

        return doc;
    }
}