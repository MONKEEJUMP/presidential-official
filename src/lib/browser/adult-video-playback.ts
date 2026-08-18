"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

function releaseVideo(video: HTMLVideoElement) {
  video.pause();
  video.removeAttribute("src");
  video.querySelectorAll("source").forEach((source) => {
    source.removeAttribute("src");
  });

  try {
    video.load();
  } catch {
    // Detached media can reject load() during teardown; its sources are gone.
  }
}

export function useAdultVideoPlayback<T extends Element>(
  visibilityTargetRef?: RefObject<T | null>,
) {
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const [isInViewport, setIsInViewport] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () =>
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [pageIsVisible, setPageIsVisible] = useState(
    () =>
      typeof document !== "undefined" &&
      document.visibilityState === "visible",
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);

    return () => {
      mediaQuery.removeEventListener("change", updateMotionPreference);
    };
  }, []);

  useEffect(() => {
    const updatePageVisibility = () => {
      setPageIsVisible(document.visibilityState === "visible");
    };

    updatePageVisibility();
    document.addEventListener("visibilitychange", updatePageVisibility);

    return () => {
      document.removeEventListener("visibilitychange", updatePageVisibility);
    };
  }, []);

  useEffect(() => {
    const target = visibilityTargetRef?.current ?? videoElementRef.current;

    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      setIsInViewport(Boolean(entry?.isIntersecting && entry.intersectionRatio > 0));
    });

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [visibilityTargetRef]);

  const canStream = isInViewport && !prefersReducedMotion && pageIsVisible;

  const videoRef = useCallback((video: HTMLVideoElement | null) => {
    if (!video) {
      return;
    }

    const previousVideo = videoElementRef.current;

    if (previousVideo && previousVideo !== video) {
      releaseVideo(previousVideo);
    }

    videoElementRef.current = video;
  }, []);

  useEffect(() => {
    const video = videoElementRef.current;

    if (!video) {
      return;
    }

    if (!canStream) {
      releaseVideo(video);
      return;
    }

    video.load();
    void video.play().catch(() => {
      // Muted autoplay may retry when the browser finishes loading the source.
    });
  }, [canStream]);

  useEffect(
    () => () => {
      if (videoElementRef.current) {
        releaseVideo(videoElementRef.current);
      }
    },
    [],
  );

  return { canStream, videoRef } as const;
}
