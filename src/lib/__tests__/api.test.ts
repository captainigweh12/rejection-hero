import { api, uploadImage } from '../api';
import { authClient } from '../authClient';

// Mock fetch
global.fetch = jest.fn();

// Mock authClient
jest.mock('../authClient', () => ({
  authClient: {
    getCookie: jest.fn(() => 'test-cookie=value'),
  },
}));

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('api.get', () => {
    it('should make GET request with correct headers', async () => {
      const mockResponse = { data: 'test' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await api.get('/api/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Cookie: 'test-cookie=value',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Resource not found' }),
      });

      await expect(api.get('/api/test')).rejects.toThrow();
    });
  });

  describe('api.post', () => {
    it('should make POST request with JSON body', async () => {
      const mockResponse = { id: '123' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const body = { name: 'Test' };
      const result = await api.post('/api/test', body);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(body),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('uploadImage', () => {
    it('should upload image with correct FormData structure', async () => {
      const mockResponse = { url: '/uploads/image.jpg' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const imageUri = 'file:///path/to/image.jpg';
      const result = await uploadImage(imageUri, 'test.jpg');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/upload/image'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      );
      expect(result).toContain('image.jpg');
    });

    it('should handle video uploads', async () => {
      const mockResponse = { url: '/uploads/video.mp4' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const videoUri = 'file:///path/to/video.mp4';
      const result = await uploadImage(videoUri, 'test.mp4');

      expect(result).toContain('video.mp4');
    });

    it('should throw error on upload failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Upload failed' }),
      });

      await expect(uploadImage('file:///path/to/image.jpg')).rejects.toThrow();
    });
  });
});

