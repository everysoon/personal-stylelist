import "./StyleReport.css";

interface Props {
  report: string;
  photoPreview: string;
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

export default function StyleReport({ report, photoPreview, onReset }: Props) {
  const sections = parseSections(report);

  return (
    <div className="report-page">
      <header className="report-header">
        <p className="report-subtitle">AI 퍼스널 스타일리스트</p>
        <h1 className="report-title">스타일 컨설팅 보고서</h1>
      </header>

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
