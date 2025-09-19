import { useQuery, useQueryClient } from "@tanstack/react-query";
import { songService } from "../services/songApi";
import { Song, SongSearchResponse, SongDetailResponse } from "../types/song";
import { ApiError } from "../types/recording";

export const SONG_QUERY_KEYS = {
  all: ["songs"] as const,
  search: (keyword: string) =>
    [...SONG_QUERY_KEYS.all, "search", keyword] as const,
  detail: (songId: number) =>
    [...SONG_QUERY_KEYS.all, "detail", songId] as const,
};

/**
 * 실시간 곡 검색 훅
 * @param keyword 검색 키워드
 * @param enabled 검색 활성화 여부
 */
export const useSongSearch = (keyword: string, enabled: boolean = true) => {
  return useQuery<SongSearchResponse, ApiError>({
    queryKey: SONG_QUERY_KEYS.search(keyword),
    queryFn: () => songService.searchSongs(keyword),
    enabled: enabled && keyword.length > 0,
    staleTime: 30 * 1000, // 30초
    retry: (failureCount, error) => {
      if (error.statusCode === 404 || error.statusCode === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

/**
 * 특정 곡 상세 정보 조회 훅
 * @param songId 곡 ID
 * @param enabled 조회 활성화 여부
 */
export const useSongDetail = (songId: number, enabled: boolean = true) => {
  return useQuery<SongDetailResponse, ApiError>({
    queryKey: SONG_QUERY_KEYS.detail(songId),
    queryFn: () => songService.getSongDetail(songId),
    enabled: enabled && !!songId,
    staleTime: 5 * 60 * 1000, // 5분
    retry: (failureCount, error) => {
      if (error.statusCode === 404 || error.statusCode === 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

/**
 * 곡 검색 결과 프리페치 훅
 */
export const usePrefetchSong = () => {
  const queryClient = useQueryClient();

  return {
    prefetchSongDetail: (songId: number) => {
      queryClient.prefetchQuery({
        queryKey: SONG_QUERY_KEYS.detail(songId),
        queryFn: () => songService.getSongDetail(songId),
        staleTime: 5 * 60 * 1000,
      });
    },
    prefetchSongSearch: (keyword: string) => {
      if (keyword.length > 0) {
        queryClient.prefetchQuery({
          queryKey: SONG_QUERY_KEYS.search(keyword),
          queryFn: () => songService.searchSongs(keyword),
          staleTime: 30 * 1000,
        });
      }
    },
  };
};
