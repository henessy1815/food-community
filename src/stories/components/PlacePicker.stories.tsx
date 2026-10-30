import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, waitFor, within } from 'storybook/test';
import { PlacePicker } from '@/components/place/PlacePicker';
import type { PlaceSearchItem } from '@/lib/place';
import type { NaverMaps } from '@/lib/naver-maps';

const RESULTS: PlaceSearchItem[] = [
  { name: '할머니 손칼국수', category: '한식 · 칼국수', address: '서울특별시 구로구 고척동 52-12', roadAddress: '서울특별시 구로구 고척로16길 29', lat: 37.5007, lng: 126.8625 },
  { name: '명동칼국수 구로점', category: '한식 · 칼국수,만두', address: '서울특별시 구로구 구로동 437-1', lat: 37.5031, lng: 126.8822 },
  { name: '오류동 바지락칼국수', category: '한식 · 칼국수', address: '서울특별시 구로구 오류동 31-5', lat: 37.4946, lng: 126.8447 },
  { name: '개봉동 손칼국수 공룡집', category: '한식 · 칼국수', address: '서울특별시 구로구 개봉동 170-8', lat: 37.4946, lng: 126.8555 },
  { name: '칼국수공방 온수점', category: '한식 · 국수', address: '서울특별시 구로구 온수동 64-2', lat: 37.4921, lng: 126.8233 },
];

/** BFF(/api/places/search · /api/places/reverse) 응답 흉내 — 검색어에 '칼국수'가 있으면 결과 5건, 아니면 0건 */
function mockSearch() {
  const original = window.fetch;
  window.fetch = (async (input: RequestInfo | URL) => {
    const url = new URL(String(input), window.location.origin);
    if (url.pathname === '/api/places/reverse') {
      // 서울시청 좌표면 시청 주소, 아니면 구로 주소
      return Response.json(
        url.searchParams.get('lat') === '37.5666103'
          ? { address: '서울특별시 중구 세종대로 110', building: '서울특별시청' }
          : { address: '서울 구로구 고척로16길 31' },
      );
    }
    if (url.pathname !== '/api/places/search') return original(input);
    const query = url.searchParams.get('query') ?? '';
    return Response.json({ items: query.includes('칼국수') ? RESULTS : [] });
  }) as typeof fetch;
  return () => {
    window.fetch = original;
  };
}

/** 네이버 지도 SDK 흉내 — 지도 이동(idle)을 테스트에서 직접 일으킨다 */
const fakeMap = { center: { lat: 0, lng: 0 }, listeners: {} as Record<string, () => void> };

function mockNaverMaps() {
  class LatLng {
    constructor(private y: number, private x: number) {}
    lat() { return this.y; }
    lng() { return this.x; }
  }
  class FakeMap {
    constructor(element: HTMLElement, options: { center: LatLng }) {
      fakeMap.center = { lat: options.center.lat(), lng: options.center.lng() };
      fakeMap.listeners = {};
      element.dataset.fakeMap = 'true';
    }
    getCenter() { return new LatLng(fakeMap.center.lat, fakeMap.center.lng); }
    destroy() {}
  }
  const maps = {
    Map: FakeMap,
    LatLng,
    Position: { TOP_RIGHT: 3, BOTTOM_RIGHT: 9 },
    Event: { addListener: (_map: unknown, name: string, listener: () => void) => (fakeMap.listeners[name] = listener) },
  } as unknown as NaverMaps;
  window.naver = { maps };
  return () => {
    delete window.naver;
  };
}

/** 지도를 끌어 중심을 옮긴 것처럼 dragstart → idle */
function dragMapTo(center: { lat: number; lng: number }) {
  fakeMap.listeners.dragstart?.();
  fakeMap.center = center;
  fakeMap.listeners.idle?.();
}

