package com.ssafy.lab.orak.upload.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QUpload is a Querydsl query type for Upload
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QUpload extends EntityPathBase<Upload> {

    private static final long serialVersionUID = 1006646904L;

    public static final QUpload upload = new QUpload("upload");

    public final com.ssafy.lab.orak.common.entity.QBaseEntity _super = new com.ssafy.lab.orak.common.entity.QBaseEntity(this);

    public final StringPath contentType = createString("contentType");

    //inherited
    public final DateTimePath<java.time.LocalDateTime> createdAt = _super.createdAt;

    public final StringPath directory = createString("directory");

    public final StringPath extension = createString("extension");

    public final NumberPath<Long> fileSize = createNumber("fileSize", Long.class);

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final StringPath originalFilename = createString("originalFilename");

    //inherited
    public final DateTimePath<java.time.LocalDateTime> updatedAt = _super.updatedAt;

    public final NumberPath<Long> uploaderId = createNumber("uploaderId", Long.class);

    public final StringPath uuid = createString("uuid");

    public QUpload(String variable) {
        super(Upload.class, forVariable(variable));
    }

    public QUpload(Path<? extends Upload> path) {
        super(path.getType(), path.getMetadata());
    }

    public QUpload(PathMetadata metadata) {
        super(Upload.class, metadata);
    }

}

