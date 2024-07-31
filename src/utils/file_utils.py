# src/utils/file_utils.py

import os

def save_generated_files(generated_files, output_dir):
    for route_path, file_contents in generated_files.items():
        for file_type, content in file_contents.items():
            # Create a filename based on the route path and file type
            filename = route_path.replace('/', '_').strip('_') + f'_{file_type}.js'
            file_path = os.path.join(output_dir, filename)
            
            # Ensure the output directory exists
            os.makedirs(output_dir, exist_ok=True)
            
            with open(file_path, 'w') as f:
                f.write(content)
            print(f"Saved {file_type} file for {route_path} at {file_path}")