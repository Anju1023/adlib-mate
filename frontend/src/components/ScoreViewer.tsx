"use client";

import { useEffect, useRef, useState } from "react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import PlaybackEngine from "osmd-audio-player";
import { Play, Square, Loader2, Sparkles, Volume2 } from "lucide-react";
import { synthesizeAudio } from "@/lib/api";

interface ScoreViewerProps {
  xmlData: string | null;
}

export default function ScoreViewer({ xmlData }: ScoreViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const playbackEngineRef = useRef<any>(null); 
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  // Audio states
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
          setAudioBlob(null); // Reset generated audio when new score loads
          
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

    // Use HTML5 Audio if blob exists (Lyria mode)
    if (audioBlob) {
        if (!audioRef.current) {
            const url = URL.createObjectURL(audioBlob);
            audioRef.current = new Audio(url);
            audioRef.current.onended = () => setIsPlaying(false);
        }
        
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
        return;
    }

    // Default Tone.js mode
    if (isPlaying) {
      playbackEngineRef.current.pause();
      setIsPlaying(false);
    } else {
      playbackEngineRef.current.play();
      setIsPlaying(true);
    }
  };

  const stopPlayback = () => {
    if (audioBlob && audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
    } else if (playbackEngineRef.current) {
      playbackEngineRef.current.stop();
      setIsPlaying(false);
    }
  };
  
  const handleSynthesize = async () => {
      if (!xmlData) return;
      setIsSynthesizing(true);
      try {
          const blob = await synthesizeAudio(xmlData);
          setAudioBlob(blob);
          // Auto play after synthesis? Maybe just let user click play.
      } catch (err) {
          console.error("Synthesis failed:", err);
          // Fallback to Tone.js quietly
          togglePlayback();
      } finally {
          setIsSynthesizing(false);
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
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    audioBlob ? 'bg-indigo-500 hover:bg-indigo-400' : 'bg-primary hover:bg-amber-400'
                } text-background`}
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
              
              {!audioBlob && (
                  <button
                    onClick={handleSynthesize}
                    disabled={isSynthesizing}
                    className="flex items-center gap-2 px-4 h-12 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all ml-4 disabled:opacity-50"
                    title="Lyria AIでリアルな音声を生成"
                  >
                      {isSynthesizing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                          <Sparkles className="w-4 h-4 text-indigo-400" />
                      )}
                      <span className="text-sm font-medium">
                          {isSynthesizing ? "生成中..." : "AI 音源生成"}
                      </span>
                  </button>
              )}
              
              {audioBlob && (
                  <div className="flex items-center gap-2 px-4 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 ml-4">
                      <Volume2 className="w-4 h-4" />
                      <span className="text-sm">Lyria Audio Ready</span>
                  </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}