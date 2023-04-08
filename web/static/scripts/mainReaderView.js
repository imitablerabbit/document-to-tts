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
            console.log("MainReaderView: documentOpened event received", e);

            this.document = e.detail;
            this.updateView();

            // Subscribe to the document so we know when the paragraphs have changed.
            this.model.currentDocument.addEventListener('paragraphsChanged', (e) => {
                console.log("MainReaderView: paragraphsChanged event received", e);
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

        this.previousParagraphElement.innerHTML = previousParagraph ? previousParagraph.content : '';
        this.currentParagraphElement.innerHTML = currentParagraph ? currentParagraph.content : '';
        this.nextParagraphElement.innerHTML = nextParagraph ? nextParagraph.content : '';
    }
}
