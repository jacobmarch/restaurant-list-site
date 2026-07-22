const VISIT_IMAGES_BUCKET = "visit-images";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function getVisitImageUrl(imagePath: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, "");
  return `${baseUrl}/storage/v1/object/public/${VISIT_IMAGES_BUCKET}/${imagePath}`;
}

export function validateVisitImage(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "Please choose a JPEG, PNG, or WebP image.";
  }

  return null;
}

export function visitImageStoragePath(visitId: string, file: File): string {
  const extension = file.type.split("/")[1] ?? "jpg";
  return `${visitId}/${crypto.randomUUID()}.${extension}`;
}

export { VISIT_IMAGES_BUCKET };
