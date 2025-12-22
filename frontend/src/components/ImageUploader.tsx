import { useState, useRef } from 'react';
import { imageToBase64, validateImageFile } from '../utils/imageUtils';

interface ImageUploaderProps {
  onImagesSelected: (images: Array<{ base64: string; name: string; type: string; file: File }>) => void;
  disabled?: boolean;
}

export function ImageUploader({ onImagesSelected, disabled }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (validateImageFile(file)) {
        validFiles.push(file);
      } else {
        alert(`文件 ${file.name} 格式不支持或文件过大（最大10MB）`);
      }
    }

    if (validFiles.length === 0) return;

    // 转换为base64
    const imagePromises = validFiles.map(async (file) => {
      const base64 = await imageToBase64(file);
      return {
        base64,
        name: file.name,
        type: file.type,
        file
      };
    });

    const images = await Promise.all(imagePromises);
    onImagesSelected(images);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`image-uploader ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={disabled ? undefined : handleClick}
      style={{
        border: '2px dashed #ccc',
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: isDragging ? '#f0f0f0' : '#fff',
        opacity: disabled ? 0.6 : 1
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        capture="environment"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />
      <div>
        <p style={{ fontSize: '18px', marginBottom: '10px' }}>
          {isDragging ? '松开以上传图片' : '点击或拖拽图片到这里上传'}
        </p>
        <p style={{ color: '#666', fontSize: '14px' }}>
          支持手机拍照或从本地选择，可同时上传多张图片
        </p>
      </div>
    </div>
  );
}

