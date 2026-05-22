import { useRef, useState } from "react";
import "./ProfileInput.css";

interface ProfileData {
  photo: File | null;
  photoPreview: string | null;
  height: string;
  weight: string;
}

export default function ProfileInput() {
  const [profile, setProfile] = useState<ProfileData>({
    photo: null,
    photoPreview: null,
    height: "",
    weight: "",
  });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfile((prev) => ({
        ...prev,
        photo: file,
        photoPreview: e.target?.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("제출된 데이터:", profile);
  };

  const isValid = profile.photo && profile.height && profile.weight;

  return (
    <div className="profile-page">
      <header className="profile-header">
        <p className="profile-subtitle">AI 퍼스널 스타일리스트</p>
        <h1 className="profile-title">나만의 스타일 찾기</h1>
        <p className="profile-desc">
          사진과 신체 정보를 입력하면 당신에게 딱 맞는 스타일을 추천해드립니다
        </p>
      </header>

      <form className="profile-form" onSubmit={handleSubmit}>
        {/* 사진 업로드 */}
        <section className="form-section">
          <label className="section-label">프로필 사진</label>
          <div
            className={`photo-upload ${isDragging ? "dragging" : ""} ${profile.photoPreview ? "has-photo" : ""}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            {profile.photoPreview ? (
              <>
                <img
                  src={profile.photoPreview}
                  alt="프로필 미리보기"
                  className="photo-preview"
                />
                <div className="photo-overlay">
                  <span>사진 변경</span>
                </div>
              </>
            ) : (
              <div className="photo-placeholder">
                <div className="upload-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 16V8m0 0-3 3m3-3 3 3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="upload-text">클릭하거나 사진을 드래그하세요</p>
                <p className="upload-hint">JPG, PNG, WEBP 지원</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>
        </section>

        {/* 신체 정보 */}
        <section className="form-section">
          <label className="section-label">신체 정보</label>
          <div className="body-inputs">
            <div className="input-group">
              <label className="input-label" htmlFor="height">키</label>
              <div className="input-wrapper">
                <input
                  id="height"
                  type="number"
                  min="100"
                  max="250"
                  placeholder="170"
                  value={profile.height}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, height: e.target.value }))
                  }
                />
                <span className="input-unit">cm</span>
              </div>
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="weight">몸무게</label>
              <div className="input-wrapper">
                <input
                  id="weight"
                  type="number"
                  min="20"
                  max="300"
                  placeholder="60"
                  value={profile.weight}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, weight: e.target.value }))
                  }
                />
                <span className="input-unit">kg</span>
              </div>
            </div>
          </div>
        </section>

        <button type="submit" className="submit-btn" disabled={!isValid}>
          스타일 추천받기
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
    </div>
  );
}
