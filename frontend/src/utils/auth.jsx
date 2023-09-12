export function tokenLoader() {
  // 토큰 존재 확인 (로그인 여부)
  const token = localStorage.getItem('access_token');
  if (!token) return null;
  // 토큰 만료시간 확인 (로그인 시간 확인)
  const tokenDuration = getTokenDuration();
  if (tokenDuration < 0) return 'EXPIRED';

  return token;
}

export function tokenRemover() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('expiration');

  return null;
}

export function getAuthConfig() {
  const token = localStorage.getItem('access_token');

  if (!token) return undefined;
  const duration = getTokenDuration();
  if (!duration || duration < 0) return undefined;

  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
  return config;
}

export function getTokenDuration() {
  const storedExpirationDate = localStorage.getItem('expiration');
  if (!storedExpirationDate) return null;

  const expirationDate = new Date(storedExpirationDate);
  const now = new Date();
  const duration = expirationDate.getTime() - now.getTime();
  return duration;
}

export function setExpiration() {
  const expiration = new Date();
  // 더하는 시간은 백엔드에 설정된 시간과 동일하게 설정
  expiration.setHours(expiration.getHours() + 4);

  localStorage.setItem('expiration', expiration.toISOString());
}
