import React, { useState, useEffect } from "react";
import axios from "axios";

const ProjectPage = () => {
  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    technologies: "",
    projectLink: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("authToken"); // Assuming token is stored
      const res = await axios.get("http://localhost:2610/api/v1/projects/freelancer", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(res.data.projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");
    const technologiesArray = formData.technologies.split(",").map((tech) => tech.trim());

    try {
      const res = await axios.post(
        "http://localhost:2610/api/v1/projects/create",
        { ...formData, technologies: technologiesArray },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.message);
      setFormData({ title: "", description: "", technologies: "", projectLink: "" });
      fetchProjects(); // Refresh the projects list
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Failed to create project");
    }
  };

  const handleDelete = async (projectId) => {
    const token = localStorage.getItem("authToken");
    try {
      const res = await axios.delete(`http://localhost:2610/api/v1/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(res.data.message);
      fetchProjects(); // Refresh the projects list
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col w-full h-full p-6">
      <h1 className="text-2xl font-bold mb-4">Add New Project</h1>
      {/* Add Project Form */}
      <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded shadow space-y-4">
        
        <div>
          <label htmlFor="title" className="block font-medium">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="p-2 w-full border rounded"
            required
          />
        </div>
        <div>
       
          <label htmlFor="description" className="block font-medium">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="p-2 w-full border rounded"
            rows="3"
            required
          />
        </div>
        <div>
          <label htmlFor="technologies" className="block font-medium">Technologies (comma-separated)</label>
          <input
            type="text"
            id="technologies"
            name="technologies"
            value={formData.technologies}
            onChange={handleChange}
            className="p-2 w-full border rounded"
            required
          />
        </div>
        <div>
          <label htmlFor="projectLink" className="block font-medium">Project Link</label>
          <input
            type="url"
            id="projectLink"
            name="projectLink"
            value={formData.projectLink}
            onChange={handleChange}
            className="p-2 w-full border rounded"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Submit
        </button>
      </form>

      {/* List of Projects */}
      <div>
      <h1 className="text-2xl font-bold mb-4">Your Projects</h1>
        {projects.length > 0 ? (
          projects.map((project) => (
            <div key={project._id} className="p-4 mb-4 border rounded shadow">
              <h2 className="text-lg font-bold">{project.title}</h2>
              <p className="text-gray-600">{project.description}</p>
              <p>
                <strong>Technologies:</strong> {project.technologies.join(", ")}
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
              <button
                onClick={() => handleDelete(project._id)}
                className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          ))
        ) : (
          <p>No projects found.</p>
        )}
      </div>
    </div>
  );
};

export default ProjectPage;
