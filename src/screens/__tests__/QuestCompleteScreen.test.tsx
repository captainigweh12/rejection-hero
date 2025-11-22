import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import QuestCompleteScreen from '../QuestCompleteScreen';
import type { RootStackParamList } from '@/navigation/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// Mock navigation
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

const mockRoute = {
  params: {
    questData: {
      questTitle: 'Ask 5 strangers for directions',
      questCategory: 'SOCIAL',
      xpEarned: 100,
      pointsEarned: 50,
      noCount: 3,
      yesCount: 2,
      actionCount: 5,
    },
    onContinue: jest.fn(),
  },
  key: 'test-key',
  name: 'QuestComplete' as keyof RootStackParamList,
};

const mockProps = {
  navigation: mockNavigation as any,
  route: mockRoute as any,
} as NativeStackScreenProps<RootStackParamList, 'QuestComplete'>;

describe('QuestCompleteScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render quest completion data correctly', () => {
    const { getByText } = render(<QuestCompleteScreen {...mockProps} />);
    
    expect(getByText('Ask 5 strangers for directions')).toBeTruthy();
    expect(getByText(/100/)).toBeTruthy(); // XP
    expect(getByText(/50/)).toBeTruthy(); // Points
  });

  it('should call onContinue when Continue button is pressed', async () => {
    const { getByTestId } = render(<QuestCompleteScreen {...mockProps} />);
    
    // Wait for animations to complete
    await waitFor(() => {
      const continueButton = getByTestId('quest-complete-continue-button');
      expect(continueButton).toBeTruthy();
    }, { timeout: 3000 });

    const continueButton = getByTestId('quest-complete-continue-button');
    fireEvent.press(continueButton);

    await waitFor(() => {
      expect(mockRoute.params.onContinue).toHaveBeenCalledTimes(1);
    });
  });

  it('should display correct stats', () => {
    const { getByText } = render(<QuestCompleteScreen {...mockProps} />);
    
    // Check that stats are displayed
    expect(getByText(/100/)).toBeTruthy(); // XP
    expect(getByText(/50/)).toBeTruthy(); // Points
  });
});

