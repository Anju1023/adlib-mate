'use client';

import { useState, useRef, useEffect } from 'react';
import {
	Music,
	Play,
	Send,
	Plus,
	Settings2,
	AlertCircle,
	Camera,
	Loader2,
	Sparkles,
	Zap,
	Brain,
} from 'lucide-react';
import { generateSolo, analyzeScore, GenerationRequest } from '@/lib/api';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';

// Dynamically import ScoreViewer with SSR disabled to prevent hydration errors
// because OpenSheetMusicDisplay relies on window/document objects.
const ScoreViewer = dynamic(() => import('@/components/ScoreViewer'), {
	ssr: false,
	loading: () => (
		<div className="flex items-center justify-center h-64 text-slate-500">
			Loading Score Viewer...
		</div>
	),
});

export default function Home() {
	const [mounted, setMounted] = useState(false);
	const [chordInput, setChordInput] = useState<string>('Dm7 G7 Cmaj7');
	const [isGenerating, setIsGenerating] = useState(false);
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [modelMode, setModelMode] = useState<'speed' | 'quality'>('speed');
	const [xmlData, setXmlData] = useState<string | null>(null);
	const [explanation, setExplanation] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setMounted(true);
	}, []);

	const handleGenerate = async () => {
		setIsGenerating(true);
		setError(null);
		setExplanation(null);

		try {
			// Basic chord parsing: split by space
			const chordList = chordInput.split(/\s+/).filter((c) => c.length > 0);

			// For MVP, we'll just put them in measure 1.
			// In a real app, we'd want to handle multiple measures.
			const request: GenerationRequest = {
				chords: [{ measure_number: 1, chords: chordList }],
				config: {
					difficulty: 'Beginner',
					instrument: 'Saxophone',
					tempo: 120,
					model_mode: modelMode,
				},
			};

			const response = await generateSolo(request);
			setXmlData(response.music_xml);
			setExplanation(response.explanation);
		} catch (err) {
			console.error(err);
			setError('生成に失敗しちゃった。バックエンドが動いてるか確認してね！');
		} finally {
			setIsGenerating(false);
		}
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setIsAnalyzing(true);
		setError(null);

		try {
			const result = await analyzeScore(file);
			// Flatten chords from measures into a single string for the input
			const chordsStr = result.chords.map((m) => m.chords.join(' ')).join(' ');
			setChordInput(chordsStr);
		} catch (err) {
			console.error(err);
			setError('画像の解析に失敗しちゃった。');
		} finally {
			setIsAnalyzing(false);
			if (fileInputRef.current) fileInputRef.current.value = '';
		}
	};

	if (!mounted) {
		return null;
	}

	return (
		<main className="min-h-screen p-4 md:p-8 flex flex-col gap-8 max-w-4xl mx-auto pb-24 md:pb-8">
			{/* Header */}
			<header className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="p-2.5 bg-linear-to-br from-primary to-amber-600 rounded-xl shadow-lg shadow-amber-900/20">
						<Music className="text-slate-950 w-6 h-6" />
					</div>
					<div>
						<h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-primary to-amber-200">
							Ad-lib Mate
						</h1>
						<p className="text-xs text-slate-500 font-sans tracking-widest uppercase opacity-80">
							AI Session Partner
						</p>
					</div>
				</div>
				<button className="p-2 hover:bg-slate-800 rounded-full transition-colors">
					<Settings2 className="w-6 h-6 text-slate-400" />
				</button>
			</header>

			{/* Input Section */}
			<section className="card flex flex-col gap-5">
				<div className="flex items-center justify-between border-b border-slate-800 pb-3">
					<h2 className="text-xl font-semibold flex items-center gap-2 text-slate-200">
						<Plus className="w-5 h-5 text-primary" />
						Chord Progression
					</h2>
					<button
						onClick={() => fileInputRef.current?.click()}
						disabled={isAnalyzing}
						className="flex items-center gap-2 text-sm font-medium text-secondary hover:text-indigo-300 transition-colors bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20 hover:bg-indigo-500/20"
					>
						{isAnalyzing ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Camera className="w-4 h-4" />
						)}
						{isAnalyzing ? 'Analyzing...' : 'Scan Score'}
					</button>
					<input
						type="file"
						ref={fileInputRef}
						onChange={handleFileChange}
						accept="image/*"
						className="hidden"
					/>
				</div>

				<div className="relative">
					<label className="text-xs text-slate-500 mb-1.5 block font-mono">
						INPUT CHORDS
					</label>
					<input
						type="text"
						value={chordInput}
						onChange={(e) => setChordInput(e.target.value)}
						className="input-jazz"
						placeholder="e.g. Dm7 G7 Cmaj7"
					/>
					{error && (
						<div className="mt-2 text-rose-500 text-sm flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
							<AlertCircle className="w-4 h-4" />
							{error}
						</div>
					)}
				</div>

				{/* Model Mode Toggle */}
				<div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-800 self-end">
					<button
						onClick={() => setModelMode('speed')}
						className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
							modelMode === 'speed'
								? 'bg-indigo-600 text-white shadow-lg'
								: 'text-slate-500 hover:text-slate-300'
						}`}
					>
						<Zap className="w-3 h-3" />
						Speed
					</button>
					<button
						onClick={() => setModelMode('quality')}
						className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
							modelMode === 'quality'
								? 'bg-amber-600 text-white shadow-lg'
								: 'text-slate-500 hover:text-slate-300'
						}`}
					>
						<Brain className="w-3 h-3" />
						Quality
					</button>
				</div>

				<button
					onClick={handleGenerate}
					disabled={isGenerating || isAnalyzing}
					className="btn-primary w-full gap-2 text-lg mt-2"
				>
					{isGenerating ? (
						<span className="animate-pulse">Improvising...</span>
					) : (
						<>
							<Send className="w-5 h-5" />
							Generate Solo
						</>
					)}
				</button>
			</section>

			{/* Score Viewer Section */}
			<section className="flex-1 flex flex-col gap-6">
				{xmlData ? (
					<>
						<div className="card p-1 bg-white/5 border-amber-500/20">
							<ScoreViewer xmlData={xmlData} />
						</div>

						{explanation && (
							<div className="card border-secondary/30 bg-linear-to-br from-slate-900 to-indigo-950/30">
								<h3 className="text-lg font-semibold text-secondary flex items-center gap-2 mb-3">
									<Sparkles className="w-5 h-5" />
									Session Advice
								</h3>
								<div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed font-sans">
									<ReactMarkdown>{explanation}</ReactMarkdown>
								</div>
							</div>
						)}
					</>
				) : (
					<div className="card h-full flex flex-col items-center justify-center border-dashed border-slate-700 bg-slate-900/30 min-h-75">
						<div className="text-center space-y-4">
							<div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto border border-slate-700 shadow-inner">
								<Play className="w-8 h-8 text-slate-600 ml-1" />
							</div>
							<div className="space-y-1">
								<h3 className="text-slate-300 font-serif text-lg">
									Ready to Jam?
								</h3>
								<p className="text-slate-500 text-sm max-w-xs mx-auto">
									Enter chords or scan a chart to generate your ad-lib solo.
								</p>
							</div>
						</div>
					</div>
				)}
			</section>

			{/* Footer / Controls */}
			<footer className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/80 backdrop-blur-md border-t border-slate-800 md:relative md:bg-transparent md:border-none md:p-0">
				<div className="max-w-4xl mx-auto flex items-center justify-center gap-4">
					{/* Playback controls will go here */}
				</div>
			</footer>
		</main>
	);
}
