// Lightweight token store shared between the API client and the AuthContext.
// Kept outside React so the fetch wrapper can read the current token without
// importing React context (avoids circular imports).

const STORAGE_KEY = 'yourfin_token';

let currentToken: string | null =
  typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;

export function getToken(): string | null {
  return currentToken;
}

export function setToken(token: string | null): void {
  currentToken = token;
  if (typeof localStorage === 'undefined') return;
  if (token) {
    localStorage.setItem(STORAGE_KEY, token);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}
