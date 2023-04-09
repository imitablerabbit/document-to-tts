package ttsweb

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
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
	// Check if the document directory exists. Return an error if it does.
	if _, err := os.Stat(documentsDir + d.ID); err == nil {
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

	// Return no error.
	return nil
}
