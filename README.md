<div>
  <h1 align="center">HLS Downloader</h1>
  <p align="center">This is a fork of the original repo <a href="https://github.com/tuhinpal/hls-downloader">tuhinpal/hls-downloader</a> with some modifications.</p>
</div>

## Backstory

I noticed that there were fewer browser-based tools available for downloading video streams that use the HTTP Live Streaming (HLS) protocol, so I saw an opportunity to fill this gap and set out to create a website that would allow users to easily download HLS streams for offline viewing or archival purposes inside from their browser and purely client side.

## Demo

Try it now [from here](https://hlsdownloader.thetuhin.com/). Please note it only supports [these browsers](https://caniuse.com/sharedarraybuffer).

## Roadmap

- [ ] Support DASH Protocol
- [x] Custom header Support

## Authors

- [@zisra](https://www.github.com/zisra)
- [@tuhinpal](https://www.github.com/tuhinpal) (original author)

## Acknowledgements

- [Vite](https://vitejs.dev/) as build tool.
- [React](https://reactjs.org/) as frontend framework.
- [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) to stich segments together.