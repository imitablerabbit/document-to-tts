from TTS.api import TTS
from pathlib import Path
import argparse

# Parse user flags
def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--model', type=str, default="tts_models/en/vctk/vits", help='Name of the model to use.')
    parser.add_argument('--speaker', type=str, default="p261", help='Name of the speaker.')

    parser.add_argument('--text-dir', type=str, default="txt-split", help='Directory containing the text files.')
    parser.add_argument('--out-dir', type=str, default="audio-split", help='Directory to save the generated audio files.')

    parser.add_argument('--start-idx', type=int, default=0, help='The index to start generating audio files from.')
    parser.add_argument('--end-idx', type=int, default=-1, help='The index to stop generating audio files at.')
    return parser.parse_args()

# Initialize the TTS model
def init_tts_model(model_name, gpu):
    tts = TTS(model_name=model_name, gpu=gpu)
    return tts

# Generate tts file from text.
def generate_tts_file(tts, text, speaker_name, file_path):
    tts.tts_to_file(text=text, speaker=speaker_name, file_path=file_path)


# Main
args = parse_args()
speaker_name = args.speaker
model_name = args.model
text_dir = args.text_dir
out_dir = args.out_dir
start_idx = args.start_idx
end_idx = args.end_idx

tts = init_tts_model(model_name, True)

# Get all text files in the directory and sort them by number.
# Then trim the list to the specified range.
my_dir = Path(text_dir)
filenames = [f for f in my_dir.iterdir() if f.is_file()]
trimmed_filenames = [f.name for f in filenames]
no_suffix_filenames = [f.with_suffix("") for f in filenames]
numbers = [int(f.name) for f in no_suffix_filenames]
numbers.sort()
numbers = numbers[start_idx:end_idx]

# Create output directory if it doesn't exist
Path(out_dir).mkdir(parents=True, exist_ok=True)

# Generate audio files from text files.
failed = []
for i in numbers:
    path = my_dir / f"{i}.txt"
    with open(path, "r", encoding='utf-8') as f:
        text = f.read()
        if text == "":
            continue

        wavPath = Path(out_dir) / f"{i}.wav"
        try:
            generate_tts_file(tts, text, speaker_name, wavPath)
        except Exception as e:
            print(f"Failed to generate {wavPath} with error: {e}")#
            failed.append(i)
        else:
            print(f"Generated {wavPath}")

print(f"Failed to generate {len(failed)} files: {failed}")
