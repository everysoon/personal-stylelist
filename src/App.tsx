import { useState } from "react";
import ProfileInput from "./components/ProfileInput";
import StyleReport from "./components/StyleReport";
import "./App.css";

interface SubmitData {
  image: string;
  height: string;
  weight: string;
  photoPreview: string;
}

type AppState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; report: string; photoPreview: string; image: string };

function App() {
  const [state, setState] = useState<AppState>({ status: "idle" });

  const handleSubmit = async ({ image, height, weight, photoPreview }: SubmitData) => {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/style-consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, height: Number(height), weight: Number(weight) }),
      });
      if (!res.ok) throw new Error("API 오류");
      const { report } = await res.json();
      setState({ status: "done", report, photoPreview, image });
    } catch {
      setState({ status: "idle" });
      alert("오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  if (state.status === "loading") {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p className="loading-text">스타일을 분석하는 중...</p>
        <p className="loading-sub">AI가 당신만의 스타일을 찾고 있어요</p>
      </div>
    );
  }

  if (state.status === "done") {
    return (
      <StyleReport
        report={state.report}
        photoPreview={state.photoPreview}
        image={state.image}
        onReset={() => setState({ status: "idle" })}
      />
    );
  }

  return <ProfileInput onSubmit={handleSubmit} />;
}

export default App;
