import * as alert from './alert.js'

/*
AudioController is a class that handles the audio playback of the
document. It will play the audio files in the background and update
the view when the audio has been loaded and when the audio has
finished playing.

When an audio file has finished playing, the AudioController will
notify the document model that the current paragraph has changed.
*/
export class AudioController {
    constructor(model) {
        this.model = model;
        this.document = model.currentDocument;

        this.playing = false;

        this.audioElement = document.getElementById('audio-player');

        // Subscribe to the document model to be notified when the document has been loaded.
        this.model.addEventListener('documentOpened', (e) => {
            this.document = e.detail;
            this.updateView();

            this.audioElement.addEventListener('play', (e) => {
                console.log('play');
                this.playing = true;
            });

            this.audioElement.addEventListener('pause', (e) => {
                // Determine if the audio has been paused or if it has
                // finished playing. If the audio has finished playing,
                // don't set the playing flag to false.
                if (this.audioElement.currentTime === this.audioElement.duration) {
                    return
                }
                console.log('pause');
                this.playing = false;
            });

            this.audioElement.addEventListener('ended', (e) => {
                this.document.nextParagraph();
            });

            // Check if there was an error loading the audio file. If
            // there was an error, try to load the next paragraph.
            this.audioElement.addEventListener('error', (e) => {
                alert.error("Missing audio src: " + this.audioElement.src + ". Skipping to next paragraph.");
                this.document.nextParagraph();
            });

            // Subscribe to the document so we know when the paragraphs have changed.
            this.document.addEventListener('paragraphChanged', (e) => {
                this.updateView();
            });
        });
    }

    // Update the audio view. This will create a new audio element within
    // the audio container and set the source to the current paragraph's
    // audio file. Automatically starts playing the audio if the playing
    // flag is set.
    updateView() {
        if (!this.document) {
            return;
        }
        if (!this.document.paragraphs) {
            return;
        }
        if (this.document.paragraphs.length === 0) {
            return;
        }

        // Set the source of the audio element to the current paragraph's audio file.
        let index = this.document.currentParagraphIndex;
        let paragraph = this.document.paragraphs[index];
        this.audioElement.src = paragraph.audioLink;

        // If the audio is playing, start playing the new audio.
        if (this.playing) {
            this.audioElement.play();
        }
    }
}
