import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// CSRF token utility functions
export const getCSRFToken = (): string | null => {
  // Get CSRF token from session cookie or localStorage
  if (typeof window !== 'undefined') {
    // Try to get from localStorage first (if stored there)
    const storedToken = localStorage.getItem('csrfToken');
    if (storedToken) {
      return storedToken;
    }
  }
  return null;
};

export const setCSRFToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('csrfToken', token);
  }
};

// Enhanced fetch function with CSRF token
export const fetchWithCSRF = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const csrfToken = getCSRFToken();
  
  const enhancedOptions: RequestInit = {
    ...options,
    credentials: 'include', // Include cookies
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
    },
  };

  const response = await fetch(url, enhancedOptions);
  
  // If we get a CSRF error, clear the token and retry once
  if (response.status === 403) {
    const errorData = await response.json().catch(() => ({}));
    if (errorData.error === 'INVALID_CSRF_TOKEN') {
      localStorage.removeItem('csrfToken');
      // Retry without CSRF token (session will generate new one)
      const retryOptions = {
        ...options,
        credentials: 'include',
        headers: {
          ...options.headers,
          'Content-Type': 'application/json',
        },
      };
      return fetch(url, retryOptions);
    }
  }
  
  return response;
};
