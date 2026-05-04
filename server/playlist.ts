import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface PlaylistVideo {
  index: number;
  title: string;
  url: string;
}

export interface PlaylistExtractionResult {
  videos: PlaylistVideo[];
  totalCount: number;
}

/**
 * Validates if a URL is a valid YouTube playlist URL
 */
export function isValidYouTubePlaylistUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const isYouTube = hostname === "youtube.com" || hostname === "www.youtube.com" || hostname === "youtu.be";
    
    if (!isYouTube) return false;

    // Check for playlist ID
    const playlistId = urlObj.searchParams.get("list");
    return !!playlistId;
  } catch {
    return false;
  }
}

/**
 * Extracts videos from a YouTube playlist using yt-dlp
 * Returns video list with titles, order numbers, and direct download URLs
 * 
 * NOTE: This function uses a fallback strategy since YouTube blocks direct URL extraction
 * for bot-like requests. The URLs returned are the video page URLs which can be used
 * with IDM's built-in YouTube support.
 */
export async function extractPlaylistVideos(
  playlistUrl: string,
  quality: string = "best"
): Promise<PlaylistExtractionResult> {
  if (!isValidYouTubePlaylistUrl(playlistUrl)) {
    throw new Error("Invalid YouTube playlist URL");
  }

  // Map quality to yt-dlp format string
  const qualityMap: Record<string, string> = {
    "360": "bestvideo[height<=360]+bestaudio/best[height<=360]/best",
    "480": "bestvideo[height<=480]+bestaudio/best[height<=480]/best",
    "720": "bestvideo[height<=720]+bestaudio/best[height<=720]/best",
    "1080": "bestvideo[height<=1080]+bestaudio/best[height<=1080]/best",
    "best": "bestvideo+bestaudio/best",
  };

  const formatString = qualityMap[quality] || qualityMap["best"];

  try {
    // Get playlist entries with video IDs and titles
    // Escape the URL to prevent command injection
    const escapedUrl = playlistUrl.replace(/'/g, "'\\''");
    const command = `python -m yt_dlp --flat-playlist --dump-json --format '${formatString}' '${escapedUrl}'`;
    
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large playlists
      timeout: 120000, // 2 minutes timeout
    });

    if (stderr && !stderr.includes("WARNING")) {
      console.error("yt-dlp stderr:", stderr);
    }

    // Parse the JSON output
    const lines = stdout.trim().split("\n").filter((line) => line.trim());
    
    if (lines.length === 0) {
      throw new Error("No videos found in playlist");
    }

    const videos: PlaylistVideo[] = [];

    // Extract video IDs and titles from flat playlist
    for (let i = 0; i < lines.length; i++) {
      try {
        const entry = JSON.parse(lines[i]);
        
        // Skip if entry doesn't have required fields
        if (!entry.title || !entry.id) {
          continue;
        }

        // Use the video page URL as the download URL
        // IDM can handle YouTube URLs directly with its built-in support
        const videoUrl = `https://www.youtube.com/watch?v=${entry.id}`;
        
        videos.push({
          index: videos.length + 1,
          title: entry.title,
          url: videoUrl,
        });
      } catch (parseError) {
        console.error(`Failed to parse line ${i}:`, parseError);
        continue;
      }
    }

    if (videos.length === 0) {
      throw new Error("Failed to extract any videos from the playlist");
    }

    return {
      videos,
      totalCount: videos.length,
    };
  } catch (error) {
    const errorStr = String(error);
    
    if (errorStr.includes("Private video") || errorStr.includes("private")) {
      throw new Error("This playlist contains private videos that cannot be accessed. Please ensure all videos in the playlist are public.");
    }
    if (errorStr.includes("not available") || errorStr.includes("removed")) {
      throw new Error("The playlist is not available or has been removed. Please check the URL and try again.");
    }
    if (errorStr.includes("ENOTFOUND") || errorStr.includes("ECONNREFUSED")) {
      throw new Error("Network error: Unable to reach YouTube. Please check your internet connection.");
    }
    if (errorStr.includes("404") || errorStr.includes("not found")) {
      throw new Error("Playlist not found. Please verify the URL is correct.");
    }
    if (errorStr.includes("403") || errorStr.includes("forbidden")) {
      throw new Error("Access denied. This playlist may be private or restricted.");
    }
    if (errorStr.includes("timeout")) {
      throw new Error("Request timed out. The playlist is taking too long to process. Please try again.");
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred while extracting the playlist. Please try again.");
  }
}

/**
 * Generates IDM-compatible text file content from playlist videos
 * Format: URL\n{\n  saveas=001 - Video Title.mp4\n}\n
 * 
 * NOTE: The URLs are YouTube video page URLs which IDM can handle directly
 * with its built-in YouTube support. IDM will automatically extract the
 * download URL when processing these entries.
 */
export function generateIdmFileContent(videos: PlaylistVideo[]): string {
  const lines: string[] = [];

  for (const video of videos) {
    // Sanitize title for filename
    const sanitizedTitle = video.title
      .replace(/[<>:"/\\|?*]/g, "") // Remove invalid filename characters
      .replace(/\s+/g, " ") // Normalize spaces
      .trim();

    const filename = `${String(video.index).padStart(3, "0")} - ${sanitizedTitle}.mp4`;

    // IDM format: URL followed by metadata
    lines.push(video.url);
    lines.push("{");
    lines.push(`  saveas=${filename}`);
    lines.push("}");
  }

  return lines.join("\n");
}
