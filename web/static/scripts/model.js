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
            request.onreadystatechange = () => {
                if (request.readyState !== XMLHttpRequest.DONE) {
                    return;
                }
                if (request.status !== 200) {
                    reject();
                    return;
                }

                this.documents = request.response.documents;
                let e = new CustomEvent(this.DOCUMENTS_LOADED, {detail: this.documents});
                this.listeners.forEach((listener) => {
                    if (listener.event === this.DOCUMENTS_LOADED) {
                        listener.eventHandler(e);
                    }
                });
                resolve(this.documents);
            };
            request.send();
        });
    }

    // Open the document with the given name. This will return a promise
    // that will be resolved when the document has been opened. This will
    // also update the current document.
    openDocument(documentID) {
        return new Promise((resolve, reject) => {
            let d = new DocumentModel();
            d.loadDocument(documentID).then(() => {
                // Remove all listeners from the current document. This will
                // prevent duplicate events from being fired and updating the
                // view multiple times.
                if (this.currentDocument !== null) {
                    this.currentDocument.removeAllEventListeners();
                }
                this.currentDocument = d;
                let e = new CustomEvent(this.DOCUMENT_OPENED, {detail: this.currentDocument});
                this.listeners.forEach((listener) => {
                    if (listener.event === this.DOCUMENT_OPENED) {
                        listener.eventHandler(e);
                    }
                });
                resolve(d);
            });
        });
    }

    // Upload the document to the server. This will return a promise
    // that will be resolved when the document has been uploaded.
    uploadDocument(documentName, documentFile) {
        return new Promise((resolve, reject) => {
            let formData = new FormData();
            formData.append('name', documentName);
            formData.append('file', documentFile);

            let request = new XMLHttpRequest();
            request.open('POST', '/documents');
            request.responseType = 'json';
            request.onreadystatechange = () => {
                if (request.readyState !== XMLHttpRequest.DONE) {
                    return;
                }
                if (request.status !== 200) {
                    reject(request.response);
                    return;
                }

                let newDocument = request.response;
                this.documents.push(newDocument);

                let e = new CustomEvent(this.DOCUMENT_UPLOADED, {detail: newDocument});
                this.listeners.forEach((listener) => {
                    if (listener.event === this.DOCUMENT_UPLOADED) {
                        listener.eventHandler(e);
                    }
                });
                resolve(newDocument);
            };
            request.send(formData);
        });
    }

    // Register listeners for the model. The listeners will be called
    // when the model changes.
    addEventListener(event, eventHandler) {
        this.listeners.push({event: event, eventHandler: eventHandler});

        // If the event has already been fired then call the event handler
        // immediately.
        if (event === this.DOCUMENT_OPENED && this.currentDocument !== null) {
            eventHandler(new CustomEvent(this.DOCUMENT_OPENED, {detail: this.currentDocument}));
        }
        if (event === this.DOCUMENTS_LOADED && this.documents.length > 0) {
            eventHandler(new CustomEvent(this.DOCUMENTS_LOADED, {detail: this.documents}));
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
        this.DOCUMENT_LOADED = 'documentLoaded';
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
            request.onreadystatechange = async () => {
                if (request.readyState !== XMLHttpRequest.DONE) {
                    return;
                }
                if (request.status !== 200) {
                    reject();
                    return;
                }

                this.id = request.response.id;
                this.name = request.response.name;
                this.paragraphs = request.response.paragraphs; // paragraph info
                this.loaded = false;
                resolve();

                // Load the paragraphs in the document. Trigger the
                // paragraph loaded event when each paragraph has been
                // loaded.
                let batchPromises = [];
                let batchSize = 100;
                let startID = 0;
                let endID = Math.min(batchSize, this.paragraphs.length-1);
                
                // Loop over the paragraphs in batches of 100 and load then with
                // the start and end IDs. The requests to the server will be inclusive
                // of the start and end IDs.
                while (startID < this.paragraphs.length-1) {
                    batchPromises.push(this.loadParagraphs(documentID, startID, endID));
                    startID = endID;

                    // If the end ID is greater than the number of paragraphs
                    // then set the end ID to the number of paragraphs.
                    if (endID + batchSize > this.paragraphs.length-1) {
                        endID = this.paragraphs.length-1;
                    } else {
                        endID += batchSize;
                    }
                }

                // Wait for all of the batches to be loaded.
                await Promise.all(batchPromises);
                this.loaded = true;

                // Trigger the document loaded event.
                let e = new CustomEvent(this.DOCUMENT_LOADED, {detail: this});
                this.listeners.forEach((listener) => {
                    Promise.resolve().then(() => {
                        if (listener.event === this.DOCUMENT_LOADED) {
                            listener.eventHandler(e);
                        }
                    });
                });
            };
            request.send();
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
        let e = new CustomEvent(this.PARAGRAPH_CHANGED, {detail: this.currentParagraphIndex});
        this.listeners.forEach((listener) => {
            if (listener.event === this.PARAGRAPH_CHANGED) {
                listener.eventHandler(e);
            }
        });
    }

    // Move to the previous paragraph.
    previousParagraph() {
        this.setCurrentParagraphIndex(this.currentParagraphIndex - 1);
    }

    // Move to the next paragraph.
    nextParagraph() {
        this.setCurrentParagraphIndex(this.currentParagraphIndex + 1);
    }

    // Register listeners for the model. The listeners will be called
    // when the model changes.
    addEventListener(event, eventHandler) {
        this.listeners.push({event: event, eventHandler: eventHandler});
    }

    // Remove all of the listeners for the document model. This is
    // used when a new document is opened. The listeners for the
    // previous document need to be removed.
    removeAllEventListeners() {
        this.listeners = [];
    }

    // Load a batch of paragraphs from the server.
    loadParagraphs(documentID, startID, endID) {
        return new Promise((resolve, reject) => {
            let url = '/documents/' + documentID + '/paragraphs/' + startID + '-' + endID;
            console.log('Loading paragraphs: ' + url);

            let request = new XMLHttpRequest();
            request.open('GET', url);
            request.responseType = 'json';
            request.setRequestHeader('Content-Type', 'application/json');
            request.onreadystatechange = () => {
                if (request.readyState !== XMLHttpRequest.DONE) {
                    return;
                }
                if (request.status !== 200) {
                    reject();
                    return;
                }

                let paragraphs = request.response;
                for (let i = 0; i < paragraphs.length; i++) {
                    let paragraph = paragraphs[i];
                    let paragraphModel = new ParagraphModel();
                    paragraphModel.id = paragraph.id;
                    paragraphModel.content = paragraph.content;
                    paragraphModel.link = paragraph.link;
                    paragraphModel.audioLink = paragraph.audioLink;
                    this.paragraphs[paragraph.id] = paragraphModel;

                    let e = new CustomEvent(this.PARAGRAPH_LOADED, {detail: paragraphModel});
                        this.listeners.forEach((listener) => {
                            // Trigger the eventHandlers in a promise so that
                            // the event handlers can be async.
                            Promise.resolve().then(() => {
                                if (listener.event === this.PARAGRAPH_LOADED) {
                                    listener.eventHandler(e);
                                }
                            });
                        });
                }
                resolve();
            };
            request.send();
        });
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
            request.onreadystatechange = () => {
                if (request.readyState !== XMLHttpRequest.DONE) {
                    return;
                }
                if (request.status !== 200) {
                    reject();
                    return;
                }

                this.id = request.response.id;
                this.content = request.response.content;
                this.link = request.response.link;
                this.audioLink = request.response.audioLink;
                resolve();
            };
            request.send();
        });
    }
}

