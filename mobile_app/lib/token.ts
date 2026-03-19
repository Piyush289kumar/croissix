// mobile_app\lib\token.ts

export const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
};

export const getRefreshToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refreshToken");
};

export const getAuthHeader = () => {
  const token = getToken();
  return token ? `Bearer ${token}` : null;
};
