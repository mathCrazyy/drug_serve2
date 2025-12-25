import { useState, useEffect } from 'react';
import type { DrugInfo } from '../types';

interface DrugInfoEditorProps {
  drugInfo: DrugInfo;
  onSave: (editedInfo: DrugInfo) => void;
  onCancel?: () => void;
}

// 药品分类选项
const DRUG_CATEGORIES = [
  '感冒',
  '发烧',
  '止痛',
  '消炎',
  '消化',
  '心血管',
  '皮肤',
  '维生素',
  '其他'
];

export function DrugInfoEditor({ drugInfo, onSave, onCancel }: DrugInfoEditorProps) {
  const [editedInfo, setEditedInfo] = useState<DrugInfo>({ ...drugInfo });
  const [category, setCategory] = useState(drugInfo.category || '');

  useEffect(() => {
    setEditedInfo({ ...drugInfo });
    setCategory(drugInfo.category || '');
  }, [drugInfo]);

  const handleFieldChange = (key: keyof DrugInfo, value: string) => {
    setEditedInfo(prev => ({ ...prev, [key]: value, edited: true }));
  };

  const handleSave = () => {
    const finalInfo = { ...editedInfo, category };
    onSave(finalInfo);
  };

  const fields = [
    { label: '药品名称', key: 'name' as keyof DrugInfo },
    { label: '生产日期', key: 'production_date' as keyof DrugInfo },
    { label: '截止日期', key: 'expiry_date' as keyof DrugInfo }
  ];

  return (
    <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
      <h3 style={{ marginBottom: '15px' }}>编辑药品信息</h3>
      
      <div style={{ display: 'grid', gap: '15px' }}>
        {fields.map(field => (
          <div key={field.key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontWeight: 'bold', minWidth: '100px', color: '#666' }}>
              {field.label}:
            </label>
            <input
              type="text"
              value={editedInfo[field.key] || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              style={{
                flex: 1,
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
        ))}

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontWeight: 'bold', minWidth: '100px', color: '#666' }}>
            药品分类:
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              flex: 1,
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="">请选择分类</option>
            {DRUG_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              backgroundColor: '#fff',
              color: '#666',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            取消
          </button>
        )}
        <button
          onClick={handleSave}
          style={{
            padding: '10px 20px',
            backgroundColor: '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          保存到家庭药品清单
        </button>
      </div>
    </div>
  );
}

