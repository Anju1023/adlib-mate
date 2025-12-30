"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import * as Tone from "tone";
import { Play, Square, Loader2, Music4 } from "lucide-react";

interface ScoreViewerProps {
  xmlData: string | null;
}

interface NoteEvent {
  time: number; // in seconds (or beats if using Transport)
  note: string; // Pitch (e.g., "C4")
  duration: number; // in seconds
  measureIndex: number; // for cursor tracking
}

export default function ScoreViewer({ xmlData }: ScoreViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const partRef = useRef<Tone.Part | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isSwing, setIsSwing] = useState(true); // Default to Swing for Jazz app!
  const [bpm, setBpm] = useState(120);

  // Initialize OSMD
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
    }
    
    // Cleanup Tone.js on unmount
    return () => {
      stopPlayback();
      synthRef.current?.dispose();
    };
  }, []);

  // Initialize Tone.js Synth
  useEffect(() => {
    if (!synthRef.current) {
      synthRef.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" }, // Softer sound like a sax/trumpet
        envelope: { attack: 0.05, decay: 0.1, sustain: 0.3, release: 1 },
      }).toDestination();
    }
  }, []);

  // Parse and Render XML
  useEffect(() => {
    const loadScore = async () => {
      if (osmdRef.current && xmlData) {
        try {
          setIsReady(false);
          await osmdRef.current.load(xmlData);
          osmdRef.current.render();
          if (osmdRef.current.cursor) {
            osmdRef.current.cursor.show();
            osmdRef.current.cursor.reset();
          }
          setIsReady(true);
        } catch (error) {
          console.error("Error loading score:", error);
        }
      }
    };
    loadScore();
  }, [xmlData]);

  // Extract Notes and Schedule Playback
  useEffect(() => {
    if (!osmdRef.current || !synthRef.current || !xmlData || !isReady) return;

    // Cleanup previous part
    Tone.Transport.stop();
    Tone.Transport.cancel();
    if (partRef.current) {
      partRef.current.dispose();
      partRef.current = null;
    }
    
    // Stop any stuck notes
    synthRef.current.releaseAll();

    const osmd = osmdRef.current;
    const cursor = osmd.cursor;
    cursor.reset();

    const events: NoteEvent[] = [];
    const iterator = cursor.Iterator;
    
    // BPM setting
    Tone.Transport.bpm.value = bpm;
    
    // Iterate through the score
    while (!iterator.EndReached) {
      const voices = iterator.CurrentVoiceEntries;
      
      for (const voice of voices) {
        for (const note of voice.Notes) {
          if (note.isRest()) continue;
          
          const absoluteTimestamp = iterator.CurrentSourceTimestamp.RealValue; 
          const duration = note.Length.RealValue; 

          // --- SWING LOGIC ---
          let playTime = absoluteTimestamp;
          let playDuration = duration;

          if (isSwing) {
            const beatPosition = absoluteTimestamp % 1; 
            
            // Swing Logic: Delay the off-beat (approx 0.5)
            if (Math.abs(beatPosition - 0.5) < 0.05) {
              playTime += 0.16; // Shift
              playDuration -= 0.16; // Shorten
            }
          }
          
          if (note.Pitch) {
             let pitch = note.Pitch.ToString();
             events.push({
               time: playTime,
               note: pitch,
               duration: playDuration,
               measureIndex: iterator.CurrentMeasureIndex
             });
          }
        }
      }
      iterator.moveToNext();
    }
    
    cursor.reset(); 

    // Create Tone.Part
    const part = new Tone.Part((time, event: NoteEvent) => {
      synthRef.current?.triggerAttackRelease(event.note, event.duration, time);
    }, events).start(0);
    
    part.loop = false;
    partRef.current = part;

    // Reset transport position to start
    Tone.Transport.position = 0;

  }, [xmlData, isSwing, bpm, isReady]); // Re-run only when these change

  const togglePlayback = async () => {
    await Tone.start(); 
    
    if (isPlaying) {
      Tone.Transport.pause();
      setIsPlaying(false);
      synthRef.current?.releaseAll(); // Safety release on pause
    } else {
      Tone.Transport.start();
      setIsPlaying(true);
    }
  };

  const stopPlayback = () => {
    Tone.Transport.stop();
    Tone.Transport.position = 0; // Reset to start
    setIsPlaying(false);
    synthRef.current?.releaseAll(); // Kill all sounds
    osmdRef.current?.cursor.reset();
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
        <div className="flex flex-col gap-3">
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
                  className="w-12 h-12 rounded-full bg-primary text-background flex items-center justify-center hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
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
          
          {/* Controls: Swing & Tempo */}
          <div className="flex items-center justify-between px-2">
             <button
               onClick={() => setIsSwing(!isSwing)}
               className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                 isSwing 
                   ? "bg-indigo-600 text-white shadow-indigo-500/20 shadow-lg" 
                   : "bg-slate-800 text-slate-400 hover:bg-slate-700"
               }`}
             >
               <Music4 className={`w-4 h-4 ${isSwing ? "animate-pulse" : ""}`} />
               {isSwing ? "Swing: ON" : "Swing: OFF"}
             </button>
             
             <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700">
                <span className="text-xs text-slate-400 font-mono">BPM</span>
                <input 
                  type="number" 
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="w-12 bg-transparent text-right text-sm text-slate-200 focus:outline-none font-mono"
                />
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
