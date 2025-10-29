class SpiralCreator {
    constructor() {
        this.canvas = document.getElementById('mainCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.originalImage = null;
        this.processedImage = null;
        this.model = null;
        
        this.initializeEventListeners();
        this.loadModel();
    }
    
    initializeEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const imageInput = document.getElementById('imageInput');
        const generateBtn = document.getElementById('generateSpiral');
        const downloadBtn = document.getElementById('downloadBtn');
        const resetBtn = document.getElementById('resetBtn');
        
        // Upload area click
        uploadArea.addEventListener('click', () => imageInput.click());
        
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleImageUpload(files[0]);
            }
        });
        
        // File input change
        imageInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleImageUpload(e.target.files[0]);
            }
        });
        
        // Generate spiral
        generateBtn.addEventListener('click', () => this.generateSpiral());
        
        // Download
        downloadBtn.addEventListener('click', () => this.downloadImage());
        
        // Reset
        resetBtn.addEventListener('click', () => this.reset());
        
        // Control updates
        this.updateControlValues();
        document.getElementById('spiralTurns').addEventListener('input', this.updateControlValues);
        document.getElementById('objectSize').addEventListener('input', this.updateControlValues);
        document.getElementById('objectCount').addEventListener('input', this.updateControlValues);
    }
    
    updateControlValues = () => {
        document.getElementById('turnsValue').textContent = document.getElementById('spiralTurns').value;
        document.getElementById('sizeValue').textContent = document.getElementById('objectSize').value;
        document.getElementById('countValue').textContent = document.getElementById('objectCount').value;
    }
    
    async loadModel() {
        try {
            console.log('Loading DeepLab model...');
            this.model = await deeplab.load();
            console.log('Model loaded successfully');
        } catch (error) {
            console.error('Error loading model:', error);
            alert('Error loading AI model. Please refresh the page and try again.');
        }
    }
    
    async handleImageUpload(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            const img = new Image();
            img.onload = async () => {
                this.originalImage = img;
                this.showControls();
                await this.processImage();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    showControls() {
        document.getElementById('controlsSection').style.display = 'block';
        document.getElementById('downloadBtn').style.display = 'inline-block';
        document.getElementById('resetBtn').style.display = 'inline-block';
    }
    
    async processImage() {
        if (!this.model) {
            alert('AI model is still loading. Please wait...');
            return;
        }
        
        const generateBtn = document.getElementById('generateSpiral');
        const originalText = generateBtn.innerHTML;
        generateBtn.innerHTML = '<span class="loading"></span>Processing...';
        generateBtn.disabled = true;
        
        try {
            // Create a temporary canvas to resize the image for processing
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            const maxSize = 512;
            
            let { width, height } = this.originalImage;
            if (width > height) {
                height = (height * maxSize) / width;
                width = maxSize;
            } else {
                width = (width * maxSize) / height;
                height = maxSize;
            }
            
            tempCanvas.width = width;
            tempCanvas.height = height;
            tempCtx.drawImage(this.originalImage, 0, 0, width, height);
            
            // Get image data for segmentation
            const imageData = tempCtx.getImageData(0, 0, width, height);
            
            // Run segmentation
            const segmentation = await this.model.segment(imageData);
            
            // Create mask for the main object (assuming person is the main object)
            const mask = this.createMask(segmentation, width, height);
            
            // Apply mask to original image
            this.processedImage = await this.applyMask(this.originalImage, mask);
            
            // Display the processed image
            this.displayProcessedImage();
            
        } catch (error) {
            console.error('Error processing image:', error);
            alert('Error processing image. Please try again.');
        } finally {
            generateBtn.innerHTML = originalText;
            generateBtn.disabled = false;
        }
    }
    
    createMask(segmentation, width, height) {
        const mask = new Uint8Array(width * height);
        const labels = segmentation.segmentationMap;
        
        // Find the largest connected component (main object)
        const labelCounts = {};
        for (let i = 0; i < labels.length; i++) {
            const label = labels[i];
            labelCounts[label] = (labelCounts[label] || 0) + 1;
        }
        
        // Remove background (label 0) and find the most prominent object
        delete labelCounts[0];
        const mainObjectLabel = Object.keys(labelCounts).reduce((a, b) => 
            labelCounts[a] > labelCounts[b] ? a : b
        );
        
        // Create mask
        for (let i = 0; i < labels.length; i++) {
            mask[i] = labels[i] === parseInt(mainObjectLabel) ? 255 : 0;
        }
        
        return { data: mask, width, height };
    }
    
    async applyMask(image, mask) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = image.width;
            canvas.height = image.height;
            
            // Draw original image
            ctx.drawImage(image, 0, 0);
            
            // Get image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Scale mask to match image size
            const scaleX = canvas.width / mask.width;
            const scaleY = canvas.height / mask.height;
            
            // Apply mask
            for (let y = 0; y < canvas.height; y++) {
                for (let x = 0; x < canvas.width; x++) {
                    const maskX = Math.floor(x / scaleX);
                    const maskY = Math.floor(y / scaleY);
                    const maskIndex = maskY * mask.width + maskX;
                    
                    if (mask.data[maskIndex] === 0) {
                        const pixelIndex = (y * canvas.width + x) * 4;
                        data[pixelIndex] = 0;     // R
                        data[pixelIndex + 1] = 0; // G
                        data[pixelIndex + 2] = 0; // B
                        data[pixelIndex + 3] = 0; // A (transparent)
                    }
                }
            }
            
            ctx.putImageData(imageData, 0, 0);
            
            // Convert to image
            const processedImg = new Image();
            processedImg.onload = () => resolve(processedImg);
            processedImg.src = canvas.toDataURL();
        });
    }
    
    displayProcessedImage() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.processedImage) {
            // Center the image
            const x = (this.canvas.width - this.processedImage.width) / 2;
            const y = (this.canvas.height - this.processedImage.height) / 2;
            this.ctx.drawImage(this.processedImage, x, y);
        }
    }
    
    generateSpiral() {
        if (!this.processedImage) {
            alert('Please upload and process an image first.');
            return;
        }
        
        const turns = parseFloat(document.getElementById('spiralTurns').value);
        const objectSize = parseInt(document.getElementById('objectSize').value);
        const objectCount = parseInt(document.getElementById('objectCount').value);
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const maxRadius = Math.min(centerX, centerY) - 50;
        
        for (let i = 0; i < objectCount; i++) {
            const t = i / objectCount;
            const angle = t * turns * 2 * Math.PI;
            const radius = maxRadius * (1 - t);
            
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            // Calculate scale based on position in spiral
            const scale = (objectSize / 100) * (0.3 + 0.7 * (1 - t));
            
            // Calculate rotation based on spiral position
            const rotation = angle + Math.PI / 2;
            
            this.drawRotatedImage(x, y, scale, rotation);
        }
    }
    
    drawRotatedImage(x, y, scale, rotation) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(rotation);
        this.ctx.scale(scale, scale);
        
        const imgWidth = this.processedImage.width * scale;
        const imgHeight = this.processedImage.height * scale;
        
        this.ctx.drawImage(
            this.processedImage,
            -imgWidth / 2,
            -imgHeight / 2,
            imgWidth,
            imgHeight
        );
        
        this.ctx.restore();
    }
    
    downloadImage() {
        const link = document.createElement('a');
        link.download = 'spiral-pattern.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }
    
    reset() {
        this.originalImage = null;
        this.processedImage = null;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        document.getElementById('controlsSection').style.display = 'none';
        document.getElementById('downloadBtn').style.display = 'none';
        document.getElementById('resetBtn').style.display = 'none';
        document.getElementById('imageInput').value = '';
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SpiralCreator();
});
