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

        this.paragraphsContainerElement = document.getElementById('paragraphs-content');

        this.currentParagraphElement = null;

        // Object to hold the paragraph elements. Each key will be the
        // paragraph ID and the value will be the paragraph element.
        this.paragraphContentCache = {};

        // Subscribe to the document model to be notified when the document has been loaded.
        this.model.addEventListener('documentOpened', (e) => {
            this.document = e.detail;
            this.initView();

            // Subscribe to paragraph loading events. When a paragraph has been loaded
            // we will update the view.
            this.model.currentDocument.addEventListener('paragraphLoaded', (e) => {
                // Pull out the paragraph element with the matching ID in the
                // dataset.
                let paragraphContentElement = this.paragraphContentCache[e.detail.id];
                if (paragraphContentElement) {
                    paragraphContentElement.textContent = e.detail.content;
                }
            });

            // Subscribe to paragraph change events. When the current paragraph
            // has changed we will update the view to highlight the current
            // paragraph.
            this.model.currentDocument.addEventListener('paragraphChanged', (e) => {
                let index = e.detail;
                let currentParagraphContentElement = this.paragraphContentCache[index];

                let previousParagraphElement = this.currentParagraphElement;
                this.currentParagraphElement = currentParagraphContentElement.parentElement;

                if (this.currentParagraphElement) {
                    this.currentParagraphElement.classList.add('current-paragraph');
                    this.currentParagraphElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                    });
                }
                if (previousParagraphElement) {
                    previousParagraphElement.classList.remove('current-paragraph');
                }
            });
        });
    }

    // Update the view with the list of paragraphs.
    initView() {
        if (!this.document) {
            console.log("SidebarParagraphView: no document");
            return;
        }
        if (!this.document.paragraphs) {
            console.log("SidebarParagraphView: no defined paragraphs");
            return;
        }
        if (this.document.paragraphs.length === 0) {
            console.log("SidebarParagraphView: no paragraphs");
            return;
        }

        // Clear the paragraphs container element.
        this.paragraphsContainerElement.innerHTML = '';

        // Add the paragraphs to the container element.
        for (let i = 0; i < this.document.paragraphs.length; i++) {
            let paragraph = this.document.paragraphs[i];
            let paragraphElement = document.createElement('div');
            paragraphElement.classList.add('paragraph');
            paragraphElement.dataset.id = paragraph.id;

            // Add the paragraph number.
            let paragraphNumberElement = document.createElement('p');
            paragraphNumberElement.classList.add('paragraph-number');
            paragraphNumberElement.textContent = paragraph.id;
            paragraphElement.appendChild(paragraphNumberElement);

            // Add the paragraph content.
            let paragraphContentElement = document.createElement('p');
            paragraphContentElement.classList.add('paragraph-content');
            if (paragraph && paragraph.content) {
                paragraphContentElement.textContent = paragraph.content;
            }
            paragraphContentElement.addEventListener('click', (e) => {
                console.log("SidebarParagraphView: paragraph clicked", e);
                let toIndex = parseInt(paragraph.id);
                this.document.setCurrentParagraphIndex(toIndex);
            });
            paragraphElement.appendChild(paragraphContentElement);

            this.paragraphsContainerElement.appendChild(paragraphElement);
            this.paragraphContentCache[paragraph.id] = paragraphContentElement;
        }
    }
}
