import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  onImageLoad: (image: HTMLImageElement) => void;
}

export default function ImageUploader({ onImageLoad }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        onImageLoad(img);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [onImageLoad]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-lg mx-auto"
    >
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          upload-zone rounded-2xl p-12 text-center
          ${isDragging ? 'upload-zone-active' : ''}
          cursor-pointer transition-all duration-300
        `}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer block">
          <motion.div
            animate={isDragging ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6"
          >
            {isDragging ? (
              <ImageIcon className="w-10 h-10 text-accent" />
            ) : (
              <Upload className="w-10 h-10 text-muted-foreground" />
            )}
          </motion.div>
          
          <h3 className="text-xl font-display font-semibold text-foreground mb-2">
            {isDragging ? 'Drop your image!' : 'Upload a Photo'}
          </h3>
          
          <p className="text-muted-foreground">
            Drag and drop an image, or click to browse
          </p>
          
          <div className="mt-6">
            <span className="btn-gold px-6 py-3 rounded-xl font-medium inline-block">
              Choose Image
            </span>
          </div>
        </label>
      </div>
    </motion.div>
  );
}
