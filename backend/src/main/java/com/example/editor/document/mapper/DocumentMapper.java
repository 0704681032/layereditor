package com.example.editor.document.mapper;

import com.example.editor.document.entity.EditorDocument;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface DocumentMapper {

    EditorDocument selectByIdForOwner(@Param("id") Long id, @Param("ownerId") Long ownerId);

    List<EditorDocument> selectPageByOwner(@Param("ownerId") Long ownerId);

    int insert(EditorDocument document);

    int updateDocument(
        @Param("id") Long id,
        @Param("ownerId") Long ownerId,
        @Param("title") String title,
        @Param("schemaVersion") Integer schemaVersion,
        @Param("content") String content,
        @Param("currentVersion") Integer currentVersion
    );

    int updateTitle(@Param("id") Long id, @Param("ownerId") Long ownerId, @Param("title") String title);

    int softDelete(@Param("id") Long id, @Param("ownerId") Long ownerId);
}
