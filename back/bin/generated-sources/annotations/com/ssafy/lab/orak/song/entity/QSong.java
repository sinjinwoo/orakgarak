package com.ssafy.lab.orak.song.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QSong is a Querydsl query type for Song
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QSong extends EntityPathBase<Song> {

    private static final long serialVersionUID = 215595680L;

    public static final QSong song = new QSong("song");

    public final com.ssafy.lab.orak.common.entity.QBaseEntity _super = new com.ssafy.lab.orak.common.entity.QBaseEntity(this);

    public final StringPath albumCoverUrl = createString("albumCoverUrl");

    public final StringPath albumName = createString("albumName");

    public final StringPath artistName = createString("artistName");

    //inherited
    public final DateTimePath<java.time.LocalDateTime> createdAt = _super.createdAt;

    public final NumberPath<Integer> durationMs = createNumber("durationMs", Integer.class);

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final StringPath lyrics = createString("lyrics");

    public final StringPath musicUrl = createString("musicUrl");

    public final NumberPath<Integer> popularity = createNumber("popularity", Integer.class);

    public final NumberPath<Long> songId = createNumber("songId", Long.class);

    public final StringPath songName = createString("songName");

    public final StringPath spotifyTrackId = createString("spotifyTrackId");

    public final StringPath status = createString("status");

    //inherited
    public final DateTimePath<java.time.LocalDateTime> updatedAt = _super.updatedAt;

    public QSong(String variable) {
        super(Song.class, forVariable(variable));
    }

    public QSong(Path<? extends Song> path) {
        super(path.getType(), path.getMetadata());
    }

    public QSong(PathMetadata metadata) {
        super(Song.class, metadata);
    }

}

