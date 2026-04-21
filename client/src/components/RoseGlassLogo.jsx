function RoseGlassLogo() {
  return (
    <div className="logo-badge" aria-hidden="true">
      <svg viewBox="0 0 220 220" className="logo-svg" role="img">
        <circle cx="110" cy="110" r="102" className="logo-bg" />
        <path
          d="M62 52h96c0 31-15 57-38 70v24h28c0 17-14 31-31 31h-14c-17 0-31-14-31-31h28v-24C77 109 62 83 62 52Z"
          className="logo-glass"
        />
        <path
          d="M74 60h72c0 18-8 34-20 45-10 8-22 13-35 13s-25-5-35-13c-12-11-20-27-20-45Z"
          className="logo-wine"
        />
        <path d="M110 124v38" className="logo-stem" />
        <path d="M86 162h48" className="logo-stem" />
        <path d="M96 84c6 8 16 10 24 12 10 2 20 6 24 15" className="logo-swirl" />
      </svg>
    </div>
  );
}

export default RoseGlassLogo;
