// A small, read-only avatar circle -- the site's photo of you (or a plain
// initial when there isn't one yet). Used on the profile page itself and
// next to each name in the Following/Followers lists. The editable upload
// version (with the camera-icon hover state) is built separately in
// ProfilePage using the existing .photo-circle pattern from TastingForm.
function Avatar({ url, name, size = "md" }) {
  const initial = name?.trim()?.[0]?.toUpperCase() || "?";

  return (
    <div className={`avatar avatar-${size}`}>
      {url ? <img src={url} alt={`${name || "User"}'s avatar`} /> : <span>{initial}</span>}
    </div>
  );
}

export default Avatar;
