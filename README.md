# document-to-tts

This is a simple script that converts a document file to a series of wav files using Coqui TTS. The split-text.py script can be used to split a document into paragraphs and sentences. The document-to-tts.py script can then be used to convert a document into a series of wav files.
You can grep over the folder of split text files to find the sentence you want to listen to as the wav filenames are the same.

## Usage

Split the text into paragraphs and sentences. The script will then convert each sentence into an audio file.

### Split text

```bash
./split-text.py --output-dir <output_dir> <input_file>
```

Example:

```bash
./split-text.py --output-dir text-split -- ./my_poetry.docx
```

### Convert split text to audio

```bash
python3 split-txt-to-tts.py --text-dir <input_dir> --output-dir <output_dir>
```

Example:

```bash
python3 split-txt-to-tts.py --text-dir text-split --output-dir audio
```

