package ttsweb

import (
	"crypto/rand"
	"crypto/sha1"
	"encoding/hex"
	"io/ioutil"
)

// -----------------------------------------------------------------------------
// Document Info
// -----------------------------------------------------------------------------

// Documents is a collection of documents that have been uploaded by the user.
// Once a document has been uploaded, it will be stored in the documents directory.
type DocumentsInfo struct {
	Documents []DocumentInfo `json:"documents"`
	Link      string         `json:"link"`

	// The documents directory.
	documentsDir string
}

// LoadDocuments will load all of the documents from the documents directory.
func LoadDocuments(documentsDir string) (*DocumentsInfo, error) {
	documents := &DocumentsInfo{
		Documents: []DocumentInfo{},
		Link:      "/documents",
	}

	// Load the documents from the documents directory.
	documentDirs, err := ioutil.ReadDir(documentsDir)
	if err != nil {
		return nil, err
	}

	// Loop through the directories in the documents directory. Each directory
	// will be a document.
	for _, documentDir := range documentDirs {
		// Load the document.
		document, err := LoadDocument(documentsDir, documentDir.Name())
		if err != nil {
			return nil, err
		}

		// Add the document to the documents.
		documents.Documents = append(documents.Documents, document)
	}

	// Return the documents.
	return documents, nil
}

// SetDocumentsDir will set the documents directory.
func (d *DocumentsInfo) SetDocumentsDir(documentsDir string) {
	d.documentsDir = documentsDir
}

// GenerateID will generate a unique ID for a document. We will check the
// documents directory to make sure that the ID is unique.
func (d DocumentsInfo) GenerateID() string {
	// Generate a random ID.
	idString := generateID()

	// Check if the ID already exists.
	for _, document := range d.Documents {
		if document.ID == idString {
			// The ID already exists, so generate a new ID.
			return d.GenerateID()
		}
	}

	// Return the ID.
	return idString
}

// CreateDocument will create a new document with the specified name and data.
func (d *DocumentsInfo) CreateDocument(name string, data []byte) (DocumentInfo, error) {
	document := DocumentInfo{
		ID:      d.GenerateID(),
		Name:    name,
		Size:    int64(len(data)),
		Sha1sum: sha1sum(data),

		Link: "/documents/" + name,
	}

	// Save the document.
	if err := document.Save(d.documentsDir, data); err != nil {
		return document, err
	}

	// Add the document to the documents.
	d.Documents = append(d.Documents, document)

	// Return the document.
	return document, nil
}

// generateID will generate a random ID
func generateID() string {
	// Create a random ID.
	id := make([]byte, 16)
	rand.Read(id)

	// Return the ID.
	return hex.EncodeToString(id)
}

// sha1sum will return the SHA1 sum of the specified data.
func sha1sum(data []byte) string {
	// Calculate the SHA1 sum.
	hash := sha1.Sum(data)

	// Return the SHA1 sum.
	return hex.EncodeToString(hash[:])
}
