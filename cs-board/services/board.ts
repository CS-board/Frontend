import { apiClient } from '@/api/client'
import { API_ENDPOINTS } from '@/constants'
import type { ApiResponse, BoardPostListResponse, BoardPostDetail } from '@/types'

export const boardService = {
  async getList(page = 0, size = 20): Promise<BoardPostListResponse> {
    const res = await apiClient.get<ApiResponse<BoardPostListResponse>>(
      `${API_ENDPOINTS.BOARD.LIST}?page=${page}&size=${size}`
    )
    return res.data
  },

  async getDetail(postId: number): Promise<BoardPostDetail> {
    const res = await apiClient.get<ApiResponse<BoardPostDetail>>(
      API_ENDPOINTS.BOARD.DETAIL(postId)
    )
    return res.data
  },
}
