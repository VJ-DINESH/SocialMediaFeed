import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

const Post = () => {
    const [post, setPost] = useState({
        postname: "",
        content: "",
        image: null,
    });

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate(); 

    const handleChange = (e) => {
        setPost({ ...post, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        setPost({ ...post, image: e.target.files[0] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setLoading(true);

        const formData = new FormData();
        formData.append("postname", post.postname);
        formData.append("content", post.content);
        formData.append("image", post.image);

        const token = localStorage.getItem("token");

        if (!token) {
            setMessage("❌ User not authenticated. Please log in again.");
            setLoading(false);
            return;
        }

        try {
            const res = await axios.post("http://localhost:5000/post", formData, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            setMessage(`✅ ${res.data.message}`);

         
            setTimeout(() => {
                navigate("/home");
            }, 2000);
        } catch (error) {
            setMessage(`❌ Failed to create post: ${error.response?.data?.error || "Server error"}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-4">
     
            <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm p-3 mb-4">
                <div className="container">
                    <h2 className="navbar-brand">Create Post</h2>
                    <div className="ms-auto">
                        <Link to="/login" className="btn btn-outline-primary me-2">Login</Link>
                        <Link to="/register" className="btn btn-outline-success me-2">Register</Link>
                        <Link to="/post" className="btn btn-primary">Create Post</Link>
                    </div>
                </div>
            </nav>

        
            <div className="container mt-5">
                <div className="row justify-content-center">
                    <div className="col-md-6">
                        <div className="card shadow p-4">
                            <h2 className="text-center mb-3">Create a Post</h2>

                            {message && (
                                <div className={`alert ${message.startsWith("✅") ? "alert-success" : "alert-danger"} text-center`}>
                                    {message}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">Post Name</label>
                                    <input
                                        type="text"
                                        name="postname"
                                        value={post.postname}
                                        onChange={handleChange}
                                        className="form-control"
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Content</label>
                                    <textarea
                                        name="content"
                                        value={post.content}
                                        onChange={handleChange}
                                        className="form-control"
                                        rows="4"
                                        required
                                    ></textarea>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Upload Image</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="form-control"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100"
                                    disabled={loading}
                                >
                                    {loading ? "Posting..." : "Post"}
                                </button>
                            </form>

                           
                            <div className="text-center mt-3">
                                <button
                                    className="btn btn-outline-secondary"
                                    onClick={() => navigate("/")}
                                >
                                    ⬅️ Back to Home
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Post;
