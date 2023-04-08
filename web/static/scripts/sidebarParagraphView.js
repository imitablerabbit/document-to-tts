/*
View for the document paragraphs. This view is responsible for displaying the
paragraphs in the sidebar.

We will subscribe to the document model to be notified when the document has
been loaded. When the document has been loaded we will then subscribe to the
document so we can be alerted for new paragraphs.
*/
export class SidebarParagraphView {
    constructor(model) {
        this.model = model;

        this.paragraphsContainerElement = document.getElementById('audio-controller-paragraphs-content');

        // Subscribe to the document model to be notified when the document has been loaded.
        this.model.addEventListener('documentOpened', (e) => {
            // console.log("SidebarParagraphView: documentOpened event received", e);
            this.document = e.detail;
            this.paragraphsContainerElement.innerHTML = JSON.stringify(this.document);
        });
    }
}
