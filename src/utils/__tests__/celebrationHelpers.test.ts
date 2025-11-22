import { generateStoryCaption, generatePostContent, getCategoryColor } from '../celebrationHelpers';
import type { CelebrationData } from '../celebrationHelpers';

describe('celebrationHelpers', () => {
  const mockData: CelebrationData = {
    questTitle: 'Ask 5 strangers for directions',
    questCategory: 'SOCIAL',
    xpEarned: 100,
    pointsEarned: 50,
    noCount: 3,
    streak: 7,
    rank: 15,
    rankChange: 2,
  };

  describe('generateStoryCaption', () => {
    it('should generate a story caption with all data', () => {
      const caption = generateStoryCaption(mockData);
      
      expect(caption).toContain('Just completed "Ask 5 strangers for directions"');
      expect(caption).toContain('7 day streak');
      expect(caption).toContain('+100 XP');
      expect(caption).toContain('+50 points');
      expect(caption).toContain('Rank #15');
      expect(caption).toContain('#RejectionHero');
      expect(caption).toContain('#QuestComplete');
    });

    it('should use 📈 emoji when rank increases', () => {
      const dataWithRankIncrease = { ...mockData, rankChange: 5 };
      const caption = generateStoryCaption(dataWithRankIncrease);
      expect(caption).toContain('📈');
    });

    it('should use 🎉 emoji when rank does not increase', () => {
      const dataWithoutRankIncrease = { ...mockData, rankChange: 0 };
      const caption = generateStoryCaption(dataWithoutRankIncrease);
      expect(caption).toContain('🎉');
    });
  });

  describe('generatePostContent', () => {
    it('should generate post content with all stats', () => {
      const content = generatePostContent(mockData);
      
      expect(content).toContain('Quest Complete: Ask 5 strangers for directions');
      expect(content).toContain('SOCIAL category');
      expect(content).toContain('3 NOs collected');
      expect(content).toContain('100 XP earned');
      expect(content).toContain('50 points gained');
      expect(content).toContain('7 day streak');
      expect(content).toContain('Rank #15');
      expect(content).toContain('+2');
      expect(content).toContain('#RejectionHero');
    });

    it('should handle negative rank change', () => {
      const dataWithNegativeChange = { ...mockData, rankChange: -3 };
      const content = generatePostContent(dataWithNegativeChange);
      expect(content).toContain('-3');
    });

    it('should handle missing rank change', () => {
      const dataWithoutRankChange = { ...mockData, rankChange: undefined };
      const content = generatePostContent(dataWithoutRankChange);
      expect(content).not.toContain('(');
      expect(content).toContain('Rank #15');
    });
  });

  describe('getCategoryColor', () => {
    it('should return correct color for known categories', () => {
      expect(getCategoryColor('SALES')).toBe('#FF6B35');
      expect(getCategoryColor('SOCIAL')).toBe('#00D9FF');
      expect(getCategoryColor('ENTREPRENEURSHIP')).toBe('#7E3FE4');
      expect(getCategoryColor('DATING')).toBe('#FF4081');
      expect(getCategoryColor('CONFIDENCE')).toBe('#FFD700');
      expect(getCategoryColor('CAREER')).toBe('#4CAF50');
    });

    it('should return default color for unknown category', () => {
      expect(getCategoryColor('UNKNOWN')).toBe('#7E3FE4');
    });
  });
});

