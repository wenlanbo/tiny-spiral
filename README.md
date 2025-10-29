# Spiral Object Creator

A web application that uploads an image, removes the background using AI, and creates a beautiful spiral pattern with the extracted object.

## Features

- **Image Upload**: Drag and drop or click to upload images
- **AI Background Removal**: Uses TensorFlow.js and DeepLab model to automatically remove backgrounds
- **Spiral Pattern Generation**: Creates concentric spiral patterns with rotated and scaled objects
- **Interactive Controls**: Adjust spiral turns, object size, and number of objects
- **Download Results**: Save your spiral patterns as PNG images

## How to Use

1. **Open the Website**: Open `index.html` in a modern web browser
2. **Upload an Image**: Click the upload area or drag and drop an image file
3. **Wait for Processing**: The AI will automatically remove the background from your image
4. **Adjust Settings**: Use the controls to customize your spiral:
   - **Spiral Turns**: Number of complete rotations (1-10)
   - **Object Size**: Size of each object in the spiral (10-100%)
   - **Number of Objects**: Total objects in the spiral (20-200)
5. **Generate Spiral**: Click "Generate Spiral" to create your pattern
6. **Download**: Save your creation as a PNG image

## Technical Details

### Background Removal
- Uses TensorFlow.js with DeepLab model for semantic segmentation
- Automatically identifies and extracts the main object from the image
- Creates transparent background for seamless spiral generation

### Spiral Algorithm
- Objects are positioned along a logarithmic spiral
- Each object is rotated to follow the spiral curve
- Objects scale down as they approach the center
- Creates smooth, natural-looking spiral patterns

### Browser Compatibility
- Requires a modern browser with Canvas and WebGL support
- Works best with Chrome, Firefox, Safari, and Edge
- Mobile-friendly responsive design

## File Structure

```
├── index.html          # Main HTML structure
├── styles.css          # CSS styling and responsive design
├── script.js           # JavaScript functionality
└── README.md           # This documentation
```

## Dependencies

The application uses CDN-hosted libraries:
- TensorFlow.js for AI model loading
- DeepLab model for image segmentation

No local installation required - everything runs in the browser!

## Tips for Best Results

1. **Image Quality**: Use high-resolution images with clear subjects
2. **Subject Clarity**: Images with distinct objects work best for background removal
3. **Spiral Settings**: 
   - More turns create tighter spirals
   - Larger object sizes work well for detailed images
   - More objects create smoother, more detailed patterns
4. **File Formats**: Supports all common image formats (JPG, PNG, GIF, WebP)

## Troubleshooting

- **Model Loading Issues**: Refresh the page if the AI model fails to load
- **Processing Errors**: Try with a different image or smaller file size
- **Performance**: For very large images, the processing may take longer

Enjoy creating beautiful spiral patterns! 🌀
