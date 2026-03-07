/**
 * [라이브저니] 실시간 핫플 — 핫니스 엔진 (Hotness Engine)
 * "얼마나 뜨거운가?" — Hotness = (Time × Density) + Conversion
 * 이 수치가 높을수록 핫플 구역 상단 배치
 */

import { getPostAgeInHours } from './timeUtils';
import { getConversionCountByPost, getConversionCount } from './conversionEvents';
import { filterVerifiedPosts } from './hotspotVerification';

const getPostTimeMs = (post) => {
  const raw = post?.timestamp || post?.createdAt || post?.time;
  const t = raw ? new Date(raw).getTime() : NaN;
  return Number.isNaN(t) ? 0 : t;
};

const getPostCoords = (post) => {
  const c = post?.coordinates;
  if (c && (c.lat != null || c.latitude != null) && (c.lng != null || c.longitude != null)) {
    return { lat: Number(c.lat ?? c.latitude), lng: Number(c.lng ?? c.longitude) };
  }
  if (post?.location && typeof post.location === 'object') {
    const lat = post.location.lat ?? post.location.latitude;
    const lng = post.location.lng ?? post.location.lon ?? post.location.longitude;
    if (lat != null && lng != null) return { lat: Number(lat), lng: Number(lng) };
  }
  return null;
};

const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const RADIUS_KM = 0.5;
const DENSITY_WINDOW_MINUTES = 60;

/**
 * 시간 신선도 (Time)
 * 30분 이내 = 1.0, 1시간 = 0.5, 3시간 경과 시 0으로 수렴
 */
export const getTimeFreshness = (post) => {
  const ageHours = getPostAgeInHours(post?.timestamp || post?.createdAt);
  if (ageHours <= 0.5) return 1;
  if (ageHours >= 3) return 0;
  return 1 - (ageHours - 0.5) / 2.5;
};

/**
 * 밀도 (Density): 특정 반경 내 유사 장소 언급/피드 급증 시 가속
 */
const getDensityScore = (post, allPosts) => {
  const coords = getPostCoords(post);
  if (!coords) return 0.3;
  const now = Date.now();
  const windowMs = DENSITY_WINDOW_MINUTES * 60 * 1000;
  let count = 0;
  (allPosts || []).forEach((p) => {
    if (p.id === post.id) return;
    const pt = getPostTimeMs(p);
    if (now - pt > windowMs) return;
    const pc = getPostCoords(p);
    if (!pc) return;
    const dist = getDistanceKm(coords.lat, coords.lng, pc.lat, pc.lng);
    if (dist <= RADIUS_KM) count += 1;
  });
  const base = 0.2 + Math.min(1, count / 10) * 0.8;
  return base;
};

/**
 * 행동 전환 (Conversion): 길찾기/전화 등 클릭 비율 — 매출과 직결
 * 전환 횟수를 정규화하여 0~1 근사
 */
const getConversionScore = (postId, conversionMap, maxConversion) => {
  const n = conversionMap[postId] || 0;
  if (maxConversion <= 0) return n > 0 ? 0.5 : 0;
  return Math.min(1, n / Math.max(1, maxConversion));
};

/**
 * 단일 게시물 핫니스 점수
 * Hotness = (Time × Density) + Conversion
 */
export const computeHotness = (post, allPosts, conversionMap, maxConversion) => {
  const time = getTimeFreshness(post);
  const density = getDensityScore(post, allPosts);
  const conversion = getConversionScore(post.id, conversionMap || {}, maxConversion || 1);
  const hotness = time * density + conversion;
  return {
    hotness,
    time,
    density,
    conversion,
  };
};

/**
 * 검증 통과한 게시물에 대해 핫니스 계산 후 랭킹 정렬
 * @returns {Array<{ post, rank, hotness, timeFreshness, impactLabel }>}
 */
export const rankHotspotPosts = (posts, options = {}) => {
  const { verifyFirst = true, maxItems = 100 } = options;
  let list = Array.isArray(posts) ? [...posts] : [];
  if (verifyFirst) {
    list = filterVerifiedPosts(list, { minScore: 0.35, attachScore: true });
  }
  const postIds = list.map((p) => p.id).filter(Boolean);
  const conversionMap = getConversionCountByPost(postIds);
  const maxConversion = Math.max(1, ...Object.values(conversionMap));

  const withScore = list.map((post) => {
    const { hotness, time, conversion } = computeHotness(post, list, conversionMap, maxConversion);
    const likes = Number(post.likes ?? post.likeCount ?? 0) || 0;
    const commentsCount = Array.isArray(post.comments) ? post.comments.length : 0;
    const conversionCount = getConversionCount(post.id);
    return { post, hotness, timeFreshness: time, conversion, likes, commentsCount, conversionCount };
  });

  withScore.sort((a, b) => b.hotness - a.hotness);

  const ranked = withScore.slice(0, maxItems).map((item, index) => {
    const rank = index + 1;
    const impactLabel = getImpactLabel(item, rank);
    return {
      ...item,
      rank,
      impactLabel,
    };
  });

  return ranked;
};

/**
 * 임팩트 라벨: "이 정보 보고 N명 이동 중", "방금 올라옴" 등
 */
function getImpactLabel(item, rank) {
  const { post, timeFreshness, likes, conversionCount } = item;
  if (conversionCount > 0) return `이 정보 보고 ${Math.min(99, conversionCount)}명 이동 중`;
  if (timeFreshness >= 1) return '방금 올라옴';
  if (timeFreshness >= 0.7) return '방금 전';
  if (timeFreshness >= 0.3) return '최근 정보';
  if (likes >= 50) return '많은 사람이 참고했어요';
  if (rank <= 3) return `핫플 ${rank}위`;
  return null;
}
