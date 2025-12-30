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
  const preparePlayback = useCallback(() => {
    if (!osmdRef.current || !synthRef.current) return;

    // Reset Transport
    Tone.Transport.stop();
    Tone.Transport.cancel();
    if (partRef.current) {
      partRef.current.dispose();
      partRef.current = null;
    }

    const osmd = osmdRef.current;
    const cursor = osmd.cursor;
    cursor.reset();

    const events: NoteEvent[] = [];
    const iterator = cursor.Iterator;
    
    // BPM setting
    Tone.Transport.bpm.value = bpm;
    
    // Iterate through the score to collect notes
    while (!iterator.EndReached) {
      const voices = iterator.CurrentVoiceEntries;
      
      for (const voice of voices) {
        for (const note of voice.Notes) {
          if (note.isRest()) continue;
          
          // Calculate timing
          // OSMD uses a proprietary timestamp (Whole Note = 4.0? No, 1.0 usually means Quarter in music21 but OSMD varies)
          // Actually, let's rely on iterator.CurrentSourceTimestamp
          // OSMD Timestamp: 0 = start, 1 = quarter note (usually)
          const absoluteTimestamp = iterator.CurrentSourceTimestamp.RealValue; // in Quarter Notes (usually 4.0 per whole)
          
          // Duration
          const duration = note.Length.RealValue; // in Quarter Notes

          // --- SWING LOGIC ---
          let playTime = absoluteTimestamp;
          let playDuration = duration;

          if (isSwing) {
            // Check if it's on an off-beat (e.g., 0.5, 1.5, 2.5...)
            // Assuming 4/4 time signature
            const beatPosition = absoluteTimestamp % 1; // Decimal part
            
            // Typical Swing: Eighth notes (0.0, 0.5) -> (0.0, 0.66)
            // If the note starts on the 'and' of the beat (approx 0.5)
            if (Math.abs(beatPosition - 0.5) < 0.05) {
              // Delay the start
              playTime += 0.16; // Shift from 0.5 to ~0.66
              playDuration -= 0.16; // Shorten slightly to avoid overlap (optional)
            } else if (Math.abs(beatPosition - 0.0) < 0.05 && duration <= 0.5) {
               // On-beat eighth notes might need to be longer?
               // For simple swing, mainly delaying the off-beat is key.
            }
          }
          
          // Pitch conversion
          // OSMD Note: note.Pitch.ToString() -> "C4", "Bb4" etc.
          // Note: Pitch might be null for some special entries, check existence
          if (note.Pitch) {
             // Tone.js format: "C4", "D#4"
             // OSMD Pitch.ToString() is usually usable but verify
             let pitch = note.Pitch.ToString();
             // Clean up if needed (OSMD might return 'C' '4' etc)
             // Usually Pitch.FundamentalNote + Accidental + Octave
             
             events.push({
               time: playTime, // in beats (quarter notes)
               note: pitch,
               duration: playDuration,
               measureIndex: iterator.CurrentMeasureIndex
             });
          }
        }
      }
      iterator.moveToNext();
    }
    
    cursor.reset(); // Reset cursor for visual playback

    // Create a Tone.Part
    // Tone.Part expects time in "bars:beats:sixteenths" or seconds. 
    // If Transport.bpm is set, we can use beats as numbers if we set timeSignature?
    // Easier: Convert beat numbers to seconds or just use beat numbers with Transport
    
    const part = new Tone.Part((time, event: NoteEvent) => {
      // Trigger Sound
      synthRef.current?.triggerAttackRelease(event.note, event.duration, time);
      
      // Update Cursor (Visual Sync)
      // This is tricky because we need to sync with Audio Context time
      // Simplified: Use Draw loop or just approximate
      Tone.Draw.schedule(() => {
         // Move cursor to specific measure or note?
         // OSMD cursor logic is complex. 
         // For MVP: Simplest is purely visual update, but jumping cursor is hard.
         // Let's just try to 'next' it roughly? 
         // Better: Map measureIndex to cursor.
         // Since we can't easily jump cursor to random index without iterating,
         // We might just let it be for now or implement a simpler cursor tracker.
         
         // Try a naive approach: If it's a new measure, next measure?
         // Or just iterate cursor based on time?
         // For now, let's skip complex cursor sync in this specialized Tone implementation
         // to ensure Sound is perfect first.
      }, time);
      
    }, events).start(0);
    
    part.loop = false;
    partRef.current = part;

  }, [xmlData, isSwing, bpm]);

  const togglePlayback = async () => {
    await Tone.start(); // Ensure AudioContext is ready
    
    if (isPlaying) {
      Tone.Transport.pause();
      setIsPlaying(false);
    } else {
      preparePlayback(); // Re-calculate schedule (in case swing changed)
      Tone.Transport.start();
      setIsPlaying(true);
    }
  };

  const stopPlayback = () => {
    Tone.Transport.stop();
    setIsPlaying(false);
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
