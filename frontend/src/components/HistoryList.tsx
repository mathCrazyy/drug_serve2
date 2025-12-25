import { useState, useEffect } from 'react';
import { getHistory, getRecordDetail } from '../services/api';
import type { HistoryRecord } from '../types';
import { DrugStatistics } from './DrugStatistics';

interface HistoryListProps {
  onRecordSelect?: (record: HistoryRecord) => void;
  refreshTrigger?: number; // 刷新触发器，当值变化时重新加载
}

export function HistoryList({ onRecordSelect, refreshTrigger }: HistoryListProps) {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const limit = 20;

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await getHistory(page, limit, search);
      if (response.success && response.data) {
        setRecords(response.data.records);
        setTotal(response.data.total);
      } else {
        console.error('加载历史记录失败:', response.error);
        setRecords([]);
        setTotal(0);
      }
    } catch (e) {
      console.error('加载历史记录失败:', e);
      setRecords([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [page, search, refreshTrigger]); // 添加 refreshTrigger 作为依赖

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleRecordClick = async (id: string) => {
    try {
      const response = await getRecordDetail(id);
      if (response.success && response.data && onRecordSelect) {
        onRecordSelect(response.data);
      }
    } catch (e) {
      console.error('加载记录详情失败:', e);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0 }}>家庭药品清单</h3>
        <button
          onClick={loadHistory}
          disabled={loading}
          style={{
            padding: '6px 12px',
            backgroundColor: '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '12px'
          }}
        >
          {loading ? '刷新中...' : '刷新'}
        </button>
      </div>
      
      <DrugStatistics records={records} />
      
      <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="搜索药品名称..."
          style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
        />
        <button
          onClick={handleSearch}
          style={{ padding: '8px 16px', backgroundColor: '#1890ff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          搜索
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>加载中...</div>
      ) : records.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>暂无历史记录</div>
      ) : (
        <>
          <div style={{ display: 'grid', gap: '10px' }}>
            {records.map((record) => (
              <div
                key={record.id}
                onClick={() => handleRecordClick(record.id)}
                style={{
                  padding: '15px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: '#fff'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 'bold' }}>{record.mergedData.name || '未知药品'}</span>
                  <span style={{ color: '#999', fontSize: '12px' }}>{formatDate(record.timestamp)}</span>
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {record.mergedData.production_date && (
                    <span style={{ marginRight: '15px' }}>生产日期: {record.mergedData.production_date}</span>
                  )}
                  {record.mergedData.expiry_date && (
                    <span>截止日期: {record.mergedData.expiry_date}</span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '5px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>
                    {record.mergedData.category && (
                      <span style={{ marginRight: '10px', padding: '2px 8px', backgroundColor: '#e6f7ff', borderRadius: '4px' }}>
                        {record.mergedData.category}
                      </span>
                    )}
                    {record.saved && <span style={{ color: '#52c41a' }}>✓ 已保存</span>}
                  </span>
                  <span>图片数量: {record.images.length}</span>
                </div>
                {/* 过期提醒 */}
                {record.mergedData.expiry_date && (() => {
                  const expiryDate = new Date(record.mergedData.expiry_date);
                  const now = new Date();
                  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  
                  if (expiryDate < now) {
                    return (
                      <div style={{ marginTop: '5px', padding: '5px', backgroundColor: '#f8d7da', color: '#dc3545', borderRadius: '4px', fontSize: '12px' }}>
                        ⚠️ 已过期
                      </div>
                    );
                  } else if (daysUntilExpiry <= 30) {
                    return (
                      <div style={{ marginTop: '5px', padding: '5px', backgroundColor: '#fff3cd', color: '#ff9800', borderRadius: '4px', fontSize: '12px' }}>
                        ⚠️ 临期（{daysUntilExpiry}天后过期）
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '4px', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
            >
              上一页
            </button>
            <span style={{ padding: '8px', lineHeight: '24px' }}>
              第 {page} 页 / 共 {Math.ceil(total / limit)} 页
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(total / limit)}
              style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '4px', cursor: page >= Math.ceil(total / limit) ? 'not-allowed' : 'pointer' }}
            >
              下一页
            </button>
          </div>
        </>
      )}
    </div>
  );
}

