# Flat Piano Studio

Flat Piano Studio is a browser-based, two-octave piano for free play, note learning, timed challenges, MIDI input, recording, replay, and metronome practice.

## Try it locally

The app has no build step or dependencies. Serve the repository with any static web server:

```sh
python3 -m http.server 8080
```

Then open `http://localhost:8080`. Opening the files directly is not recommended because browser audio, MIDI, and offline features require a secure or local web origin.

## Publish with GitHub Pages

1. Push this repository to GitHub.
2. Open **Settings → Pages** in the repository.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the default branch and the `/ (root)` folder, then save.

The root page forwards visitors to the app in `Piano_html5/`. The `Code_piano/` folder preserves the original Construct project and is not needed by the deployed app.

## Browser support

- Pointer, touch, and computer keyboard input
- Web MIDI where the browser supports it
- Installable/offline PWA behavior on supported browsers
- Ogg and M4A audio fallbacks

## Repository layout

- `Piano_html5/` — maintained static web app
- `Code_piano/` — archived original Construct source
- `Piano basic Guide line.docx` — original project notes

## License

No open-source license has been selected yet. Add a license before inviting outside contributions or reuse.
