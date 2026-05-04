import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { extractPlaylistVideos, generateIdmFileContent, isValidYouTubePlaylistUrl } from "./playlist";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  playlist: router({
    extract: protectedProcedure
      .input(
        z.object({
          playlistUrl: z.string().url("Invalid URL"),
          quality: z.enum(["360", "480", "720", "1080", "best"]),
        })
      )
      .mutation(async ({ input }) => {
        // Validate playlist URL
        if (!isValidYouTubePlaylistUrl(input.playlistUrl)) {
          throw new Error("Invalid YouTube playlist URL. Please provide a valid playlist link.");
        }

        try {
          const result = await extractPlaylistVideos(input.playlistUrl, input.quality);
          return {
            success: true,
            videos: result.videos,
            totalCount: result.totalCount,
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to extract playlist";
          throw new Error(errorMessage);
        }
      }),

    generateFile: protectedProcedure
      .input(
        z.object({
          videos: z.array(
            z.object({
              index: z.number(),
              title: z.string(),
              url: z.string(),
            })
          ),
        })
      )
      .mutation(({ input }) => {
        const fileContent = generateIdmFileContent(input.videos);
        return {
          content: fileContent,
          filename: `youtube-playlist-${Date.now()}.txt`,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
