import { useState } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ImagePreview } from './components/ImagePreview';
import { DrugInfoDisplay } from './components/DrugInfoDisplay';
import { HistoryList } from './components/HistoryList';
import { recognizeDrug, saveDrug } from './services/api';
import type { DrugInfo, HistoryRecord } from './types';
import './App.css';

function App() {
  const [selectedImages, setSelectedImages] = useState<Array<{ base64: string; name: string; type: string; file: File }>>([]);
  const [recognizing, setRecognizing] = useState(false);
  const [drugInfo, setDrugInfo] = useState<DrugInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0); // 用于触发历史记录刷新

  const handleImagesSelected = (images: Array<{ base64: string; name: string; type: string; file: File }>) => {
    setSelectedImages(prev => [...prev, ...images]);
    setError(null);
    setDrugInfo(null);
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleRecognize = async () => {
    if (selectedImages.length === 0) {
      setError('请至少选择一张图片');
      return;
    }

    setRecognizing(true);
    setError(null);
    setDrugInfo(null);

    try {
      const images = selectedImages.map(img => ({
        base64: img.base64,
        name: img.name,
        type: img.type
      }));

      const response = await recognizeDrug(images);

      if (response.success && response.data) {
        setDrugInfo(response.data.mergedData);
        // 不清空图片，允许继续上传
        // setSelectedImages([]);
        setShowHistory(false);
      } else {
        setError(response.error || '识别失败');
      }
    } catch (e) {
      setError(`识别失败: ${e instanceof Error ? e.message : '未知错误'}`);
    } finally {
      setRecognizing(false);
    }
  };

  const handleRecordSelect = (record: HistoryRecord) => {
    setSelectedRecord(record);
    setDrugInfo(record.mergedData);
    setShowHistory(false);
  };

  const handleSaveDrug = async (editedInfo: DrugInfo) => {
    try {
      const response = await saveDrug(editedInfo, selectedRecord?.id);
      if (response.success) {
        setError(null);
        // 显示成功提示
        alert('已保存到家庭药品清单');
        // 清空当前识别结果，允许继续上传
        setDrugInfo(null);
        setSelectedImages([]);
        setSelectedRecord(null);
        // 触发历史记录刷新
        setHistoryRefreshTrigger(prev => prev + 1);
      } else {
        setError(response.error || '保存失败');
      }
    } catch (e) {
      setError(`保存失败: ${e instanceof Error ? e.message : '未知错误'}`);
    }
  };
  
  const handleQuickSave = async (drugInfo: DrugInfo) => {
    // 快速保存（不编辑，直接保存）
    await handleSaveDrug(drugInfo);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>药品识别系统</h1>
        <div className="header-actions">
          <button
            onClick={() => {
              const newShowHistory = !showHistory;
              setShowHistory(newShowHistory);
              setSelectedRecord(null);
              setDrugInfo(null);
              // 当切换到历史记录页面时，触发刷新
              if (newShowHistory) {
                setHistoryRefreshTrigger(prev => prev + 1);
              }
            }}
            className="btn-secondary"
          >
            {showHistory ? '返回识别' : '查看家庭药品清单'}
          </button>
        </div>
      </header>

      <main className="app-main">
        {showHistory ? (
          <HistoryList 
            onRecordSelect={handleRecordSelect} 
            refreshTrigger={historyRefreshTrigger}
          />
        ) : (
          <>
            <div className="upload-section">
              <ImageUploader
                onImagesSelected={handleImagesSelected}
                disabled={recognizing}
              />
              
              {selectedImages.length > 0 && (
                <>
                  <ImagePreview
                    images={selectedImages}
                    onRemove={handleRemoveImage}
                  />
                  <div className="action-buttons">
                    <button
                      onClick={handleRecognize}
                      disabled={recognizing}
                      className="btn-primary"
                    >
                      {recognizing ? '识别中...' : '开始识别'}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedImages([]);
                        setDrugInfo(null);
                        setError(null);
                      }}
                      disabled={recognizing}
                      className="btn-secondary"
                    >
                      清空
                    </button>
                  </div>
                </>
              )}
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {drugInfo && (
              <>
                <DrugInfoDisplay 
                  drugInfo={drugInfo} 
                  loading={recognizing}
                  onSave={handleQuickSave}
                  showEdit={true}
                />
                {/* 识别后仍可继续上传 */}
                <div style={{ marginTop: '20px' }}>
                  <ImageUploader
                    onImagesSelected={handleImagesSelected}
                    disabled={recognizing}
                  />
                </div>
              </>
            )}

            {selectedRecord && (
              <div className="selected-record-info">
                <h3>历史记录详情</h3>
                <p>识别时间: {new Date(selectedRecord.timestamp).toLocaleString('zh-CN')}</p>
                <p>图片数量: {selectedRecord.images.length}</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;

