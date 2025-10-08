import React, { useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';

const PhotoUpload = ({ 
  onUpload = () => {}, 
  onVerificationSubmit = () => {},
  questId = null,
  questTitle = "",
  allowMultiple = false,
  maxFiles = 3,
  isRequired = false,
  currentPhotos = [],
  isVerificationMode = false,
  className = ''
}) => {
  const [uploadedFiles, setUploadedFiles] = useState(currentPhotos);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    
    setError(null);
    setIsUploading(true);

    try {
      const fileArray = Array.from(files);
      const maxAllowed = allowMultiple ? maxFiles : 1;
      const filesToProcess = fileArray.slice(0, maxAllowed);

      const processedFiles = await Promise.all(
        filesToProcess.map(async (file, index) => {
          // Validate file type
          if (!file.type.startsWith('image/')) {
            throw new Error(`File ${file.name} is not an image`);
          }

          // Validate file size (10MB max before compression)
          if (file.size > 10 * 1024 * 1024) {
            throw new Error(`File ${file.name} is too large (max 10MB)`);
          }

          // Compress image
          const compressionOptions = {
            maxSizeMB: 1, // 1MB max after compression
            maxWidthOrHeight: 1200,
            useWebWorker: true,
            onProgress: (progress) => {
              setCompressionProgress(Math.round(progress * 100));
            }
          };

          const compressedFile = await imageCompression(file, compressionOptions);
          
          // Create preview
          const previewUrl = URL.createObjectURL(compressedFile);
          
          return {
            id: Date.now() + index,
            file: compressedFile,
            originalFile: file,
            name: file.name,
            size: compressedFile.size,
            type: compressedFile.type,
            previewUrl,
            uploadedAt: new Date(),
            isNew: true
          };
        })
      );

      const newFiles = allowMultiple 
        ? [...uploadedFiles, ...processedFiles].slice(0, maxFiles)
        : processedFiles;

      setUploadedFiles(newFiles);
      onUpload(newFiles);
      
    } catch (err) {
      console.error('Error processing files:', err);
      setError(err.message);
    } finally {
      setIsUploading(false);
      setCompressionProgress(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileSelect = (e) => {
    handleFiles(e.target.files);
  };

  const removeFile = (fileId) => {
    const updatedFiles = uploadedFiles.filter(file => file.id !== fileId);
    setUploadedFiles(updatedFiles);
    onUpload(updatedFiles);
    
    // Clean up preview URL
    const fileToRemove = uploadedFiles.find(file => file.id === fileId);
    if (fileToRemove?.previewUrl) {
      URL.revokeObjectURL(fileToRemove.previewUrl);
    }
  };

  const handleVerificationSubmit = () => {
    if (uploadedFiles.length === 0 && isRequired) {
      setError('Photo verification is required for this quest');
      return;
    }
    
    onVerificationSubmit({
      questId,
      photos: uploadedFiles,
      submittedAt: new Date()
    });
  };

  const canAddMore = allowMultiple && uploadedFiles.length < maxFiles;
  const hasFiles = uploadedFiles.length > 0;

  return (
    <div className={`photo-upload ${className}`}>
      <div className="bg-white rounded-lg p-4 shadow-sm">
        
        {/* Header */}
        <div className="upload-header mb-4">
          <h3 className="text-lg font-bold text-gray-800 mb-1">
            📸 Photo {isVerificationMode ? 'Verification' : 'Upload'}
          </h3>
          {questTitle && (
            <p className="text-sm text-gray-600">
              For quest: <span className="font-medium">{questTitle}</span>
            </p>
          )}
          {isRequired && (
            <p className="text-xs text-red-600 mt-1">
              * Photo verification required
            </p>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="error-message bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-red-500">⚠️</span>
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Upload area */}
        {(!hasFiles || canAddMore) && (
          <div 
            className={`upload-zone border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
              dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <div className="uploading-state">
                <div className="text-3xl mb-2">⏳</div>
                <div className="text-sm text-gray-600 mb-2">Processing images...</div>
                {compressionProgress > 0 && (
                  <div className="progress-bar w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${compressionProgress}%` }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="upload-prompt">
                <div className="text-4xl mb-3">📷</div>
                <div className="text-gray-700 font-medium mb-1">
                  {hasFiles ? 'Add More Photos' : 'Take or Upload Photos'}
                </div>
                <div className="text-sm text-gray-500 mb-3">
                  Drag and drop images here, or click to select
                </div>
                <div className="text-xs text-gray-400">
                  Supports: JPG, PNG, GIF • Max: {allowMultiple ? `${maxFiles} files` : '1 file'} • 10MB each
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple={allowMultiple}
              onChange={handleFileSelect}
              className="hidden"
              capture="environment" // Prefer rear camera on mobile
            />
          </div>
        )}

        {/* File preview grid */}
        {hasFiles && (
          <div className="file-preview-grid mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {uploadedFiles.map((file) => (
                <FilePreview 
                  key={file.id} 
                  file={file} 
                  onRemove={() => removeFile(file.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Upload summary */}
        {hasFiles && (
          <div className="upload-summary mt-4 pt-3 border-t border-gray-100">
            <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
              <span>
                {uploadedFiles.length} of {allowMultiple ? maxFiles : 1} photo{uploadedFiles.length !== 1 ? 's' : ''}
              </span>
              <span>
                Total size: {formatFileSize(uploadedFiles.reduce((sum, file) => sum + file.size, 0))}
              </span>
            </div>
            
            {allowMultiple && uploadedFiles.length >= maxFiles && (
              <div className="text-xs text-orange-600">
                Maximum number of photos reached
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        {isVerificationMode && (
          <div className="verification-actions mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={handleVerificationSubmit}
              disabled={isRequired && uploadedFiles.length === 0}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                isRequired && uploadedFiles.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600 active:scale-95'
              }`}
            >
              ✅ Submit Verification
              {uploadedFiles.length > 0 && ` (${uploadedFiles.length} photo${uploadedFiles.length !== 1 ? 's' : ''})`}
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="instructions mt-4 text-xs text-gray-500">
          <p>💡 Tips:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Take clear, well-lit photos</li>
            <li>Show the completed task clearly</li>
            <li>Images are automatically compressed for faster upload</li>
            {isVerificationMode && <li>Photos help verify quest completion</li>}
          </ul>
        </div>
      </div>
    </div>
  );
};

const FilePreview = ({ file, onRemove }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="file-preview relative group bg-gray-50 rounded-lg overflow-hidden">
      <div className="aspect-square relative">
        <img
          src={file.previewUrl || file.url}
          alt={file.name}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
        />
        
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Remove button */}
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
        >
          ×
        </button>

        {/* File info overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 transform translate-y-full group-hover:translate-y-0 transition-transform">
          <div className="text-xs truncate">{file.name}</div>
          <div className="text-xs text-gray-300">{formatFileSize(file.size)}</div>
        </div>

        {/* New file indicator */}
        {file.isNew && (
          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            New
          </div>
        )}
      </div>
    </div>
  );
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default PhotoUpload;