export default function MarqueeBanner() {
  const text = "★ CubeCon 2026 ★ May 2nd ★ Kulturwerk 118 ★ Sursee ★ 64 Players ★ 8 Cubes ★";
  
  return (
    <div className="marquee-banner">
      <div className="marquee-content">
        {[...Array(4)].map((_, i) => (
          <span key={i} className="marquee-text">{text}</span>
        ))}
      </div>
    </div>
  );
}
