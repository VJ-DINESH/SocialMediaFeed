import React from "react";
import { Routes, Route } from "react-router-dom";
import Register from "./components/Register";
import Login from "./components/Login";
import Home from "./components/Home";
import Post from "./components/Post";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Register />} />
      <Route path="/home" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/post" element={<Post />} />
    </Routes>
  );
};

export default App;