const meta = {
  title: 'Components/Place/PlacePicker',
  component: PlacePicker,
  tags: ['ai-generated'],
  parameters: { layout: 'fullscreen', nextjs: { appDirectory: true } },
  beforeEach: () => {
    const restoreFetch = mockSearch();
    const restoreMaps = mockNaverMaps();
    return () => {
      restoreFetch();
      restoreMaps();
    };
  },
  args: { initial: null, onClose: fn(), onSelect: fn() },
} satisfies Meta<typeof PlacePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

type User = { click: (el: Element) => Promise<void>; type: (el: Element, text: string) => Promise<void> };

const CITY_HALL = { lat: 37.5666103, lng: 126.9783882 };

/** 지도 화면이 열리고 SDK가 첫 idle을 일으킨 상태(핀 = 서울시청 주소)까지 */
const openMap = async (canvasElement: HTMLElement) => {
  const body = within(canvasElement.ownerDocument.body);
  await body.findByRole('region', { name: /위치 지도/ });
  fakeMap.listeners.idle?.();
  await body.findByText('서울특별시 중구 세종대로 110');
  return body;
};

/** 지도 화면 검색창 → 검색 화면에서 검색 */
const search = async (body: ReturnType<typeof within>, userEvent: User, text: string) => {
  await userEvent.click(body.getByRole('textbox', { name: '장소 검색' }));
  await userEvent.type(await body.findByRole('textbox', { name: '검색어 입력' }), `${text}{enter}`);
};

/** 처음엔 서울시청 지도 — 주소 확인 전엔 비활성화, 핀 위치 주소가 나오면 그 위치(건물명)로 등록 */
export const DefaultMap: Story = {
  play: async ({ canvasElement, args, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await expect(await body.findByRole('region', { name: /장소 위치 지도/ })).toBeVisible();
    await waitFor(() => expect(fakeMap.center).toEqual(CITY_HALL));
    await expect(body.getByRole('button', { name: '이 위치로 등록하기' })).toBeDisabled();
    await openMap(canvasElement);
    await userEvent.click(body.getByRole('button', { name: '이 위치로 등록하기' }));
    await expect(args.onSelect).toHaveBeenCalledWith({ name: '서울특별시청', address: '서울특별시 중구 세종대로 110', ...CITY_HALL });
  },
};

/** 검색창을 누르면 검색 화면 → 결과 선택 → 검색창엔 검색어, 주소엔 지번, 지도 중심은 선택한 위·경도 */
export const Results: Story = {
  play: async ({ canvasElement, args, userEvent }) => {
    const body = await openMap(canvasElement);
    await search(body, userEvent, '칼국수');
    await expect(await body.findByText('‘칼국수’ 검색 결과 5개')).toBeVisible();
    await userEvent.click(body.getByRole('button', { name: /할머니 손칼국수/ }));

    await expect(await body.findByRole('textbox', { name: '장소 검색' })).toHaveValue('칼국수');
    await expect(body.getByText('서울특별시 구로구 고척동 52-12')).toBeVisible();
    await waitFor(() => expect(fakeMap.center).toEqual({ lat: 37.5007, lng: 126.8625 }));
    await userEvent.click(body.getByRole('button', { name: '이 위치로 등록하기' }));
    await expect(args.onSelect).toHaveBeenCalledWith({
      name: '할머니 손칼국수',
      address: '서울특별시 구로구 고척동 52-12',
      lat: 37.5007,
      lng: 126.8625,
    });
  },
};

/** 결과 선택 후 지도를 움직이면 핀(지도 중심) 위치의 주소·좌표로 등록 — 장소명은 그대로 */
export const MoveMap: Story = {
  play: async ({ canvasElement, args, userEvent }) => {
    const body = await openMap(canvasElement);
    await search(body, userEvent, '칼국수');
    await userEvent.click(await body.findByRole('button', { name: /할머니 손칼국수/ }));
    await waitFor(() => expect(fakeMap.center).toEqual({ lat: 37.5007, lng: 126.8625 }));
    dragMapTo({ lat: 37.50081234567, lng: 126.86271234567 });
    await expect(await body.findByText('서울 구로구 고척로16길 31')).toBeVisible();
    await userEvent.click(body.getByRole('button', { name: '이 위치로 등록하기' }));
    await expect(args.onSelect).toHaveBeenCalledWith({
      name: '할머니 손칼국수',
      address: '서울 구로구 고척로16길 31',
      lat: 37.5008123,
      lng: 126.8627123,
    });
  },
};

/** 결과 없음 → 직접 등록 → 검색창엔 장소명, 주소·좌표는 지도에 선택돼 있던 서울시청 그대로 */
export const NoResults: Story = {
  play: async ({ canvasElement, args, userEvent }) => {
    const body = await openMap(canvasElement);
    await search(body, userEvent, '구로 할머니국수집');
    await expect(await body.findByText('검색 결과가 없어요')).toBeVisible();
    await expect(body.getByRole('textbox', { name: '장소명 *' })).toHaveValue('구로 할머니국수집');
    await userEvent.click(body.getByRole('button', { name: '이 이름으로 등록하기' }));

    await expect(await body.findByRole('textbox', { name: '장소 검색' })).toHaveValue('구로 할머니국수집');
    await expect(body.getByText('서울특별시 중구 세종대로 110')).toBeVisible();
    await waitFor(() => expect(fakeMap.center).toEqual(CITY_HALL));
    await userEvent.click(body.getByRole('button', { name: '이 위치로 등록하기' }));
    await expect(args.onSelect).toHaveBeenCalledWith({
      name: '구로 할머니국수집',
      address: '서울특별시 중구 세종대로 110',
      ...CITY_HALL,
    });
  },
};

/** 지도 화면의 "장소명 직접 입력" — 장소명을 비우면 등록 버튼 비활성화 */
export const ManualEntry: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(body.getByRole('button', { name: '장소명 직접 입력' }));
    await expect(body.getByRole('button', { name: '이 이름으로 등록하기' })).toBeDisabled();
    await userEvent.type(body.getByRole('textbox', { name: '장소명 *' }), '구로 할머니국수집');
    await expect(body.getByRole('button', { name: '이 이름으로 등록하기' })).toBeEnabled();
  },
};

