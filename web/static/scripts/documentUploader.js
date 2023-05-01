import * as alert from './alert.js'

/*
DocumentUploader handles posting documents to the server.
*/
export class DocumentUploader {
    constructor(model) {
        this.model = model;

        /*
            <form id="document-upload-form" method="dialog">
                <label for="document-name">Document Name:</label>
                <input type="text" name="document-name" id="document-name">
                <label for="document-file">Document File:</label>
                <input type="file" name="document" id="document-file">
                <button id="document-upload-submit">Submit</button>
            </form>
        */

        this.form = document.getElementById('document-upload-form');
        this.nameInput = document.getElementById('document-name');
        this.fileInput = document.getElementById('document-file');
        this.submitButton = document.getElementById('document-upload-submit');

        this.form.addEventListener('submit', (event) => {
            event.preventDefault();
            this.submit();
        });

        this.submitButton.addEventListener('click', (event) => {
            event.preventDefault();
            this.submit();
        });
    }

    submit() {
        let name = this.nameInput.value;
        let file = this.fileInput.files[0];
        this.model.uploadDocument(name, file).then((d) => {
            alert.success('Document uploaded: ' + d.name);
        }).catch((e) => {
            alert.error('Error uploading document: ' + e);
        });
    }
}
