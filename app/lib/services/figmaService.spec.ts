import { describe, it, expect } from 'vitest';
import { FigmaService } from '~/lib/services/figmaService';

describe('FigmaService', () => {
  describe('extractFileId', () => {
    it('should extract file ID from standard Figma URL', () => {
      const url = 'https://www.figma.com/file/abc123def456ghi789/Test-Design';
      const fileId = FigmaService.extractFileId(url);
      expect(fileId).toBe('abc123def456ghi789');
    });

    it('should extract file ID from design URL', () => {
      const url = 'https://www.figma.com/design/xyz789abc123def456/My-Design';
      const fileId = FigmaService.extractFileId(url);
      expect(fileId).toBe('xyz789abc123def456');
    });

    it('should extract file ID from prototype URL', () => {
      const url = 'https://www.figma.com/proto/mno456pqr789stu012/Prototype';
      const fileId = FigmaService.extractFileId(url);
      expect(fileId).toBe('mno456pqr789stu012');
    });

    it('should return null for invalid URL', () => {
      const url = 'https://www.example.com/invalid-url';
      const fileId = FigmaService.extractFileId(url);
      expect(fileId).toBeNull();
    });

    it('should return null for malformed Figma URL', () => {
      const url = 'https://www.figma.com/file/invalid';
      const fileId = FigmaService.extractFileId(url);
      expect(fileId).toBeNull();
    });
  });

  describe('constructor', () => {
    it('should create service with API key', () => {
      const apiKey = 'test-api-key';
      const service = new FigmaService(apiKey);
      expect(service).toBeInstanceOf(FigmaService);
    });
  });
});