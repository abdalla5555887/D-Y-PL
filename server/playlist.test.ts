import { describe, expect, it } from "vitest";
import {
  isValidYouTubePlaylistUrl,
  generateIdmFileContent,
  type PlaylistVideo,
} from "./playlist";

describe("Playlist Utilities", () => {
  describe("isValidYouTubePlaylistUrl", () => {
    it("should accept valid YouTube playlist URLs", () => {
      const validUrls = [
        "https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf",
        "https://youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf",
        "https://www.youtube.com/playlist?list=PL123456789",
      ];

      validUrls.forEach((url) => {
        expect(isValidYouTubePlaylistUrl(url)).toBe(true);
      });
    });

    it("should reject invalid YouTube URLs", () => {
      const invalidUrls = [
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Single video, not playlist
        "https://www.youtube.com/", // No playlist ID
        "https://www.example.com/playlist?list=123", // Not YouTube
        "not a url",
        "",
      ];

      invalidUrls.forEach((url) => {
        expect(isValidYouTubePlaylistUrl(url)).toBe(false);
      });
    });
  });

  describe("generateIdmFileContent", () => {
    it("should generate correctly formatted IDM file content", () => {
      const videos: PlaylistVideo[] = [
        {
          index: 1,
          title: "First Video Title",
          url: "https://example.com/video1.mp4",
        },
        {
          index: 2,
          title: "Second Video Title",
          url: "https://example.com/video2.mp4",
        },
      ];

      const content = generateIdmFileContent(videos);

      expect(content).toContain("https://example.com/video1.mp4");
      expect(content).toContain("001 - First Video Title.mp4");
      expect(content).toContain("https://example.com/video2.mp4");
      expect(content).toContain("002 - Second Video Title.mp4");
      expect(content).toContain("saveas=");
    });

    it("should sanitize special characters in filenames", () => {
      const videos: PlaylistVideo[] = [
        {
          index: 1,
          title: 'Video with "quotes" and <brackets>',
          url: "https://example.com/video.mp4",
        },
      ];

      const content = generateIdmFileContent(videos);

      // Should not contain invalid filename characters
      expect(content).not.toContain('"');
      expect(content).not.toContain("<");
      expect(content).not.toContain(">");
      expect(content).toContain("001 - Video with quotes and brackets.mp4");
    });

    it("should pad video numbers with zeros", () => {
      const videos: PlaylistVideo[] = Array.from({ length: 15 }, (_, i) => ({
        index: i + 1,
        title: `Video ${i + 1}`,
        url: `https://example.com/video${i + 1}.mp4`,
      }));

      const content = generateIdmFileContent(videos);

      expect(content).toContain("001 - Video 1.mp4");
      expect(content).toContain("009 - Video 9.mp4");
      expect(content).toContain("010 - Video 10.mp4");
      expect(content).toContain("015 - Video 15.mp4");
    });

    it("should maintain correct IDM format structure", () => {
      const videos: PlaylistVideo[] = [
        {
          index: 1,
          title: "Test Video",
          url: "https://example.com/test.mp4",
        },
      ];

      const content = generateIdmFileContent(videos);
      const lines = content.split("\n");

      // Format should be: URL, {, saveas=filename, }
      expect(lines[0]).toBe("https://example.com/test.mp4");
      expect(lines[1]).toBe("{");
      expect(lines[2]).toContain("saveas=");
      expect(lines[3]).toBe("}");
    });
  });
});
