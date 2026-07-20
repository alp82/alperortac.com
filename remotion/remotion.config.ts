import { Config } from "@remotion/cli/config";

// THROWAWAY prototype config (wayfinder #29).
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// H.264 mp4 by default; we also render webm via CLI flags in the render step.
Config.setCodec("h264");
