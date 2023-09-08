import { Dialog, DialogContent, DialogTitle, TextField } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useState, Dispatch } from 'react';
import { toast } from 'react-hot-toast';
import { ERROR, PLAYLIST, SEGMENT } from '../constants';
import parseHls from '../lib/parseHls';
import RenderCustomHeaders from './customHeader';
import Layout from './layout';

export default function HomePage({
	setUrl,
	setHeaders,
}: {
	setUrl: Dispatch<React.SetStateAction<string>>;
	setHeaders: Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
	const [text, settext] = useState('');
	const [playlist, setPlaylist] = useState<
		{
			name: string;
			bandwidth: number;
			uri: string;
		}[]
	>([]);
	const [limitationrender, setLimitationRender] = useState(false);
	const [customHeadersRender, setCustomHeadersRender] = useState(false);
	const [customHeaders, setcustomHeaders] = useState({});

	function toggleLimitation() {
		setLimitationRender(!limitationrender);
	}

	function toggleCustomHeaders() {
		setCustomHeadersRender(!customHeadersRender);
	}

	function closeQualityDialog() {
		setPlaylist([]);
	}

	async function validateAndSetUrl() {
		toast.loading(`Validating...`, { duration: 800 });
		let data = await parseHls({ hlsUrl: text, headers: customHeaders });
		if (!data) {
			// I am sure the parser lib returning, instead of throwing error
			toast.error(`Invalid url, Content possibly not parsed!`);
			return;
		}
		if (data.type === ERROR) {
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
			setUrl(text);
			setHeaders(customHeaders);
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
						value={text}
						onChange={(e) => settext(e.target.value)}
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
						{(playlist || []).map((item) => {
							return (
								<div
									className="flex justify-between items-center mt-2"
									key={item.bandwidth}
								>
									<button
										className="mr-2 px-2 py-1 rounded-md bg-black text-white"
										onClick={() => {
											setUrl(item.uri);
											setHeaders(customHeaders);
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
				open={limitationrender}
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

			<Dialog
				open={customHeadersRender}
				onClose={toggleCustomHeaders}
				fullWidth
				maxWidth="sm"
			>
				<DialogTitle className="flex justify-between">
					<span className="text-xl font-bold">Custom headers</span>
					<button className="text-sm" onClick={toggleCustomHeaders}>
						<Close />
					</button>
				</DialogTitle>
				<DialogContent>
					<RenderCustomHeaders
						customHeaders={customHeaders}
						setCustomHeaders={setcustomHeaders}
					/>
				</DialogContent>
			</Dialog>
		</>
	);
}

const limitations = [
	"It may not work on some browsers, Especially on mobile browsers. <a href='https://caniuse.com/sharedarraybuffer' class='underline' target='_blank' rel='noopener'>See supported browsers</a>.",
	'It does not currently support custom headers.',
	'Custom cookies will not be possible because the browser will ignore them.',
	'It is not possible to download live streams.',
];
