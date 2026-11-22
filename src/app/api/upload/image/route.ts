import { type NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  formatBytes,
  MAX_IMAGE_SIZE_BYTES,
} from "@/lib/vendor-menu-validation";

const ALLOWED_MIME_SET = new Set<string>(ALLOWED_IMAGE_MIME_TYPES);

function matchesMagicBytes(mimeType: string, bytes: Uint8Array): boolean {
  if (mimeType === "image/jpeg") {
    return (
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    );
  }

  if (mimeType === "image/png") {
    return (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }

  if (mimeType === "image/webp") {
    if (bytes.length < 12) return false;
    const riff =
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46;
    const webp =
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50;
    return riff && webp;
  }

  return false;
}

function sanitizeImageFilename(rawName: string): string {
  const stem = rawName.replace(/\.[^.]+$/, "");
  const clean = stem.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 64);
  return clean || "pizzahub-menu-item";
}

interface ImgBBApiResponse {
  success?: boolean;
  data?: {
    url?: string;
    display_url?: string;
    width?: number | string;
    height?: number | string;
  };
  error?: {
    message?: string;
  };
}

export async function POST(request: NextRequest) {
  let sessionResult: Awaited<
    ReturnType<ReturnType<typeof getAuth>["api"]["getSession"]>
  > = null;
  try {
    sessionResult = await getAuth().api.getSession({
      headers: request.headers,
    });
  } catch {
    sessionResult = null;
  }

  if (!sessionResult?.session || !sessionResult?.user) {
    return NextResponse.json(
      { success: false, message: "Authentication required." },
      { status: 401 },
    );
  }

  const userRecord = sessionResult.user as typeof sessionResult.user & {
    role?: unknown;
    isBlocked?: unknown;
  };

  if (userRecord.isBlocked === true) {
    return NextResponse.json(
      { success: false, message: "Your account has been blocked." },
      { status: 403 },
    );
  }

  if (userRecord.role !== "vendor") {
    return NextResponse.json(
      {
        success: false,
        message: "Only vendor accounts can upload menu images.",
      },
      { status: 403 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid upload payload. Expected multipart form data.",
      },
      { status: 400 },
    );
  }

  const uploadedEntry = formData.get("image");
  if (!(uploadedEntry instanceof File)) {
    return NextResponse.json(
      { success: false, message: "Select an image file to upload." },
      { status: 400 },
    );
  }

  if (!ALLOWED_MIME_SET.has(uploadedEntry.type)) {
    return NextResponse.json(
      {
        success: false,
        message: "Unsupported file type. Upload a JPG, PNG, or WebP image.",
      },
      { status: 400 },
    );
  }

  if (uploadedEntry.size <= 0) {
    return NextResponse.json(
      { success: false, message: "The selected image file is empty." },
      { status: 400 },
    );
  }

  if (uploadedEntry.size > MAX_IMAGE_SIZE_BYTES) {
    return NextResponse.json(
      {
        success: false,
        message: `Image exceeds the ${formatBytes(MAX_IMAGE_SIZE_BYTES)} maximum size.`,
      },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await uploadedEntry.arrayBuffer());
  if (!matchesMagicBytes(uploadedEntry.type, buffer)) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Image file signature does not match a valid JPG, PNG, or WebP image.",
      },
      { status: 400 },
    );
  }

  const apiKey = process.env.IMGBB_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        message: "Image upload service is not configured on the server.",
      },
      { status: 503 },
    );
  }

  const body = new URLSearchParams();
  body.set("key", apiKey);
  body.set("image", buffer.toString("base64"));
  body.set("name", sanitizeImageFilename(uploadedEntry.name));

  try {
    const upstream = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      signal: AbortSignal.timeout(15000),
    });

    const payload = (await upstream
      .json()
      .catch(() => null)) as ImgBBApiResponse | null;

    if (!upstream.ok || !payload?.success) {
      const upstreamMessage =
        payload?.error?.message?.trim() ||
        "Image hosting provider rejected the upload.";
      return NextResponse.json(
        { success: false, message: upstreamMessage },
        { status: 502 },
      );
    }

    const displayUrl = payload.data?.display_url?.trim();
    const rawUrl = payload.data?.url?.trim();
    const resolvedUrl = displayUrl || rawUrl;

    if (!resolvedUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "Image host returned an incomplete response without a URL.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        url: resolvedUrl,
        displayUrl: displayUrl || resolvedUrl,
        width: payload.data?.width ? Number(payload.data.width) : null,
        height: payload.data?.height ? Number(payload.data.height) : null,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Timed out or lost connection while uploading image to host.",
      },
      { status: 502 },
    );
  }
}
