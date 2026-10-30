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

/** POST /api/places — multipart: title · content(10자 이상) · placeName(필수) · address · lat · lng · photos(1~5장) */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail(401, { message: "로그인이 필요해요." });

  const input = readPlaceForm(await request.formData());
  if (!input.ok) return fail(400, input.error);

  const countError = photoCountError(input.files.length);
  if (countError) return fail(400, { field: "photos", message: countError });

  const paths = await uploadPlaceImages(supabase, input.files);
  if (!paths) return fail(500, { field: "photos", message: "사진을 올리지 못했어요." });

  const { data: place, error } = await supabase
    .from("place")
    .insert({
      title: input.title,
      content: input.content,
      ...locationColumns(input.location),
      user_id: user.id,
    })
    .select("id")
    .single();
  if (error) {
    await removePlaceImageFiles(supabase, paths);
    return fail(500, { message: "맛집을 등록하지 못했어요." });
  }

  const imageError = await insertPlaceImages(supabase, place.id, paths);
  if (imageError) {
    await supabase.from("place").delete().eq("id", place.id);
    await removePlaceImageFiles(supabase, paths);
    return fail(500, { field: "photos", message: "사진을 저장하지 못했어요." });
  }

  return NextResponse.json<PlaceSavedBody>({ id: place.id }, { status: 201 });
}
