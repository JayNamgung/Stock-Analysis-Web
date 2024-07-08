import React from 'react';
import axios from 'axios';
import './UpdateButton.css';

const UpdateButton = ({ isUpdating, setIsUpdating }) => {
  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await axios.post('http://localhost:8000/api/v1/companies/update');
      alert('기업 목록이 성공적으로 업데이트되었습니다.');
    } catch (error) {
      console.error('Error updating companies:', error);
      alert('기업 목록 업데이트에 실패했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <button 
      className={`update-button ${isUpdating ? 'updating' : ''}`} 
      onClick={handleUpdate} 
      disabled={isUpdating}
    >
      {isUpdating ? '업데이트 중...' : '기업 목록 업데이트'}
    </button>
  );
};

export default UpdateButton;