"use client";

import { useEffect, useRef, useState } from "react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import PlaybackEngine from "osmd-audio-player";
import { Play, Square, Loader2 } from "lucide-react";

interface ScoreViewerProps {
  xmlData: string | null;
}

export default function ScoreViewer({ xmlData }: ScoreViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const playbackEngineRef = useRef<any>(null); 
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (containerRef.current && !osmdRef.current) {
      osmdRef.current = new OpenSheetMusicDisplay(containerRef.current, {
        autoResize: true,
        drawTitle: false,
        drawComposer: false,
        drawSubtitle: false,
        drawingParameters: "compacttight",
        followCursor: true,
      });
      if (osmdRef.current.cursor) {
        osmdRef.current.cursor.show();
      }
    }

    return () => {
      if (playbackEngineRef.current) {
        playbackEngineRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    const initPlayer = async () => {
      if (osmdRef.current && xmlData) {
        try {
          setIsReady(false);
          await osmdRef.current.load(xmlData);
          osmdRef.current.render();
          
          if (!playbackEngineRef.current) {
            playbackEngineRef.current = new PlaybackEngine();
          }
          
          await playbackEngineRef.current.loadScore(osmdRef.current);
          playbackEngineRef.current.setBpm(120);
          
          setIsReady(true);
        } catch (error) {
          console.error("Error initializing playback:", error);
        }
      }
    };
    initPlayer();
  }, [xmlData]);

  const togglePlayback = async () => {
    if (!playbackEngineRef.current) return;

    if (isPlaying) {
      playbackEngineRef.current.pause();
      setIsPlaying(false);
    } else {
      playbackEngineRef.current.play();
      setIsPlaying(true);
    }
  };

  const stopPlayback = () => {
    if (playbackEngineRef.current) {
      playbackEngineRef.current.stop();
      setIsPlaying(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="w-full bg-white rounded-lg p-4 overflow-hidden relative min-h-[200px]">
        <div ref={containerRef} className="w-full" />
        {!xmlData && (
          <div className="text-slate-400 text-center py-20 italic">
            No music data loaded.
          </div>
        )}
      </div>
      
      {xmlData && (
        <div className="flex items-center justify-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
          {!isReady ? (
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>読み込み中...</span>
            </div>
          ) : (
            <>
              <button
                onClick={togglePlayback}
                className="w-12 h-12 rounded-full bg-primary text-background flex items-center justify-center hover:bg-amber-400 transition-colors"
                title={isPlaying ? "一時停止" : "再生"}
              >
                {isPlaying ? <Square className="fill-current w-5 h-5" /> : <Play className="fill-current w-5 h-5 ml-1" />}
              </button>
              
              <button
                onClick={stopPlayback}
                className="w-12 h-12 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center hover:bg-slate-700 transition-colors"
                title="停止"
              >
                <Square className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
