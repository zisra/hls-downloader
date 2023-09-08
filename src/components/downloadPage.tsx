import { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
	DOWNLOAD_ERROR,
	JOB_FINISHED,
	SEGMENT,
	SEGMENT_CHUNK_SIZE,
	SEGMENT_STARTING_DOWNLOAD,
	SEGMENT_STICHING,
	STARTING_DOWNLOAD,
	START_DOWNLOAD,
} from '../constants';
import Layout from './layout';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import parseHls from '../lib/parseHls';
import { LinearProgress } from '@mui/material';

// make a progress bar component using material ui
function ProgressBar({ progress }: { progress: number }) {
	console.log(progress);
	return (
		<LinearProgress
			sx={{
				width: '100%',
				padding: '5px 0',
				marginTop: 2,
				marginLeft: 20,
				marginRight: 20,
				borderRadius: 5,
			}}
			variant="determinate"
			value={progress * 100}
		/>
	);
}

export default function DownloadPage({ url }: { url: string }) {
	const [downloadState, setDownloadState] = useState(START_DOWNLOAD);
	const [additionalMessage, setAdditionalMessage] = useState<string | null>('');
	const [downloadBlobUrl, setDownloadBlobUrl] = useState('');
	const [progress, setProgress] = useState<number | null>(null);

	async function startDownload() {
		setDownloadState(STARTING_DOWNLOAD);
		setAdditionalMessage(`Job started`);

		try {
			setAdditionalMessage(`Fetching segments`);

			let getSegments = await parseHls({ hlsUrl: url });
			if (getSegments?.type !== SEGMENT)
				throw new Error(`Invalid segment url, Please refresh the page`);

			let segments: {
				name: string;
				bandwidth: number;
				uri: string;
				index: string;
			}[] = [];

			if (Array.isArray(getSegments.data)) {
				segments = getSegments.data.map((s: any, i: number) => ({
					...s,
					index: i,
				}));
			} else {
				console.error('Invalid segment data');
			}

			setAdditionalMessage(`Downloading FFmpeg`);
			const ffmpeg = createFFmpeg({
				mainName: 'main',
				corePath:
					'https://unpkg.com/@ffmpeg/core-st@0.11.1/dist/ffmpeg-core.js',
				log: false,
			});

			await ffmpeg.load();
			setAdditionalMessage(`FFmpeg loaded`);

			setDownloadState(SEGMENT_STARTING_DOWNLOAD);

			let segmentChunks = [];
			for (let i = 0; i < segments.length; i += SEGMENT_CHUNK_SIZE) {
				segmentChunks.push(segments.slice(i, i + SEGMENT_CHUNK_SIZE));
			}

			let successfulSegments: string[] = [];

			setProgress(0);
			
			for (let i = 0; i < segmentChunks.length; i++) {
				setAdditionalMessage(`Downloading segment chunks`);
				setProgress(i / segmentChunks.length);

				let segmentChunk = segmentChunks[i];

				await Promise.all(
					segmentChunk.map(async (segment) => {
						try {
							let fileId = `${segment.index}.ts`;
							let getFile = await fetch(segment.uri);

							if (!getFile.ok) throw new Error('File failed to fetch');

							ffmpeg.FS(
								'writeFile',
								fileId,
								// TODO: fix type error
								// @ts-ignore
								await fetchFile(await getFile.arrayBuffer())
							);
							successfulSegments.push(fileId);
							console.log(`[SUCCESS] Segment downloaded ${segment.index}`);
						} catch (error) {
							console.log(`[ERROR] Segment download error ${segment.index}`);
						}
					})
				);
			}
			setProgress(1);

			successfulSegments = successfulSegments.sort((a, b) => {
				let aIndex = parseInt(a.split('.')[0]);
				let bIndex = parseInt(b.split('.')[0]);
				return aIndex - bIndex;
			});

			setAdditionalMessage(`Stiching segments`);
			setDownloadState(SEGMENT_STICHING);

			await ffmpeg.run(
				'-i',
				`concat:${successfulSegments.join('|')}`,
				'-c',
				'copy',
				'output.ts'
			);

			setAdditionalMessage(`Stiching segments finished`);

			successfulSegments.forEach((segment) => {
				// cleanup
				try {
					ffmpeg.FS('unlink', segment);
				} catch (_) {}
			});

			let data;

			try {
				data = ffmpeg.FS('readFile', 'output.ts');
			} catch (_) {
				throw new Error(`Something went wrong while stiching!`);
			}

			setAdditionalMessage(null);
			setDownloadState(JOB_FINISHED);
			setDownloadBlobUrl(
				URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp2t' }))
			);

			setTimeout(() => {
				ffmpeg.exit(); // ffmpeg.exit() is callable only after load() stage.
			}, 1000);
		} catch (error) {
			if (error instanceof Error) {
				setAdditionalMessage(null);
				setDownloadState(DOWNLOAD_ERROR);
				toast.error(error.message);
			}
		}
	}

	return (
		<Layout>
			<h2 className="text-2xl lg:text-3xl font-bold mb-4">{downloadState}</h2>
			<code className="border border-gray-200 bg-gray-100 px-2 rounded-sm break-all text-center py-2 w-full max-w-3xl">
				{url}
			</code>

			{downloadState === START_DOWNLOAD && (
				<div className="flex gap-5 items-center mt-5">
					<button
						className="px-4 py-1.5 bg-gray-900 hover:bg-gray-700 text-white rounded-md"
						onClick={startDownload}
					>
						Start Download
					</button>
				</div>
			)}

			{additionalMessage && (
				<p className="text-gray-900 mt-5">{additionalMessage}</p>
			)}

			{progress ? <ProgressBar progress={progress} /> : null}

			{downloadBlobUrl && (
				<div className="flex gap-2 items-center">
					<a
						href={downloadBlobUrl}
						download={`hls-downloader-${new Date()
							.toLocaleDateString()
							.replace(/[/]/g, '-')}.mp4`} // .mp4 is widely supported, and player knows the mimetype so it doesn't matter
						className="px-4 py-1.5 bg-gray-900 hover:bg-gray-700 text-white rounded-md mt-5"
					>
						Download now
					</a>

					<button
						onClick={() => window.location.reload()}
						className="px-4 py-1.5 bg-gray-900 hover:bg-gray-700 text-white rounded-md mt-5"
					>
						Create new
					</button>
				</div>
			)}

			{downloadState === DOWNLOAD_ERROR && (
				<button
					onClick={() => window.location.reload()}
					className="px-4 py-1.5 bg-gray-900 hover:bg-gray-700 text-white rounded-md mt-5"
				>
					Try with different url
				</button>
			)}
		</Layout>
	);
}
