import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getCompanies, deleteCompany } from "./api";
import { getReadableErrorMessage, useToast } from "../Toast/ToastProvider";
import { TOAST_FAILURE, TOAST_SUCCESS } from "../../constants/toastMessages";

const CompanyList = () => {
  const { showToast } = useToast();
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const { data } = await getCompanies();
        setCompanies(data.data); // Adjust based on your API response structure
      } catch (error) {
        console.error("Error fetching companies:", error.message);
        showToast({ type: "error", message: getReadableErrorMessage(error, TOAST_FAILURE.COMPANY_LIST_LOAD_FAILED) });
      }
    };
    fetchCompanies();
  }, [showToast]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this company?")) {
      try {
        await deleteCompany(id);
        setCompanies(companies.filter((company) => company._id !== id));
        showToast({ type: "success", message: TOAST_SUCCESS.COMPANY_DELETED });
      } catch (error) {
        console.error("Error deleting company:", error.message);
        showToast({ type: "error", message: getReadableErrorMessage(error, TOAST_FAILURE.COMPANY_DELETE_FAILED) });
      }
    }
  };

  return (
    <div>
      <h1>Company List</h1>
      <Link to="/companies/new" style={{ textDecoration: "none", marginBottom: "20px" }}>
        <button>Add New Company</button>
      </Link>
      <ul>
        {companies.map((company) => (
          <li key={company._id}>
            <h3>{company.company_name}</h3>
            <p>Location: {company.location}</p>
            <p>Industry: {company.industry}</p>
            <Link to={`/companies/${company._id}/edit`}>
              <button>Edit</button>
            </Link>
            <button onClick={() => handleDelete(company._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CompanyList;
