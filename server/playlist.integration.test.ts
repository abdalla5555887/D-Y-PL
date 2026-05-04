import { describe, expect, it } from "vitest";
import {
  isValidYouTubePlaylistUrl,
  generateIdmFileContent,
  type PlaylistVideo,
} from "./playlist";

describe("Playlist Integration Tests", () => {
  describe("URL Validation - Edge Cases", () => {
    it("should handle URLs with query parameters", () => {
      const url = "https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf&index=1";
      expect(isValidYouTubePlaylistUrl(url)).toBe(true);
    });

    it("should handle URLs with multiple query parameters", () => {
      const url = "https://www.youtube.com/playlist?list=PLtest&t=100&v=abc";
      expect(isValidYouTubePlaylistUrl(url)).toBe(true);
    });

    it("should reject URLs with only video ID", () => {
      const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
      expect(isValidYouTubePlaylistUrl(url)).toBe(false);
    });

    it("should reject URLs with empty list parameter", () => {
      const url = "https://www.youtube.com/playlist?list=";
      expect(isValidYouTubePlaylistUrl(url)).toBe(false);
    });

    it("should reject malformed URLs", () => {
      expect(isValidYouTubePlaylistUrl("ht!tp://invalid")).toBe(false);
      expect(isValidYouTubePlaylistUrl("")).toBe(false);
      expect(isValidYouTubePlaylistUrl("   ")).toBe(false);
    });
  });

  describe("IDM File Format - Comprehensive", () => {
    it("should generate valid IDM format with single video", () => {
      const videos: PlaylistVideo[] = [
        {
          index: 1,
          title: "Test Video",
          url: "https://example.com/video.mp4",
        },
      ];

      const content = generateIdmFileContent(videos);
      const lines = content.split("\n");

      expect(lines[0]).toBe("https://example.com/video.mp4");
      expect(lines[1]).toBe("{");
      expect(lines[2]).toContain("saveas=001 - Test Video.mp4");
      expect(lines[3]).toBe("}");
    });

    it("should handle videos with special characters in titles", () => {
      const videos: PlaylistVideo[] = [
        {
          index: 1,
          title: 'Video with "quotes" & <symbols> | pipes',
          url: "https://example.com/video.mp4",
        },
      ];

      const content = generateIdmFileContent(videos);

      // Should sanitize special characters
      expect(content).toContain("001 - Video with quotes");
      expect(content).not.toContain('"');
      expect(content).not.toContain("<");
      expect(content).not.toContain(">");
      expect(content).not.toContain("|");
    });

    it("should handle videos with Unicode characters", () => {
      const videos: PlaylistVideo[] = [
        {
          index: 1,
          title: "فيديو عربي 中文视频 日本語ビデオ",
          url: "https://example.com/video.mp4",
        },
      ];

      const content = generateIdmFileContent(videos);

      // Should preserve Unicode characters
      expect(content).toContain("فيديو عربي");
      expect(content).toContain("中文视频");
      expect(content).toContain("日本語ビデオ");
    });

    it("should handle very long video titles", () => {
      const longTitle = "A".repeat(300);
      const videos: PlaylistVideo[] = [
        {
          index: 1,
          title: longTitle,
          url: "https://example.com/video.mp4",
        },
      ];

      const content = generateIdmFileContent(videos);

      // Should still generate valid format
      expect(content).toContain("001 -");
      expect(content).toContain(".mp4");
      expect(content).toContain("saveas=");
    });

    it("should properly number videos up to 999", () => {
      const videos: PlaylistVideo[] = Array.from({ length: 999 }, (_, i) => ({
        index: i + 1,
        title: `Video ${i + 1}`,
        url: `https://example.com/video${i + 1}.mp4`,
      }));

      const content = generateIdmFileContent(videos);

      expect(content).toContain("001 - Video 1.mp4");
      expect(content).toContain("099 - Video 99.mp4");
      expect(content).toContain("999 - Video 999.mp4");
    });

    it("should handle URLs with special characters", () => {
      const videos: PlaylistVideo[] = [
        {
          index: 1,
          title: "Test",
          url: "https://example.com/video.mp4?token=abc123&expires=2026-05-04",
        },
      ];

      const content = generateIdmFileContent(videos);

      expect(content).toContain("https://example.com/video.mp4?token=abc123&expires=2026-05-04");
    });

    it("should maintain proper line breaks in output", () => {
      const videos: PlaylistVideo[] = [
        {
          index: 1,
          title: "Video 1",
          url: "https://example.com/video1.mp4",
        },
        {
          index: 2,
          title: "Video 2",
          url: "https://example.com/video2.mp4",
        },
      ];

      const content = generateIdmFileContent(videos);
      const lines = content.split("\n");

      // Should have proper structure: URL, {, saveas, }, URL, {, saveas, }
      expect(lines.length).toBe(8);
      expect(lines[0]).toContain("video1");
      expect(lines[4]).toContain("video2");
    });

    it("should handle empty title gracefully", () => {
      const videos: PlaylistVideo[] = [
        {
          index: 1,
          title: "",
          url: "https://example.com/video.mp4",
        },
      ];

      const content = generateIdmFileContent(videos);

      expect(content).toContain("001 - .mp4");
      expect(content).toContain("saveas=");
    });

    it("should handle whitespace-only titles", () => {
      const videos: PlaylistVideo[] = [
        {
          index: 1,
          title: "   ",
          url: "https://example.com/video.mp4",
        },
      ];

      const content = generateIdmFileContent(videos);

      // Should trim whitespace
      expect(content).toContain("001 - .mp4");
    });
  });

  describe("Batch Processing", () => {
    it("should generate correct format for large playlists", () => {
      const videos: PlaylistVideo[] = Array.from({ length: 50 }, (_, i) => ({
        index: i + 1,
        title: `Video ${i + 1}`,
        url: `https://example.com/video${i + 1}.mp4`,
      }));

      const content = generateIdmFileContent(videos);
      const lines = content.split("\n");

      // Each video should have 4 lines (URL, {, saveas, })
      expect(lines.length).toBe(50 * 4);

      // Verify first and last entries
      expect(lines[0]).toContain("video1");
      expect(lines[lines.length - 4]).toContain("video50");
    });

    it("should maintain consistent format across all videos", () => {
      const videos: PlaylistVideo[] = Array.from({ length: 10 }, (_, i) => ({
        index: i + 1,
        title: `Video ${i + 1}`,
        url: `https://example.com/video${i + 1}.mp4`,
      }));

      const content = generateIdmFileContent(videos);
      const blocks = content.split("}\n");

      // Each block (except last) should follow pattern: URL\n{\n  saveas=filename\n
      for (let i = 0; i < blocks.length - 1; i++) {
        const block = blocks[i];
        expect(block).toContain("https://");
        expect(block).toContain("{");
        expect(block).toContain("saveas=");
      }
    });
  });
});
