import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Get CSRF token from user data if available
  const userData = queryClient.getQueryData(["/api/user"]) as any;
  const csrfToken = userData?.csrfToken;
  
  const headers: Record<string, string> = {};
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  // Temporarily disable CSRF tokens since CSRF protection is disabled
  // if (csrfToken) {
  //   headers["X-CSRF-Token"] = csrfToken;
  // }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    const fullUrl = url.startsWith("http") ? url : `http://localhost:5000${url}`;
    
    // Request logging removed for cleaner console
    
    // Get CSRF token from user data if available
    const userData = queryClient.getQueryData(["/api/user"]) as any;
    const csrfToken = userData?.csrfToken;
    
    const headers: Record<string, string> = {};
    // Temporarily disable CSRF tokens since CSRF protection is disabled
    // if (csrfToken) {
    //   headers["X-CSRF-Token"] = csrfToken;
    // }
    
    const res = await fetch(fullUrl, {
      credentials: "include",
      headers,
    });

    // Response logging removed for cleaner console

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      if (process.env.NODE_ENV === 'development') {
        console.log("401 Unauthorized - returning null");
      }
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
