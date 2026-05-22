interface Env {
  OPENAI_API_KEY: string;
}

interface HairstyleSuggestion {
  name: string;
  desc: string;
  imagePrompt: string;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function base64ToBlob(base64: string, mimeType: string): Blob {
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    bytes[i] = raw.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  try {
    const { image } = (await request.json()) as { image: string };

    const mimeMatch = image.match(/^data:(image\/[\w+]+);base64,/);
    const mimeType = mimeMatch?.[1] ?? "image/jpeg";
    const base64Data = image.replace(/^data:image\/[\w+]+;base64,/, "");
    const imageBlob = base64ToBlob(base64Data, mimeType);

    // Step 1: GPT-4o가 사진을 보고 이 사람에게 어울리는 헤어스타일 9개를 직접 추천
    const chatRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a world-class hairstylist. Analyze the person's photo and recommend 9 hairstyles that would suit them best, considering their face shape, features, and overall vibe. The person may be male or female — tailor recommendations accordingly. Output JSON only."
          },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: image, detail: "high" } },
              {
                type: "text",
                text: `Look at this person and recommend exactly 9 hairstyles that would suit them best. Consider their face shape, features, gender, and overall image. Choose diverse styles. Hair coloring is allowed if it suits them.

Return a JSON object with this exact shape:
{
  "hairstyles": [
    {
      "name": "헤어스타일 이름 (Korean)",
      "desc": "한 줄 설명 (Korean, max 20 chars)",
      "imagePrompt": "detailed English prompt describing only the hairstyle for an image generation model"
    }
  ]
}

Rules for imagePrompt: describe only the hairstyle (cut, length, texture, color if applicable). Do not mention the face or person.`
              }
            ]
          }
        ],
        max_tokens: 1000,
        response_format: { type: "json_object" }
      })
    });

    if (!chatRes.ok) throw new Error(await chatRes.text());

    const chatData = (await chatRes.json()) as { choices: { message: { content: string } }[] };
    const suggestions: HairstyleSuggestion[] = JSON.parse(chatData.choices[0].message.content).hairstyles;

    // Step 2: 추천된 9개 스타일로 이미지 생성 (병렬)
    const makePrompt = (imagePrompt: string) =>
      `너는 최고의 헤어스타일리스트야. 첨부한 사진 속 사람에게 어울리는 헤어스타일로 바꿔줘. 헤어스타일: ${imagePrompt}. 반드시 지켜야 할 규칙: 첨부한 사람의 얼굴은 절대 바꾸지 말고 기존 얼굴 그대로 100% 유지해. 눈, 코, 입, 피부톤, 표정 모두 원본과 동일하게 유지. 오직 헤어스타일만 바꿔. 잘 어울리는 색이 있다면 염색도 허용해. 자연스럽고 사실적으로 표현해줘.`;

    const results = await Promise.allSettled(
      suggestions.map(async ({ name, desc, imagePrompt }) => {
        const form = new FormData();
        form.append("image", new File([imageBlob], "photo.jpg", { type: mimeType }));
        form.append("prompt", makePrompt(imagePrompt));
        form.append("model", "gpt-image-1.5");
        form.append("n", "1");
        form.append("size", "1024x1024");
        form.append("quality", "low");

        const res = await fetch("https://api.openai.com/v1/images/edits", {
          method: "POST",
          headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
          body: form
        });

        if (!res.ok) throw new Error(await res.text());

        const data = (await res.json()) as { data: { b64_json: string }[] };
        return {
          name,
          desc,
          imageUrl: `data:image/png;base64,${data.data[0].b64_json}`
        };
      })
    );

    const hairstyles = results.map((result, i) => {
      if (result.status === "fulfilled") return result.value;
      return { name: suggestions[i]?.name ?? `스타일 ${i + 1}`, desc: suggestions[i]?.desc ?? "", imageUrl: null };
    });

    return Response.json({ hairstyles }, { headers: CORS });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500, headers: CORS }
    );
  }
}
