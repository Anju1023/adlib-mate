"use client";

import { useEffect, useRef } from "react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";

interface ScoreViewerProps {
  xmlData: string | null;
}

export default function ScoreViewer({ xmlData }: ScoreViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);

  useEffect(() => {
    if (containerRef.current && !osmdRef.current) {
      osmdRef.current = new OpenSheetMusicDisplay(containerRef.current, {
        autoResize: true,
        drawTitle: false,
        drawComposer: false,
        drawSubtitle: false,
        drawingParameters: "compacttight",
      });
    }
  }, []);

  useEffect(() => {
    const renderScore = async () => {
      if (osmdRef.current && xmlData) {
        try {
          await osmdRef.current.load(xmlData);
          osmdRef.current.render();
        } catch (error) {
          console.error("Error rendering score:", error);
        }
      }
    };
    renderScore();
  }, [xmlData]);

  return (
    <div className="w-full bg-white rounded-lg p-4 overflow-hidden">
      <div ref={containerRef} className="w-full" />
      {!xmlData && (
        <div className="text-slate-400 text-center py-20 italic">
          No music data loaded.
        </div>
      )}
    </div>
  );
}
