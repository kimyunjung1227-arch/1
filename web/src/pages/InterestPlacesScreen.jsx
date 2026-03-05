import React from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import InterestPlacesContent from '../components/InterestPlacesContent';

const InterestPlacesScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="screen-layout bg-background-light dark:bg-background-dark">
      <div className="screen-content">
        {/* 상단 헤더 - 다른 화면과 동일한 패턴 */}
        <header className="screen-header bg-white dark:bg-gray-900 flex items-center p-4 justify-between shadow-sm">
          <BackButton ariaLabel="관심 지역 설정 닫기" />
          <h1 className="flex-1 text-center text-base font-semibold text-text-primary-light dark:text-text-primary-dark pr-10">
            관심 지역 설정
          </h1>
          <button
            type="button"
            aria-label="닫기"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center text-text-secondary-light dark:text-text-secondary-dark"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </header>

        {/* 본문: 모바일 화면 높이에 맞게 패딩만 조정 */}
        <main className="screen-body px-4 pt-3">
          <InterestPlacesContent compact={false} />
        </main>
      </div>
    </div>
  );
};

export default InterestPlacesScreen;
