import { useEffect, useState } from "react";
import "./StyleReport.css";
import HairstyleGrid, { type HairstyleItem } from "./HairstyleGrid";

interface Props {
  report: string;
  photoPreview: string;
  image: string;
  onReset: () => void;
}

interface Section {
  title: string;
  content: string;
}

const SECTION_ICONS: Record<string, string> = {
  "체형 분석": "📐",
  "퍼스널 컬러": "🎨",
  "추천 스타일": "✨",
  "추천 아이템": "🛍️",
  "피해야 할 스타일": "⚠️",
  "스타일링 팁": "💡",
};

function parseSections(report: string): Section[] {
  return report
    .split(/^## /m)
    .filter(Boolean)
    .map((block) => {
      const newlineIdx = block.indexOf("\n");
      return {
        title: block.slice(0, newlineIdx).trim(),
        content: block.slice(newlineIdx + 1).trim(),
      };
    });
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function SectionContent({ content }: { content: string }) {
  return (
    <div className="section-content">
      {content.split("\n").map((line, i) => {
        if (line.startsWith("- ")) {
          return (
            <div key={i} className="report-list-item">
              <span className="bullet" />
              <span dangerouslySetInnerHTML={{ __html: formatInline(line.slice(2)) }} />
            </div>
          );
        }
        if (!line.trim()) return null;
        return (
          <p key={i} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
        );
      })}
    </div>
  );
}

type HairState =
  | { status: "loading" }
  | { status: "done"; items: HairstyleItem[] }
  | { status: "error" };

export default function StyleReport({ report, photoPreview, image, onReset }: Props) {
  const sections = parseSections(report);
  const [hairState, setHairState] = useState<HairState>({ status: "loading" });

  const generateHairstyles = async () => {
    setHairState({ status: "loading" });
    try {
      const res = await fetch("/api/hairstyle-gen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      if (!res.ok) throw new Error("API 오류");
      const { hairstyles } = await res.json();
      setHairState({ status: "done", items: hairstyles });
    } catch {
      setHairState({ status: "error" });
    }
  };

  useEffect(() => {
    generateHairstyles();
  }, []);

  return (
    <div className="report-page">
      <header className="report-header">
        <p className="report-subtitle">AI 퍼스널 스타일리스트</p>
        <h1 className="report-title">스타일 컨설팅 보고서</h1>
      </header>

      {/* 헤어스타일 추천 — 보고서 최상단 */}
      <div className="hair-section">
        <div className="hair-section-header">
          <h2 className="hair-section-title">추천 헤어스타일 9가지</h2>
          <p className="hair-section-desc">단발·중단발·장발, 다양한 스타일을 AI가 생성해드립니다</p>
        </div>

        {hairState.status === "loading" && (
          <div className="hair-loading">
            <div className="loading-spinner" />
            <p className="loading-text">헤어스타일을 생성하는 중...</p>
            <p className="loading-sub">9가지 스타일을 AI가 만들고 있어요. 잠시만 기다려주세요</p>
          </div>
        )}

        {hairState.status === "done" && (
          <HairstyleGrid items={hairState.items} />
        )}

        {hairState.status === "error" && (
          <div className="hair-error">
            <p>헤어스타일 생성에 실패했습니다.</p>
            <button className="hair-retry-btn" onClick={generateHairstyles}>다시 시도</button>
          </div>
        )}
      </div>

      {/* 스타일 컨설팅 보고서 본문 */}
      <div className="report-body">
        <aside className="report-aside">
          <img src={photoPreview} alt="프로필" className="report-photo" />
        </aside>

        <div className="report-sections">
          {sections.map((section) => (
            <div key={section.title} className="report-section">
              <div className="section-header">
                <span className="section-icon">
                  {SECTION_ICONS[section.title] ?? "•"}
                </span>
                <h2 className="section-title">{section.title}</h2>
              </div>
              <SectionContent content={section.content} />
            </div>
          ))}
        </div>
      </div>

      <div className="report-footer">
        <button className="reset-btn" onClick={onReset}>
          다시 분석하기
        </button>
      </div>
    </div>
  );
}
