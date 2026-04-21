import RoseGlassLogo from "./RoseGlassLogo";

function HeroPanel({ tastingsCount, winesCount, averageRating }) {
  return (
    <header className="hero-panel">
      <div className="hero-copy">
        <RoseGlassLogo />
        <p className="eyebrow">Digital Wine Journal</p>
        <h1>SipLog</h1>
        <p className="hero-text">
          Build your own tasting timeline, collect bottles you loved, and make
          every sip feel like part of your story.
        </p>
      </div>

      <div className="stats-grid">
        <article className="stat-card">
          <span className="stat-label">Saved Tastings</span>
          <strong>{tastingsCount}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Wine Entries</span>
          <strong>{winesCount}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Average Rating</span>
          <strong>{averageRating}</strong>
        </article>
      </div>
    </header>
  );
}

export default HeroPanel;
