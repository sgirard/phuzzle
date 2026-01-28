export interface StockImageInfo {
  id: string;
  author: string;
  url: string;
  download_url: string;
  width: number;
  height: number;
}

export async function fetchRandomStockImage(): Promise<{ image: HTMLImageElement; attribution: StockImageInfo }> {
  // Fetch a random image ID from Lorem Picsum
  // Lorem Picsum sources images from Unsplash photographers and provides attribution
  const randomId = Math.floor(Math.random() * 1000) + 1;
  
  // Get image info for attribution
  const infoResponse = await fetch(`https://picsum.photos/id/${randomId}/info`);
  
  if (!infoResponse.ok) {
    throw new Error('Failed to fetch image info');
  }
  
  const imageInfo: StockImageInfo = await infoResponse.json();
  
  // Load the image
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      resolve({ image: img, attribution: imageInfo });
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load stock image'));
    };
    
    // Use a good resolution for puzzles
    img.src = `https://picsum.photos/id/${randomId}/1920/1280`;
  });
}
