package com.example.editor.asset.service;

import com.example.editor.asset.dto.AssetResponse;
import com.example.editor.asset.entity.EditorAsset;
import com.example.editor.asset.mapper.AssetMapper;
import com.example.editor.common.exception.NotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * AssetService单元测试
 */
@ExtendWith(MockitoExtension.class)
class AssetServiceTest {

    @Mock
    private AssetMapper assetMapper;

    @InjectMocks
    private AssetService assetService;

    @BeforeEach
    void setup() {
        ReflectionTestUtils.setField(assetService, "baseUrl", "http://localhost:8080/uploads");
        ReflectionTestUtils.setField(assetService, "maxPageSize", 100);
        ReflectionTestUtils.setField(assetService, "maxBatchSize", 20);
        ReflectionTestUtils.setField(assetService, "dedupEnabled", true);
    }

    @Test
    @DisplayName("根据ID获取资产 - 存在时返回响应")
    void testGetAssetFound() {
        EditorAsset asset = createTestAsset(1L, "test.png", "image/png");
        when(assetMapper.selectById(1L)).thenReturn(asset);

        AssetResponse response = assetService.getAsset(1L);

        assertNotNull(response);
        assertEquals(1L, response.id());
        assertEquals("test.png", response.filename());
        verify(assetMapper).selectById(1L);
    }

    @Test
    @DisplayName("根据ID获取资产 - 不存在时抛出NotFoundException")
    void testGetAssetNotFound() {
        when(assetMapper.selectById(1L)).thenReturn(null);

        assertThrows(NotFoundException.class, () -> assetService.getAsset(1L));
        verify(assetMapper).selectById(1L);
    }

    @Test
    @DisplayName("根据SHA256查找重复资产 - 存在时返回Optional包含响应")
    void testFindDuplicateBySha256Found() {
        EditorAsset asset = createTestAsset(1L, "duplicate.png", "image/png");
        when(assetMapper.selectBySha256("abc123")).thenReturn(asset);

        Optional<AssetResponse> result = assetService.findDuplicateBySha256("abc123");

        assertTrue(result.isPresent());
        assertEquals(1L, result.get().id());
        verify(assetMapper).selectBySha256("abc123");
    }

    @Test
    @DisplayName("根据SHA256查找重复资产 - 不存在时返回空Optional")
    void testFindDuplicateBySha256NotFound() {
        when(assetMapper.selectBySha256("abc123")).thenReturn(null);

        Optional<AssetResponse> result = assetService.findDuplicateBySha256("abc123");

        assertFalse(result.isPresent());
        verify(assetMapper).selectBySha256("abc123");
    }

    @Test
    @DisplayName("批量删除 - 空ID列表应抛出异常")
    void testBatchDeleteEmptyIds() {
        assertThrows(IllegalArgumentException.class, () -> assetService.batchDelete(null));
        assertThrows(IllegalArgumentException.class, () -> assetService.batchDelete(java.util.List.of()));
    }

    @Test
    @DisplayName("批量删除 - 超过限制数量应抛出异常")
    void testBatchDeleteTooManyIds() {
        var tooManyIds = java.util.stream.LongStream.range(1, 25).boxed().toList();
        assertThrows(IllegalArgumentException.class, () -> assetService.batchDelete(tooManyIds));
    }

    @Test
    @DisplayName("获取存储统计信息")
    void testGetStorageStats() {
        when(assetMapper.countByCondition(null, null)).thenReturn(10L);
        when(assetMapper.selectTotalFileSize()).thenReturn(1024L * 1024L * 50L); // 50MB
        when(assetMapper.selectCountByKind("image")).thenReturn(8L);
        when(assetMapper.selectTotalSizeByKind("image")).thenReturn(1024L * 1024L * 40L); // 40MB

        AssetService.StorageStats stats = assetService.getStorageStats();

        assertEquals(10L, stats.totalFiles());
        assertEquals(1024L * 1024L * 50L, stats.totalSizeBytes());
        assertEquals(8L, stats.imageCount());
        assertEquals(1024L * 1024L * 40L, stats.imageSizeBytes());
    }

    private EditorAsset createTestAsset(Long id, String filename, String mimeType) {
        EditorAsset asset = new EditorAsset();
        asset.setId(id);
        asset.setFilename(filename);
        asset.setMimeType(mimeType);
        asset.setKind("image");
        asset.setFileSize(1024L);
        asset.setStorageKey("2024/01/test.png");
        asset.setWidth(100);
        asset.setHeight(100);
        return asset;
    }
}