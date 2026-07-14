"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useAdultVideoPlayback } from "@/lib/browser/adult-video-playback";

const NATIONWIDE_MAP_POSTER = "/media/posters/nationwide-map.jpg";

export function FindUsNationwideVideo() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const { canStream, videoRef } = useAdultVideoPlayback(mountRef);
  const shouldPlayVideo = canStream && !videoFailed;

  return (
    <div
      className="flex min-h-0 w-full flex-1 items-center justify-center"
      ref={mountRef}
    >
      <div className="relative aspect-video w-full max-w-4xl overflow-hidden bg-po-ink">
        <Image
          alt=""
          aria-hidden="true"
          className="object-contain"
          fill
          priority
          sizes="(min-width: 1024px) 62vw, 100vw"
          src={NATIONWIDE_MAP_POSTER}
        />

        {shouldPlayVideo ? (
          <video
            aria-hidden="true"
            autoPlay
            className="absolute inset-0 h-full w-full object-contain"
            loop
            muted
            onError={() => setVideoFailed(true)}
            playsInline
            poster={NATIONWIDE_MAP_POSTER}
            preload="metadata"
            ref={videoRef}
          >
            <source src="/media/nationwide-map.webm" type="video/webm" />
            <source src="/media/nationwide-map.mp4" type="video/mp4" />
          </video>
        ) : null}
      </div>
    </div>
  );
}
