import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { uploadImage } from "@/lib/cloudinary";
import { checkImageSafe } from "@/lib/moderation";

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const safe = await checkImageSafe(buffer, file.type);
    if (!safe) {
      return NextResponse.json(
        { error: "This photo appears to contain explicit content and can't be posted." },
        { status: 422 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "We couldn't verify this photo. Please try again." },
      { status: 502 }
    );
  }

  const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;

  try {
    const url = await uploadImage(dataUri);
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "Image upload failed" }, { status: 500 });
  }
}
