import { useEffect, useState } from "react";
import UserHoverCard from "./UserHoverCard";
import Avatar from "./Avatar";
import { fetchComments, postComment, deleteComment } from "../services/commentService";
import { formatTimelineDate } from "../utils/formatTimelineDate";

// Inline, per-tasting comment thread shown under a Community feed card once
// its "Comments" toggle is opened. Fetches lazily -- nothing is requested
// until a card's thread is actually expanded -- and reports its live count
// back up to the card via onCountChange, so the toggle button's label
// stays right even after the thread is collapsed again (a post or a
// delete updates it immediately, not just the next full feed reload).
function CommentSection({ tastingId, currentUser, onRequireLogin, onCountChange }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    fetchComments(tastingId)
      .then((data) => {
        if (ignore) return;
        setComments(data.comments);
        onCountChange(data.comments.length);
        setError("");
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
    // onCountChange is a fresh function from the parent on every render --
    // only tastingId should ever re-trigger this fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tastingId]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!currentUser) {
      onRequireLogin();
      return;
    }

    const text = draft.trim();
    if (!text) {
      return;
    }

    setPosting(true);
    try {
      const comment = await postComment(tastingId, text);
      const next = [...comments, comment];
      setComments(next);
      onCountChange(next.length);
      setDraft("");
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await deleteComment(tastingId, commentId);
      const next = comments.filter((comment) => comment.id !== commentId);
      setComments(next);
      onCountChange(next.length);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="comment-section">
      {loading && <p className="feed-loading">Loading comments...</p>}
      {!loading && error && (
        <p className="status-message error" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && comments.length === 0 && (
        <p className="feed-empty">No comments yet.</p>
      )}

      {comments.length > 0 && (
        <ul className="comment-list">
          {comments.map((comment) => (
            <li className="comment-item" key={comment.id}>
              <Avatar url={comment.author?.avatarUrl} name={comment.author?.name} size="sm" />
              <div className="comment-body">
                <p className="comment-meta">
                  {comment.author ? (
                    <UserHoverCard username={comment.author.username} className="comment-author-link">
                      @{comment.author.username}
                    </UserHoverCard>
                  ) : (
                    <span>Someone</span>
                  )}
                  <span className="comment-time">{formatTimelineDate(comment.createdAt)}</span>
                </p>
                <p className="comment-text">{comment.text}</p>
              </div>
              {currentUser && comment.author?.id === currentUser.id && (
                <button
                  type="button"
                  className="comment-delete"
                  aria-label="Delete comment"
                  onClick={() => handleDelete(comment.id)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form className="comment-composer" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor={`comment-input-${tastingId}`}>
          Write a comment
        </label>
        <textarea
          id={`comment-input-${tastingId}`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={currentUser ? "Add a comment..." : "Log in to comment"}
          maxLength={500}
          rows={2}
          disabled={!currentUser}
        />
        <button
          type="submit"
          className="button-gold"
          disabled={currentUser ? posting || !draft.trim() : false}
        >
          {currentUser ? "Post" : "Log in to comment"}
        </button>
      </form>
    </div>
  );
}

export default CommentSection;
