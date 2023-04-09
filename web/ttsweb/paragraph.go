package ttsweb

import (
	"fmt"
	"io/ioutil"
	"os"
	"sort"
	"strconv"
	"strings"
)

// -----------------------------------------------------------------------------
// Paragraph Info
// -----------------------------------------------------------------------------

type ParagraphInfoList []ParagraphInfo

// implements sort.Interface
func (p ParagraphInfoList) Len() int {
	return len(p)
}
func (p ParagraphInfoList) Less(i, j int) bool {
	intIDi, err := strconv.Atoi(p[i].ID)
	if err != nil {
		return false
	}
	intIDj, err := strconv.Atoi(p[j].ID)
	if err != nil {
		return false
	}
	return intIDi < intIDj
}
func (p ParagraphInfoList) Swap(i, j int) {
	p[i], p[j] = p[j], p[i]
}

// ParagraphInfo describes the information about a paragraph. This does not
// include the text of the paragraph. In order to get the text of the paragraph,
// a Paragraph object must be created instead.
type ParagraphInfo struct {
	ID string `json:"id"`

	Link      string `json:"link"`
	AudioLink string `json:"audioLink"`
}

// LoadParagraphs will load all of the paragraphs from the paragraphs directory.
func LoadParagraphInfos(documentsDir, documentID string) ([]ParagraphInfo, error) {
	fmt.Println("Loading paragraph infos for document " + documentID)

	paragraphs := []ParagraphInfo{}

	// Load the paragraphs from the paragraphs directory.
	paragraphFiles, err := os.ReadDir(documentsDir + documentID + "/paragraphs")
	if err != nil {
		return nil, err
	}

	// Loop through the files in the paragraphs directory. Each directory
	// will be a paragraph.
	for _, paragraphFile := range paragraphFiles {
		// Load the paragraph.
		pName := paragraphFile.Name()
		paragraphID := strings.TrimSuffix(pName, ".txt")
		paragraph, err := LoadParagraphInfo(documentsDir, documentID, paragraphID)
		if err != nil {
			return nil, err
		}
		paragraphs = append(paragraphs, paragraph)
	}

	pil := ParagraphInfoList(paragraphs)
	sort.Sort(pil)

	// Return the paragraphs.
	return pil, nil
}

// LoadParagraphInfo will populate the ParagraphInfo struct with the information
// about the paragraph. This does not include the text of the paragraph.
func LoadParagraphInfo(documentsDir, documentID string, paragraphID string) (ParagraphInfo, error) {
	fmt.Println("Loading paragraph info " + paragraphID + " for document " + documentID)

	paragraph := ParagraphInfo{}
	paragraph.ID = paragraphID

	// Stringbuilder for the link.
	var link strings.Builder
	link.WriteString("/documents/")
	link.WriteString(documentID)
	link.WriteString("/paragraphs/")
	link.WriteString(paragraph.ID)
	paragraph.Link = link.String()

	// Stringbuilder for the audio link.
	var audioLink strings.Builder
	audioLink.WriteString("/documents/")
	audioLink.WriteString(documentID)
	audioLink.WriteString("/paragraphs/")
	audioLink.WriteString(paragraph.ID)
	audioLink.WriteString("/audio")
	paragraph.AudioLink = audioLink.String()

	// Return the paragraph.
	return paragraph, nil
}

// -----------------------------------------------------------------------------
// Paragraphs
// -----------------------------------------------------------------------------

// Paragraph is a paragraph of a document. This includes the text of the
// paragraph. Everything else is in the ParagraphInfo struct.
type Paragraph struct {
	ParagraphInfo

	Content string `json:"content"`
}

// LoadParagraph will load a paragraph from the paragraphs directory.
//
// The paragraph will be loaded from the file documents/{id}/paragraphs/{id}. {id}
// is the ID of the document and is a directory in the documents
// directory. The paragraph will be loaded from the index.json file
// in the paragraph directory.
func LoadParagraph(documentsDir, documentID string, paragraphID string) (Paragraph, error) {
	fmt.Println("Loading paragraph " + paragraphID + " for document " + documentID)

	paragraphFile := paragraphID + ".txt"
	paragraph := Paragraph{}

	// Load the paragraph from the paragraphs directory.
	data, err := ioutil.ReadFile(documentsDir + documentID + "/paragraphs/" + paragraphFile)
	if err != nil {
		return paragraph, err
	}

	paragraph.ID = strings.TrimSuffix(paragraphFile, ".txt")
	paragraph.Content = string(data)
	paragraph.Link = "/documents/" + documentID + "/paragraphs/" + paragraph.ID
	paragraph.AudioLink = "/documents/" + documentID + "/paragraphs/" + paragraph.ID + "/audio"

	// Return the paragraph.
	return paragraph, nil
}
