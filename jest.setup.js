// Jest setup file for React Native testing
import '@testing-library/jest-native/extend-expect';

// Mock React Native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock expo modules
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {},
    },
  },
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  MediaType: {
    Images: 'images',
    Videos: 'videos',
    All: 'all',
  },
}));

jest.mock('expo-av', () => ({
  Audio: {
    Recording: {
      createAsync: jest.fn(),
    },
    setAudioModeAsync: jest.fn(),
    requestPermissionsAsync: jest.fn(),
  },
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(),
}));

// Mock React Navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  canGoBack: jest.fn(() => true),
  isFocused: jest.fn(() => true),
  addListener: jest.fn(() => jest.fn()),
  removeListener: jest.fn(),
  getParent: jest.fn(),
  getState: jest.fn(),
  setOptions: jest.fn(),
};

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => mockNavigation,
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: jest.fn((callback) => callback()),
  };
});

// Mock React Query
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: jest.fn(({ queryFn, enabled = true }) => {
      if (!enabled) {
        return { data: undefined, isLoading: false, error: null, refetch: jest.fn() };
      }
      try {
        const data = queryFn ? queryFn() : undefined;
        return {
          data,
          isLoading: false,
          error: null,
          refetch: jest.fn(() => Promise.resolve({ data })),
        };
      } catch (error) {
        return {
          data: undefined,
          isLoading: false,
          error,
          refetch: jest.fn(),
        };
      }
    }),
    useMutation: jest.fn(({ mutationFn, onSuccess, onError }) => ({
      mutate: jest.fn((variables) => {
        try {
          const result = mutationFn ? mutationFn(variables) : Promise.resolve();
          if (onSuccess) onSuccess(result, variables);
          return result;
        } catch (error) {
          if (onError) onError(error, variables);
          throw error;
        }
      }),
      mutateAsync: jest.fn(async (variables) => {
        try {
          const result = mutationFn ? await mutationFn(variables) : Promise.resolve();
          if (onSuccess) onSuccess(result, variables);
          return result;
        } catch (error) {
          if (onError) onError(error, variables);
          throw error;
        }
      }),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
      data: null,
    })),
    useQueryClient: jest.fn(() => ({
      invalidateQueries: jest.fn(),
      refetchQueries: jest.fn(),
      setQueryData: jest.fn(),
      getQueryData: jest.fn(),
      fetchQuery: jest.fn(),
    })),
  };
});

// Mock API client
jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn(() => Promise.resolve({})),
    post: jest.fn(() => Promise.resolve({})),
    put: jest.fn(() => Promise.resolve({})),
    patch: jest.fn(() => Promise.resolve({})),
    delete: jest.fn(() => Promise.resolve({})),
  },
  uploadImage: jest.fn(() => Promise.resolve('https://example.com/image.jpg')),
  BACKEND_URL: 'https://api.rejectionhero.com',
}));

// Mock auth client
jest.mock('@/lib/authClient', () => ({
  authClient: {
    signIn: jest.fn(),
    signOut: jest.fn(),
    signUp: jest.fn(),
    getSession: jest.fn(() => Promise.resolve({ user: { id: 'test-user-id' } })),
    getCookie: jest.fn(() => 'test-cookie'),
  },
}));

// Mock session hook
jest.mock('@/lib/useSession', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
      },
    },
    isLoading: false,
    refetch: jest.fn(),
  })),
}));

// Mock theme context
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(() => ({
    theme: 'night',
    setTheme: jest.fn(),
    colors: {
      backgroundSolid: '#0A0A0F',
      backgroundGradient: ['#0A0A0F', '#1A1A24', '#2A1A34'],
      text: '#FFFFFF',
      textSecondary: 'rgba(255, 255, 255, 0.7)',
      textTertiary: 'rgba(255, 255, 255, 0.5)',
      primary: '#7E3FE4',
      card: 'rgba(255, 255, 255, 0.05)',
      cardBorder: 'rgba(255, 255, 255, 0.1)',
      surface: 'rgba(255, 255, 255, 0.03)',
      border: 'rgba(255, 255, 255, 0.1)',
      inputBorder: 'rgba(255, 255, 255, 0.2)',
      shadow: '#000000',
      error: '#FF3B30',
      success: '#4CAF50',
    },
    isDayMode: false,
  })),
  ThemeProvider: ({ children }) => children,
}));

// Mock language context
jest.mock('@/contexts/LanguageContext', () => ({
  useLanguage: jest.fn(() => ({
    language: 'en',
    t: (key: string) => key,
    setLanguage: jest.fn(),
  })),
  LanguageProvider: ({ children }) => children,
}));

// Mock sound service
jest.mock('@/services/soundService', () => ({
  playSound: jest.fn(() => Promise.resolve()),
}));

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

