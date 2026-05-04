import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Download, AlertCircle, CheckCircle2, Play } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ExtractedVideo {
  index: number;
  title: string;
  url: string;
}

type Step = "input" | "quality" | "preview" | "complete";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState<Step>("input");
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [selectedQuality, setSelectedQuality] = useState("720");
  const [extractedVideos, setExtractedVideos] = useState<ExtractedVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractMutation = trpc.playlist.extract.useMutation();
  const generateFileMutation = trpc.playlist.generateFile.useMutation();

  const handleExtractPlaylist = async () => {
    if (!playlistUrl.trim()) {
      setError("Please enter a YouTube playlist URL");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await extractMutation.mutateAsync({
        playlistUrl: playlistUrl.trim(),
        quality: selectedQuality as "360" | "480" | "720" | "1080" | "best",
      });

      setExtractedVideos(result.videos);
      setStep("preview");
      toast.success(`Successfully extracted ${result.totalCount} videos!`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to extract playlist";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceedToQuality = () => {
    if (!playlistUrl.trim()) {
      setError("Please enter a YouTube playlist URL");
      return;
    }
    setError(null);
    setStep("quality");
  };

  const handleDownloadFile = async () => {
    try {
      const result = await generateFileMutation.mutateAsync({
        videos: extractedVideos,
      });

      // Create blob and download
      const blob = new Blob([result.content], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setStep("complete");
      toast.success("File downloaded successfully!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate file";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleReset = () => {
    setStep("input");
    setPlaylistUrl("");
    setSelectedQuality("720");
    setExtractedVideos([]);
    setError(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md p-8 border-0 shadow-lg">
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-slate-900">YouTube to IDM</h1>
              <p className="text-slate-600">Extract playlists for batch downloading</p>
            </div>

            <div className="bg-slate-100 rounded-lg p-6 space-y-3 text-sm text-slate-700">
              <div className="flex gap-3">
                <Play className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>Extract videos from any YouTube playlist</span>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Choose your preferred video quality</span>
              </div>
              <div className="flex gap-3">
                <Download className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span>Download IDM-compatible batch file</span>
              </div>
            </div>

            <Button
              onClick={() => (window.location.href = getLoginUrl())}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 font-medium"
            >
              Sign in to Continue
            </Button>

            <p className="text-xs text-slate-500">
              Sign in with your Manus account to get started
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">YouTube Playlist Extractor</h1>
          <p className="text-lg text-slate-600">
            Convert your playlists into IDM-compatible batch import files
          </p>
        </div>

        {/* Main Card */}
        <Card className="border-0 shadow-xl overflow-hidden">
          {/* Step Indicators */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
            {["input", "quality", "preview", "complete"].map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    step === s
                      ? "bg-blue-600 text-white"
                      : ["input", "quality", "preview"].includes(s) &&
                          ["input", "quality", "preview", "complete"].indexOf(step) >
                            ["input", "quality", "preview", "complete"].indexOf(s)
                        ? "bg-green-600 text-white"
                        : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {i + 1}
                </div>
                {i < 3 && (
                  <div
                    className={`w-12 h-1 mx-2 transition-all ${
                      ["input", "quality", "preview", "complete"].indexOf(step) >
                      ["input", "quality", "preview", "complete"].indexOf(s)
                        ? "bg-green-600"
                        : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Step 1: Input */}
            {step === "input" && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="playlist-url" className="text-base font-semibold text-slate-900">
                    YouTube Playlist URL
                  </Label>
                  <p className="text-sm text-slate-600 mt-1 mb-3">
                    Paste the URL of any public YouTube playlist
                  </p>
                  <Input
                    id="playlist-url"
                    placeholder="https://www.youtube.com/playlist?list=..."
                    value={playlistUrl}
                    onChange={(e) => {
                      setPlaylistUrl(e.target.value);
                      setError(null);
                    }}
                    disabled={isLoading}
                    className="h-11 text-base"
                  />
                </div>

                {error && (
                  <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-900">Error</p>
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleProceedToQuality}
                  disabled={!playlistUrl.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 font-medium"
                >
                  Next: Select Quality
                </Button>
              </div>
            )}

            {/* Step 2: Quality Selection */}
            {step === "quality" && (
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-semibold text-slate-900 mb-4 block">
                    Select Video Quality
                  </Label>
                  <RadioGroup value={selectedQuality} onValueChange={setSelectedQuality}>
                    <div className="space-y-3">
                      {[
                        { value: "360", label: "360p - Lowest (Fastest)" },
                        { value: "480", label: "480p - Low" },
                        { value: "720", label: "720p - High (Recommended)" },
                        { value: "1080", label: "1080p - Very High" },
                        { value: "best", label: "Best Available - Highest Quality" },
                      ].map((option) => (
                        <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                          <RadioGroupItem value={option.value} id={option.value} />
                          <Label htmlFor={option.value} className="cursor-pointer flex-1 font-medium text-slate-900">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setStep("input")}
                    variant="outline"
                    className="flex-1 h-11 font-medium"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleExtractPlaylist}
                    disabled={isLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-11 font-medium"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Extracting...
                      </>
                    ) : (
                      "Extract & Preview"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Preview */}
            {step === "preview" && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-base font-semibold text-slate-900">
                      Extracted Videos ({extractedVideos.length})
                    </Label>
                    <span className="text-sm text-slate-600">Quality: {selectedQuality === "best" ? "Best Available" : `${selectedQuality}p`}</span>
                  </div>

                  <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-lg">
                    <div className="divide-y divide-slate-200">
                      {extractedVideos.map((video) => (
                        <div key={video.index} className="p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-bold text-blue-700">
                                {String(video.index).padStart(3, "0")}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {video.title}
                              </p>
                              <p className="text-xs text-slate-500 truncate mt-1">{video.url}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setStep("quality")}
                    variant="outline"
                    className="flex-1 h-11 font-medium"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleDownloadFile}
                    disabled={generateFileMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white h-11 font-medium"
                  >
                    {generateFileMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download File
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Complete */}
            {step === "complete" && (
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Download Complete!</h2>
                  <p className="text-slate-600">
                    Your IDM-compatible batch file has been downloaded successfully.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                  <p className="text-sm font-medium text-blue-900 mb-2">Next Steps:</p>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Open Internet Download Manager (IDM)</li>
                    <li>Go to File → Import → Import from Text File</li>
                    <li>Select the downloaded file</li>
                    <li>Start downloading your playlist!</li>
                  </ol>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleDownloadFile}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white h-11 font-medium"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Again
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="flex-1 h-11 font-medium"
                  >
                    Extract Another
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-slate-600">
          <p>
            💡 Tip: Make sure the playlist is public or you have access to it for successful extraction
          </p>
        </div>
      </div>
    </div>
  );
}
