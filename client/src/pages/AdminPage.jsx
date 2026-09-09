import { useEffect, useState } from "react";
import UserHoverCard from "../components/UserHoverCard";
import SiteHeader from "../components/SiteHeader";
import Avatar from "../components/Avatar";
import FilterBar from "../components/FilterBar";
import { useAuth } from "../context/useAuth";
import { useAdminUsers } from "../hooks/useAdminUsers";
import { useAdminStats } from "../hooks/useAdminStats";
import { useAdminTastings } from "../hooks/useAdminTastings";

const SEARCH_DEBOUNCE_MS = 400;

function formatJoinDate(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const STAT_TILES = [
  { key: "totalUsers", label: "Total Users" },
  { key: "totalVisits", label: "Site Visits" },
  { key: "totalTastings", label: "Tastings Logged" },
  { key: "newUsersThisWeek", label: "New This Week" },
  { key: "newUsersThisMonth", label: "New This Month" },
];

function Leaderboard({ title, entries, countLabel }) {
  if (!entries || entries.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="admin-board-title">{title}</p>
      {entries.map((person) => (
        <UserHoverCard
          username={person.username}
          className="admin-board-person"
          key={person.id}
        >
          <Avatar url={person.avatarUrl} name={person.name} size="sm" />
          <span className="admin-board-name">@{person.username}</span>
          <span className="admin-board-count">
            {person.followersCount ?? person.tastingsCount} {countLabel}
          </span>
        </UserHoverCard>
      ))}
    </div>
  );
}

function RecentTastings() {
  const admin = useAdminTastings();
  const { search: confirmedSearch, runSearch } = admin;
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (searchTerm === confirmedSearch) {
      return undefined;
    }
    const timeoutId = setTimeout(() => {
      runSearch(searchTerm);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, confirmedSearch, runSearch]);

  const handleRemove = (tasting) => {
    const wineName = tasting.wineId?.name || "this tasting";
    if (!window.confirm(`Remove ${wineName} (posted by @${tasting.userId?.username})? This can't be undone.`)) {
      return;
    }
    admin.removeTasting(tasting._id);
  };

  return (
    <div className="admin-recent-tastings">
      <p className="admin-board-title">Recent Tastings</p>

      <div className="admin-recent-search">
        <FilterBar
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          placeholder="Search by wine or poster..."
        />
      </div>

      {admin.loading && <p className="feed-loading">Loading recent tastings...</p>}
      {admin.error && <p className="status-message error">{admin.error}</p>}
      {!admin.loading && !admin.error && admin.tastings.length === 0 && (
        <p className="feed-empty">
          {admin.search ? `No tastings found for “${admin.search}”.` : "No tastings yet."}
        </p>
      )}

      {admin.tastings.map((tasting) => (
        <div className="admin-recent-row" key={tasting._id}>
          <div className="admin-recent-info">
            <p className="admin-recent-wine">{tasting.wineId?.name || "Untitled wine"}</p>
            <p className="admin-recent-meta">
              by{" "}
              <UserHoverCard username={tasting.userId?.username} className="card-author-link">
                @{tasting.userId?.username}
              </UserHoverCard>
              {" · "}
              {formatJoinDate(tasting.createdAt)}
            </p>
          </div>
          <button
            type="button"
            className="card-action"
            onClick={() => handleRemove(tasting)}
            disabled={admin.removingId === tasting._id}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 6h18" />
              <path d="M8 6V4h8v2" />
              <path d="M19 6l-1 14H6L5 6" />
            </svg>
            {admin.removingId === tasting._id ? "Removing..." : "Remove"}
          </button>
        </div>
      ))}
    </div>
  );
}

function AdminStats() {
  const { stats, loading, error } = useAdminStats();

  if (loading) {
    return <p className="feed-loading">Loading site stats...</p>;
  }
  if (error) {
    return <p className="status-message error">{error}</p>;
  }
  if (!stats) {
    return null;
  }

  return (
    <section className="panel list-panel">
      <div className="section-heading">
        <h2 className="brand-highlight">Site Stats</h2>
      </div>

      <div className="admin-stats-split">
        <div className="admin-stats-stack">
          {STAT_TILES.map((tile) => (
            <div className="admin-stat-row" key={tile.key}>
              <span className="admin-stat-num">{stats[tile.key] ?? 0}</span>
              <span className="admin-stat-label">{tile.label}</span>
            </div>
          ))}
        </div>

        <div className="admin-stats-main">
          <div className="admin-boards-stack">
            <Leaderboard
              title="Most Followed"
              entries={stats.topByFollowers}
              countLabel="followers"
            />
            <Leaderboard
              title="Most Tastings Posted"
              entries={stats.topByTastings}
              countLabel="tastings"
            />
          </div>

          <RecentTastings />
        </div>
      </div>
    </section>
  );
}

function AdminUserDirectory() {
  const { user } = useAuth();
  const admin = useAdminUsers();
  const { search: confirmedSearch, runSearch } = admin;
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (searchTerm === confirmedSearch) {
      return undefined;
    }
    const timeoutId = setTimeout(() => {
      runSearch(searchTerm);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, confirmedSearch, runSearch]);

  return (
    <section className="panel list-panel admin-users-panel">
      <div className="section-heading">
        <h2 className="brand-highlight">All Users</h2>
      </div>

      <FilterBar
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        placeholder="Search users by name or username..."
      />

      {admin.loading && <p className="feed-loading">Loading users...</p>}
      {admin.error && <p className="status-message error">{admin.error}</p>}
      {!admin.loading && !admin.error && admin.users.length === 0 && (
        <p className="feed-empty">No users found.</p>
      )}

      {admin.users.length > 0 && (
        <div className="connection-list admin-user-list">
          {admin.users.map((person) => {
            const isSelf = Boolean(user && person.id === user.id);

            return (
              <div className="connection-row" key={person.id}>
                <UserHoverCard username={person.username} className="connection-link">
                  <Avatar url={person.avatarUrl} name={person.name} size="sm" />
                  <div>
                    <span className="connection-name">{person.name}</span>
                    <p className="admin-user-meta">
                      @{person.username} · Joined {formatJoinDate(person.createdAt)}
                    </p>
                  </div>
                </UserHoverCard>

                {person.isSuperAdmin ? (
                  <span className="admin-badge admin-badge-super">Super Admin</span>
                ) : user?.isSuperAdmin && !isSelf ? (
                  <button
                    type="button"
                    className={`button-gold ${person.isAdmin ? "is-following" : ""}`}
                    onClick={() => admin.toggleAdmin(person.id, person.isAdmin)}
                  >
                    {person.isAdmin ? "Remove Admin" : "Make Admin"}
                  </button>
                ) : person.isAdmin ? (
                  <span className="admin-badge">Admin</span>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {admin.hasMore && (
        <div className="button-row">
          <button type="button" className="button-secondary" onClick={admin.loadMore}>
            Load more users
          </button>
        </div>
      )}
    </section>
  );
}

function AdminPage() {
  return (
    <>
      <SiteHeader />
      <div className="app-shell">
        <AdminStats />
        <AdminUserDirectory />
      </div>
    </>
  );
}

export default AdminPage;
