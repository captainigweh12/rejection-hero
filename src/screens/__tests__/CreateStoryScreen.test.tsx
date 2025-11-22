import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CreateStoryScreen from '../CreateStoryScreen';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '@/lib/api';
import { api } from '@/lib/api';

// Mock dependencies
jest.mock('expo-image-picker');
jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  uploadImage: jest.fn(),
}));

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
    initialCaption: 'Test caption',
  },
  key: 'test-key',
  name: 'CreateStory' as const,
};

describe('CreateStoryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (uploadImage as jest.Mock).mockResolvedValue('https://example.com/image.jpg');
    (api.post as jest.Mock).mockResolvedValue({ id: 'story-123' });
  });

  it('should pre-fill caption from route params', () => {
    const { getByDisplayValue } = render(
      <CreateStoryScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    expect(getByDisplayValue('Test caption')).toBeTruthy();
  });

  it('should allow selecting image from library', async () => {
    const mockImageResult = {
      canceled: false,
      assets: [{ uri: 'file:///path/to/image.jpg', type: 'image' }],
    };
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue(mockImageResult);

    const { getByTestId } = render(
      <CreateStoryScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    const selectImageButton = getByTestId('select-image-button');
    fireEvent.press(selectImageButton);

    await waitFor(() => {
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
    });
  });

  it('should upload image and create story on share', async () => {
    const mockImageResult = {
      canceled: false,
      assets: [{ uri: 'file:///path/to/image.jpg', type: 'image' }],
    };
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue(mockImageResult);
    (uploadImage as jest.Mock).mockResolvedValue('https://example.com/image.jpg');

    const { getByTestId } = render(
      <CreateStoryScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    // Select image
    const selectImageButton = getByTestId('select-image-button');
    fireEvent.press(selectImageButton);

    await waitFor(() => {
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
    });

    // Share story
    const shareButton = getByTestId('share-story-button');
    fireEvent.press(shareButton);

    await waitFor(() => {
      expect(uploadImage).toHaveBeenCalledWith('file:///path/to/image.jpg', expect.any(String));
      expect(api.post).toHaveBeenCalledWith(
        '/api/stories',
        expect.objectContaining({
          imageUrl: 'https://example.com/image.jpg',
        })
      );
    });
  });

  it('should handle upload errors gracefully', async () => {
    const mockImageResult = {
      canceled: false,
      assets: [{ uri: 'file:///path/to/image.jpg', type: 'image' }],
    };
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue(mockImageResult);
    (uploadImage as jest.Mock).mockRejectedValue(new Error('Upload failed'));

    const { getByTestId } = render(
      <CreateStoryScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    const selectImageButton = getByTestId('select-image-button');
    fireEvent.press(selectImageButton);

    await waitFor(() => {
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
    });

    const shareButton = getByTestId('share-story-button');
    fireEvent.press(shareButton);

    await waitFor(() => {
      expect(uploadImage).toHaveBeenCalled();
      // Should show error alert (mocked in setup)
    });
  });
});

