package ttsweb

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"os/exec"
	"path"
)

// -----------------------------------------------------------------------------
// Document Info
// -----------------------------------------------------------------------------

// Document is a document that has been uploaded by the user. Once a document
// has been uploaded, it will be stored in the documents directory. The document
// will be stored in a directory with the same name as the ID of the document.
// The document information will be stored in the index.json file in the
// document directory.
type DocumentInfo struct {
	// The ID of the document.
	ID string `json:"id"`

	// The name of the document as it was uploaded by the user.
	Name string `json:"name"`

	// The size of the document in bytes.
	Size int64 `json:"size"`

	// Extension of the document.
	Extension string `json:"extension"`

	// The SHA1 sum of the document.
	Sha1sum string `json:"sha1sum"`

	// The paragraphs of the document. The paragraphs will be stored in the
	// paragraphs directory in the document directory.
	Paragraphs []ParagraphInfo `json:"paragraphs"`

	Link string `json:"link"`
}

// LoadDocument will load a document from the documents directory.
//
// The document will be loaded from the file documents/{id}. {id}
// is the ID of the document and is a directory in the documents
// directory. The document will be loaded from the index.json file
// in the document directory.
func LoadDocument(documentsDir string, id string) (DocumentInfo, error) {
	fmt.Println("Loading document: " + id)

	document := DocumentInfo{}

	// Load the document from the documents directory.
	data, err := ioutil.ReadFile(documentsDir + id + "/index.json")
	if err != nil {
		return document, err
	}

	// Unmarshal the document.
	err = json.Unmarshal(data, &document)
	if err != nil {
		return document, err
	}

	// Return the document.
	return document, nil
}

// Save will save the document to the documents directory.
//
// The document will be saved to the file documents/{id}. {id}
// is the ID of the document and is a directory in the documents
// directory. The document will be saved to the index.json file
// in the document directory.
func (d DocumentInfo) Save(documentsDir string, file []byte) error {
	// Ensure path is formatted correctly using the path package.
	documentPath := path.Join(documentsDir, d.ID)

	// Check if the document directory exists. Return an error if it does.
	if _, err := os.Stat(documentPath); err == nil {
		return err
	}

	// Create the document directory.
	if err := os.MkdirAll(documentsDir+d.ID, 0755); err != nil {
		return err
	}

	// Save the document to the documents directory.
	indexData, err := json.Marshal(d)
	if err != nil {
		return err
	}
	if err := ioutil.WriteFile(documentsDir+d.ID+"/index.json", indexData, 0644); err != nil {
		return err
	}
	if err := ioutil.WriteFile(documentsDir+d.ID+"/file.data", file, 0644); err != nil {
		return err
	}

	go func() {
		// Split the document into paragraphs.
		if err := d.SplitToParagraphs(documentsDir); err != nil {
			fmt.Println(err)
			return
		}
		fmt.Println("Split document into paragraphs:", d.ID)

		// Synthesize the paragraphs of the document.
		if err := d.SynthesizeParagraphs(documentsDir); err != nil {
			fmt.Println(err)
			return
		}
		fmt.Println("Synthesized paragraphs:", d.ID)
	}()

	// Return no error.
	return nil
}

// SplitToParagraphs splits the text into paragraphs by running the text through
// the paragraph splitter script 'split-document.sh'.
func (d DocumentInfo) SplitToParagraphs(documentsDir string) error {
	outputDir := path.Join(documentsDir, d.ID, "paragraphs")
	inputFile := path.Join(documentsDir, d.ID, "file.data")

	// Run the paragraph splitter script.
	cmd := exec.Command("bash", "./split-document.sh", "--output", outputDir, "--", inputFile)

	// Print the output of the script.
	output, err := cmd.Output()
	if err != nil {
		return err
	}
	fmt.Println(string(output))

	// Return no error.
	return nil
}

// SynthesizeParagraphs synthesizes the paragraphs of the document by running
// the text through the paragraph synthesizer script 'split-txt-to-tts.py'.
func (d DocumentInfo) SynthesizeParagraphs(documentsDir string) error {
	paragraphsDir := path.Join(documentsDir, d.ID, "paragraphs")
	audioDir := path.Join(documentsDir, d.ID, "audio")

	// Run the paragraph synthesizer script.
	cmd := exec.Command("python3", "./split-txt-to-tts.py", "--speaker", "p241", "--text-dir", paragraphsDir, "--out-dir", audioDir)

	// Print the output of the script.
	output, err := cmd.Output()
	if err != nil {
		return err
	}
	fmt.Println(string(output))

	// Return no error.
	return nil
}
