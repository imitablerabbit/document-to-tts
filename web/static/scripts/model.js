/*
Model for the audio player content. 

The user will be able upload documents to the server and the
model will receive the list of audio files from the server
and update the view accordingly.
*/
export class Model {
    constructor() {
        this.documents = [];
        this.currentDocument = null;

        // Listeners for the model events.
        this.listeners = [];

        // Event types.
        this.DOCUMENTS_LOADED = 'documentsLoaded';
        this.DOCUMENT_OPENED = 'documentOpened';
        this.DOCUMENT_UPLOADED = 'documentUploaded';
    }

    // Load the list of documents from the server. This will return a promise
    // that will be resolved when the documents have been loaded.
    loadDocuments() {
        return new Promise((resolve, reject) => {
            let request = new XMLHttpRequest();
            request.open('GET', '/documents');
            request.responseType = 'json';
            request.send();
            request.onload = () => {
                this.documents = request.response.documents;
                let e = new CustomEvent(this.DOCUMENTS_LOADED, {detail: this.documents});
                this.listeners.forEach((listener) => {
                    if (listener.event === this.DOCUMENTS_LOADED) {
                        listener.eventHandler(e);
                    }
                });
                resolve();
            };
        });
    }

    // Open the document with the given name. This will return a promise
    // that will be resolved when the document has been opened. This will
    // also update the current document.
    openDocument(documentID) {
        return new Promise((resolve, reject) => {
            let document = new DocumentModel();
            document.loadDocument(documentID).then(() => {
                this.currentDocument = document;
                let e = new CustomEvent(this.DOCUMENT_OPENED, {detail: this.currentDocument});
                this.listeners.forEach((listener) => {
                    if (listener.event === this.DOCUMENT_OPENED) {
                        listener.eventHandler(e);
                    }
                });
                resolve();
            });
        });
    }

    // Upload the document to the server. This will return a promise
    // that will be resolved when the document has been uploaded.
    uploadDocument(documentName, documentFile) {
        return new Promise((resolve, reject) => {
            let formData = new FormData();
            formData.append('documentName', this.documentName);
            formData.append('documentFile', this.documentFile);

            let request = new XMLHttpRequest();
            request.open('POST', '/documents');
            request.send(formData);
            request.onload = () => {
                let e = new CustomEvent(this.DOCUMENT_UPLOADED, {detail: this.currentDocument});
                this.listeners.forEach((listener) => {
                    if (listener.event === this.DOCUMENT_UPLOADED) {
                        listener.eventHandler(e);
                    }
                });
                resolve();
            };
        });
    }

    // Register listeners for the model. The listeners will be called
    // when the model changes.
    addEventListener(event, eventHandler) {
        this.listeners.push({event: event, eventHandler: eventHandler});

        // If the event has already been fired then call the event handler
        // immediately.
        if (event === this.DOCUMENTS_LOADED && this.documents.length > 0) {
            eventHandler(new CustomEvent(this.DOCUMENTS_LOADED, {detail: this.documents}));
        }
        if (event === this.DOCUMENT_OPENED && this.currentDocument !== null) {
            eventHandler(new CustomEvent(this.DOCUMENT_OPENED, {detail: this.currentDocument}));
        }
        if (event === this.DOCUMENT_UPLOADED && this.currentDocument !== null) {
            eventHandler(new CustomEvent(this.DOCUMENT_UPLOADED, {detail: this.currentDocument}));
        }
    }
}








/*
DocumentModel contains the information for a single document.
*/
export class DocumentModel {
    constructor() {
        // Document information passed in by the user for uploading or
        // back from the server when loading existing documents.
        this.documentID = null;
        this.documentName = null;

        // Has the document model been loaded from the server?
        this.loaded = false;

        // Response from the server containing the paragraph information.
        this.currentParagraphIndex = 0;
        this.paragraphs = null;

        // Listeners for the model events.
        this.listeners = [];

        // Event types.
        this.LOADED = 'loaded';
        this.AUDIO_FILES_LOADED = 'audioFilesLoaded';
    }

    // Load the document from the server. This will return a promise
    // that will be resolved when the document has been loaded.
    loadDocument(documentID) {
        return new Promise((resolve, reject) => {
            let request = new XMLHttpRequest();
            request.open('GET', '/documents/' + documentID);
            request.responseType = 'json';
            request.send();
            request.onload = () => {
                this.documentID = request.response.id;
                this.documentName = request.response.name;
                this.paragraphs = request.response.paragraphs;
                this.loaded = true;
                resolve();
            };
        });
    }

    // Load the audio files from the server.
    loadExisting(documentName) {
        return new Promise((resolve, reject) => {
            let request = new XMLHttpRequest();
            request.open('GET', '/documents/' + documentName + '/audio');
            request.responseType = 'json';
            request.send();
            request.onload = () => {
                this.audioFiles = request.response;
                this.loaded = true;
                resolve();
            };
        });
    }

    // Set the current audio file to be played.
    setCurrentAudioFile(audioFile) {
        this.currentAudioFile = audioFile;
        this.currentAudioFileIndex = this.audioFiles.indexOf(audioFile);
    }

    // Register listeners for the model. The listeners will be called
    // when the model changes.
    addEventListener(event, eventHandler) {
        this.listeners.push({event: event, eventHandler: eventHandler});
    }
}










/*
ParagraphModel contains the information for a single paragraph.
*/
export class ParagraphModel {
    constructor() {
        this.paragraphText = null;
        this.paragraphNumber = null;
        this.paragraphAudioFile = null;
    }

    // Set the paragraph text.
    setParagraphText(paragraphText) {
        this.paragraphText = paragraphText;
    }

    // Set the paragraph number.
    setParagraphNumber(paragraphNumber) {
        this.paragraphNumber = paragraphNumber;
    }

    // Set the paragraph audio file.
    setParagraphAudioFile(paragraphAudioFile) {
        this.paragraphAudioFile = paragraphAudioFile;
    }
}

