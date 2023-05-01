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

        this.document = model.currentDocument;

        this.saveData = null;

        // Subscribe to the document model to be notified when the document has been loaded.
        this.model.addEventListener('documentOpened', (e) => {
            this.document = e.detail;

            // Subscribe to the document so we know when the paragraphs have changed.
            this.document.addEventListener('paragraphChanged', (e) => {
                this.save(e.detail);
            });

            // Subscribe to pause events so we can save the current position of the user
            // in the document.
            this.audioController.audioElement.addEventListener('pause', (e) => {
                this.save(this.document.currentParagraphIndex);
            });

            this.document.addEventListener('documentLoaded', (e) => {

                // Load the current position of the user in the document from the database.
                let position = this.load();
                if (position && position.documentID === this.document.id) {
                    // Set the current paragraph index and the current time in the audio file.
                    this.document.setCurrentParagraphIndex(position.paragraphIndex);
                    this.audioController.audioElement.currentTime = position.currentTime;
                }
            });
        });
    }
    
    // Save the current position of the user in the book to the clients browser.
    // This will save the current paragraph index and the current time in the
    // audio file.
    save(index) {
        if (!this.document) {
            return;
        }
        if (!this.document.paragraphs) {
            return;
        }
        if (this.document.paragraphs.length === 0) {
            return;
        }

        // Get the current paragraph and the current time in the audio file.
        let currentTime = this.audioController.audioElement.currentTime;

        // Save the current position of the user in the book to the clients browser.
        let saveData = {
            documentName: this.document.name,
            documentID: this.document.id,
            paragraphIndex: index,
            currentTime: currentTime
        };
        localStorage.setItem('saveData', JSON.stringify(saveData));
    }

    // Load the current position of the user in the book from the clients browser.
    // This will load the current paragraph index and the current time in the
    // audio file.
    load() {
        let saveData = localStorage.getItem('saveData');
        if (!saveData) {
            return null;
        }
        this.saveData = JSON.parse(saveData);
        return this.saveData;
    }

    // Clear the saved position of the user in the book from the clients browser.
    clear() {
        localStorage.removeItem('saveData');
    }

    // Loads the document that the user was last reading.
    loadLastDocument() {
        let saveData = localStorage.getItem('saveData');
        if (!saveData) {
            return null;
        }
        saveData = JSON.parse(saveData);
        this.model.openDocument(saveData.documentID);
    }
}
