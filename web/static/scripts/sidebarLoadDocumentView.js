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

        var documentLoadSelectElement = document.getElementById('document-load-select');
        var documentLoadButtonElement = document.getElementById('document-load-submit');

        // Add an event listener to the document load button element so we can
        // notify the model when the user has selected a document.
        documentLoadButtonElement.addEventListener('click', (e) => {
            e.preventDefault();
            var documentID = documentLoadSelectElement.value;
            if (documentID) {
                this.model.openDocument(documentID).then(() => {
                    // console.log("LoadDocumentView: document loaded", this.model.currentDocument);
                });
            }
        });

        // Subscribe to the document model to be notified when the document has been loaded.
        // The view will add the list of documents to the select.
        this.model.addEventListener('documentsLoaded', (e) => {
            // console.log("LoadDocumentView: documentsLoaded event received", e);

            // Prepare the document load select element. Empty existing
            // options and add a default option.
            documentLoadSelectElement.innerHTML = '';
            var option = document.createElement('option');
            option.value = '';
            option.innerHTML = 'Select a document';
            documentLoadSelectElement.appendChild(option);
            
            // The model has loaded the list of documents. We will now populate the
            // document load select element with the list of documents.
            var documents = e.detail;
            for (var i = 0; i < documents.length; i++) {
                var option = document.createElement('option');
                option.value = documents[i].id;
                option.innerHTML = documents[i].name;
                documentLoadSelectElement.appendChild(option);
            }
        });
    }
}
