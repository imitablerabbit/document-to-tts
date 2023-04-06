set -e

# ------------------------------------------------------------------------------
# Variables
# ------------------------------------------------------------------------------

# The input file.
input_file=$1

# ------------------------------------------------------------------------------
# Functions
# ------------------------------------------------------------------------------

# Create a temporary file name.
function create_tmp_file {
    tmp_name="$(mktemp -u split-XXXXXXXX.txt)"
    while [ -f "${tmp_name}" ]; do
        tmp_name="$(mktemp -u split-XXXXXXXX.txt)"
    done
    echo ${tmp_name}
}

# Print action start message.
function start_action {
    text=$1
    nest_level=$2
    if [ -z "${nest_level}" ]; then
        nest_level=0
    fi
    # Use 4 spaces for each level of nesting.
    nest_level=$((nest_level * 4))
    printf "%${nest_level}s" ""
    printf "$1 "
}

# Print action end message.
function end_action {
    status_code=$1
    if [ -z "${status_code}" ]; then
        status_code=0
    fi
    if [ "${status_code}" -eq 0 ]; then
        tput setaf 2
        echo "done"
        tput sgr0
    else
        tput setaf 1
        echo "failed"
        tput sgr0
    fi
}

# Print usage information.
function usage {
    echo "Usage: split-document.sh <input_file> <output_dir>"
    exit 1
}

# ------------------------------------------------------------------------------
# Main
# ------------------------------------------------------------------------------

# Parse the command line arguments using getopt.
eval set -- $(getopt -o h,o: --long help,output: -n 'split-document.sh' -- "$@")
while true; do
    case "$1" in
        -h|--help)
            usage
            ;;
        -o|--output)
            output_dir=$2
            shift 2
            ;;
        --)
            shift
            break
            ;;
        *)
            echo "Internal error!"
            exit 1
            ;;
    esac
done

# Check the input parameters.
if [ -z "${input_file}" ]; then
    echo "Error: input_file is empty"
    usage
fi
if [ -z "${output_dir}" ]; then
    output_dir="split"
fi

# Convert the document to plain text.
tmp_name=$(create_tmp_file)
start_action "Converting ${input_file} to ${tmp_name}..."
pandoc -s ${input_file} -o ${tmp_name}
end_action $?

# Clean up the text.
start_action "Cleaning up ${tmp_name}..."

# Convert unicode characters to ASCII.
echo
start_action "Converting unicode characters to ASCII..." 1
tmp_name2=$(create_tmp_file)
iconv -f UTF-8 -t ASCII//TRANSLIT ${tmp_name} > ${tmp_name2}
status_code=$?
mv ${tmp_name2} ${tmp_name}
end_action ${status_code}

# Protect blank lines.
start_action "Protecting blank lines..." 1
sed -i 's/^$/@@@/g' ${tmp_name}
end_action $?

# Convert \n and \r to spaces.
start_action "Converting newlines and carriage returns to spaces..." 1
sed -i ':a;N;$!ba;s/\n/ /g' ${tmp_name}
sed -i ':a;N;$!ba;s/\r/ /g' ${tmp_name}
end_action

# Recover blank lines.
start_action "Recovering blank lines..." 1
sed -i 's/@@@/\n\n/g' ${tmp_name}
end_action $?

# Remove multiple spaces.
start_action "Removing multiple spaces..." 1
sed -i 's/  */ /g' ${tmp_name}
end_action $?

# Remove leading and trailing spaces.
start_action "Removing leading and trailing spaces..." 1
sed -i 's/^ *//g' ${tmp_name}
sed -i 's/ *$//g' ${tmp_name}
end_action

# Split the document into separate files based on paragraphs.
start_action "Splitting ${tmp_name} into separate files..."
mkdir -p ${output_dir}
awk -v "output_dir=${output_dir}" 'BEGIN{n=0}/^$/{n++}$0!=""{print > output_dir "/" n ".txt"}' ${tmp_name}
end_action $?

# Remove the temporary files.
start_action "Removing temporary files..."
rm ${tmp_name}
end_action
