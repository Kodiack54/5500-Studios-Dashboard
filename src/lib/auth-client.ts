/**
 * Client-side auth utilities
 * Reads user info from dev_user cookie set by auth-7000
 */

'use client';

import Cookies from 'js-cookie';

export interface DevUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Auth service configuration
export const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'http://161.35.229.220:7000';
export const DASHBOARD_PORT = '5500';

/**
 * Get the current user from cookies (client-side)
 */
export function getUser(): DevUser | null {
  try {
    const userCookie = Cookies.get('dev_user');
    if (!userCookie) {
      return null;
    }
    return JSON.parse(decodeURIComponent(userCookie));
  } catch {
    return null;
  }
}

/**
 * Check if user is logged in
 */
export function isLoggedIn(): boolean {
  return !!Cookies.get('accessToken');
}

/**
 * Redirect to login page
 */
export function redirectToLogin(): void {
  window.location.href = `${AUTH_URL}/login?redirect=${DASHBOARD_PORT}`;
}

/**
 * Logout - clear cookies and redirect
 */
export function logout(): void {
  Cookies.remove('accessToken');
  Cookies.remove('dev_user');
  window.location.href = `${AUTH_URL}/logout`;
}
