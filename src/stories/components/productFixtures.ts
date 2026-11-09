import type { Order, Product } from '@/lib/products';

/** 스토리용 강연·모임 상품 — 디자인(design.pen 15~27) 데이터 */
export const gukbapTour: Product = {
  id: 'gwangmyeong-gukbap-tour',
  category: '맛집 투어 모임',
  title: '광명 숨은 국밥 투어',
  summary: '운영팀이 직접 다녀온 광명 국밥집 3곳을 이웃과 함께 걸으며 맛봐요.',
  description: '블로그엔 잘 안 나오지만 동네 사람들은 줄 서는 광명 국밥집 3곳을 돌아요.',
  bannerImage: { src: '/images/gukbap-tour.jpg', alt: '광명 숨은 국밥 투어 배너' },
  photos: [
    { src: '/images/gukbap-tour.jpg', alt: '국밥집이 모인 광명 골목 풍경' },
    { src: '/images/gukbap-bowl.jpg', alt: '파를 듬뿍 올린 뽀얀 돼지국밥' },
    { src: '/images/gukbap-ttukbaegi.jpg', alt: '반찬을 곁들인 뚝배기 국밥 한 상' },
  ],
  startsAt: '2026-11-21T11:00:00+09:00',
  endsAt: '2026-11-21T13:30:00+09:00',
  address: '광명시 철산동 · 철산역 2번 출구 앞',
  region: '광명 철산역',
  meetingSpot: '철산역',
  parking: '철산역 공영주차장 (주차비 개인 부담)',
  price: 25000,
  maxSeats: 12,
  seats: 8,
  refundDeadline: '2026-11-18T23:59:59+09:00',
  schedule: [{ time: '11:00', description: '철산역 2번 출구 모임 · 인사' }],
  includes: ['포함 · 국밥집 3곳 시식비, 운영팀 가이드'],
  status: 'on_sale',
  myOrder: null,
};

export const manduClass: Product = {
  ...gukbapTour,
  id: 'bucheon-mandu-class',
  category: '맛집 체험 모임',
  title: '부천 시장 만두 빚기 모임',
  bannerImage: { src: '/images/mandu.jpg', alt: '부천 시장 만두 빚기 모임 배너' },
  photos: [{ src: '/images/mandu.jpg', alt: '갓 쪄낸 수제 고기만두' }],
  startsAt: '2026-11-14T10:00:00+09:00',
  endsAt: '2026-11-14T12:00:00+09:00',
  region: '부천 심곡동',
  price: 30000,
  maxSeats: 10,
  seats: 7,
  refundDeadline: '2026-11-11T23:59:59+09:00',
};

export const kalguksuTalk: Product = {
  ...gukbapTour,
  id: 'oryu-kalguksu-talk',
  category: '사장님 강연',
  title: '오류동 칼국수 40년 이야기',
  bannerImage: { src: '/images/kalguksu.jpg', alt: '오류동 칼국수 40년 이야기 배너' },
  photos: [{ src: '/images/kalguksu.jpg', alt: '바지락 칼국수' }],
  startsAt: '2026-11-06T19:30:00+09:00',
  endsAt: '2026-11-06T21:00:00+09:00',
  region: '구로 오류동',
  price: 15000,
  maxSeats: 16,
  seats: 16,
  refundDeadline: '2026-11-03T23:59:59+09:00',
  status: 'closed',
};

export const soldOut: Product = { ...gukbapTour, seats: 12, status: 'closed' };

/** product 테이블 컬럼만 채운 상품 — 선택 항목(카테고리·요약·주차·진행 순서 등)이 없을 때 */
export const dbProduct: Product = {
  id: 'ccff1c3f-99c2-40c6-90a1-34b06878446b',
  title: '심심한 주말 놓치기 아까운 기회',
  description: '주말에 함께 요리하거나 맛집을 탐방하는 과정입니다.\n초보자도 참여 가능해요!',
  bannerImage: { src: '/images/sample-food.png', alt: '심심한 주말 놓치기 아까운 기회 배너' },
  photos: [{ src: '/images/sample-food.png', alt: '심심한 주말 놓치기 아까운 기회' }],
  startsAt: '2026-11-21T10:00:00+09:00',
  address: '서울특별시 강동구 고덕로 강일동 요리센터 2층',
  price: 30000,
  maxSeats: 20,
  seats: 3,
  refundDeadline: '2026-11-18T23:59:59+09:00',
  status: 'on_sale',
  myOrder: null,
};

const baseOrder: Order = {
  id: 'order-1',
  orderNo: '20261102-0001',
  product: gukbapTour,
  amount: 25000,
  method: '신한카드 · 일시불',
  status: 'paid',
  paidAt: '2026-11-02T10:12:00+09:00',
  attended: false,
  cancelable: true,
};

export const paidOrder = baseOrder;

export const lockedOrder: Order = {
  ...baseOrder,
  id: 'order-2',
  product: kalguksuTalk,
  amount: 15000,
  paidAt: '2026-10-28T20:12:00+09:00',
  cancelable: false,
};

export const attendedOrder: Order = {
  ...baseOrder,
  id: 'order-3',
  product: {
    ...gukbapTour,
    title: '항동 빵지순례 산책',
    photos: [{ src: '/images/bakery.jpg', alt: '항동 빵집의 소금빵' }],
    startsAt: '2026-10-17T14:00:00+09:00',
    region: '구로 항동',
  },
  amount: 20000,
  paidAt: '2026-10-02T09:41:00+09:00',
  attended: true,
  cancelable: false,
};

export const refundingOrder: Order = {
  ...baseOrder,
  id: 'order-4',
  product: manduClass,
  amount: 30000,
  status: 'refunding',
  canceledAt: '2026-11-01T18:20:00+09:00',
  cancelable: false,
};

export const refundedOrder: Order = {
  ...baseOrder,
  id: 'order-5',
  product: {
    ...gukbapTour,
    title: '광명 닭갈비 골목 투어',
    photos: [{ src: '/images/dakgalbi.jpg', alt: '숯불 닭갈비' }],
    startsAt: '2026-10-24T12:00:00+09:00',
    region: '광명 일직동',
  },
  status: 'refunded',
  canceledAt: '2026-10-12T21:02:00+09:00',
  refundedAt: '2026-10-15T10:00:00+09:00',
  cancelable: false,
};
