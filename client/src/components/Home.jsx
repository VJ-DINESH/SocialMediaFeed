import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FaTrash } from "react-icons/fa"; 
import "bootstrap/dist/css/bootstrap.min.css";

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/posts");
      setPosts(res.data);
      res.data.forEach((post) => fetchComments(post.id));
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const fetchComments = async (postId) => {
    try {
      const res = await axios.get(`http://localhost:5000/comments/${postId}`);
      setComments((prev) => ({ ...prev, [postId]: res.data }));
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleReaction = async (postId, action) => {
    try {
      const user_id = 1; 
      await axios.post(`http://localhost:5000/${action}/${postId}`, { user_id });

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes: action === "like" ? (post.likes || 0) + 1 : post.likes,
                dislikes: action === "dislike" ? (post.dislikes || 0) + 1 : post.dislikes,
              }
            : post
        )
      );

      showMessage(action === "like" ? "Post liked successfully!" : "Post disliked successfully!");
    } catch (error) {
      console.error("Error updating reaction:", error);
    }
  };

  const handleCommentChange = (postId, text) => {
    setNewComment((prev) => ({ ...prev, [postId]: text }));
  };

  const submitComment = async (postId) => {
    try {
      const user_id = 1; 
      const comment = newComment[postId];

      if (!comment) return;

      await axios.post(`http://localhost:5000/comment`, {
        user_id,
        post_id: postId,
        comment,
      });

      setComments((prevComments) => ({
        ...prevComments,
        [postId]: [...(prevComments[postId] || []), { comment }],
      }));

      setNewComment((prev) => ({ ...prev, [postId]: "" }));
      showMessage("Comment added successfully!");
    } catch (error) {
      console.error("Error submitting comment:", error);
    }
  };



  return (
    <div className="container mt-4">
      {message && <div className="alert alert-success text-center">{message}</div>}

      <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm p-3 mb-4">
        <div className="container">
          <h2 className="navbar-brand">Social Media Feed</h2>
          <div className="ms-auto">
            <Link to="/login" className="btn btn-outline-primary me-2">
              Login
            </Link>
            <Link to="/register" className="btn btn-outline-success me-2">
              Register
            </Link>
            <Link to="/post" className="btn btn-primary">
              Create Post
            </Link>
          </div>
        </div>
      </nav>

      <h2 className="text-center mb-4">All Posts</h2>
      <div className="row">
        {posts.length > 0 ? (
          posts.map((post) => (
            <div key={post.id} className="col-md-3 mb-4">
              <div className="card shadow-sm position-relative">
          
                

                <div className="card-body">
                  <h5 className="card-title text-primary">{post.postname}</h5>
                  <p className="card-text">{post.content}</p>

                  {post.image && (
                    <img
                      src={`http://localhost:5000/uploads/${post.image}`}
                      alt="Post"
                      className="img-fluid rounded mb-3"
                      style={{ maxHeight: "200px", objectFit: "cover" }}
                    />
                  )}

                  <div className="d-flex justify-content-between">
                    <button className="btn btn-outline-success btn-sm" onClick={() => handleReaction(post.id, "like")}>
                      👍 Like {post.likes}
                    </button>
                    <button className="btn btn-outline-danger btn-sm" onClick={() => handleReaction(post.id, "dislike")}>
                      👎 Dislike {post.dislikes}
                    </button>
                  </div>

                  <div className="mt-3">
                    <textarea
                      className="form-control"
                      placeholder="Write a comment..."
                      value={newComment[post.id] || ""}
                      onChange={(e) => handleCommentChange(post.id, e.target.value)}
                    ></textarea>
                    <button className="btn btn-outline-primary btn-sm mt-2" onClick={() => submitComment(post.id)}>
                      💬 Comment
                    </button>
                  </div>

                  <div className="mt-2">
                    {comments[post.id]?.map((cmt, index) => (
                      <p key={index} className="text-muted">{cmt.comment}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-muted">No posts available.</p>
        )}
      </div>
    </div>
  );
};

export default Home;
