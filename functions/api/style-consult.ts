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
                image_url: { url: image, detail: "high" },
              },
              {
                type: "text",
                text: `당신은 30년 경력의 전문 퍼스널 스타일리스트입니다.
첨부된 사진에서 아래 시각적 요소만 참고하여 패션 스타일 컨설팅을 진행해주세요.
- 전체적인 체형 실루엣과 비율
- 피부톤 (밝기, 웜/쿨 여부)
- 헤어 컬러
- 현재 착용 중인 의상 스타일

신체 정보:
- 키: ${height}cm
- 몸무게: ${weight}kg
- BMI: ${bmi}

아래 6가지 항목으로 구성된 스타일 컨설팅 보고서를 마크다운 형식(## 제목)으로 작성해주세요.
각 항목은 사진에서 관찰한 내용을 근거로 구체적이고 친근하게 작성해주세요.

## 체형 분석
사진의 실루엣과 비율, 신체 정보를 바탕으로 체형의 특징과 장점을 분석해주세요.

## 퍼스널 컬러
사진에서 보이는 피부톤, 헤어 컬러를 분석하여 퍼스널 컬러 타입(봄웜/여름쿨/가을웜/겨울쿨)을 진단하고 어울리는 색상 팔레트를 알려주세요.

## 추천 스타일
체형 실루엣과 퍼스널 컬러에 맞는 패션 스타일 방향을 구체적으로 추천해주세요.

## 추천 아이템
실제로 활용할 수 있는 의류 아이템, 색상, 핏을 구체적으로 추천해주세요.

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
