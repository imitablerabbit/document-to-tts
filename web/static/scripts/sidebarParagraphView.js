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

        this.document = model.currentDocument;

        this.paragraphsContainerElement = document.getElementById('audio-controller-paragraphs-content');

        // Subscribe to the document model to be notified when the document has been loaded.
        this.model.addEventListener('documentOpened', (e) => {
            // console.log("SidebarParagraphView: documentOpened event received", e);
            this.document = e.detail;
            this.updateView();
            
            // Subscribe to the document so we know when the paragraphs have changed.
            this.model.currentDocument.addEventListener('paragraphsChanged', (e) => {
                // console.log("SidebarParagraphView: paragraphsChanged event received", e);
                this.updateView();
            });
        });
    }

    // Update the view with the list of paragraphs.
    updateView() {
        // console.log("SidebarParagraphView: updating view");
        if (!this.document) {
            // console.log("SidebarParagraphView: no document");
            return;
        }
        if (!this.document.paragraphs) {
            // console.log("SidebarParagraphView: no defined paragraphs");
            return;
        }
        if (this.document.paragraphs.length === 0) {
            // console.log("SidebarParagraphView: no paragraphs");
            return;
        }

        // Clear the paragraphs container element.
        this.paragraphsContainerElement.innerHTML = '';

        // Add the paragraphs to the container element.
        for (let i = 0; i < this.document.paragraphs.length; i++) {
            let paragraph = this.document.paragraphs[i];
            let paragraphElement = document.createElement('div');
            paragraphElement.classList.add('audio-controller-paragraph');

            // Add the paragraph number.
            let paragraphNumberElement = document.createElement('p');
            paragraphNumberElement.classList.add('audio-controller-paragraph-number');
            paragraphNumberElement.innerHTML = paragraph.id;
            paragraphElement.appendChild(paragraphNumberElement);

            // Add the paragraph content.
            let paragraphContentElement = document.createElement('p');
            paragraphContentElement.classList.add('audio-controller-paragraph-content');
            paragraphContentElement.innerHTML = paragraph.content;
            paragraphElement.appendChild(paragraphContentElement);

            // Only add the audio element if there is an audio link and we are
            // within 10 paragraphs of the current paragraph.
            if (paragraph.audioLink &&
                (i > this.document.currentParagraphIndex - 10 &&
                 i < this.document.currentParagraphIndex + 10)) {

                // Add the audio from the audioLink in the paragraph.
                let audioElement = document.createElement('audio');
                audioElement.setAttribute('controls', 'controls');
                audioElement.setAttribute('src', paragraph.audioLink);
                paragraphElement.appendChild(audioElement);
            }

            this.paragraphsContainerElement.appendChild(paragraphElement);
        }
    }
}
