/**
 * API Client Module
 *
 * This module provides a centralized API client for making HTTP requests to the backend.
 * It handles authentication, request formatting, error handling, and response parsing.
 */

// Import fetch from expo/fetch for React Native compatibility
// This ensures fetch works correctly across different platforms (iOS, Android, Web)
import { fetch as expoFetch } from "expo/fetch";

// Import the authentication client to access user session cookies
import { authClient } from "./authClient";

/**
 * Backend URL Configuration
 *
 * The backend URL is configured via environment variable.
 * Production: https://api.rejectionhero.com
 * Development: http://localhost:3000 (fallback)
 */
// Get backend URL with fallback for development/Expo Go
const getBackendURL = () => {
  const PRODUCTION_URL = "https://api.rejectionhero.com";
  let url = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL;

  // Use the configured URL directly (don't override sandbox URLs)
  // Sandbox URLs are valid for preview/staging environments
  if (url) {
    return url;
  }

  return __DEV__ ? "http://localhost:3000" : PRODUCTION_URL;
};

const BACKEND_URL = getBackendURL();

if (!BACKEND_URL) {
  console.error("❌ BACKEND_URL is not set. Available env vars:", Object.keys(process.env).filter(k => k.includes("BACKEND")));
  // Don't throw in development - show warning instead
  if (__DEV__) {
    console.warn("⚠️ Running in development mode without BACKEND_URL. Some features may not work.");
  } else {
    throw new Error("Backend URL setup has failed. Please contact support@vibecodeapp.com for help.");
  }
}
console.log("✅ API Client initialized with backend URL:", BACKEND_URL);

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

type FetchOptions = {
  method: HttpMethod;
  body?: object | FormData; // Request body, will be JSON stringified before sending (or sent as-is for FormData)
};

/**
 * Core Fetch Function
 *
 * A generic, type-safe wrapper around the fetch API that handles all HTTP requests.
 *
 * @template T - The expected response type (for type safety)
 * @param path - The API endpoint path (e.g., "/api/posts")
 * @param options - Configuration object containing HTTP method and optional body
 * @returns Promise resolving to the typed response data
 *
 * Features:
 * - Automatic authentication: Attaches session cookies from authClient
 * - JSON handling: Automatically stringifies request bodies and parses responses
 * - FormData support: Automatically detects FormData and sets correct headers
 * - Error handling: Throws descriptive errors with status codes and messages
 * - Type safety: Returns strongly-typed responses using TypeScript generics
 *
 * @throws Error if the response is not ok (status code outside 200-299 range)
 */
const fetchFn = async <T>(path: string, options: FetchOptions): Promise<T> => {
  const { method, body } = options;
  // Step 1: Authentication - Retrieve session cookies from the auth client
  // These cookies are used to identify the user and maintain their session
  const headers = new Map<string, string>();
  const cookies = authClient.getCookie();
  if (cookies) {
    headers.set("Cookie", cookies);
  }

  // Detect if body is FormData
  const isFormData = body instanceof FormData;

  // Step 2: Make the HTTP request
  try {
    // Construct the full URL by combining the base backend URL with the endpoint path
    const response = await expoFetch(`${BACKEND_URL}${path}`, {
      method,
      headers: {
        // Only set Content-Type for JSON, let browser set it for FormData
        ...(!isFormData ? { "Content-Type": "application/json" } : {}),
        // Include authentication cookies if available
        ...(cookies ? { Cookie: cookies } : {}),
      },
      // Stringify the body if it's JSON, or send FormData as-is
      body: body
        ? (isFormData ? body : JSON.stringify(body))
        : undefined,
      // Include credentials for better iOS compatibility
      credentials: "include",
    });

    // Step 3: Error handling - Check if the response was successful
    if (!response.ok) {
      // Parse the error details from the response body
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }
      // Create error object with parsed data attached
      const error: any = new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
      // Attach all error data properties to the error object for easy access
      Object.assign(error, errorData);
      error.status = response.status;
      error.statusText = response.statusText;
      throw error;
    }

    // Step 4: Parse and return the successful response as JSON
    // The response is cast to the expected type T for type safety
    return response.json() as Promise<T>;
  } catch (error: any) {
    // Check for bad gateway (502) errors - backend server is down or unreachable
    const is502Error = error.status === 502 || error.message?.includes('bad gateway');
    
    // Enhanced error logging for debugging - but skip 400/403/500/502 errors (validation/subscription/server errors)
    // These are handled gracefully by the app, so we don't want red error screens
    const is400Error = error.status === 400;
    const is403Error = error.status === 403;
    const is500Error = error.status === 500;
    
    if (is502Error) {
      // Log 502 errors non-disruptively - backend is likely down or unreachable
      console.warn(`[API Warning] ${method} ${path}: Backend server unreachable (502 Bad Gateway). The server may be down or the URL is incorrect.`);
      // Create a more user-friendly error message
      const gatewayError: any = new Error(`Backend server is temporarily unavailable. Please try again in a moment.`);
      gatewayError.status = 502;
      gatewayError.isGatewayError = true;
      gatewayError.originalError = error;
      throw gatewayError;
    }
    
    if (!is400Error && !is403Error && !is500Error) {
      console.error(`[API Error] ${method} ${path}:`, error);
    } else {
      // Log non-disruptively for debugging
      console.log(`[API ${error.status}] ${method} ${path}:`, error.message);
    }

    // Check for network-specific errors
    if (error.message) {
      if (error.message.includes('Network request failed')) {
        throw new Error(`Network error: Unable to connect to backend. Please check your connection.`);
      }
      if (error.message.includes('hostname could not be found') || error.message.includes('fetch failed')) {
        // This is a DNS/hostname resolution error - likely temporary
        // The error will be caught by React Query retry logic
        throw new Error(`Connection error: Unable to reach the server. Retrying...`);
      }
      if (error.message.includes('bad gateway')) {
        const gatewayError: any = new Error(`Backend server is temporarily unavailable. Please try again in a moment.`);
        gatewayError.status = 502;
        gatewayError.isGatewayError = true;
        throw gatewayError;
      }
    }

    // Re-throw the error so the calling code can handle it appropriately
    throw error;
  }
};