/** 지도 SDK를 못 불러오면 안내 문구 */
export const MapUnavailable: Story = {
  beforeEach: () => {
    delete window.naver;
    // meta beforeEach의 검색 mock 위에 SDK 주소 실패를 덧씌운다
    const original = window.fetch;
    window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input), window.location.origin);
      if (url.pathname === '/api/places/map/sdk') return Response.json({ message: '지도를 불러오지 못했어요.' }, { status: 503 });
      return original(input, init);
    }) as typeof fetch;
    return () => {
      window.fetch = original;
    };
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await expect(await body.findByText('지도를 불러오지 못했어요')).toBeVisible();
  },
};

/** 장소명만 등록된 장소를 다시 선택 — 지도 + 검색창에 장소명 */
export const ReselectNameOnly: Story = {
  args: { initial: { name: '은행나무 손칼국수' } },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await expect(await body.findByRole('region', { name: /은행나무 손칼국수 위치 지도/ })).toBeVisible();
    await expect(body.getByRole('textbox', { name: '장소 검색' })).toHaveValue('은행나무 손칼국수');
  },
};

/** 검색 화면 뒤로가기 → 지도 화면, 지도 화면 뒤로가기 → 닫기 */
export const Close: Story = {
  play: async ({ canvasElement, args, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(body.getByRole('textbox', { name: '장소 검색' }));
    await body.findByRole('textbox', { name: '검색어 입력' });
    await userEvent.click(body.getByRole('button', { name: '뒤로가기' }));
    await expect(await body.findByRole('textbox', { name: '장소 검색' })).toBeVisible();
    await expect(args.onClose).not.toHaveBeenCalled();
    await userEvent.click(body.getByRole('button', { name: '뒤로가기' }));
    await expect(args.onClose).toHaveBeenCalled();
  },
};
