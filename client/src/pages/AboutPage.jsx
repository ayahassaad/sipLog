import SiteHeader from "../components/SiteHeader";
import { usePageTitle } from "../hooks/usePageTitle";

const FEATURES = [
  "Log a tasting: record how a wine looks, smells, and tastes, along with your own rating and thoughts.",
  "Keep a running journal: every entry you log stays in My Journal, and you can flip through your wine cards with the left and right arrow keys on your keyboard.",
  "Choose who sees each entry: post it to the Community for everyone, share it with just the people who follow you, or keep it private to yourself.",
  "Browse the Community feed: see what other people are tasting, or switch to the Following view to see only the people you follow.",
  "Watch your rating come to life: the shape and color of the bottle in your rating changes depending on the type of wine you logged.",
  "Favorite and comment: save tastings you love to your favorites, and leave comments on entries in the Community.",
  "Message other tasters: send direct messages to people you connect with.",
  "Stay in the loop: the notification bell keeps you updated on new followers, favorites, comments, and messages.",
];

function AboutPage() {
  usePageTitle("About");

  return (
    <>
      <SiteHeader />
      <main className="app-shell">
        <section className="panel about-page">
          <div className="section-heading">
            <h1 className="brand-highlight">About SipLog</h1>
          </div>

          <p className="about-intro">
            SipLog is a personal wine tasting journal. Log the wines you try, keep notes on
            what you noticed, and look back on your own tasting history over time.
          </p>

          <div className="about-section">
            <p className="section-kicker">What you can do</p>
            <ul className="about-list">
              {FEATURES.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>

          <div className="about-section">
            <p className="section-kicker">About this project</p>
            <p>
              SipLog is an independent project built and maintained by Ayah Assaad. It is not
              a commercial product, and it is not affiliated with any wine brand, retailer, or
              organization.
            </p>
          </div>

          <div className="about-section">
            <p className="section-kicker">Privacy</p>
            <p>
              SipLog stores your email address, your tastings, and any photos you upload
              (photos are hosted through Cloudinary). Each tasting you log has its own
              audience that you choose: Community, Followers, or Private, as described above.
              Messages you send are saved so your conversations stay in your inbox, and only
              you and the other person in a conversation can read them. Nothing you enter into
              SipLog is sold or shared with outside companies.
            </p>
          </div>

          <div className="about-section">
            <p className="section-kicker">Browser support</p>
            <p>
              SipLog is built and tested using Chrome. Safari is not currently supported, and
              some features, like uploading a photo or sending a message, may not work
              correctly there. For the best experience, please use Chrome or another Chromium
              powered browser.
            </p>
          </div>

          <div className="about-section">
            <p className="section-kicker">Accessibility</p>
            <p>
              Effort has gone into making SipLog usable with a keyboard and a screen reader,
              including full keyboard navigation through your journal's wine cards. If you run
              into something that is not accessible, please reach out using the contact info
              below.
            </p>
          </div>

          <div className="about-section">
            <p className="section-kicker">Feedback</p>
            <p>
              Questions, bug reports, and ideas are always welcome. You can reach Ayah Assaad
              directly at{" "}
              <a href="mailto:ayah.assaad@icloud.com">ayah.assaad@icloud.com</a>.
            </p>
          </div>

          <p className="about-footer">© 2026 Ayah Assaad. All rights reserved.</p>
        </section>
      </main>
    </>
  );
}

export default AboutPage;
