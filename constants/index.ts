/** 라우트 경로·API 경로(prefix는 NEXT_PUBLIC_API_BASE_URL 뒤에 붙음)·토큰 키 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  RANKING: '/ranking',
  MY_RECORD: '/my-record',
  QNA: '/qna',
  BOARD: '/board',
  SETTINGS: '/settings',
  CHANGE_PASSWORD: '/change-password',
} as const

export const API_ENDPOINTS = {
  REGISTER: {
    DEPARTMENTS: '/register',
    SIGNUP: '/register',
    MAIL_SEND: '/register/mail',
    MAIL_VERIFY: '/register/mail/verification',
    BAEKJOON_VALIDATE: '/register/baekjoon/validate',
  },
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PASSWORD_MAIL: '/auth/password/mail',
    PASSWORD_MAIL_VERIFY: '/auth/password/mail/verification',
    PASSWORD_RESET: '/auth/password/reset',
  },
  CHALLENGES: {
    RANKINGS: (id: number) => `/challenges/${id}/rankings`,
    INFO_SUMMARY: (id: number) => `/challenges/${id}/details`,
    INFO_DETAILS: (id: number) => `/challenges/${id}/details`,
  },
  ME: {
    SUMMARY: '/me/records/summary',
    WEEKS: '/me/records/weeks',
    PROGRESS_SUMMARY: (challengeId: number) => `/me/records/${challengeId}/progress-summary`,
    DAILY_SOLVED: (challengeId: number) => `/me/records/${challengeId}/solved-problems`,
    GOAL_POINTS: '/users/me/goal-points',
  },
  USERS: {
    ME_DETAIL: '/users/me/detail',
    GRADE: '/users/me/grade',
    DEPARTMENT: '/users/me/department',
    WITHDRAW: '/users/me',
  },
  BOARD: {
    LIST: '/board/posts',
    DETAIL: (id: number) => `/board/posts/${id}`,
  },
  QNA: {
    LIST: '/qna/questions',
    DETAIL: (id: number) => `/qna/questions/${id}`,
    CREATE: '/qna/questions',
    DELETE: (id: number) => `/qna/questions/${id}`,
    UPDATE: (id: number) => `/qna/questions/${id}`,
    LIKE_TOGGLE: (id: number) => `/qna/questions/${id}/likes/toggle`,
    SOLVE: (id: number) => `/qna/questions/${id}/solve`,
    COMMENT_CREATE: (questionId: number) => `/qna/questions/${questionId}/comments`,
    COMMENT_DELETE: (questionId: number, commentId: number) => `/qna/questions/${questionId}/comments/${commentId}`,
    COMMENT_UPDATE: (questionId: number, commentId: number) => `/qna/questions/${questionId}/comments/${commentId}`,
  },
} as const

export const MOBILE_BREAKPOINT = 768

export const TOKEN_KEY = 'chipsat_token'
