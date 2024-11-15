import React, { useEffect, useState } from "react";
import axios from "axios";

const JobApplicationStatusPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const token = localStorage.getItem("authToken"); // Assuming token is stored in local storage
        const response = await axios.get("http://localhost:2610/api/v1/applications/status", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setApplications(response.data.data); // Set the array of applications directly
      } catch (error) {
        console.error("Failed to fetch job applications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  if (loading) {
    return <p>Loading job application statuses...</p>;
  }

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-2xl font-semibold mb-6">Job Application Status</h1>
      <div className="w-full max-w-2xl">
        {applications.length > 0 ? (
          applications.map((application) => (
            <div key={application._id} className="p-4 mb-4 border border-gray-200 rounded shadow">
              <h2 className="text-lg font-bold">{application.jobId.job_title}</h2>
              <p className="text-gray-600">{application.jobId.company_name}</p>
              <p>Location: {application.jobId.location}</p>
              <p>Status: <span className="font-semibold">{application.status || "Pending"}</span></p>
              <p>Applied At: {new Date(application.appliedAt).toLocaleDateString()}</p>
            </div>
          ))
        ) : (
          <p>No job applications found.</p>
        )}
      </div>
    </div>
  );
};

export default JobApplicationStatusPage;
