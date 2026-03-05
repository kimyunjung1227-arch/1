import React, { useState, useEffect, useCallback } from 'react';
import { getInterestPlaces, toggleInterestPlace } from '../utils/interestPlaces';
import { getRecommendedRegions } from '../utils/recommendationEngine';
import { getCombinedPosts } from '../utils/mockData';
import { getRegionDefaultImage } from '../utils/regionDefaultImages';
import { getDisplayImageUrl } from '../api/upload';

const InterestPlacesContent = ({ compact = false }) => {
  const [inputValue, setInputValue] = useState('');
  const [interestList, setInterestList] = useState([]);
  const [popularRegions, setPopularRegions] = useState([]);

  const loadInterestPlaces = useCallback(() => {
    setInterestList(getInterestPlaces() || []);
  }, []);

  const loadPopularRegions = useCallback(() => {
    const localPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
    const combined = getCombinedPosts(Array.isArray(localPosts) ? localPosts : []);
    setPopularRegions(getRecommendedRegions(combined, 'active'));
  }, []);

  useEffect(() => {
    loadInterestPlaces();
    loadPopularRegions();
  }, [loadInterestPlaces, loadPopularRegions]);

  const handleAddByInput = () => {
    const name = inputValue.trim().replace(/\s+/g, ' ').slice(0, 30);
    if (!name) return;
    if (toggleInterestPlace(name)) {
      setInputValue('');
      loadInterestPlaces();
      window.dispatchEvent(new CustomEvent('interestPlaceChanged', { detail: { place: name, enabled: true } }));
    }
  };

  const handleRemove = (name) => {
    toggleInterestPlace(name);
    loadInterestPlaces();
    window.dispatchEvent(new CustomEvent('interestPlaceChanged', { detail: { place: name, enabled: false } }));
  };

  const handleTogglePopular = (item) => {
    const name = item.regionName || item.title || item.name;
    if (!name) return;
    toggleInterestPlace(name);
    loadInterestPlaces();
    window.dispatchEvent(new CustomEvent('interestPlaceChanged', { detail: { place: name, enabled: true } }));
  };

  const isInterest = (name) =>
    interestList.some((p) => p.name === name || (p.name && name.includes(p.name)) || (name && p.name.includes(name)));

  const getRegionImage = (item) => {
    const raw = item.image || item.representativeImage;
    if (raw) return getDisplayImageUrl(raw);
    return getRegionDefaultImage(item.regionName || item.title || item.name);
  };

  const inputCls = compact
    ? 'flex-1 min-w-0 h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30'
    : 'flex-1 min-w-0 h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-background-light dark:bg-background-dark text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary';
  const btnCls = compact
    ? 'shrink-0 h-9 px-3 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90'
    : 'shrink-0 h-11 px-4 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 active:opacity-90';
  const sectionCls = compact ? 'pb-3' : 'pb-5';
  const labelCls = compact ? 'text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5' : 'text-sm font-medium text-gray-600 dark:text-gray-400 mb-2';
  const listItemCls = compact ? 'gap-2 p-2 rounded-lg' : 'gap-3 p-3 rounded-xl';
  const thumbSize = compact ? 'w-10 h-10' : 'w-12 h-12';

  return (
    <>
      <section className={sectionCls}>
        <label className={`block ${labelCls}`}>지역 직접 입력</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddByInput()}
            placeholder="예: 서울, 강남구, 제주"
            className={inputCls}
          />
          <button type="button" onClick={handleAddByInput} className={btnCls}>
            추가
          </button>
        </div>
      </section>

      <section className={sectionCls}>
        <h2 className={`${labelCls} ${compact ? 'mb-2' : 'mb-3'}`}>
          내 관심 지역 {interestList.length > 0 && `(${interestList.length})`}
        </h2>
        {interestList.length === 0 ? (
          <p className={compact ? 'text-xs text-gray-400 py-1' : 'text-sm text-gray-400 dark:text-gray-500 py-2'}>
            지역을 입력하거나 아래 인기 지역을 눌러 추가하세요.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {interestList.map((place) => (
              <span
                key={place.name}
                className="inline-flex items-center gap-0.5 px-2 py-px rounded-full bg-background-light dark:bg-background-dark border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 shadow-sm leading-none"
              >
                {place.name}
                <button
                  type="button"
                  onClick={() => handleRemove(place.name)}
                  className="p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                  aria-label={`${place.name} 제거`}
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className={`${labelCls} ${compact ? 'mb-2' : 'mb-3'}`}>인기 지역</h2>
        {popularRegions.length === 0 ? (
          <p className={compact ? 'text-xs text-gray-400 py-2' : 'text-sm text-gray-500 dark:text-gray-500 py-4'}>
            최근 게시물이 있는 지역이 여기에 표시됩니다.
          </p>
        ) : (
          <ul className={compact ? 'space-y-1.5' : 'space-y-2'}>
            {popularRegions.map((item) => {
              const name = item.regionName || item.title || item.name;
              const selected = isInterest(name);
              const imgUrl = getRegionImage(item);
              return (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() => handleTogglePopular(item)}
                    className={`w-full flex items-center ${listItemCls} border text-left transition-colors ${
                      selected
                        ? 'bg-primary/10 border-primary/30 dark:bg-primary/20 dark:border-primary/40'
                        : 'bg-background-light dark:bg-background-dark border-gray-200 dark:border-gray-600 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className={`${thumbSize} rounded-lg overflow-hidden shrink-0 bg-gray-200 dark:bg-gray-600`}>
                      <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className={`flex-1 text-sm font-medium ${selected ? 'text-primary' : 'text-gray-800 dark:text-gray-200'}`}>
                      {name}
                    </span>
                    {item.badge && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">{item.badge}</span>
                    )}
                    {selected && (
                      <span className="material-symbols-outlined text-primary text-xl shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                        check_circle
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
};

export default InterestPlacesContent;
