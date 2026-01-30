import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Image as ImageIcon, Shuffle } from 'lucide-react';
import { fetchRandomStockImage, StockImageInfo } from '@/utils/stockImages';

interface ImageUploaderProps {
  onImageLoad: (image: HTMLImageElement, attribution?: StockImageInfo) => void;
}

export default function ImageUploader({ onImageLoad }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingRandom, setIsLoadingRandom] = useState(false);

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

  const handleRandomImage = useCallback(async () => {
    setIsLoadingRandom(true);
    try {
      const { image, attribution } = await fetchRandomStockImage();
      onImageLoad(image, attribution);
    } catch (error) {
      console.error('Failed to load random image:', error);
    } finally {
      setIsLoadingRandom(false);
    }
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
          upload-zone rounded-2xl p-6 sm:p-12 text-center
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
            className="inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-muted mb-4 sm:mb-6"
          >
            {isDragging ? (
              <ImageIcon className="w-7 h-7 sm:w-10 sm:h-10 text-accent" />
            ) : (
              <Upload className="w-7 h-7 sm:w-10 sm:h-10 text-muted-foreground" />
            )}
          </motion.div>
          
          <h3 className="text-xl font-display font-semibold text-foreground mb-2">
            {isDragging ? 'Drop your image!' : 'Choose a Photo'}
          </h3>
          
          <p className="text-muted-foreground">
            Drag and drop an image, or click to browse
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            (stays on your device)
          </p>
          
          <div className="mt-6 flex justify-center">
            <span className="btn-gold px-6 py-3 rounded-xl font-medium inline-block">
              Choose Image
            </span>
          </div>
        </label>
        
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-sm text-muted-foreground mb-3">Or try a random image</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRandomImage}
            disabled={isLoadingRandom}
            className="btn-primary px-5 py-2.5 rounded-xl font-medium inline-flex items-center gap-2 disabled:opacity-50"
          >
            {isLoadingRandom ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Shuffle className="w-4 h-4" />
                Random Stock Image
              </>
            )}
          </motion.button>
          <p className="text-xs text-muted-foreground mt-2">
            Free images from Lorem Picsum (CC licensed)
          </p>
        </div>
      </div>
    </motion.div>
  );
}
