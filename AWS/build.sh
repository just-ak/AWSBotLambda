#!/bin/bash
here=$1
echo "Building edgeAuth from $here"
# Load environment variables
ENV_FILE=".env"
echo "Loading environment variables from $ENV_FILE"

# Clear existing env vars
unset COGNITO_USER_POOL_DOMAIN COGNITO_CLIENT_ID

# Loop through each line in the .env file
while IFS= read -r line || [[ -n "$line" ]]; do
    # Skip empty lines and comments
    if [[ -z "$line" ]] || [[ "$line" =~ ^[[:space:]]*# ]]; then
        continue
    fi
    
    # Extract key and value
    if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
        key="${BASH_REMATCH[1]}"
        value="${BASH_REMATCH[2]}"
        # Remove surrounding quotes if present
        value="${value%\"}"
        value="${value#\"}"
        # Export the environment variable
        export "$key=$value"
        # echo "Exported: $key=$value"
    elif [[ "$line" =~ ^([^=]+)$ ]]; then
        # Handle keys without values
        key="${BASH_REMATCH[1]}"
        export "$key="
        # echo "Exported: $key= (empty value)"
    fi
done < "$ENV_FILE"

# Create alias variables for sed replacements
COGNITO_DOMAIN="$COGNITO_USER_POOL_DOMAIN"
CLIENT_ID="$COGNITO_CLIENT_ID"
COGNITO_AWS_REGION="$COGNITO_AWS_REGION"

echo "Using COGNITO_DOMAIN=$COGNITO_DOMAIN"
echo "Using CLIENT_ID=$CLIENT_ID"
echo "Using COGNITO_AWS_REGION=$COGNITO_AWS_REGION"
# printenv | sort
echo "=== End Environment Variables ==="

# Function to build all files
build() {
    # Create build directory if it doesn't exist
    mkdir -p ${here}/../build
    
    # Source directory
    SRC_DIR="${here}/../src"
    BUILD_DIR="${here}/../build"
    
    echo "Copying and processing all files from ${SRC_DIR} to ${BUILD_DIR}"
    
    # Find all files in source directory
    find ${SRC_DIR} -type f | while read src_file; do
        # Get relative path from source directory
        rel_path=$(python3 -c "import os,sys; print(os.path.relpath(sys.argv[1], sys.argv[2]))" "${src_file}" "${SRC_DIR}")
        # rel_path=$(realpath --relative-to="${SRC_DIR}" "${src_file}")
        # Create destination path
        dest_file="${BUILD_DIR}/${rel_path}"
        # Create destination directory if needed
        dest_dir=$(dirname "${dest_file}")
        mkdir -p "${dest_dir}"
        
        # Get file extension
        extension="${src_file##*.}"
        
        # Process JavaScript/TypeScript files with sed for variable replacement
        if [[ "${extension}" == "js" || "${extension}" == "mjs" || "${extension}" == "ts" ]]; then
            echo "Processing ${rel_path}"
            # Process file with sed replacements
            sed "s|__COGNITO_USER_POOL_DOMAIN__|$COGNITO_USER_POOL_DOMAIN|g; 
                 s|__COGNITO_CLIENT_ID__|$CLIENT_ID|g; \
                 s|__COGNITO_AWS_REGION__|$COGNITO_AWS_REGION|g" \
                "${src_file}" > "${dest_file}"
        else
            # Just copy other files without processing
            echo "Copying ${rel_path}"
            cp "${src_file}" "${dest_file}"
        fi
    done
    
    echo "✅ Build complete. Files copied to ${BUILD_DIR}"
}

build