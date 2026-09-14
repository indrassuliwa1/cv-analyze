import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase";

// GET: Ambil semua komentar pengunjung, diurutkan dari yang paling baru
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("visitor_comments")
      .select("id, created_at, name, comment")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase GET error:", error);
      return NextResponse.json(
        { error: error.message || "Gagal mengambil data komentar." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (err: unknown) {
    console.error("Unexpected error in GET /api/comments:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan internal server.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST: Simpan komentar baru pengunjung ke Supabase
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, comment } = body;

    const trimmedName = typeof name === "string" ? name.trim() : "";
    const trimmedComment = typeof comment === "string" ? comment.trim() : "";

    // Validasi input
    if (!trimmedName) {
      return NextResponse.json(
        { error: "Nama wajib diisi." },
        { status: 400 }
      );
    }

    if (!trimmedComment) {
      return NextResponse.json(
        { error: "Komentar wajib diisi." },
        { status: 400 }
      );
    }

    if (trimmedName.length > 60) {
      return NextResponse.json(
        { error: "Nama maksimal 60 karakter." },
        { status: 400 }
      );
    }

    if (trimmedComment.length > 500) {
      return NextResponse.json(
        { error: "Komentar maksimal 500 karakter." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("visitor_comments")
      .insert([
        {
          name: trimmedName,
          comment: trimmedComment,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase POST error:", error);
      return NextResponse.json(
        { error: error.message || "Gagal menyimpan komentar ke database." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Komentar berhasil ditambahkan.",
        data,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("Unexpected error in POST /api/comments:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat memproses komentar.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
