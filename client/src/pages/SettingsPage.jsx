import SiteHeader from "../components/SiteHeader";

function SettingsPage() {
  return (
    <>
      <SiteHeader />
      <div className="app-shell">
        <section className="panel">
          <div className="section-heading">
            <h2 className="brand-highlight">Settings</h2>
          </div>
          <p className="status-message">
            Settings are coming soon - check back shortly.
          </p>
        </section>
      </div>
    </>
  );
}

export default SettingsPage;
