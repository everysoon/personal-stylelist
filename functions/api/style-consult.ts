interface Env {
  OPENAI_API_KEY: string;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

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

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: image, detail: "low" },
              },
              {
                type: "text",
                text: `당신은 10년 경력의 전문 퍼스널 스타일리스트입니다. 아래 신체 정보와 사진을 분석하여 맞춤형 스타일 컨설팅 보고서를 작성해주세요.

신체 정보:
- 키: ${height}cm
- 몸무게: ${weight}kg
- BMI: ${bmi}

아래 6가지 항목으로 구성된 보고서를 마크다운 형식(## 제목)으로 작성해주세요. 각 항목은 친근하고 구체적으로 작성해주세요.

## 체형 분석
사진과 신체 정보를 바탕으로 체형의 특징과 장점을 분석해주세요.

## 퍼스널 컬러
사진의 피부톤, 눈동자, 머리카락 색을 분석하여 퍼스널 컬러 타입(봄웜/여름쿨/가을웜/겨울쿨)을 진단하고 어울리는 색상을 알려주세요.

## 추천 스타일
체형과 퍼스널 컬러에 맞는 패션 스타일 방향을 구체적으로 추천해주세요.

## 추천 아이템
실제로 활용할 수 있는 구체적인 의류 아이템, 색상, 핏을 추천해주세요.

## 피해야 할 스타일
체형이나 컬러에 맞지 않아 피하는 것이 좋은 스타일과 그 이유를 설명해주세요.

## 스타일링 팁
전반적인 스타일 완성도를 높이는 실용적인 팁을 알려주세요.`,
              },
            ],
          },
        ],
        max_tokens: 2500,
      }),
    });

    if (!openaiRes.ok) {
      const err = await openaiRes.text();
      throw new Error(err);
    }

    const data = (await openaiRes.json()) as {
      choices: { message: { content: string } }[];
    };
    const report = data.choices[0].message.content;

    return Response.json({ report }, { headers: CORS });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500, headers: CORS }
    );
  }
}
