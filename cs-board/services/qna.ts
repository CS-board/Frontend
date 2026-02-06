import { apiClient } from '@/api/client'
import { API_ENDPOINTS } from '@/constants'
import type { ApiResponse, QuestionListResponse, QuestionDetail } from '@/types'

export const qnaService = {
  async getList(page = 0, size = 10): Promise<QuestionListResponse> {
    const res = await apiClient.get<ApiResponse<QuestionListResponse>>(
      `${API_ENDPOINTS.QNA.LIST}?page=${page}&size=${size}`
    )
    return res.data
  },

  async getDetail(id: number): Promise<QuestionDetail> {
    const res = await apiClient.get<ApiResponse<QuestionDetail>>(
      API_ENDPOINTS.QNA.DETAIL(id)
    )
    return res.data
  },

  async create(title: string, content: string): Promise<{ id: number }> {
    const res = await apiClient.post<ApiResponse<{ id: number }>>(
      API_ENDPOINTS.QNA.CREATE,
      { title, content }
    )
    return res.data
  },

  async update(id: number, title: string, content: string): Promise<void> {
    await apiClient.patch(API_ENDPOINTS.QNA.UPDATE(id), { title, content })
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.QNA.DELETE(id))
  },

  async toggleLike(id: number): Promise<{ liked: boolean; likeCount: number }> {
    const res = await apiClient.post<ApiResponse<{ liked: boolean; likeCount: number }>>(
      API_ENDPOINTS.QNA.LIKE_TOGGLE(id)
    )
    return res.data
  },

  async markSolved(id: number, solved: boolean): Promise<void> {
    await apiClient.post(
      `${API_ENDPOINTS.QNA.SOLVE(id)}?solved=${solved}`
    )
  },

  async createComment(questionId: number, content: string): Promise<{ id: number }> {
    const res = await apiClient.post<ApiResponse<{ id: number }>>(
      API_ENDPOINTS.QNA.COMMENT_CREATE(questionId),
      { content }
    )
    return res.data
  },

  async updateComment(questionId: number, commentId: number, content: string): Promise<void> {
    await apiClient.patch(
      API_ENDPOINTS.QNA.COMMENT_UPDATE(questionId, commentId),
      { content }
    )
  },

  async deleteComment(questionId: number, commentId: number): Promise<void> {
    await apiClient.delete(
      API_ENDPOINTS.QNA.COMMENT_DELETE(questionId, commentId)
    )
  },
}
