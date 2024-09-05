import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar/Navbar";
import Sidebar from "../../components/Sidebar/Sidebar";
import axios from "axios";

const WorkSearchPage = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filters, setFilters] = useState({
    location: "",
    experience: "",
    techStack: ""
  });
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 10;

  // Fetch all jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axios.get("http://localhost:8000/getAllJobs");
        setJobs(res.data);
        setFilteredJobs(res.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchJobs();
  }, []);

  // Handle Search
  const handleSearch = (e) => {
    setSearchKeyword(e.target.value);
    filterJobs(e.target.value, filters);
  };

  // Handle Filter
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    filterJobs(searchKeyword, { ...filters, [name]: value });
  };

  // Filter jobs based on search and filters
  const filterJobs = (keyword, filters) => {
    const filtered = jobs.filter((job) => {
      return (
        job.job_title.toLowerCase().includes(keyword.toLowerCase()) &&
        (filters.location ? job.location.toLowerCase().includes(filters.location.toLowerCase()) : true) &&
        (filters.experience ? job.experience.toLowerCase().includes(filters.experience.toLowerCase()) : true) &&
        (filters.techStack ? job.tech_stack.includes(filters.techStack) : true)
      );
    });
    setFilteredJobs(filtered);
  };

  // Pagination logic
  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="flex flex-col w-full h-full">
      <Navbar />
      <div className="grid sm:grid-cols-9 grid-cols-1">
        <div className="col-span-2"><Sidebar /></div>
        <div className="w-full flex flex-col col-span-7 p-4">
          {/* Search Bar */}
          <input
            type="text"
            placeholder="Search by job title..."
            value={searchKeyword}
            onChange={handleSearch}
            className="p-2 mb-4 border border-gray-300 rounded"
          />

          {/* Filters */}
          <div className="flex space-x-4 mb-4">
            <input
              type="text"
              name="location"
              placeholder="Filter by location"
              value={filters.location}
              onChange={handleFilterChange}
              className="p-2 border border-gray-300 rounded"
            />
            <input
              type="text"
              name="experience"
              placeholder="Filter by experience"
              value={filters.experience}
              onChange={handleFilterChange}
              className="p-2 border border-gray-300 rounded"
            />
            <input
              type="text"
              name="techStack"
              placeholder="Filter by tech stack"
              value={filters.techStack}
              onChange={handleFilterChange}
              className="p-2 border border-gray-300 rounded"
            />
          </div>

          {/* Job List */}
          <div>
            {currentJobs.map((job, index) => (
              <div key={index} className="p-4 mb-2 border border-gray-200 rounded shadow-sm">
                <h2 className="text-lg font-bold">{job.job_title}</h2>
                <p className="text-sm text-gray-600">{job.company_name}</p>
                <p className="text-sm">Location: {job.location}</p>
                <p className="text-sm">Experience: {job.experience}</p>
                <p className="text-sm">Tech Stack: {job.tech_stack.join(", ")}</p>
                <p className="text-sm">Posted at: {new Date(job.postedAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-4">
            {Array.from({ length: Math.ceil(filteredJobs.length / jobsPerPage) }, (_, index) => (
              <button
                key={index}
                onClick={() => paginate(index + 1)}
                className={`px-3 py-1 mx-1 ${currentPage === index + 1 ? "bg-blue-500 text-white" : "bg-gray-200"}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkSearchPage;
