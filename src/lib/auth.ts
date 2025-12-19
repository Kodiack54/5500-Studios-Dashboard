/**
 * Auth utilities for Kodiack Dashboard
 * Works with auth-7000 service for JWT token management
 */

import { cookies } from 'next/headers';

// Auth service configuration
export const AUTH_URL = process.env.AUTH_URL || 'http://161.35.229.220:7000';
export const DASHBOARD_PORT = '5500';

export interface DevUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

/**
 * Get the current user from cookies (server-side)
 */
export async function getUser(): Promise<DevUser | null> {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get('dev_user');

    if (!userCookie?.value) {
      return null;
    }

    return JSON.parse(decodeURIComponent(userCookie.value));
  } catch {
    return null;
  }
}

/**
 * Check if user has a valid access token (server-side)
 */
export async function hasValidToken(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken');
    return !!token?.value;
  } catch {
    return false;
  }
}

/**
 * Get login URL with redirect back to this dashboard
 */
export function getLoginUrl(redirectPath: string = '/'): string {
  return `${AUTH_URL}/login?redirect=${DASHBOARD_PORT}`;
}

/**
 * Get logout URL
 */
export function getLogoutUrl(): string {
  return `${AUTH_URL}/logout`;
}
