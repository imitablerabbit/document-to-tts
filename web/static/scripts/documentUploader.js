import { alert } from './alert.js';

/*
DocumentUploader handles posting documents to the server.
*/
export class DocumentUploader {
    constructor() {

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
        let formData = new FormData();
        formData.append('name', this.nameInput.value);
        formData.append('file', this.fileInput.files[0]);

        let request = new XMLHttpRequest();
        request.open('POST', '/documents');
        request.send(formData);

        alert.alert('Document uploaded.');
    }
}
