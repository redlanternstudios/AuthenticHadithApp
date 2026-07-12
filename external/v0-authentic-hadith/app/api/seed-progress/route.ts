import { getAllProgress } from "@/lib/seed-progress"

export const dynamic = "force-dynamic"

export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let ticks = 0
      const maxTicks = 3600 // 1 hour max (1s interval)

      const interval = setInterval(() => {
        ticks++
        if (ticks > maxTicks) {
          clearInterval(interval)
          controller.close()
          return
        }

        const progress = getAllProgress()
        const data = JSON.stringify(progress)
        controller.enqueue(encoder.encode(`data: ${data}\n\n`))

        // Close if all collections are done or errored
        const values = Object.values(progress)
        if (
          values.length > 0 &&
          values.every((p) => p.phase === "done" || p.phase === "error")
        ) {
          // Send one final update then close after a short delay
          setTimeout(() => {
            clearInterval(interval)
            controller.close()
          }, 2000)
        }
      }, 1000)
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
