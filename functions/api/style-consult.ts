interface Env {
  OPENAI_API_KEY: string;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const HEADERS = (key: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${key}`,
});

async function callOpenAI(apiKey: string, body: object): Promise<{ choices: { message: { content: string } }[] }> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: HEADERS(apiKey),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestPost({
  request,
  env,
}: {
  request: Request;
  env: Env;
}) {
  try {
    const { image, height, weight } = (await request.json()) as {
      image: string;
      height: number;
      weight: number;
    };

    const bmi = (weight / Math.pow(height / 100, 2)).toFixed(1);

    // Step 1: Extract objective visual elements only — avoids personal analysis refusal
    const descData = await callOpenAI(env.OPENAI_API_KEY, {
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a fashion photography analyst. Describe only the objective visual elements in the photo for styling purposes. Never identify or analyze the individual person.",
        },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: image, detail: "high" } },
            {
              type: "text",
              text: `Describe only the following observable visual elements from this photo. Output as JSON with these exact keys:
{
  "silhouette": "visible body outline and proportions through clothing (shoulder vs hip ratio, torso length, overall shape)",
  "skinUndertone": "dominant color undertone visible in skin areas (warm/golden, cool/pink, or neutral)",
  "hair": "hair color, length, and texture",
  "clothing": "clothing style, fit, colors, and patterns visible"
}`,
            },
          ],
        },
      ],
      max_tokens: 400,
      response_format: { type: "json_object" },
    });

    const visual = descData.choices[0].message.content;

    // Step 2: Generate the Korean style report from the description (no image)
    const reportData = await callOpenAI(env.OPENAI_API_KEY, {
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `당신은 30년 경력의 전문 퍼스널 스타일리스트입니다.
아래 패션 사진 분석 데이터와 신체 정보를 바탕으로 스타일 컨설팅 보고서를 작성해주세요.

[패션 사진 분석]
${visual}

[신체 정보]
- 키: ${height}cm
- 몸무게: ${weight}kg
- BMI: ${bmi}

아래 6가지 항목을 마크다운 형식(## 제목)으로 작성해주세요. 각 항목은 구체적이고 친근하게 작성해주세요.

## 체형 분석
실루엣 데이터와 신체 정보를 바탕으로 체형의 특징과 장점을 분석해주세요.

## 퍼스널 컬러
피부 언더톤과 헤어 컬러를 바탕으로 퍼스널 컬러 타입(봄웜/여름쿨/가을웜/겨울쿨)을 진단하고 어울리는 색상 팔레트를 알려주세요.

## 추천 스타일
체형과 퍼스널 컬러에 맞는 패션 스타일 방향을 구체적으로 추천해주세요.

## 추천 아이템
실제로 활용할 수 있는 의류 아이템, 색상, 핏을 구체적으로 추천해주세요.

## 피해야 할 스타일
체형이나 컬러에 맞지 않아 피하는 것이 좋은 스타일과 그 이유를 설명해주세요.

## 스타일링 팁
전반적인 스타일 완성도를 높이는 실용적인 팁을 알려주세요.`,
        },
      ],
      max_tokens: 2500,
    });

    const report = reportData.choices[0].message.content;

    return Response.json({ report }, { headers: CORS });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500, headers: CORS }
    );
  }
}
