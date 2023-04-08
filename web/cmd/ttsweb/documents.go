package main

import (
	"crypto/rand"
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

// Document is a document that has been uploaded by the user. Once a document
// has been uploaded, it will be stored in the documents directory. The document
// will be stored in a directory with the same name as the ID of the document.
// The document information will be stored in the index.json file in the
// document directory.
type Document struct {
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
	Paragraphs []Paragraph `json:"paragraphs"`

	Link string `json:"link"`
}

// LoadDocument will load a document from the documents directory.
//
// The document will be loaded from the file documents/{id}. {id}
// is the ID of the document and is a directory in the documents
// directory. The document will be loaded from the index.json file
// in the document directory.
func LoadDocument(documentsDir string, id string) (Document, error) {
	fmt.Println("Loading document: " + id)

	document := Document{}

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
func (d Document) Save(documentsDir string, file []byte) error {
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

// Paragraph is a paragraph of a document. The paragraphs will be stored in the
// paragraphs directory in the document directory. These are created when the
// document is uploaded. We will run the "split-document.sh" script to split the
// document into paragraphs.
type Paragraph struct {
	ID      string `json:"id"`
	Content string `json:"content"`

	Link      string `json:"link"`
	AudioLink string `json:"audioLink"`
}

// LoadParagraphs will load all of the paragraphs from the paragraphs directory.
func LoadParagraphs(documentsDir, documentID string) ([]Paragraph, error) {
	fmt.Println("Loading paragraphs for document " + documentID)

	paragraphs := []Paragraph{}

	// Load the paragraphs from the paragraphs directory.
	paragraphFiles, err := ioutil.ReadDir(documentsDir + documentID + "/paragraphs")
	if err != nil {
		return nil, err
	}

	// Loop through the files in the paragraphs directory. Each directory
	// will be a paragraph.
	for _, paragraphFile := range paragraphFiles {
		// Load the paragraph.
		paragraph, err := LoadParagraph(documentsDir, documentID, paragraphFile.Name())
		if err != nil {
			return nil, err
		}

		// Add the paragraph to the paragraphs.
		paragraphs = append(paragraphs, paragraph)
	}

	// Return the paragraphs.
	return paragraphs, nil
}

// LoadParagraph will load a paragraph from the paragraphs directory.
//
// The paragraph will be loaded from the file documents/{id}/paragraphs/{id}. {id}
// is the ID of the document and is a directory in the documents
// directory. The paragraph will be loaded from the index.json file
// in the paragraph directory.
func LoadParagraph(documentsDir, documentID string, paragraphFile string) (Paragraph, error) {
	fmt.Println("Loading paragraph " + paragraphFile + " for document " + documentID)

	paragraph := Paragraph{}

	// Load the paragraph from the paragraphs directory.
	data, err := ioutil.ReadFile(documentsDir + documentID + "/paragraphs/" + paragraphFile)
	if err != nil {
		return paragraph, err
	}

	paragraph.ID = strings.TrimSuffix(paragraphFile, ".txt")
	paragraph.Content = string(data)
	// paragraph.Link = "/documents/" + documentID + "/paragraphs/" + paragraph.ID
	paragraph.AudioLink = "/documents/" + documentID + "/paragraphs/" + paragraph.ID + "/audio"

	// Return the paragraph.
	return paragraph, nil
}

// Documents is a collection of documents that have been uploaded by the user.
// Once a document has been uploaded, it will be stored in the documents directory.
type Documents struct {
	Documents []Document `json:"documents"`
	Link      string     `json:"link"`

	// The documents directory.
	documentsDir string
}

// LoadDocuments will load all of the documents from the documents directory.
func LoadDocuments(documentsDir string) (*Documents, error) {
	documents := &Documents{
		Documents: []Document{},
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

// GenerateID will generate a unique ID for a document. We will check the
// documents directory to make sure that the ID is unique.
func (d Documents) GenerateID() string {
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
func (d *Documents) CreateDocument(name string, data []byte) (Document, error) {
	document := Document{
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

// ServeHTTP will handle the HTTP requests for the documents.
//
// The following HTTP requests are supported:
// - GET /documents
//   - Returns the documents that have been uploaded by the user.
//     Each document will be returned as a JSON object and will contain a link
//     to the document for more specific information. The data returned will
//     be a subset of the data returned by the /documents/fetch/{id} request.
//
// - POST /documents
//   - Uploads a document to the server.
//
// - GET /documents/{id}
//   - Returns the document info with the specified ID.
//
// - GET /documents/{id}/paragraphs/{paragraph_id}/audio
//   - Returns the audio for the paragraph with the specified ID.
func (d Documents) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		if r.URL.Path == "/documents" {
			d.httpGetDocuments(w, r)
		} else {
			// Check if we are getting a document or the audio for a paragraph.
			if strings.Contains(r.URL.Path, "/paragraphs/") {
				d.httpGetParagraphAudio(w, r)
			} else {
				d.httpGetDocument(w, r)
			}
		}
	case http.MethodPost:
		d.httpPostDocuments(w, r)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

// httpGetDocuments will return the documents that have been uploaded by the
// user. Each document will be returned as a JSON object and will contain a link
// to the document for more specific information.
func (d Documents) httpGetDocuments(w http.ResponseWriter, r *http.Request) {
	// Marshal the documents.
	data, err := json.Marshal(d)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Write the documents.
	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

// httpGetDocument will return the document info with the specified ID.
func (d Documents) httpGetDocument(w http.ResponseWriter, r *http.Request) {
	// Get the ID from the URL.
	id := strings.TrimPrefix(r.URL.Path, "/documents/")
	if id == "" {
		http.Error(w, "id is required", http.StatusBadRequest)
		return
	}

	// Find the document.
	var document Document
	for _, d := range d.Documents {
		if d.ID == id {
			document = d
			break
		}
	}

	// Check if the document was found.
	if document.ID == "" {
		http.Error(w, "document not found", http.StatusNotFound)
		return
	}

	// Load the paragraphs for the document. These are not normally sent when the
	// full list of documents is requested.
	paragraphs, err := LoadParagraphs(d.documentsDir, document.ID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	document.Paragraphs = paragraphs

	// Marshal the document.
	data, err := json.Marshal(document)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Write the document.
	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

// httpGetParagraphAudio will return the audio for the specified paragraph.
func (d Documents) httpGetParagraphAudio(w http.ResponseWriter, r *http.Request) {
	// Get the document ID and paragraph ID.
	path := strings.Split(r.URL.Path, "/")
	documentID := path[2]
	paragraphID := path[4]

	// Serve the audio file.
	http.ServeFile(w, r, filepath.Join(d.documentsDir, documentID, "audio", paragraphID+".wav"))
}

// httpPostDocuments will upload a document to the server. The document will be
// sent as a multipart form. The form will contain the following fields:
//   - name: The name of the document as it was uploaded by the user.
//   - file: The document file.
func (d Documents) httpPostDocuments(w http.ResponseWriter, r *http.Request) {
	// Parse the multipart form.
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Get the name of the document.
	name := r.FormValue("name")
	if name == "" {
		http.Error(w, "name is required", http.StatusBadRequest)
		return
	}

	// Get the file.
	file, _, err := r.FormFile("file")
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Read the file.
	fileData, err := ioutil.ReadAll(file)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Create the document.
	document, err := d.CreateDocument(name, fileData)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Marshal the document.
	data, err := json.Marshal(document)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Write the document.
	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
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
