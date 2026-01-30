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
      className="w-full max-w-lg mx-auto landscape-mobile:max-w-2xl"
    >
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          upload-zone rounded-2xl p-6 sm:p-12 text-center
          landscape-mobile:p-4 landscape-mobile:flex landscape-mobile:items-center landscape-mobile:gap-6 landscape-mobile:text-left
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
        <label htmlFor="file-upload" className="cursor-pointer block landscape-mobile:flex landscape-mobile:items-center landscape-mobile:gap-4 landscape-mobile:flex-1">
          <motion.div
            animate={isDragging ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 landscape-mobile:w-12 landscape-mobile:h-12 rounded-full bg-muted mb-4 sm:mb-6 landscape-mobile:mb-0 landscape-mobile:flex-shrink-0"
          >
            {isDragging ? (
              <ImageIcon className="w-7 h-7 sm:w-10 sm:h-10 landscape-mobile:w-6 landscape-mobile:h-6 text-accent" />
            ) : (
              <Upload className="w-7 h-7 sm:w-10 sm:h-10 landscape-mobile:w-6 landscape-mobile:h-6 text-muted-foreground" />
            )}
          </motion.div>
          
          <div className="landscape-mobile:flex-1">
            <h3 className="text-xl font-display font-semibold text-foreground mb-2 landscape-mobile:text-lg landscape-mobile:mb-1">
              {isDragging ? 'Drop your image!' : 'Choose a Photo'}
            </h3>
            
            <p className="text-muted-foreground landscape-mobile:text-sm">
              Drag and drop an image, or click to browse
            </p>
            <p className="text-sm text-muted-foreground mt-1 landscape-mobile:text-xs landscape-mobile:mt-0">
              (stays on your device)
            </p>
          </div>
          
          <div className="mt-6 flex justify-center landscape-mobile:mt-0">
            <span className="btn-gold px-6 py-3 rounded-xl font-medium inline-block landscape-mobile:px-4 landscape-mobile:py-2 landscape-mobile:text-sm">
              Choose Image
            </span>
          </div>
        </label>
        
        <div className="mt-4 pt-4 border-t border-border/50 landscape-mobile:mt-0 landscape-mobile:pt-0 landscape-mobile:border-t-0 landscape-mobile:border-l landscape-mobile:pl-6 landscape-mobile:flex landscape-mobile:flex-col landscape-mobile:items-center landscape-mobile:justify-center">
          <p className="text-sm text-muted-foreground mb-3 landscape-mobile:text-xs landscape-mobile:mb-2">Or try a random image</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRandomImage}
            disabled={isLoadingRandom}
            className="btn-primary px-5 py-2.5 rounded-xl font-medium inline-flex items-center gap-2 disabled:opacity-50 landscape-mobile:px-3 landscape-mobile:py-1.5 landscape-mobile:text-sm"
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
          <p className="text-xs text-muted-foreground mt-2 landscape-mobile:mt-1 landscape-mobile:text-[10px]">
            Free images from Lorem Picsum (CC licensed)
          </p>
        </div>
      </div>
    </motion.div>
  );
}
