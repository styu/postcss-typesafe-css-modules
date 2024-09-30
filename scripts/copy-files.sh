#!/bin/bash

# Define source and destination directories
SOURCE_DIR="$1"
DEST_DIR="$2"

# Check if the source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
  echo "Error: Source directory does not exist."
  exit 1
fi

# Ensure the destination directory exists
mkdir -p "$DEST_DIR"

# Find and process each file
find "$SOURCE_DIR" -type f | while IFS= read -r file; do
  # Remove the source directory path
  new_path=$(echo "$file" | sed "s|^$SOURCE_DIR/||")
  
  # Create the corresponding directory structure in the destination directory
  mkdir -p "$DEST_DIR/$(dirname "$new_path")"
  
  # Copy the file to the new location
  cp "$file" "$DEST_DIR/$new_path"
done

