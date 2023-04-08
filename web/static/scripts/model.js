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
                this.documents = request.response;
                resolve();
            };
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
                resolve();
            };
        });
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
        this.documentFile = null;

        // Has the document model been loaded from the server?
        this.loaded = false;

        // Response from the server containing the paragraph information.
        this.paragraphs = null;

        this.paragraphs = [];
        this.currentAudioFile = null;
        this.currentAudioFileIndex = null;
        this.audioPlayer = null;
        this.audioPlayerElement = null;
        this.audioPlayerSource = null;
    }

    // Load the document from the server. This will return a promise
    // that will be resolved when the document has been loaded.
    loadDocument(documentName) {
        return new Promise((resolve, reject) => {
            let request = new XMLHttpRequest();
            request.open('GET', '/documents/' + documentName);
            request.responseType = 'json';
            request.send();
            request.onload = () => {
                let document = new DocumentModel();
                document.documentID = request.response.documentID;
                document.documentName = request.response.documentName;
                document.documentFile = request.response.documentFile;
                document.paragraphs = request.response.paragraphs;
                this.currentDocument = document;
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

