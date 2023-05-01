/*
View for the list of documents and document selection.

This view is responsible for displaying the list of documents in the sidebar.
The user will be able to select a document from the list and the view will
notify the model that the document has been selected. The model will then
load the document and notify any observers that the document has been loaded.
*/
export class SidebarLoadDocumentView {
    constructor(model) {
        this.model = model;

        this.documentLoadSelectElement = document.getElementById('document-load-select');
        this.documentLoadButtonElement = document.getElementById('document-load-submit');

        // Add an event listener to the document load button element so we can
        // notify the model when the user has selected a document.
        this.documentLoadButtonElement.addEventListener('click', (e) => {
            e.preventDefault();
            var documentID = this.documentLoadSelectElement.value;
            if (documentID) {
                this.model.openDocument(documentID);
            }
        });

        // Subscribe to the document model to be notified when the document has been loaded.
        // The view will add the list of documents to the select.
        this.model.addEventListener('documentsLoaded', (e) => {

            // Prepare the document load select element. Empty existing
            // options and add a default option.
            this.documentLoadSelectElement.innerHTML = '';
            var option = document.createElement('option');
            option.value = '';
            option.innerHTML = 'Select a document';
            this.documentLoadSelectElement.appendChild(option);
            
            // The model has loaded the list of documents. We will now populate the
            // document load select element with the list of documents.
            var documents = e.detail;
            for (var i = 0; i < documents.length; i++) {
                let d = documents[i];
                this.addDocumentOption(d);
            }
        });

        // Subscribe to the document model to be notified when the document has been uploaded.
        // The view will add the document to the list of documents.
        this.model.addEventListener('documentUploaded', (e) => {
            console.log("SidebarLoadDocumentView: documentUploaded event received", e);
            var d = e.detail;
            this.addDocumentOption(d);
        });
    }

    // Add option to the document load select element.
    addDocumentOption(d) {
        var option = document.createElement('option');
        option.value = d.id;
        option.innerHTML = d.name;
        this.documentLoadSelectElement.appendChild(option);
    }
}
