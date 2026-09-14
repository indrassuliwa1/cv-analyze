import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Initialize the Google Gen AI client with GEMINI_API_KEY from environment
const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cvText, targetRole, jobDescription } = body;

    const effectiveJobRequirements = (jobDescription || targetRole || "").trim();

    if (!cvText || typeof cvText !== "string" || cvText.trim().length === 0) {
      return NextResponse.json(
        { error: "Teks CV wajib diisi untuk analisis." },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_gemini_api_key_here") {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY belum dikonfigurasi. Silakan tambahkan API key Anda ke dalam file .env.local",
        },
        { status: 500 }
      );
    }

    const systemInstruction = `Kamu adalah sistem ATS (Applicant Tracking System) profesional dan Recruiter Ahli.
Tugasmu adalah menganalisis teks CV dan mengevaluasi kesesuaiannya dengan kualifikasi atau standar industri.

WAJIB merespons HANYA dalam format JSON murni dan valid tanpa teks pembuka, penutup, atau markdown formatting (tanpa backticks \`\`\`json atau \`\`\`).

Struktur JSON yang WAJIB dipatuhi:
{
  "score": <angka integer 0-100>,
  "summary": "<string ringkasan komprehensif evaluasi>",
  "strengths": [
    "<string syarat/kualifikasi yang berhasil dipenuhi>",
    "<string kekuatan profil berikutnya>"
  ],
  "missing_keywords": [
    "<string skill atau kata kunci penting yang tidak ditemukan di CV>",
    "<string skill berikutnya>"
  ],
  "suggestions": [
    "<string saran taktis merombak atau meningkatkan kalimat di CV>",
    "<string saran taktis berikutnya>"
  ]
}`;

    const userPrompt = `${
      effectiveJobRequirements
        ? `DESKRIPSI LOWONGAN PEKERJAAN / JOB REQUIREMENTS TARGET:\n"""\n${effectiveJobRequirements}\n"""\n\n`
        : ""
    }TEKS CV KANDIDAT:\n"""\n${cvText}\n"""\n
Lakukan evaluasi kecocokan secara ketat. Hitung estimasi skor ATS (0-100), buat ringkasan evaluasi, sebutkan poin strengths, sebutkan missing_keywords (terutama dari lowongan yang tidak ada di CV), dan berikan suggestions perbaikan kalimat CV. Kembalikan HANYA JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const responseText = response.text || "{}";
    let parsedResult;

    try {
      parsedResult = JSON.parse(responseText);
    } catch {
      // Fallback in case of stray markdown backticks
      const cleanJson = responseText.replace(/```json\n?|```/g, "").trim();
      parsedResult = JSON.parse(cleanJson);
    }

    // Normalize keys to support both backend contract and UI robustly
    const normalizedData = {
      score: typeof parsedResult.score === "number" ? parsedResult.score : (parsedResult.atsScore || 75),
      summary: parsedResult.summary || "",
      strengths: Array.isArray(parsedResult.strengths) ? parsedResult.strengths : [],
      missing_keywords: Array.isArray(parsedResult.missing_keywords) 
        ? parsedResult.missing_keywords 
        : (Array.isArray(parsedResult.missingKeywords) ? parsedResult.missingKeywords : []),
      suggestions: Array.isArray(parsedResult.suggestions)
        ? parsedResult.suggestions
        : (Array.isArray(parsedResult.revisionTips) ? parsedResult.revisionTips : (Array.isArray(parsedResult.improvements) ? parsedResult.improvements : [])),
    };

    return NextResponse.json({
      success: true,
      data: normalizedData,
    });
  } catch (error: unknown) {
    console.error("Error analyzing CV with LLM:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Terjadi kesalahan saat memproses analisis CV.";
    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
