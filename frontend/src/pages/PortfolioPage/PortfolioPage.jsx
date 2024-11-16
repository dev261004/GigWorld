import React, { useState, useEffect } from "react";
import axios from "axios";
import {jwtDecode} from "jwt-decode";

const PortfolioPage = () => {
  const [bio, setBio] = useState("");
  const [projects, setProjects] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolio();
  }, []);

const fetchPortfolio = async () => {
    try {
        const token = localStorage.getItem("authToken"); // Retrieve token
        if (!token) {
            throw new Error("Authentication token not found");
        }

        // Decode the token to get the user ID
        const decodedToken = jwtDecode(token);
        const userId =  decodedToken.id || decodedToken._id || decodedToken.userId;
        if (!userId) {
            throw new Error("User ID not found in token");
        }
        
        // console.log("User ID:", userId);
        // console.log("Decoded Token:", decodedToken);

        if (!userId) {
            throw new Error("User ID not found in token");
        }

        const res = await axios.get(`http://localhost:2610/api/v1/portfolio/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        setPortfolio(res.data.portfolio);
        setBio(res.data.portfolio?.bio || "");
        setProjects(res.data.portfolio?.projects || []);
    } catch (error) {
        console.error("Error fetching portfolio:", error);
    } finally {
        setLoading(false);
    }
};

  const handleBioChange = (e) => {
    setBio(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");

    try {
      const endpoint = portfolio ? "update" : "create";
      const res = await axios.post(
        `http://localhost:2610/api/v1/portfolio/${endpoint}`,
        { bio },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(res.data.message);
      fetchPortfolio(); // Refresh the portfolio
      setIsEditing(false); // Hide the form
    } catch (error) {
      console.error("Error submitting portfolio:", error);
      alert("Failed to update/create portfolio");
    }
  };

  const handleEditClick = () => {
    setIsEditing(true); // Show the form for editing
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col w-full h-full p-6">
      <h1 className="text-2xl font-bold mb-4">Your Portfolio</h1>

      {/* Portfolio Form (Visible in Editing Mode Only) */}
      {isEditing && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 p-4 border rounded shadow space-y-4"
        >
          <h2 className="text-lg font-semibold">Portfolio Details</h2>
          <div>
            <label htmlFor="bio" className="block font-medium">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              value={bio}
              onChange={handleBioChange}
              className="p-2 w-full border rounded"
              rows="3"
              required
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {portfolio ? "Update Portfolio" : "Create Portfolio"}
          </button>
        </form>
      )}

      {/* Portfolio Content (Visible when Not Editing) */}
      {!isEditing && portfolio && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Portfolio Content</h2>
          <p className="mb-4">
            <strong>Bio:</strong> {portfolio.bio}
          </p>
          <h3 className="text-lg font-semibold mb-4">Projects:</h3>
          {projects.length > 0 ? (
            projects.map((project, index) => (
              <div key={index} className="p-4 mb-4 border rounded shadow">
                <h4 className="text-lg font-bold">{project.title}</h4>
                <p className="text-gray-600">{project.description}</p>
                <p>
                  <strong>Technologies:</strong> {project.technologies?.join(", ")}
                </p>
                {project.projectLink && (
                  <p>
                    <strong>Link:</strong>{" "}
                    <a
                      href={project.projectLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {project.projectLink}
                    </a>
                  </p>
                )}
              </div>
            ))
          ) : (
            <p>No projects found.</p>
          )}
        </div>
      )}

      {/* Edit Button */}
      {!isEditing && (
        <button
          onClick={handleEditClick}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          {portfolio ? "Edit Portfolio" : "Create Portfolio"}
        </button>
      )}
    </div>
  );
};

export default PortfolioPage;
