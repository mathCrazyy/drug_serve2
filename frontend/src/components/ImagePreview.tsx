interface ImagePreviewProps {
  images: Array<{ base64: string; name: string; type: string }>;
  onRemove?: (index: number) => void;
}

export function ImagePreview({ images, onRemove }: ImagePreviewProps) {
  if (images.length === 0) return null;

  return (
    <div style={{ marginTop: '20px' }}>
      <h3 style={{ marginBottom: '10px' }}>已选择图片 ({images.length})</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
        {images.map((img, index) => (
          <div key={index} style={{ position: 'relative', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
            <img
              src={`data:${img.type};base64,${img.base64}`}
              alt={img.name}
              style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }}
            />
            {onRemove && (
              <button
                onClick={() => onRemove(index)}
                style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  background: 'rgba(255, 0, 0, 0.7)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  lineHeight: '1'
                }}
              >
                ×
              </button>
            )}
            <div style={{ padding: '5px', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {img.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

