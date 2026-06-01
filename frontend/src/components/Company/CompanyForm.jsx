import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCompanyById, registerCompany, updateCompany } from "./api.js";
import { getReadableErrorMessage, useToast } from "../Toast/ToastProvider.jsx";
import { TOAST_FAILURE, TOAST_SUCCESS } from "../../constants/toastMessages.js";

// eslint-disable-next-line react/prop-types
const CompanyForm = ({ isEdit }) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    company_name: "",
    location: "",
    industry: "",
    website: "",
    contact_info: "",
    company_mail: "",
  });
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (isEdit && id) {
      const fetchCompany = async () => {
        try {
        const { data } = await getCompanyById(id);
        setFormData(data.data); // Adjust based on your API response
      } catch (error) {
        console.error("Error fetching company:", error.message);
        showToast({ type: "error", message: getReadableErrorMessage(error, TOAST_FAILURE.COMPANY_FORM_LOAD_FAILED) });
      }
      };
      fetchCompany();
    }
  }, [isEdit, id, showToast]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await updateCompany(id, formData);
        showToast({ type: "success", message: TOAST_SUCCESS.COMPANY_UPDATED });
      } else {
        await registerCompany(formData);
        showToast({ type: "success", message: TOAST_SUCCESS.COMPANY_REGISTERED });
      }
      navigate("/companies");
    } catch (error) {
      console.error("Error submitting form:", error.message);
      showToast({ type: "error", message: getReadableErrorMessage(error, TOAST_FAILURE.COMPANY_SAVE_FAILED) });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="company_name"
        value={formData.company_name}
        onChange={handleChange}
        placeholder="Company Name"
        required
      />
      <input
        type="text"
        name="location"
        value={formData.location}
        onChange={handleChange}
        placeholder="Location"
        required
      />
      <input
        type="text"
        name="industry"
        value={formData.industry}
        onChange={handleChange}
        placeholder="Industry"
        required
      />
      <input
        type="text"
        name="website"
        value={formData.website}
        onChange={handleChange}
        placeholder="Website"
      />
      <input
        type="text"
        name="contact_info"
        value={formData.contact_info}
        onChange={handleChange}
        placeholder="Contact Info"
        required
      />
      <input
        type="email"
        name="company_mail"
        value={formData.company_mail}
        onChange={handleChange}
        placeholder="Email"
        required
      />
      <button type="submit">{isEdit ? "Update" : "Register"}</button>
    </form>
  );
};

export default CompanyForm;
