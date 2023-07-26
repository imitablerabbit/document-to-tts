/*
SaveDocumentPositionController is a controller that is responsible for saving the
current position of the user in the document. This controller will subscribe to the
document model to be notified when the document has been loaded. When the
document has been loaded we will then subscribe to the document so we can be
alerted for paragraph changes.

When the current paragraph has changed we will save the current position of the
user in the document in the database.
*/
export class SaveDocumentPositionController {
    constructor(model, audioController) {
        this.model = model;
        this.audioController = audioController;

        // Document that has been opened by the user.
        this.document = model.currentDocument;

        // Subscribe to the document model to be notified when the document has been loaded.
        this.model.addEventListener('documentOpened', (e) => {
            this.document = e.detail;

            // Subscribe to the document so we know when the paragraphs have changed.
            this.document.addEventListener('paragraphChanged', (e) => {
                let index = e.detail;
                this.save(index);
            });

            // Subscribe to pause events so we can save the current position of the user
            // in the document.
            this.audioController.audioElement.addEventListener('pause', (e) => {
                this.save(this.document.currentParagraphIndex);
            });

            // When a new document is loaded, we need to load the current position of the
            // user in the document from the clients browser.
            this.document.addEventListener('documentLoaded', (e) => {
                this.load();
            });
        });
    }
    
    // This will save the current paragraph index and the current time in the
    // audio file.
    save(index) {
        if (!this.document || !this.document.paragraphs || this.document.paragraphs.length === 0) {
            return;
        }

        // Get the current paragraph and the current time in the audio file.
        let currentTime = this.audioController.audioElement.currentTime;

        // Save the current position of the user in the book to the clients browser.
        let saveData = {
            documentName: this.document.name,
            documentID: this.document.id,
            paragraphIndex: index
        };
        localStorage.setItem(this.document.id, JSON.stringify(saveData));
    }

    // Load the current position of the user in the book from the clients browser.
    // This will load the current paragraph index and the current time in the
    // audio file.
    load() {
        let saveData = localStorage.getItem(this.document.id);
        if (saveData) {
            saveData = JSON.parse(saveData);
            if (saveData.documentID === this.document.id) {
                let index = saveData.paragraphIndex;
                this.document.setCurrentParagraphIndex(index);
                return index;
            }
        }
        return null;
    }
}
