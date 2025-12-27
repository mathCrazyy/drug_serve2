// 压缩图片
function compressImage(file: File, maxWidth: number = 1920, maxHeight: number = 1920, quality: number = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 计算压缩后的尺寸
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          } else {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建canvas上下文'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('图片压缩失败'));
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          },
          file.type,
          quality
        );
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function imageToBase64(file: File): Promise<string> {
  // 优化压缩策略：更激进的压缩以减少base64数据大小
  let processedFile = file;
  
  // 如果图片大于1MB，就开始压缩（降低阈值）
  if (file.size > 1 * 1024 * 1024) {
    try {
      // 第一轮压缩：1920x1920, 质量0.7
      processedFile = await compressImage(file, 1920, 1920, 0.7);
      
      // 如果压缩后仍然大于1.5MB，进一步压缩
      if (processedFile.size > 1.5 * 1024 * 1024) {
        processedFile = await compressImage(file, 1280, 1280, 0.6);
      }
      
      // 如果仍然大于1MB，最激进压缩
      if (processedFile.size > 1 * 1024 * 1024) {
        processedFile = await compressImage(file, 1024, 1024, 0.5);
      }
    } catch (e) {
      console.warn('图片压缩失败，使用原图:', e);
      processedFile = file;
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // 移除 data:image/...;base64, 前缀，只保留base64数据
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(processedFile);
  });
}

export function validateImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!validTypes.includes(file.type)) {
    return false;
  }
  
  if (file.size > maxSize) {
    return false;
  }
  
  return true;
}

