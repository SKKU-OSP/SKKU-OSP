export function tokenLoader() {
  const token = localStorage.getItem('access_token');

  if (!token) {
    return null;
  }
  return token;
}

export function tokenRemover() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');

  return null;
}

export function getAuthConfig() {
  const token = localStorage.getItem('access_token');
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
  return config;
}
