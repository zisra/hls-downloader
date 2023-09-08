import { Parser } from 'm3u8-parser';
import { ERROR, PLAYLIST, SEGMENT } from '../constants';

async function parseHls({
	hlsUrl,
	headers = {},
}: {
	hlsUrl: string;
	headers?: Record<string, string>;
}) {
	try {
		let url = new URL(hlsUrl);

		let response = await fetch(url.href, {
			headers: {
				...headers,
			},
		});

		if (!response.ok) {
			throw new Error(response.statusText);
		}

		let manifest = await response.text();

		const parser = new Parser();
		parser.push(manifest);
		parser.end();

		let path = hlsUrl;

		try {
			let pathBase = url.pathname.split('/');
			pathBase.pop();
			pathBase.push('{{URL}}');
			path = pathBase.join('/');
		} catch (perror) {
			console.info(`[Info] Path parse error`, perror);
		}

		let base = url.origin + path;

		if (parser.manifest.playlists?.length) {
			let groups = parser.manifest.playlists;

			const mappedGroups: {
				name: string;
				bandwidth: number;
				uri: string;
			}[] = groups
				.map((playlist) => {
					return {
						name: playlist.attributes.NAME
							? playlist.attributes.NAME
							: playlist.attributes.RESOLUTION
							? `${playlist.attributes.RESOLUTION.width}x${playlist.attributes.RESOLUTION.height}`
							: `MAYBE_AUDIO:${playlist.attributes.BANDWIDTH}`,
						bandwidth: playlist.attributes.BANDWIDTH,
						uri: playlist.uri.startsWith('http')
							? playlist.uri
							: base.replace('{{URL}}', playlist.uri),
					};
				})
				.filter((g) => g);

			return {
				type: PLAYLIST,
				data: mappedGroups,
			};
		} else if (parser.manifest.segments?.length) {
			let segments = parser.manifest.segments;
			const mappedSegments = segments.map((s) => ({
				...s,
				uri: s.uri.startsWith('http') ? s.uri : base.replace('{{URL}}', s.uri),
			}));

			return {
				type: SEGMENT,
				data: mappedSegments,
			};
		}
	} catch (error) {
		if (error instanceof Error) {
			return {
				type: ERROR,
				data: error.message,
			};
		}
	}
}

export default parseHls;
