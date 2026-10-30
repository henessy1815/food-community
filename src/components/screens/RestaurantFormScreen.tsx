"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Icon } from "@/components/foundations/Icon";
import { BottomBar } from "@/components/layout/BottomBar";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlacePicker } from "@/components/place/PlacePicker";
import { PlaceSummary } from "@/components/place/PlaceSummary";
import { Button } from "@/components/ui/Button";
import { HelperText } from "@/components/ui/Field";
import { FileUploader, type UploadedFile } from "@/components/ui/FileUploader";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { TextField } from "@/components/ui/TextField";
import { Toast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import {
  CONTENT_MAX,
  CONTENT_MIN,
  PLACE_IMAGE_MAX_COUNT as MAX_PHOTOS,
  PLACE_IMAGE_MAX_MB as MAX_MB,
  PLACE_IMAGE_TYPES,
  TITLE_MAX,
  contentError,
  imageError,
  locationError,
  photoCountError,
  titleError,
  type PlaceErrorBody,
  type PlaceSavedBody,
} from "@/lib/place";
import { emptyFormValues, type RestaurantFormValues } from "@/lib/restaurant-form";

type FieldKey = "photos" | "title" | "content" | "location";

function validate(v: RestaurantFormValues): Partial<Record<FieldKey, string>> {
  const errors: Partial<Record<FieldKey, string>> = {};
  const hasInvalid = v.photos.some((p) => p.status === "error");
  const photosError = photoCountError(v.photos.filter((p) => p.status === "complete").length);
  if (hasInvalid) errors.photos = `JPG·PNG, ${MAX_MB}MB 이하 사진만 올릴 수 있어요. 표시된 사진을 지워주세요.`;
  else if (photosError) errors.photos = photosError;
  const tError = titleError(v.title);
  if (tError) errors.title = tError;
  const cError = contentError(v.content);
  if (cError) errors.content = cError;
  const lError = locationError(v.location);
  if (lError) errors.location = lError;
  return errors;
}

export function RestaurantFormScreen({
  mode,
  restaurantId,
  initialValues = emptyFormValues,
}: {
  mode: "create" | "edit";
  restaurantId?: string;
  initialValues?: RestaurantFormValues;
}) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [serverErrors, setServerErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  /** 새로 고른 사진 원본 — 제출할 때 BFF로 보낸다 (기존 사진은 id만 보냄) */
  const files = useRef(new Map<string, File>());

  const errors = { ...serverErrors, ...validate(values) };
  const visibleErrors = (Object.keys(errors) as FieldKey[]).filter((k) => touched[k]);
  const isValid = Object.keys(errors).length === 0;
  const dirty = JSON.stringify(values) !== JSON.stringify(initialValues);
  const errorOf = (k: FieldKey) => (touched[k] ? errors[k] : undefined);
  const set = <K extends keyof RestaurantFormValues>(key: K, value: RestaurantFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    // 키를 지워야 한다 — undefined 값으로 남기면 Object.keys에 잡혀 버튼이 계속 비활성화된다
    setServerErrors((e) => {
      const next = { ...e };
      delete next[key];
      return next;
    });
  };
  const touch = (k: FieldKey) => setTouched((t) => ({ ...t, [k]: true }));

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  // 작성 중 새로고침·탭 닫기 경고
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const addFiles = (picked: File[]) => {
    const slots = MAX_PHOTOS - values.photos.length;
    const added: UploadedFile[] = picked.slice(0, slots).map((file) => {
      const id = crypto.randomUUID();
      const mb = (file.size / 1024 / 1024).toFixed(1);
      const error = imageError(file);
      if (!error) files.current.set(id, file);
      return {
        id,
        name: file.name,
        thumbnailUrl: URL.createObjectURL(file),
        status: error ? "error" : "complete",
        meta: error ? `${mb}MB · ${error}` : `${mb}MB`,
      };
    });
    set("photos", [...values.photos, ...added]);
    touch("photos");
  };

  const removeFile = (id: string) => {
    files.current.delete(id);
    set("photos", values.photos.filter((p) => p.id !== id));
    touch("photos");
  };

  const exitHref = mode === "edit" && restaurantId ? `/restaurants/${restaurantId}` : "/";
  const leave = () => (window.history.length > 1 ? router.back() : router.push(exitHref));
  const onBack = () => (dirty ? setLeaveOpen(true) : leave());

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ photos: true, title: true, content: true, location: true });
    if (!isValid || saving) return;

    const body = new FormData();
    body.set("title", values.title.trim());
    body.set("content", values.content.trim());
    if (values.location) {
      const { name, address, lat, lng } = values.location;
      body.set("placeName", name);
      if (address && lat !== undefined && lng !== undefined) {
        body.set("address", address);
        body.set("lat", String(lat));
        body.set("lng", String(lng));
      }
    }
    for (const photo of values.photos) {
      const file = files.current.get(photo.id);
      if (file) body.append("photos", file);
      else if (photo.status === "complete") body.append("keep", photo.id);
    }

    setSaving(true);
    try {
      const res = await fetch(mode === "edit" ? `/api/places/${restaurantId}` : "/api/places", {
        method: mode === "edit" ? "PATCH" : "POST",
        body,
      });
      if (!res.ok) {
        const { field, message } = (await res.json()) as PlaceErrorBody;
        if (field) setServerErrors({ [field]: message });
        setToast(message);
        return;
      }
      const { id } = (await res.json()) as PlaceSavedBody;
      router.replace(`/restaurants/${id}`);
      router.refresh();
    } catch {
      setToast(mode === "edit" ? "맛집을 수정하지 못했어요." : "맛집을 등록하지 못했어요.");
    } finally {
      setSaving(false);
    }
  };

  const photoCount = values.photos.filter((p) => p.status !== "error").length;

  return (
    <form noValidate onSubmit={onSubmit} className="flex min-h-dvh flex-col">
      <PageHeader back onBack={onBack} title={mode === "edit" ? "맛집 수정" : "맛집 등록"} size="narrow" />

      <Container
        size="narrow"
        as="main"
        className="flex flex-1 flex-col gap-(--spacing-24) pt-(--spacing-8) pb-(--spacing-32)"
      >
        {visibleErrors.length > 0 && (
          <div
            role="alert"
            className="flex gap-(--spacing-12) rounded-[14px] border border-border-error bg-background-default p-(--spacing-16)"
          >
            <Icon name="error" size={20} className="text-text-error" />
            <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <p className="label-lg text-text-error">필수 항목 {visibleErrors.length}개를 확인해주세요</p>
              <p className="label-md text-text-error-strong">빨간색으로 표시된 항목을 채워야 등록할 수 있어요.</p>
            </div>
          </div>
        )}

        <div role="group" aria-labelledby="photo-label" className="flex flex-col gap-(--spacing-8)">
          <div className="flex items-center justify-between">
            <p id="photo-label" className="label-lg text-text-default">
              사진 *
            </p>
            <span className={cn("label-md", errorOf("photos") ? "text-text-error" : "text-text-tertiary")}>
              {photoCount} / {MAX_PHOTOS}
            </span>
          </div>
          <FileUploader
            files={values.photos}
            onFiles={addFiles}
            onRemove={removeFile}
            accept={PLACE_IMAGE_TYPES.join(",")}
            disabled={values.photos.length >= MAX_PHOTOS}
            helperText={`JPG · PNG, 장당 ${MAX_MB}MB 이하, 최대 ${MAX_PHOTOS}장`}
            errorMessage={errorOf("photos")}
          />
        </div>

        <TextField
          size="lg"
          label="맛집 이름 *"
          placeholder="가게 이름을 입력해주세요"
          maxLength={TITLE_MAX}
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          onBlur={() => touch("title")}
          helperText={`최대 ${TITLE_MAX}자 · ${values.title.length} / ${TITLE_MAX}`}
          errorMessage={errorOf("title")}
        />

        <Textarea
          label="맛집 내용 *"
          placeholder="주차, 아이 동반, 웨이팅 정보 등을 알려주세요"
          maxLength={CONTENT_MAX}
          showCounter
          value={values.content}
          onChange={(e) => set("content", e.target.value)}
          onBlur={() => touch("content")}
          helperText={`${CONTENT_MIN}자 이상 · 주차·아이 동반 정보가 있으면 큰 도움이 돼요`}
          errorMessage={errorOf("content")}
        />

        <div role="group" aria-labelledby="location-label" className="flex flex-col gap-(--spacing-8)">
          <p id="location-label" className="label-lg text-text-default">
            장소 *
          </p>
          {values.location && (
            <PlaceSummary
              title={values.location.address ?? values.location.name}
              description={
                values.location.address ? values.location.name : "주소·지도 위치 없이 장소명만 등록돼요"
              }
            />
          )}
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            iconLeft="map-pin"
            iconRight="chevron-right"
            onClick={() => setPickerOpen(true)}
          >
            {values.location ? "장소 다시 선택하기" : "장소 입력하기"}
          </Button>
          <HelperText error={errorOf("location")} />
        </div>

      </Container>

      <BottomBar>
        <Button type="submit" size="lg" fullWidth disabled={!isValid} loading={saving}>
          {mode === "edit" ? "수정 완료" : "등록하기"}
        </Button>
        {!isValid && <p className="label-md text-text-tertiary">필수 항목을 모두 채우면 버튼이 활성화돼요</p>}
      </BottomBar>

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[120px] z-40 flex justify-center px-(--spacing-16)">
          <Toast type="error">{toast}</Toast>
        </div>
      )}

      {pickerOpen && (
        <PlacePicker
          initial={values.location}
          onClose={() => {
            setPickerOpen(false);
            touch("location");
          }}
          onSelect={(location) => {
            set("location", location);
            setPickerOpen(false);
            touch("location");
          }}
        />
      )}

      <Modal
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title="작성한 내용이 사라져요"
        secondaryAction={{ label: "계속 작성", onClick: () => setLeaveOpen(false) }}
        primaryAction={{ label: "나가기", onClick: leave }}
      >
        지금 나가면 {mode === "edit" ? "수정한" : "작성한"} 내용이 저장되지 않아요. 그래도 나갈까요?
      </Modal>
    </form>
  );
}
