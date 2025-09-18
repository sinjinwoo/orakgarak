package com.ssafy.lab.orak.comment.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QComment is a Querydsl query type for Comment
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QComment extends EntityPathBase<Comment> {

    private static final long serialVersionUID = -1768840836L;

    public static final QComment comment = new QComment("comment");

    public final NumberPath<Long> albumId = createNumber("albumId", Long.class);

    public final StringPath content = createString("content");

    public final NumberPath<Long> createdAt = createNumber("createdAt", Long.class);

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final BooleanPath isDeleted = createBoolean("isDeleted");

    public final NumberPath<Long> parentCommentId = createNumber("parentCommentId", Long.class);

    public final NumberPath<Long> updatedAt = createNumber("updatedAt", Long.class);

    public final NumberPath<Long> userId = createNumber("userId", Long.class);

    public QComment(String variable) {
        super(Comment.class, forVariable(variable));
    }

    public QComment(Path<? extends Comment> path) {
        super(path.getType(), path.getMetadata());
    }

    public QComment(PathMetadata metadata) {
        super(Comment.class, metadata);
    }

}

