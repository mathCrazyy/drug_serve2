import { useMemo } from 'react';
import type { HistoryRecord, DrugStatistics } from '../types';

interface DrugStatisticsProps {
  records: HistoryRecord[];
}

export function DrugStatistics({ records }: DrugStatisticsProps) {
  const stats = useMemo(() => {
    const statistics: DrugStatistics = {
      total: 0,
      expiring: 0,
      expired: 0,
      byCategory: {}
    };

    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    records.forEach(record => {
      if (record.saved && record.mergedData) {
        statistics.total++;
        
        const category = record.mergedData.category || record.category || '未分类';
        statistics.byCategory[category] = (statistics.byCategory[category] || 0) + 1;

        // 检查过期和临期
        if (record.mergedData.expiry_date) {
          const expiryDate = new Date(record.mergedData.expiry_date);
          if (expiryDate < now) {
            statistics.expired++;
          } else if (expiryDate <= thirtyDaysLater) {
            statistics.expiring++;
          }
        }
      }
    });

    return statistics;
  }, [records]);

  return (
    <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f7ff', borderRadius: '8px' }}>
      <h3 style={{ marginBottom: '15px' }}>药品统计</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '15px' }}>
        <div style={{ padding: '10px', backgroundColor: '#fff', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>{stats.total}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>总药品数</div>
        </div>
        
        {stats.expiring > 0 && (
          <div style={{ padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px', textAlign: 'center', border: '1px solid #ffc107' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9800' }}>{stats.expiring}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>临期药品</div>
            <div style={{ fontSize: '10px', color: '#ff9800', marginTop: '5px' }}>30天内过期</div>
          </div>
        )}
        
        {stats.expired > 0 && (
          <div style={{ padding: '10px', backgroundColor: '#f8d7da', borderRadius: '4px', textAlign: 'center', border: '1px solid #dc3545' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>{stats.expired}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>过期药品</div>
          </div>
        )}
      </div>

      {Object.keys(stats.byCategory).length > 0 && (
        <div>
          <h4 style={{ marginBottom: '10px', fontSize: '14px' }}>按分类统计</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {Object.entries(stats.byCategory).map(([category, count]) => (
              <div
                key={category}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#fff',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '12px'
                }}
              >
                <span style={{ fontWeight: 'bold' }}>{category}:</span> {count}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

