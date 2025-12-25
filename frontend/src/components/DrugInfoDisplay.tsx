import { useState } from 'react';
import type { DrugInfo } from '../types';
import { DrugInfoEditor } from './DrugInfoEditor';

interface DrugInfoDisplayProps {
  drugInfo: DrugInfo;
  loading?: boolean;
  onSave?: (editedInfo: DrugInfo) => void;
  showEdit?: boolean;
}

export function DrugInfoDisplay({ drugInfo, loading, onSave, showEdit = true }: DrugInfoDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>正在识别中...</p>
      </div>
    );
  }

  if (isEditing && onSave) {
    return (
      <DrugInfoEditor
        drugInfo={drugInfo}
        onSave={(editedInfo) => {
          onSave(editedInfo);
          setIsEditing(false);
        }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  // 只显示三个字段：药品名称、生产日期、截止日期
  const fields = [
    { label: '药品名称', key: 'name' as keyof DrugInfo },
    { label: '生产日期', key: 'production_date' as keyof DrugInfo },
    { label: '截止日期', key: 'expiry_date' as keyof DrugInfo }
  ];

  const hasData = fields.some(field => drugInfo[field.key]);

  if (!hasData) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
        <p>未识别到药品信息</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0 }}>识别结果</h3>
        {showEdit && onSave && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => onSave(drugInfo)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#52c41a',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              保存
            </button>
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#1890ff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              编辑
            </button>
          </div>
        )}
      </div>
      
      <div style={{ display: 'grid', gap: '10px' }}>
        {fields.map(field => {
          const value = drugInfo[field.key];
          if (!value) return null;
          
          return (
            <div key={field.key} style={{ display: 'flex', padding: '8px', backgroundColor: '#fff', borderRadius: '4px' }}>
              <span style={{ fontWeight: 'bold', minWidth: '100px', color: '#666' }}>{field.label}:</span>
              <span style={{ flex: 1 }}>{value}</span>
            </div>
          );
        })}
        {drugInfo.category && (
          <div style={{ display: 'flex', padding: '8px', backgroundColor: '#fff', borderRadius: '4px' }}>
            <span style={{ fontWeight: 'bold', minWidth: '100px', color: '#666' }}>分类:</span>
            <span style={{ flex: 1 }}>{drugInfo.category}</span>
          </div>
        )}
      </div>
    </div>
  );
}

