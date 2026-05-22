interface Env {
  OPENAI_API_KEY: string;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

const HAIRSTYLES = [
  // 단발
  {
    name: "보브컷 (단발)",
    desc: "턱선까지 오는 깔끔한 단발",
    prompt: "short bob cut ending at the jaw line, possibly with a subtle hair color that suits the person"
  },
  {
    name: "픽시컷 (단발)",
    desc: "짧고 세련된 픽시 스타일",
    prompt: "short chic pixie cut, possibly with a flattering hair color"
  },
  {
    name: "웨이브 단발",
    desc: "자연스러운 웨이브의 단발 스타일",
    prompt: "short wavy bob with soft natural waves, possibly with a complementary hair color"
  },
  // 중단발
  {
    name: "미디엄 레이어드 (중단발)",
    desc: "어깨선까지 오는 레이어드 스타일",
    prompt:
      "medium length layered haircut ending at shoulder length, possibly with highlights or a hair color that suits the person"
  },
  {
    name: "미디엄 웨이브 (중단발)",
    desc: "부드러운 웨이브의 중단발",
    prompt: "medium length soft romantic waves, possibly with a flattering hair color or balayage"
  },
  {
    name: "히피펌 (중단발)",
    desc: "자연스러운 컬의 중단발 펌",
    prompt: "medium length hippy perm with voluminous natural curls, possibly with a warm hair color"
  },
  // 장발
  {
    name: "스트레이트 (장발)",
    desc: "윤기 있는 매끄러운 장발",
    prompt: "long straight sleek shiny hair, possibly with a rich hair color that complements the person"
  },
  {
    name: "레이어드 (장발)",
    desc: "볼륨감 있는 레이어드 장발",
    prompt: "long layered hair with natural volume and movement, possibly with highlights or a hair color"
  },
  {
    name: "비치웨이브 (장발)",
    desc: "자연스럽게 흐르는 장발 웨이브",
    prompt: "long flowing natural beach waves, possibly with a sun-kissed hair color or balayage"
  }
];

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

    const makePrompt = (hairstyle: string) =>
      `너는 최고의 헤어스타일리스트야. 첨부한 사진 속 사람이랑 최고로 잘 어울리는 헤어스타일로 바꿔줘.
       헤어스타일: ${hairstyle}. 반드시 지켜야 할 규칙: 첨부한 사람의 얼굴은 절대 바꾸지 말고 기존 얼굴 그대로 100% 유지해. 눈, 코, 입, 피부톤, 표정 모두 원본과 동일하게 유지. 오직 헤어스타일만 바꿔. 잘 어울리는 색이 있다면 염색도 허용해. 자연스럽고 사실적으로 표현해줘.`;

    const results = await Promise.allSettled(
      HAIRSTYLES.map(async ({ name, desc, prompt }) => {
        const form = new FormData();
        form.append("image", new File([imageBlob], "photo.jpg", { type: mimeType }));
        form.append("prompt", makePrompt(prompt));
        form.append("model", "gpt-image-1.5");
        form.append("n", "1");
        form.append("size", "1024x1024");
        form.append("quality", "low");

        const res = await fetch("https://api.openai.com/v1/images/edits", {
          method: "POST",
          headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
          body: form
        });

        if (!res.ok) {
          const err = await res.text();
          throw new Error(err);
        }

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
      return { name: HAIRSTYLES[i].name, desc: HAIRSTYLES[i].desc, imageUrl: null };
    });

    return Response.json({ hairstyles }, { headers: CORS });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500, headers: CORS }
    );
  }
}
