package com.ssafy.lab.orak.recording.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QRecord is a Querydsl query type for Record
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QRecord extends EntityPathBase<Record> {

    private static final long serialVersionUID = 1366221798L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QRecord record = new QRecord("record");

    public final com.ssafy.lab.orak.common.entity.QBaseEntity _super = new com.ssafy.lab.orak.common.entity.QBaseEntity(this);

    //inherited
    public final DateTimePath<java.time.LocalDateTime> createdAt = _super.createdAt;

    public final NumberPath<Integer> durationSeconds = createNumber("durationSeconds", Integer.class);

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final NumberPath<Long> songId = createNumber("songId", Long.class);

    public final StringPath title = createString("title");

    //inherited
    public final DateTimePath<java.time.LocalDateTime> updatedAt = _super.updatedAt;

    public final com.ssafy.lab.orak.upload.entity.QUpload upload;

    public final NumberPath<Long> uploadId = createNumber("uploadId", Long.class);

    public final NumberPath<Long> userId = createNumber("userId", Long.class);

    public QRecord(String variable) {
        this(Record.class, forVariable(variable), INITS);
    }

    public QRecord(Path<? extends Record> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QRecord(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QRecord(PathMetadata metadata, PathInits inits) {
        this(Record.class, metadata, inits);
    }

    public QRecord(Class<? extends Record> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.upload = inits.isInitialized("upload") ? new com.ssafy.lab.orak.upload.entity.QUpload(forProperty("upload")) : null;
    }

}

