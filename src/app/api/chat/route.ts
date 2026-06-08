import { NextResponse } from "next/server";

type AnthropicRole = "system" | "user" | "assistant";

type Message = {
  role: AnthropicRole;
  content: string;
};

type RequestBody = {
  messages: Message[];
};

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/chat/completions";

export async function POST(request: Request) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "Anthropic API key is not configured. Set ANTHROPIC_API_KEY in your environment.",
      },
      { status: 500 },
    );
  }

  let body: RequestBody;

  try {
    body = await request.json();
  } catch (err) {
    return NextResponse.json(
      { error: "Unable to parse request body." },
      { status: 400 },
    );
  }

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json(
      { error: "Request must include a non-empty messages array." },
      { status: 400 },
    );
  }

  const payload = {
    model: "claude-3.5",
    messages: body.messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    max_tokens_to_sample: 500,
    temperature: 0.2,
  };

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ANTHROPIC_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorContent = await response.text();
    return NextResponse.json(
      { error: "Anthropic request failed.", details: errorContent },
      { status: response.status },
    );
  }

  const data = await response.json();
  const completion =
    data?.choices?.[0]?.message?.content?.trim() || data?.completion?.trim() || "";

  return NextResponse.json({ completion });
}
