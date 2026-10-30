import { NextResponse } from "next/server";
import { photoCountError, type PlaceErrorBody, type PlaceSavedBody } from "@/lib/place";
import {
  insertPlaceImages,
  locationColumns,
  readPlaceForm,
  removePlaceImageFiles,
  uploadPlaceImages,
} from "@/lib/places";
import { createClient } from "@/lib/supabase/server";

function fail(status: number, body: PlaceErrorBody) {
  return NextResponse.json(body, { status });
}

/**
 * PATCH /api/places/[id] — multipart: title · content · placeName · address · lat · lng · keep(유지할 place_image.id, 여러 개) · photos(새 사진)
 * 유지 + 새 사진이 1~5장이어야 한다. keep에 없는 기존 사진은 테이블·버킷에서 삭제한다.
 */
export async function PATCH(request: Request, { params }: RouteContext<"/api/places/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail(401, { message: "로그인이 필요해요." });

  const { data: place } = await supabase
    .from("place")
    .select("user_id, place_image(id, image_path)")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!place) return fail(404, { message: "맛집을 찾을 수 없어요." });
  if (place.user_id !== user.id) return fail(403, { message: "내가 쓴 글만 수정할 수 있어요." });

  const form = await request.formData();
  const input = readPlaceForm(form);
  if (!input.ok) return fail(400, input.error);

  const keep = new Set(form.getAll("keep").map(String));
  const images = place.place_image as { id: string; image_path: string }[];
  const removed = images.filter((image) => !keep.has(image.id));

  const countError = photoCountError(images.length - removed.length + input.files.length);
  if (countError) return fail(400, { field: "photos", message: countError });

  const paths = await uploadPlaceImages(supabase, input.files);
  if (!paths) return fail(500, { field: "photos", message: "사진을 올리지 못했어요." });

  const rollback = async () => {
    if (paths.length === 0) return;
    await supabase.from("place_image").delete().eq("place_id", id).in("image_path", paths);
    await removePlaceImageFiles(supabase, paths);
  };

  if (paths.length > 0 && (await insertPlaceImages(supabase, id, paths))) {
    await removePlaceImageFiles(supabase, paths);
    return fail(500, { field: "photos", message: "사진을 저장하지 못했어요." });
  }

  const { error } = await supabase
    .from("place")
    .update({ title: input.title, content: input.content, ...locationColumns(input.location) })
    .eq("id", id);
  if (error) {
    await rollback();
    return fail(500, { message: "맛집을 수정하지 못했어요." });
  }

  if (removed.length > 0) {
    await supabase
      .from("place_image")
      .delete()
      .in(
        "id",
        removed.map((image) => image.id),
      );
    await removePlaceImageFiles(
      supabase,
      removed.map((image) => image.image_path),
    );
  }

  return NextResponse.json<PlaceSavedBody>({ id });
}

/**
 * DELETE /api/places/[id] — 소프트 삭제 (deleted_at 기록)
 * 사진 파일·place_image는 복구할 수 있도록 남겨 두고, 조회는 RLS(deleted_at is null)로 막는다.
 */
export async function DELETE(_request: Request, { params }: RouteContext<"/api/places/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail(401, { message: "로그인이 필요해요." });

  const { data: place } = await supabase
    .from("place")
    .select("user_id")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!place) return fail(404, { message: "맛집을 찾을 수 없어요." });
  if (place.user_id !== user.id) return fail(403, { message: "내가 쓴 글만 삭제할 수 있어요." });

  // SELECT 정책상 일반 UPDATE로는 deleted_at을 채울 수 없어 전용 함수(본인 글만 삭제)를 호출한다
  const { data: deleted, error } = await supabase.rpc("soft_delete_place", { p_place_id: id });
  if (error || !deleted) return fail(500, { message: "맛집을 삭제하지 못했어요." });

  return new NextResponse(null, { status: 204 });
}
