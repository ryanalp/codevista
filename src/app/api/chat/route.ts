import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Roles accepted by the Anthropic Messages API. */
type AnthropicRole = "user" | "assistant";

type Message = {
  role: AnthropicRole;
  content: string;
};

type RequestBody = {
  messages: Message[];
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Correct Anthropic Messages API endpoint. */
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

/**
 * Hard cap on tokens generated per request.
 * Keeps individual calls cheap and prevents runaway billing.
 */
const MAX_TOKENS_CAP = 1000;

/** Abort the request if Anthropic has not responded within this many ms. */
const REQUEST_TIMEOUT_MS = 10_000;

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  // 1. Guard: API key must be present ----------------------------------------
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Anthropic API key is not configured. " +
          "Set ANTHROPIC_API_KEY in your environment variables.",
      },
      { status: 500 },
    );
  }

  // 2. Parse & validate request body -----------------------------------------
  let body: RequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Unable to parse request body. Expected valid JSON." },
      { status: 400 },
    );
  }

  if (
    !body.messages ||
    !Array.isArray(body.messages) ||
    body.messages.length === 0
  ) {
    return NextResponse.json(
      { error: "Request must include a non-empty messages array." },
      { status: 400 },
    );
  }

  // Strip out any "system" role messages — the Anthropic Messages API expects
  // system content via a top-level `system` field, not inside the messages array.
  const userAssistantMessages = body.messages.filter(
    (m) => m.role === "user" || m.role === "assistant",
  );

  if (userAssistantMessages.length === 0) {
    return NextResponse.json(
      {
        error:
          'messages array must contain at least one "user" or "assistant" message.',
      },
      { status: 400 },
    );
  }

  // 3. Build payload ----------------------------------------------------------
  const payload = {
    // claude-3-haiku is universally available across all Anthropic plan tiers.
    model: "claude-sonnet-4-5",
    messages: userAssistantMessages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    // Wallet protection: hard cap so a single request cannot drain prepaid funds.
    max_tokens: MAX_TOKENS_CAP,
    temperature: 0.2,
  };

  // 4. Call Anthropic with a strict timeout -----------------------------------
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Correct Anthropic auth header — NOT "Authorization: Bearer".
        "x-api-key": apiKey,
        // Required by the Anthropic Messages API.
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 5. Handle non-2xx responses with actionable detail --------------------
    if (!response.ok) {
      let errorDetail: string;

      try {
        const errorJson = await response.json();
        errorDetail =
          errorJson?.error?.message ?? JSON.stringify(errorJson);
      } catch {
        errorDetail = await response.text();
      }

      const humanReadable: Record<number, string> = {
        401: "Unauthorized — the ANTHROPIC_API_KEY is invalid or revoked.",
        402: "Payment required — your Anthropic prepaid balance is exhausted. Top up at console.anthropic.com.",
        403: "Forbidden — your API key does not have permission for this operation.",
        404: "Not found — the requested model does not exist or is not available on your plan.",
        429: "Rate limited — too many requests. Slow down or upgrade your Anthropic plan.",
        529: "Anthropic API is overloaded. Retry after a short delay.",
      };

      const friendlyMessage =
        humanReadable[response.status] ??
        `Anthropic returned HTTP ${response.status}.`;

      return NextResponse.json(
        {
          error: friendlyMessage,
          statusCode: response.status,
          details: errorDetail,
        },
        { status: response.status },
      );
    }

    // 6. Parse successful response ------------------------------------------
    const data = await response.json();

    // Anthropic Messages API returns: data.content[0].text
    const completion: string =
      (data?.content?.[0]?.text as string | undefined)?.trim() ?? "";

    return NextResponse.json({ completion });
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    // Anti-loop / timeout guard: AbortError means we killed the request.
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json(
        {
          error:
            `Anthropic API request timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds. ` +
            "The request was aborted to prevent runaway resource usage.",
        },
        { status: 504 },
      );
    }

    // Network-level or unexpected errors.
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while contacting the Anthropic API.",
        details: message,
      },
      { status: 500 },
    );
  }
}
