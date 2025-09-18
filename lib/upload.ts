import axios from "axios";

export type AiResult = any;

export async function uploadImage(uri: string): Promise<AiResult> {
  const ext = uri.split(".").pop()?.toLowerCase();
  const type =
    ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

  const form = new FormData();
  form.append("image", {
    uri,
    name: `upload.${ext ?? "jpg"}`,
    type,
  } as any);

  const { data } = await axios.post(
    "https://2322918ec24d.ngrok-free.app/upload_image",
    form,
    { headers: { "Content-Type": "multipart/form-data" }, timeout: 60000 }
  );
  return data;
}
