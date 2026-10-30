import type { UploadedFile } from "@/components/ui/FileUploader";
import type { PlaceLocation } from "./place";
import type { Restaurant } from "./restaurants";

export interface RestaurantFormValues {
  /** 기존 사진은 id = place_image.id, 새 사진은 클라이언트에서 만든 임시 id */
  photos: UploadedFile[];
  title: string;
  content: string;
  location: PlaceLocation | null;
}

export const emptyFormValues: RestaurantFormValues = { photos: [], title: "", content: "", location: null };

/** 수정 화면 초기값 */
export function toFormValues(r: Restaurant): RestaurantFormValues {
  return {
    photos: r.photos.map((photo, i) => ({
      id: photo.id ?? photo.src,
      name: photo.src.split("/").pop() ?? `사진 ${i + 1}`,
      meta: "업로드 완료",
      status: "complete",
      thumbnailUrl: photo.src,
    })),
    title: r.name,
    content: r.body,
    location: r.placeName ? { name: r.placeName, address: r.address, lat: r.lat, lng: r.lng } : null,
  };
}
