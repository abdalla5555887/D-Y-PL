# YouTube Playlist to IDM Generator

An elegant web application that extracts YouTube playlists and generates IDM-compatible batch import files for streamlined video downloading.

## Features

- **Playlist URL Input**: Simply paste any YouTube playlist URL
- **Quality Selection**: Choose from 360p, 480p, 720p, 1080p, or best available quality
- **Video Preview**: See all extracted videos with their titles and order numbers before downloading
- **YouTube Video URLs**: Extracts YouTube video page URLs which IDM can process with its built-in YouTube support
- **IDM-Compatible Format**: Generates .txt files in the exact format required by Internet Download Manager
- **Comprehensive Error Handling**: User-friendly messages for invalid URLs, private playlists, and network issues
- **Polished UI**: Refined typography, smooth interactions, and responsive design
- **Progress Indicators**: Real-time feedback during playlist extraction

## How to Use

### Step 1: Access the Application
Visit the deployed application at: **https://ytplaylist-5h2ehhkq.manus.space**

### Step 2: Sign In
Click "Sign in to Continue" and authenticate with your Manus account.

### Step 3: Enter Playlist URL
Paste your YouTube playlist URL in the input field. The URL should look like:
```
https://www.youtube.com/playlist?list=PLxxxxxxxxxxxxxx
```

### Step 4: Select Quality
Choose your preferred video quality:
- **360p** - Lowest quality, fastest processing
- **480p** - Low quality
- **720p** - High quality (Recommended)
- **1080p** - Very high quality
- **Best** - Highest available quality

### Step 5: Review Videos
The application will extract all videos from the playlist and display them in a preview list showing:
- Video number (001, 002, etc.)
- Video title
- YouTube video page URL

### Step 6: Download File
Click "Download File" to generate and download the IDM-compatible .txt file.

### Step 7: Import to IDM
1. Open Internet Download Manager (IDM)
2. Go to **File → Import → Import from Text File**
3. Select the downloaded .txt file
4. Click OK to add all videos to your download queue
5. IDM will automatically extract the download URLs using its built-in YouTube support
6. Start downloading!

## File Format

The generated .txt file follows the IDM batch import format:

```
https://www.youtube.com/watch?v=video_id_1
{
  saveas=001 - Video Title 1.mp4
}
https://www.youtube.com/watch?v=video_id_2
{
  saveas=002 - Video Title 2.mp4
}
```

Each entry contains:
- YouTube video page URL
- Metadata block with the filename (number - title.mp4)
- IDM will automatically extract the actual download URL from the YouTube page

## Supported Playlists

- ✅ Public YouTube playlists
- ✅ Playlists you have access to
- ❌ Private playlists (will show error message)
- ❌ Restricted playlists (will show error message)

## Troubleshooting

### "Invalid YouTube playlist URL"
- Ensure you're using a valid YouTube playlist URL
- The URL must contain a `list` parameter
- Example: `https://www.youtube.com/playlist?list=PLxxxxxx`

### "Playlist not found"
- Verify the URL is correct
- Check if the playlist still exists
- Try copying the URL directly from YouTube

### "Access denied. This playlist may be private or restricted"
- The playlist is private or you don't have access to it
- Only public playlists can be extracted

### "Request timed out"
- The playlist is very large and taking too long to process
- Try again in a moment
- Consider breaking large playlists into smaller segments

### Videos not downloading in IDM
- Ensure the .txt file was imported correctly
- Check that IDM is properly configured
- Verify your internet connection

## Technical Details

### Backend
- **Framework**: Express.js with tRPC
- **Video Extraction**: yt-dlp
- **Database**: MySQL/TiDB
- **Authentication**: Manus OAuth

### Frontend
- **Framework**: React 19
- **UI Library**: shadcn/ui
- **Styling**: Tailwind CSS 4
- **Typography**: Inter & Poppins fonts

### Quality Selection
The quality selector is used to configure IDM's download preferences:
- 360p: Low quality, fastest processing
- 480p: Low-medium quality
- 720p: High quality (Recommended)
- 1080p: Very high quality
- Best: Highest available quality

Note: IDM will use its built-in YouTube support to automatically select the best available format matching your quality preference.

## Limitations

- Maximum playlist size: Limited by YouTube's API and system resources
- Processing time: Depends on playlist size and server load
- YouTube URL extraction: Requires YouTube to be accessible from your network
- IDM YouTube support: Requires IDM to have proper YouTube support configured

## Privacy & Security

- Your playlist URLs are processed server-side only
- No personal data is stored
- Generated files are not saved on our servers
- All communication is encrypted (HTTPS)

## Support

For issues or feature requests, please contact support through the Manus platform.

## License

This application is provided as-is for educational and personal use purposes.

---

**Version**: 1.0.0  
**Last Updated**: May 4, 2026
