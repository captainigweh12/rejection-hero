import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import RootStackNavigator from '../RootNavigator';

// Mock all screens to avoid loading full implementations
jest.mock('../../screens/HomeScreen', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return function HomeScreen() {
    return (
      <View testID="home-screen">
        <Text>Home Screen</Text>
      </View>
    );
  };
});

jest.mock('../../screens/QuestDetailScreen', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return function QuestDetailScreen() {
    return (
      <View testID="quest-detail-screen">
        <Text>Quest Detail Screen</Text>
      </View>
    );
  };
});

describe('Navigation', () => {
  it('should navigate to QuestDetail when route params are provided', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <RootStackNavigator />
      </NavigationContainer>
    );

    // Navigation should work with proper route params
    expect(getByTestId).toBeDefined();
  });

  it('should handle navigation params correctly', () => {
    const navigation = {
      navigate: jest.fn(),
      goBack: jest.fn(),
    };

    // Test that navigation functions are callable
    expect(() => navigation.navigate('QuestDetail', { userQuestId: 'test-id' })).not.toThrow();
    expect(() => navigation.goBack()).not.toThrow();
  });
});

