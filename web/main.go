package main

import (
	"flag"
	"fmt"
	"net/http"
	"os"
	"strings"

	"imitablerabbit/ttsweb"
)

var (
	portFlag        = flag.Int("port", 8080, "the port number that this server should listen on")
	staticFilesFlag = flag.String("static", "build/static", "the static file directory")

	documentsDirFlag = flag.String("documents-dir", "documents/", "the directory that contains the documents")
)

func main() {
	flag.Parse()

	listenAddress := fmt.Sprintf(":%d", *portFlag)

	// Verify the required directories.
	if err := verifyPath(*staticFilesFlag); err != nil {
		panic(err)
	}
	if err := verifyPath(*documentsDirFlag); err != nil {
		panic(err)
	}

	// Load the documents.
	documents, err := ttsweb.LoadDocuments(*documentsDirFlag)
	if err != nil {
		panic(err)
	}
	documents.SetDocumentsDir(*documentsDirFlag)

	// Create the http server.
	server := &http.Server{
		Addr: listenAddress,
		Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			fmt.Printf("Request: %s %s\n", r.Method, r.URL.Path)

			// Check if the request is for a static file.
			if strings.HasPrefix(r.URL.Path, "/static/") {
				http.StripPrefix("/static/", http.FileServer(http.Dir(*staticFilesFlag+"/"))).ServeHTTP(w, r)
				return
			}

			// Check if the request is for a document.
			if strings.HasPrefix(r.URL.Path, "/documents") {
				documents.ServeHTTP(w, r)
				return
			}

			// Otherwise, serve the index page.
			http.ServeFile(w, r, *staticFilesFlag+"/html/index.html")
		}),
	}

	// Start the server.
	fmt.Printf("Listening on %s for HTTP requests ...\n", listenAddress)
	if err := server.ListenAndServe(); err != nil {
		panic(err)
	}
}

// verifyPath will verify that the path is valid. The path must be a directory
// and must exist.
func verifyPath(path string) error {
	if path == "" {
		return fmt.Errorf("path cannot be empty")
	}

	// Check if the path is a directory.
	info, err := os.Stat(path)
	if err != nil {
		return err
	}
	if !info.IsDir() {
		return fmt.Errorf("path must be a directory")
	}
	return nil
}
