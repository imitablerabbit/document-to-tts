package ttsweb

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
)

// ServeHTTP will handle the HTTP requests for the documents.
//
// The following HTTP requests are supported:
//
// - POST /documents
//   - Uploads a document to the server.
//
// - GET /documents
//   - Returns the documents that have been uploaded by the user.
//     Each document will be returned as a JSON object and will contain a link
//     to the document for more specific information. The data returned will
//     be a subset of the data returned by the /documents/fetch/{id} request.
//
// - GET /documents/{id}
//   - Returns the document info with the specified ID.
//
// - GET /documents/{id}/paragraphs/{paragraph_id}
//   - Returns the paragraph with the specified ID.
//
// - GET /documents/{id}/paragraphs/{paragraph_id}/audio
//   - Returns the audio for the paragraph with the specified ID.
func (d DocumentsInfo) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		fallthrough
	case http.MethodPost:
		if strings.HasPrefix(r.URL.Path, "/documents") {
			d.httpDocumentsRouter(w, r)
		}
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

// -----------------------------------------------------------------------------
// Document Handlers
// -----------------------------------------------------------------------------

// httpDocumentsRouter is the top level router for the documents endpoints.
// This will parse out the request and call the appropriate handler.
func (d DocumentsInfo) httpDocumentsRouter(w http.ResponseWriter, r *http.Request) {
	fmt.Println("httpDocumentsRouter")

	// Check if we are uploading a document.
	if r.Method == http.MethodPost {
		fmt.Println("\t|-httpPostDocuments")
		d.httpPostDocuments(w, r)
		return
	}

	// Split the path and determine which handler to call.
	path := strings.Split(r.URL.Path, "/")
	if len(path) >= 2 && path[1] == "documents" {

		// Check if we are accessing a paragraph. We will hand
		// off to the paragraphs router here.
		// /documents/{id}/paragraphs/*
		if len(path) >= 4 && path[3] == "paragraphs" {
			fmt.Println("\t|-httpParagraphsRouter")
			d.httpParagraphsRouter(w, r)
			return
		}

		// Check if we are getting the list of documents.
		// /documents
		if len(path) == 2 {
			fmt.Println("\t|-httpGetDocuments")
			d.httpGetDocuments(w, r)
			return
		}

		// Check if we are getting a specific document.
		// /documents/{id}
		if len(path) == 3 && path[2] != "" {
			fmt.Println("\t|-httpGetDocument")
			d.httpGetDocument(w, r)
			return
		}
	}

	// If we get here, the request was not handled.
	http.Error(w, "not found", http.StatusNotFound)
}

