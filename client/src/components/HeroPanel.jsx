import RoseGlassLogo from "./RoseGlassLogo";

function HeroPanel() {
  return (
    <header className="hero-panel">
      <div className="hero-copy">
        <RoseGlassLogo />
        <h1>SipLog</h1>
        <p className="hero-text">
          Build your own tasting timeline, collect bottles you loved, and make
          every sip feel like part of your story.
        </p>
      </div>
    </header>
  );
}

export default HeroPanel;
