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
        this.id = null;
        this.name = null;
        this.paragraphs = null;

        // Has the document model been loaded from the server?
        this.loaded = false;

        // Response from the server containing the paragraph information.
        this.currentParagraphIndex = 0;
        
        // Listeners for the model events.
        this.listeners = [];

        // Event types.
        this.PARAGRAPH_LOADED = 'paragraphLoaded';
        this.PARAGRAPH_CHANGED = 'paragraphChanged';
    }

    // Load the document from the server. This will return a promise
    // that will be resolved when the document has been loaded.
    loadDocument(documentID) {
        return new Promise((resolve, reject) => {
            let request = new XMLHttpRequest();
            request.open('GET', '/documents/' + documentID);
            request.responseType = 'json';
            request.send();
            request.onload = async () => {
                this.id = request.response.id;
                this.name = request.response.name;
                this.paragraphs = request.response.paragraphs;
                this.loaded = false;
                resolve();

                // Load the paragraphs in the document. Trigger the
                // paragraph loaded event when each paragraph has been
                // loaded.
                let batch = [];
                let batchSize = 100;
                for (let i = 0; i < this.paragraphs.length; i++) {
                    let paragraph = this.paragraphs[i];
                    let paragraphModel = new ParagraphModel();

                    // Create a function to load the paragraph and trigger
                    // the paragraph loaded event.
                    let p = paragraphModel.loadParagraph(documentID, paragraph.id).then(() => {
                        this.paragraphs[i] = paragraphModel;
                        let e = new CustomEvent(this.PARAGRAPH_LOADED, {detail: paragraphModel});
                        this.listeners.forEach((listener) => {
                            if (listener.event === this.PARAGRAPH_LOADED) {
                                listener.eventHandler(e);
                            }
                        });
                    });

                    // Load the paragraph in batches.
                    batch.push(p);
                    if (batch.length === batchSize || i === this.paragraphs.length - 1) {
                        await Promise.all(batch);
                        batch = [];
                    }
                }
                this.loaded = true;
            };
        });
    }

    // Get the current paragraph.
    getCurrentParagraphIndex() {
        return this.currentParagraphIndex;
    }

    // Set the current paragraph index.
    setCurrentParagraphIndex(index) {
        // Make sure the index is valid and a number.
        if (index < 0 || index >= this.paragraphs.length || isNaN(index)) {
            return;
        }

        this.currentParagraphIndex = index;
        let e = new CustomEvent(this.PARAGRAPH_CHANGED, {detail: this.index});
        this.listeners.forEach((listener) => {
            if (listener.event === this.PARAGRAPH_CHANGED) {
                listener.eventHandler(e);
            }
        });
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
        this.id = null;
        this.content = null;
        this.link = null;
        this.audioLink = null;
    }
    
    // Load the paragraph from the server. This will return a promise
    // that will be resolved when the paragraph has been loaded.
    loadParagraph(documentID, paragraphID) {
        return new Promise((resolve, reject) => {
            let request = new XMLHttpRequest();
            request.open('GET', '/documents/' + documentID + '/paragraphs/' + paragraphID);
            request.responseType = 'json';
            request.send();
            request.onload = () => {
                this.id = request.response.id;
                this.content = request.response.content;
                this.link = request.response.link;
                this.audioLink = request.response.audioLink;
                resolve();
            };
        });
    }
}