// httpGetDocuments will return the documents that have been uploaded by the
// user. Each document will be returned as a JSON object and will contain a link
// to the document for more specific information.
func (d DocumentsInfo) httpGetDocuments(w http.ResponseWriter, r *http.Request) {

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
func (d DocumentsInfo) httpGetDocument(w http.ResponseWriter, r *http.Request) {
	// Get the ID from the URL.
	id := strings.TrimPrefix(r.URL.Path, "/documents/")
	if id == "" {
		http.Error(w, "id is required", http.StatusBadRequest)
		return
	}

	// Find the document.
	var document DocumentInfo
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
	paragraphs, err := LoadParagraphInfos(d.documentsDir, document.ID)
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

// -----------------------------------------------------------------------------
// Paragraph Handlers
// -----------------------------------------------------------------------------

// httpParagraphsRouter is the top level router for the paragraphs endpoints.
// This will parse out the request and call the appropriate handler.
func (d DocumentsInfo) httpParagraphsRouter(w http.ResponseWriter, r *http.Request) {
	path := strings.Split(r.URL.Path, "/")
	if len(path) == 5 && path[4] != "" {
		if strings.Contains(path[4], ",") || strings.Contains(path[4], "-") {
			// /documents/{id}/paragraphs/{paragraph_id1}-{paragraph_id2},{paragraph_id3}
			fmt.Println("\t\t|-httpGetParagraphBatch")
			d.httpGetParagraphBatch(w, r)
			return
		}
		// /documents/{id}/paragraphs/{paragraph_id}
		fmt.Println("\t\t|-httpGetParagraph")
		d.httpGetParagraph(w, r)
		return
	}

	if len(path) == 6 && path[5] == "audio" {
		// /documents/{id}/paragraphs/{paragraph_id}/audio
		fmt.Println("\t\t|-httpGetParagraphAudio")
		d.httpGetParagraphAudio(w, r)
		return
	}
}

// httpGetParagraph will return the paragraph with the specified ID.
func (d DocumentsInfo) httpGetParagraph(w http.ResponseWriter, r *http.Request) {
	// Get the document ID and paragraph ID.
	path := strings.Split(r.URL.Path, "/")
	documentID := path[2]
	paragraphID := path[4]

	// Load the paragraph.
	paragraph, err := LoadParagraph(d.documentsDir, documentID, paragraphID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Marshal the paragraph.
	data, err := json.Marshal(paragraph)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Write the paragraph.
	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

// httpGetParagraphBatch will return the paragraphs with the specified IDs.
// The IDs can be specified as a range (e.g. 1-5) or a list (e.g. 1,2,3,4,5).
// A combination of both is also supported (e.g. 1-3,5,7-10).
func (d DocumentsInfo) httpGetParagraphBatch(w http.ResponseWriter, r *http.Request) {
	// Get the document ID and paragraph ID.
	path := strings.Split(r.URL.Path, "/")
	documentID := path[2]
	paragraphIDBatchString := path[4]

	// Parse the paragraph IDs.
	paragraphIDs, err := parseParagraphIDBatch(paragraphIDBatchString)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Load the paragraph.
	paragraphs, err := LoadParagraphBatch(d.documentsDir, documentID, paragraphIDs)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Marshal the paragraph.
	data, err := json.Marshal(paragraphs)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Write the paragraph.
	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

// ParseParagraphIDBatch will parse a batch of paragraph IDs.
func parseParagraphIDBatch(s string) ([]string, error) {
	// Split the string into a list of IDs.
	ids := strings.Split(s, ",")

	// Parse the IDs.
	var paragraphIDs []string
	for _, id := range ids {
		// Check if the ID is a range.
		if strings.Contains(id, "-") {
			// Parse the range.
			parts := strings.Split(id, "-")
			if len(parts) != 2 {
				return nil, fmt.Errorf("invalid range: %s", id)
			}
			start, err := strconv.Atoi(parts[0])
			if err != nil {
				return nil, fmt.Errorf("invalid range: %s", id)
			}
			end, err := strconv.Atoi(parts[1])
			if err != nil {
				return nil, fmt.Errorf("invalid range: %s", id)
			}

			// Add the IDs in the range to the list.
			for i := start; i <= end; i++ {
				paragraphIDs = append(paragraphIDs, strconv.Itoa(i))
			}
			continue
		}

		// Add the ID to the list.
		paragraphIDs = append(paragraphIDs, id)
	}

	return paragraphIDs, nil
}

// httpGetParagraphAudio will return the audio for the specified paragraph.
func (d DocumentsInfo) httpGetParagraphAudio(w http.ResponseWriter, r *http.Request) {
	// Get the document ID and paragraph ID.
	path := strings.Split(r.URL.Path, "/")
	documentID := path[2]
	paragraphID := path[4]

	// Serve the audio file.
	http.ServeFile(w, r, filepath.Join(d.documentsDir, documentID, "audio", paragraphID+".wav"))
}

// -----------------------------------------------------------------------------
// Upload Handlers
// -----------------------------------------------------------------------------

// httpPostDocuments will upload a document to the server. The document will be
// sent as a multipart form. The form will contain the following fields:
//   - name: The name of the document as it was uploaded by the user.
//   - file: The document file.
func (d DocumentsInfo) httpPostDocuments(w http.ResponseWriter, r *http.Request) {
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

	// Add the document to the list.
	d.Documents = append(d.Documents, document)

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
