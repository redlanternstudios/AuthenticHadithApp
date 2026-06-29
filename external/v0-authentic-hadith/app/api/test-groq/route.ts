import { generateText } from "ai"

export async function GET() {
  try {
    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: "Who is Prophet Mohammed? Please provide a brief, respectful summary in 2-3 sentences.",
      maxOutputTokens: 256,
    })

    return Response.json({
      success: true,
      engine: "AI Gateway",
      model: "openai/gpt-4o-mini",
      response: text,
    })
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        hint: "Check that GROQ_API_KEY is set in your environment variables.",
      },
      { status: 500 },
    )
  }
}
