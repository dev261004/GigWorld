// import { useState } from "react";
// import axios from "axios";

// const ApplyJobPage = () => {
//   const [fullName, setFullName] = useState("");
//   const [email, setEmail] = useState("");
//   const [message, setMessage] = useState("");
//   const [resume, setResume] = useState(null); // To handle file upload

//   // Handle form input change
//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     if (name === "fullName") {
//       setFullName(value);
//     } else if (name === "email") {
//       setEmail(value);
//     } else if (name === "message") {
//       setMessage(value);
//     }
//   };

//   // Handle file upload
//   const handleFileChange = (e) => {
//     setResume(e.target.files[0]);
//   };

//   // Handle form submission
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     // Form data to be sent to backend
//     const formData = new FormData();
//     formData.append("fullName", fullName);
//     formData.append("email", email);
//     formData.append("message", message);
//     formData.append("resume", resume);

//     try {
//       const response = await axios.post("http://localhost:2610/api/v1/jobs/apply", formData, {
//         headers: {
//           "Content-Type": "multipart/form-data", // Required for file upload
//         },
//       });
//       alert(response.data.message);
//     } catch (error) {
//       console.error("Error applying for the job", error);
//       alert("Error applying for the job.");
//     }
//   };

//   return (
//     <div className="flex justify-center mt-8">
//       <form onSubmit={handleSubmit} className="p-6 border border-gray-300 rounded shadow-lg w-96">
//         <h2 className="text-xl font-bold mb-4">Apply for the Job</h2>

//         <div className="mb-4">
//           <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
//           <input
//             type="text"
//             id="fullName"
//             name="fullName"
//             value={fullName}
//             onChange={handleInputChange}
//             className="w-full p-2 border border-gray-300 rounded"
//             required
//           />
//         </div>

//         <div className="mb-4">
//           <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
//           <input
//             type="email"
//             id="email"
//             name="email"
//             value={email}
//             onChange={handleInputChange}
//             className="w-full p-2 border border-gray-300 rounded"
//             required
//           />
//         </div>

//         <div className="mb-4">
//           <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
//           <textarea
//             id="message"
//             name="message"
//             value={message}
//             onChange={handleInputChange}
//             className="w-full p-2 border border-gray-300 rounded"
//             rows="4"
//             required
//           />
//         </div>

//         <div className="mb-4">
//           <label htmlFor="resume" className="block text-sm font-medium text-gray-700">Upload Resume</label>
//           <input
//             type="file"
//             id="resume"
//             name="resume"
//             onChange={handleFileChange}
//             className="w-full p-2 border border-gray-300 rounded"
//             required
//           />
//         </div>

//         <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
//           Apply
//         </button>
//       </form>
//     </div>
//   );
// };

// export default ApplyJobPage;
import { useState, useEffect, } from "react";
import {  useNavigate,useParams } from "react-router-dom";

import axios from "axios";

const ApplyJobPage = () => {
  const navigate = useNavigate();
  const { jobId } = useParams(); // Get jobId from URL
  const [job, setJob] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    message: "",
    resume: null,
  });

  useEffect(() => {
    const fetchJob = async () => {
      try {
        // console.log("jobid:",jobId)
        const res = await axios.get(`http://localhost:2610/api/v1/jobs/id/${jobId}`);
        //  console.log("res:",res.data.data.job_title)
        setJob(res.data.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchJob();
  }, [jobId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      resume: e.target.files[0],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSubmit = new FormData();
    formDataToSubmit.append("fullName", formData.fullName);
    formDataToSubmit.append("email", formData.email);
    formDataToSubmit.append("message", formData.message);
    formDataToSubmit.append("resume", formData.resume);

    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.post(`http://localhost:2610/api/v1/jobs/apply/${jobId}`, formDataToSubmit, {
        headers: {
          "Authorization": `Bearer ${token}`, // Include the token in the request headers
          "Content-Type": "multipart/form-data"
        }
      });
      
      alert(res.data.message);
      navigate("/dashboard")
    } catch (error) {
      console.error(error);
      alert("Error applying for the job");
    }
  };
// console.log("jobtitel:",job.job_title)
  if (!job) return <div>Loading job details...</div>;

  return (
    <div className="flex flex-col w-full h-full">
      <h1 className="text-2xl font-bold mb-4">Apply for {job.job_title}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="block">Full Name</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className="p-2 w-full border border-gray-300 rounded"
            required
          />
        </div>
        <div>
          <label htmlFor="email" className="block">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="p-2 w-full border border-gray-300 rounded"
            required
          />
        </div>
        <div>
          <label htmlFor="message" className="block">Message</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            className="p-2 w-full border border-gray-300 rounded"
            rows="4"
            required
          />
        </div>
        <div>
          <label htmlFor="resume" className="block">Upload Resume</label>
          <input
            type="file"
            id="resume"
            name="resume"
            onChange={handleFileChange}
            className="p-2 w-full border border-gray-300 rounded"
            required
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
          Submit Application
        </button>
      </form>
    </div>
  );
};

export default ApplyJobPage;
