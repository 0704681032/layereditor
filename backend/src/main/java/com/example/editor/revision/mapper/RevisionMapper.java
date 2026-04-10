package com.example.editor.revision.mapper;

import com.example.editor.revision.entity.EditorDocumentRevision;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface RevisionMapper {

    int insert(EditorDocumentRevision revision);

    List<EditorDocumentRevision> selectByDocumentId(@Param("documentId") Long documentId);

    EditorDocumentRevision selectById(@Param("id") Long id, @Param("documentId") Long documentId);
}
