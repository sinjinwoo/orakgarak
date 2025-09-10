// 더미 API 클라이언트 (실제 백엔드 연동 전까지 사용)
export const apiClient = {
  get: async (url: string, config?: any) => {
    console.log(`[더미 API] GET ${url}`, config);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { data: null };
  },
  
  post: async (url: string, data?: any, config?: any) => {
    console.log(`[더미 API] POST ${url}`, data, config);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { data: null };
  },
  
  put: async (url: string, data?: any, config?: any) => {
    console.log(`[더미 API] PUT ${url}`, data, config);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { data: null };
  },
  
  delete: async (url: string, config?: any) => {
    console.log(`[더미 API] DELETE ${url}`, config);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { data: null };
  }
};

export default apiClient;
