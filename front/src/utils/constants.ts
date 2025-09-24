// 애플리케이션 전역 상수들

// API 관련 상수
export const API_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// UI 관련 상수
export const UI_CONSTANTS = {
  HEADER_HEIGHT: 80,
  FOOTER_HEIGHT: 60,
  SIDEBAR_WIDTH: 280,
  MOBILE_BREAKPOINT: 768,
} as const;

// 로컬스토리지 키
export const STORAGE_KEYS = {
  FEED_ALBUMS: 'feedAlbums',
  MY_ALBUMS: 'myAlbums',
  FOLLOWING_USERS: 'followingUsers',
  USER_PREFERENCES: 'userPreferences',
  BACKGROUND_IMAGE: 'backgroundImage',
} as const;

// 에러 메시지
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  SERVER_ERROR: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  UNAUTHORIZED: '인증이 필요합니다.',
  FORBIDDEN: '접근 권한이 없습니다.',
  NOT_FOUND: '요청한 데이터를 찾을 수 없습니다.',
  VALIDATION_ERROR: '입력한 정보를 다시 확인해주세요.',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.',
} as const;

// 성공 메시지
export const SUCCESS_MESSAGES = {
  ALBUM_CREATED: '앨범이 성공적으로 생성되었습니다.',
  ALBUM_UPDATED: '앨범이 성공적으로 수정되었습니다.',
  ALBUM_DELETED: '앨범이 성공적으로 삭제되었습니다.',
  LIKE_ADDED: '좋아요를 눌렀습니다.',
  LIKE_REMOVED: '좋아요를 취소했습니다.',
  FOLLOW_ADDED: '팔로우했습니다.',
  FOLLOW_REMOVED: '언팔로우했습니다.',
  COMMENT_ADDED: '댓글이 추가되었습니다.',
  COMMENT_DELETED: '댓글이 삭제되었습니다.',
} as const;

// 경고 메시지
export const WARNING_MESSAGES = {
  NETWORK_RETRY: '네트워크 문제로 데이터를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.',
  DATA_LOAD_FAILED: '데이터를 불러오는데 문제가 발생했습니다.',
  INCOMPLETE_DATA: '일부 데이터가 누락되었습니다.',
} as const;

// 애니메이션 관련 상수
export const ANIMATION_CONSTANTS = {
  DEFAULT_DURATION: 0.3,
  FAST_DURATION: 0.15,
  SLOW_DURATION: 0.5,
  SPRING_CONFIG: {
    tension: 300,
    friction: 30,
  },
} as const;

// 음악 관련 상수
export const MUSIC_CONSTANTS = {
  DEFAULT_DURATION: 0,
  MIN_VOLUME: 0,
  MAX_VOLUME: 100,
  DEFAULT_VOLUME: 50,
  SUPPORTED_FORMATS: ['mp3', 'wav', 'm4a', 'ogg'],
} as const;

// 사용자 관련 상수
export const USER_CONSTANTS = {
  MIN_NICKNAME_LENGTH: 2,
  MAX_NICKNAME_LENGTH: 20,
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 50,
  DEFAULT_AVATAR: '/images/default-avatar.png',
  DEFAULT_BACKGROUND: '/images/default-background.jpg',
} as const;
