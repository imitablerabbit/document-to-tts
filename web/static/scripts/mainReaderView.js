/*
View for the main reader. This view is responsible for displaying the
paragraphs in the main reader window.

We will subscribe to the document model to be notified when the document has
been loaded. When the document has been loaded we will then subscribe to the
document so we can be alerted for new paragraphs. We will also subscribe for
paragraph changes so we can update the view.
*/
export class MainReaderView {
    constructor(model) {
        this.model = model;
        this.document = model.currentDocument;

        this.previousParagraphElement = document.getElementById('previous-paragraph');
        this.currentParagraphElement = document.getElementById('current-paragraph');
        this.nextParagraphElement = document.getElementById('next-paragraph');

        // Subscribe to the document model to be notified when the document has been loaded.
        this.model.addEventListener('documentOpened', (e) => {
            this.document = e.detail;
            this.updateView();

            // Subscribe to paragraph loading events. When a paragraph has been loaded
            // we will update the view.
            this.model.currentDocument.addEventListener('paragraphLoaded', (e) => {
                
                // Only update the view if the paragraph that was loaded is one of the
                // 3 paragraphs that we are displaying.
                let updatedId = e.detail.id;
                let index = this.document.currentParagraphIndex;
                if (updatedId === this.document.paragraphs[index].id) {
                    this.updateView();
                }
                if (updatedId > 0 && index > 0 &&
                    updatedId === this.document.paragraphs[index - 1].id) {
                    this.updateView();
                }
                if (updatedId < this.document.paragraphs.length &&
                    index < this.document.paragraphs.length - 1 &&
                    updatedId === this.document.paragraphs[index + 1].id) {
                    this.updateView();
                }
            });

            // Subscribe to the document so we know when the paragraphs have changed.
            this.model.currentDocument.addEventListener('paragraphChanged', (e) => {
                console.log("MainReaderView: paragraphChanged event received", e);
                this.updateView();
            });
        });
    }

    // Update the view with the 3 paragraphs. This will make sure that the
    // index is within the bounds of the array when updating the previous
    // and next paragraphs.
    updateView() {
        console.log("MainReaderView: updating view");
        if (!this.document) {
            console.log("MainReaderView: no document");
            return;
        }
        if (!this.document.paragraphs) {
            console.log("MainReaderView: no defined paragraphs");
            return;
        }
        if (this.document.paragraphs.length === 0) {
            console.log("MainReaderView: no paragraphs");
            return;
        }

        let paragraphIndex = this.document.currentParagraphIndex;

        let previousParagraph;
        let currentParagraph;
        let nextParagraph;

        if (paragraphIndex === 0) {
            previousParagraph = null;
        } else {
            previousParagraph = this.document.paragraphs[paragraphIndex - 1];
        }
        currentParagraph = this.document.paragraphs[paragraphIndex];
        if (paragraphIndex === this.document.paragraphs.length - 1) {
            nextParagraph = null;
        } else {
            nextParagraph = this.document.paragraphs[paragraphIndex + 1];
        }

        if (previousParagraph && previousParagraph.content) {
            this.previousParagraphElement.textContent = previousParagraph.content
        } else {
            this.previousParagraphElement.textContent = "";
        }
        if (currentParagraph && currentParagraph.content) {
            this.currentParagraphElement.textContent = currentParagraph.content
        } else {
            this.currentParagraphElement.textContent = "";
        }
        if (nextParagraph && nextParagraph.content) {
            this.nextParagraphElement.textContent = nextParagraph.content
        } else {
            this.nextParagraphElement.textContent = "";
        }
    }
}
