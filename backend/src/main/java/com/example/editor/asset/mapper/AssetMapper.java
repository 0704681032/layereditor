package com.example.editor.asset.mapper;

import com.example.editor.asset.entity.EditorAsset;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AssetMapper {

    int insert(EditorAsset asset);

    EditorAsset selectById(@Param("id") Long id);

    List<EditorAsset> selectList(@Param("documentId") Long documentId,
                                  @Param("kind") String kind,
                                  @Param("offset") int offset,
                                  @Param("limit") int limit);

    long countByCondition(@Param("documentId") Long documentId,
                          @Param("kind") String kind);

    int updateDocumentId(@Param("id") Long id, @Param("documentId") Long documentId);
}
