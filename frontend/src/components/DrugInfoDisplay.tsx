import type { DrugInfo } from '../types';

interface DrugInfoDisplayProps {
  drugInfo: DrugInfo;
  loading?: boolean;
}

export function DrugInfoDisplay({ drugInfo, loading }: DrugInfoDisplayProps) {
  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>正在识别中...</p>
      </div>
    );
  }

  const fields = [
    { label: '药品名称', key: 'name' as keyof DrugInfo },
    { label: '品牌', key: 'brand' as keyof DrugInfo },
    { label: '生产厂家', key: 'manufacturer' as keyof DrugInfo },
    { label: '生产日期', key: 'production_date' as keyof DrugInfo },
    { label: '截止日期', key: 'expiry_date' as keyof DrugInfo },
    { label: '批号', key: 'batch_number' as keyof DrugInfo },
    { label: '剂型', key: 'dosage_form' as keyof DrugInfo },
    { label: '规格', key: 'strength' as keyof DrugInfo }
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
      <h3 style={{ marginBottom: '15px' }}>识别结果</h3>
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
      </div>
    </div>
  );
}

