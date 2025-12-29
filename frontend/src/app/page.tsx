'use client';

import { useState, useRef } from 'react';
import { Music, Play, Send, Plus, Settings2, AlertCircle, Camera, Loader2 } from 'lucide-react';
import { generateSolo, analyzeScore, GenerationRequest } from '@/lib/api';
import dynamic from 'next/dynamic';

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
	const [chordInput, setChordInput] = useState<string>('Dm7 G7 Cmaj7');
	const [isGenerating, setIsGenerating] = useState(false);
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [xmlData, setXmlData] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleGenerate = async () => {
		setIsGenerating(true);
		setError(null);

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
				},
			};

			const response = await generateSolo(request);
			setXmlData(response.music_xml);
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
			const chordsStr = result.chords
				.map((m) => m.chords.join(' '))
				.join(' ');
			setChordInput(chordsStr);
		} catch (err) {
			console.error(err);
			setError('画像の解析に失敗しちゃった。');
		} finally {
			setIsAnalyzing(false);
			if (fileInputRef.current) fileInputRef.current.value = '';
		}
	};

	return (
		<main className="min-h-screen p-4 md:p-8 flex flex-col gap-8 max-w-4xl mx-auto">
			{/* Header */}
			<header className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div className="p-2 bg-primary rounded-lg">
						<Music className="text-background w-6 h-6" />
					</div>
					<h1 className="text-2xl font-bold tracking-tight text-primary">
						Ad-lib Mate
					</h1>
				</div>
				<button className="p-2 hover:bg-slate-800 rounded-full transition-colors">
					<Settings2 className="w-6 h-6 text-slate-400" />
				</button>
			</header>

			{/* Input Section */}
			<section className="card flex flex-col gap-4">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold flex items-center gap-2">
						<Plus className="w-5 h-5 text-primary" />
						今日のコード進行
					</h2>
					<button
						onClick={() => fileInputRef.current?.click()}
						disabled={isAnalyzing}
						className="flex items-center gap-2 text-sm text-secondary hover:text-indigo-400 transition-colors"
					>
						{isAnalyzing ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Camera className="w-4 h-4" />
						)}
						{isAnalyzing ? '解析中...' : '楽譜を撮影'}
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
					<input
						type="text"
						value={chordInput}
						onChange={(e) => setChordInput(e.target.value)}
						className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-lg font-mono focus:border-primary focus:outline-none transition-colors"
						placeholder="例: Dm7 G7 Cmaj7"
					/>
					{error && (
						<div className="mt-2 text-rose-500 text-sm flex items-center gap-1">
							<AlertCircle className="w-4 h-4" />
							{error}
						</div>
					)}
					<p className="mt-2 text-sm text-slate-500">
						半角スペース区切りで入力してね！ (例: Dm7 G7 Cmaj7)
					</p>
				</div>
				<button
					onClick={handleGenerate}
					disabled={isGenerating || isAnalyzing}
					className="btn-primary w-full gap-2 text-lg"
				>
					{isGenerating ? (
						<span className="animate-pulse">生成中...</span>
					) : (
						<>
							<Send className="w-5 h-5" />
							アドリブを生成する
						</>
					)}
				</button>
			</section>

			{/* Score Viewer Section */}
			<section className="flex-1 min-h-100">
				{xmlData ? (
					<ScoreViewer xmlData={xmlData} />
				) : (
					<div className="card h-full flex flex-col items-center justify-center border-dashed border-slate-700 bg-transparent">
						<div className="text-center space-y-4">
							<div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto border border-slate-800">
								<Play className="w-8 h-8 text-slate-700" />
							</div>
							<p className="text-slate-500 max-w-xs">
								生成されたアドリブがここに表示されるよ。
								まずは上のフォームにコードを入力してみてね！
							</p>
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
