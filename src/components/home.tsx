import { Dialog, DialogContent, DialogTitle, TextField } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useState, Dispatch, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { ERROR, PLAYLIST, SEGMENT } from '../constants';
import parseHls from '../lib/parseHls';
import Layout from './layout';

export default function HomePage({
	setUrl,
}: {
	setUrl: Dispatch<React.SetStateAction<string>>;
}) {
	const [hlsUrl, setHlsUrl] = useState('');

	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const destinationUrl = urlParams.get('destination');
		if (destinationUrl) {
			setHlsUrl(destinationUrl);
		}
	}, []);

	const [playlist, setPlaylist] = useState<
		{
			name: string;
			bandwidth: string;
			uri: string;
		}[]
	>([]);

	const [limitationRender, setLimitationRender] = useState(false);

	function toggleLimitation() {
		setLimitationRender(!limitationRender);
	}

	function closeQualityDialog() {
		setPlaylist([]);
	}

	async function validateAndSetUrl() {
		const validatingToast = toast.loading(`Validating...`, { duration: 800 });
		let data = await parseHls({ hlsUrl: hlsUrl });
		if (!data) {
			// I am sure the parser lib returning, instead of throwing error
			toast.error(`Invalid url, Content possibly not parsed!`);
			return;
		}
		if (data.type === ERROR) {
			toast.dismiss(validatingToast);
			toast.error('Something went wrong');
		} else if (data.type === PLAYLIST) {
			if (!data.data.length) {
				toast.error(`No playlist found in the url`);
			} else {
				// TODO: fix type error
				// @ts-ignore
				setPlaylist(data.data);
			}
		} else if (data.type === SEGMENT) {
			setUrl(hlsUrl);
		}
	}

	return (
		<>
			<Layout>
				<h1 className="text-3xl lg:text-4xl font-bold">HLS Downloader</h1>

				<div className="w-full max-w-3xl mt-5 mb-4">
					<TextField
						label="HLS URI"
						fullWidth
						size="small"
						value={hlsUrl}
						onChange={(e) => setHlsUrl(e.target.value)}
						InputProps={{
							endAdornment: (
								<button
									className="cursor-pointer"
									onClick={validateAndSetUrl}
									disabled={typeof SharedArrayBuffer === 'undefined'}
								>
									{typeof SharedArrayBuffer === 'undefined'
										? 'No browser support'
										: 'Download'}
								</button>
							),
						}}
					/>
				</div>
			</Layout>

			<Dialog
				open={playlist.length !== 0}
				fullWidth
				maxWidth="sm"
				onClose={closeQualityDialog}
			>
				<DialogTitle className="flex justify-between">
					<span className="text-xl font-bold">Select quality</span>
					<button className="text-sm" onClick={closeQualityDialog}>
						<Close />
					</button>
				</DialogTitle>
				<DialogContent>
					<div className="flex flex-wrap justify-center items-center">
						{(playlist || [])
							.sort((a, b) => parseInt(a.bandwidth) - parseInt(b.bandwidth))
							.map((item) => {
								return (
									<div
										className="flex justify-between items-center mt-2"
										key={item.bandwidth}
									>
										<button
											className="mr-2 px-2 py-1 rounded-md bg-black text-white"
											onClick={() => {
												setUrl(item.uri);
											}}
										>
											{item.name}
										</button>
									</div>
								);
							})}
					</div>
				</DialogContent>
			</Dialog>

			<Dialog
				open={limitationRender}
				onClose={toggleLimitation}
				fullWidth
				maxWidth="sm"
			>
				<DialogTitle className="flex justify-between">
					<span className="text-xl font-bold">Limitations</span>
					<button className="text-sm" onClick={toggleLimitation}>
						<Close />
					</button>
				</DialogTitle>
				<DialogContent>
					<ol className="list-decimal list-inside text-gray-700">
						{limitations.map((limitation) => (
							<li
								key={limitation}
								dangerouslySetInnerHTML={{ __html: limitation }}
							/>
						))}
					</ol>
				</DialogContent>
			</Dialog>
		</>
	);
}

const limitations = [
	"It may not work on some browsers, Especially on mobile browsers. <a href='https://caniuse.com/sharedarraybuffer' class='underline' target='_blank' rel='noopener'>See supported browsers</a>.",
	'Custom cookies will not be possible because the browser will ignore them.',
	'It is not possible to download live streams.',
];
