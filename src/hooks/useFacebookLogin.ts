import { useState, useEffect, useCallback } from 'react';

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

interface FacebookLoginState {
  isSDKLoaded: boolean;
  isLoading: boolean;
  isLoggedIn: boolean;
  pages: FacebookPage[];
  error: string | null;
}

declare global {
  interface Window {
    FB: {
      init: (config: {
        appId: string;
        cookie: boolean;
        xfbml: boolean;
        version: string;
      }) => void;
      login: (
        callback: (response: { authResponse?: { accessToken: string } }) => void,
        options?: { scope: string }
      ) => void;
      logout: (callback: () => void) => void;
      getLoginStatus: (
        callback: (response: { status: string; authResponse?: { accessToken: string } }) => void
      ) => void;
      api: (
        path: string,
        method: string,
        params: Record<string, string>,
        callback: (response: { data?: FacebookPage[]; error?: { message: string } }) => void
      ) => void;
    };
    fbAsyncInit: () => void;
  }
}

export function useFacebookLogin(appId: string | null) {
  const [state, setState] = useState<FacebookLoginState>({
    isSDKLoaded: false,
    isLoading: false,
    isLoggedIn: false,
    pages: [],
    error: null,
  });

  useEffect(() => {
    if (!appId) return;

    if (window.FB) {
      setState(prev => ({ ...prev, isSDKLoaded: true }));
      return;
    }

    window.fbAsyncInit = () => {
      window.FB.init({
        appId,
        cookie: true,
        xfbml: true,
        version: 'v18.0',
      });
      setState(prev => ({ ...prev, isSDKLoaded: true }));
    };

    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    document.body.appendChild(script);

    return () => {};
  }, [appId]);

  const fetchPages = useCallback((accessToken: string) => {
    return new Promise<FacebookPage[]>((resolve, reject) => {
      window.FB.api(
        '/me/accounts',
        'GET',
        { fields: 'id,name,access_token,category,picture', access_token: accessToken },
        (response) => {
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response.data || []);
          }
        }
      );
    });
  }, []);

  const login = useCallback(async () => {
    if (!window.FB || !state.isSDKLoaded) {
      setState(prev => ({ ...prev, error: 'Facebook SDK not loaded' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    return new Promise<void>((resolve, reject) => {
      window.FB.login(
        async (response) => {
          if (response.authResponse) {
            try {
              const pages = await fetchPages(response.authResponse.accessToken);
              setState(prev => ({
                ...prev,
                isLoading: false,
                isLoggedIn: true,
                pages,
              }));
              resolve();
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Failed to load pages';
              setState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
              }));
              reject(error);
            }
          } else {
            setState(prev => ({
              ...prev,
              isLoading: false,
              error: 'Facebook login was cancelled',
            }));
            reject(new Error('Login cancelled'));
          }
        },
        { scope: 'pages_show_list,pages_messaging,pages_read_engagement,pages_manage_metadata' }
      );
    });
  }, [state.isSDKLoaded, fetchPages]);

  const logout = useCallback(() => {
    if (window.FB) {
      window.FB.logout(() => {
        setState(prev => ({
          ...prev,
          isLoggedIn: false,
          pages: [],
        }));
      });
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    login,
    logout,
    clearError,
  };
}