/**
 * API Client Object
 *
 * Provides convenient methods for making HTTP requests with different methods.
 * Each method is a thin wrapper around fetchFn with the appropriate HTTP verb.
 *
 * Usage Examples:
 *
 * // GET request - Fetch data
 * const posts = await api.get<Post[]>('/api/posts');
 *
 * // POST request - Create new data
 * const newPost = await api.post<Post>('/api/posts', {
 *   title: 'My Post',
 *   content: 'Hello World'
 * });
 *
 * // PUT request - Replace existing data
 * const updatedPost = await api.put<Post>('/api/posts/123', {
 *   title: 'Updated Title',
 *   content: 'Updated Content'
 * });
 *
 * // PATCH request - Partially update existing data
 * const patchedPost = await api.patch<Post>('/api/posts/123', {
 *   title: 'New Title Only'
 * });
 *
 * // DELETE request - Remove data
 * await api.delete('/api/posts/123');
 */
const api = {
  /**
   * GET - Retrieve data from the server
   * @template T - Expected response type
   * @param path - API endpoint path
   */
  get: <T>(path: string) => fetchFn<T>(path, { method: "GET" }),

  /**
   * POST - Create new data on the server
   * @template T - Expected response type
   * @param path - API endpoint path
   * @param body - Optional request body containing data to create
   */
  post: <T>(path: string, body?: object) => fetchFn<T>(path, { method: "POST", body }),

  /**
   * PUT - Replace existing data on the server
   * @template T - Expected response type
   * @param path - API endpoint path
   * @param body - Optional request body containing data to replace
   */
  put: <T>(path: string, body?: object) => fetchFn<T>(path, { method: "PUT", body }),

  /**
   * PATCH - Partially update existing data on the server
   * @template T - Expected response type
   * @param path - API endpoint path
   * @param body - Optional request body containing partial data to update
   */
  patch: <T>(path: string, body?: object) => fetchFn<T>(path, { method: "PATCH", body }),

  /**
   * DELETE - Remove data from the server
   * @template T - Expected response type
   * @param path - API endpoint path
   */
  delete: <T>(path: string) => fetchFn<T>(path, { method: "DELETE" }),
};

/**
 * Upload image with authentication
 * Helper function for uploading images with FormData while maintaining authentication
 */
const uploadImage = async (imageUri: string, filename?: string): Promise<string> => {
  const formData = new FormData();
  const fileExtension = imageUri.split(".").pop() || "jpg";
  const finalFilename = filename || `image.${fileExtension}`;
  const match = /\.(\w+)$/.exec(finalFilename);
  const type = match ? `image/${match[1]}` : "image/jpeg";

  formData.append("image", {
    uri: imageUri,
    name: finalFilename,
    type,
  } as any);

  const cookies = authClient.getCookie();
  
  const response = await expoFetch(`${BACKEND_URL}/api/upload/image`, {
    method: "POST",
    body: formData,
    headers: {
      // Don't set Content-Type for FormData - let the browser set it with boundary
      ...(cookies ? { Cookie: cookies } : {}),
    },
    credentials: "include",
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }
    throw new Error(
      `Upload Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`,
    );
  }

  const uploadData = await response.json();
  return `${BACKEND_URL}${uploadData.url}`;
};

// Export the API client, upload helper, and backend URL to be used in other modules
export { api, uploadImage, BACKEND_URL };
