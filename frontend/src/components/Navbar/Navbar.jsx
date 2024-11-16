// import React from "react";
// import { Link } from "react-router-dom";

// const Navbar = () => {
//   return (
//     <header className="text-slate-700 container relative mx-auto flex flex-col overflow-hidden px-4 py-4 lg:flex-row lg:items-center">
//       <a
//         href="#"
//         className="flex items-center whitespace-nowrap text-2xl font-black"
//       >
//         <span className="mr-2 w-8">
//           <img src="/images/JOJj79gp_Djhwdp_ZOKLL.png" alt="" />
//         </span>
//         Work Hive
//       </a>
//       <input type="checkbox" className="peer hidden" id="navbar-open" />
//       <label
//         className="absolute top-5 right-5 cursor-pointer lg:hidden"
//         htmlFor="navbar-open"
//       >
//         <svg
//           className="h-7 w-7"
//           xmlns="http://www.w3.org/2000/svg"
//           fill="none"
//           viewBox="0 0 24 24"
//           stroke="currentColor"
//         >
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             strokeWidth="1.5"
//             d="M4 6h16M4 12h16M4 18h16"
//           />
//         </svg>
//       </label>
//       <nav
//         aria-label="Header Navigation"
//         className="peer-checked:pt-8 peer-checked:max-h-60 flex max-h-0 w-full flex-col items-center overflow-hidden transition-all lg:ml-24 lg:max-h-full lg:flex-row"
//       >
//         <ul className="flex w-full flex-col items-center space-y-2 lg:flex-row lg:justify-center lg:space-y-0">
//           <li className="lg:mr-12">
//             <Link
//               className="rounded text-gray-700 transition focus:outline-none focus:ring-1 focus:ring-blue-700 focus:ring-offset-2"
//               to="/"
//             >
//               Home
//             </Link>
//           </li>
//           <li className="lg:mr-12">
//             <Link
//               className="rounded text-gray-700 transition focus:outline-none focus:ring-1 focus:ring-blue-700 focus:ring-offset-2"
//               to="/pricing"
//             >
//               Pricing
//             </Link>
//           </li>
//           <li className="lg:mr-12">
//             <Link
//               className="rounded text-gray-700 transition focus:outline-none focus:ring-1 focus:ring-blue-700 focus:ring-offset-2"
//               to="/contact"
//             >
//               Contact
//             </Link>
//           </li>
//           <li className="lg:mr-12">
//             <a
//               className="rounded text-gray-700 transition focus:outline-none focus:ring-1 focus:ring-blue-700 focus:ring-offset-2"
//               href="#"
//             >
//               FAQ
//             </a>
//           </li>
//         </ul>
//         <hr className="mt-4 w-full lg:hidden" />
//         <div className="my-4 flex items-center space-x-6 space-y-2 lg:my-0 lg:ml-auto lg:space-x-8 lg:space-y-0">
//           <Link
//             to="/signin"
//             title=""
//             className={"whitespace-nowrap rounded font-medium transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-blue-700 focus:ring-offset-2 hover:text-opacity-50 "}
//           >
//             {" "}Sign in{" "}
//           </Link>
//           <Link
//             to="/signup"
//             title=""
//             className="whitespace-nowrap rounded-xl bg-blue-700 px-5 py-3 font-medium text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2 hover:bg-blue-600"
//           >
//             Sign up
//           </Link>
//         </div>
//       </nav>
//     </header>
//   );
// };

// export default Navbar;
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if the user is logged in (you can store the user token or authentication state in localStorage)
  useEffect(() => {
    const token = localStorage.getItem("authToken"); // Or use a context or Redux state
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("authToken"); // Clear the auth token or user data
    setIsAuthenticated(false);
    navigate("/"); // Redirect to home after logout
  };

  return (
    <header className="text-slate-700 container relative mx-auto flex flex-col overflow-hidden px-4 py-4 lg:flex-row lg:items-center">
      <Link to="/" className="flex items-center whitespace-nowrap text-2xl font-black">
        <span className="mr-2 w-8">
          <img src="/images/JOJj79gp_Djhwdp_ZOKLL.png" alt="" />
        </span>
        Work Hive
      </Link>
      <input type="checkbox" className="peer hidden" id="navbar-open" />
      <label className="absolute top-5 right-5 cursor-pointer lg:hidden" htmlFor="navbar-open">
        <svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </label>
      <nav aria-label="Header Navigation" className="peer-checked:pt-8 peer-checked:max-h-60 flex max-h-0 w-full flex-col items-center overflow-hidden transition-all lg:ml-24 lg:max-h-full lg:flex-row">
        <ul className="flex w-full flex-col items-center space-y-2 lg:flex-row lg:justify-center lg:space-y-0">
          <li className="lg:mr-12"><Link className="rounded text-gray-700" to="/">Home</Link></li>
          <li className="lg:mr-12"><Link className="rounded text-gray-700" to="/pricing">Pricing</Link></li>
          <li className="lg:mr-12"><Link className="rounded text-gray-700" to="/contact">Contact</Link></li>
         
        </ul>
        <div className="my-4 flex items-center space-x-6 space-y-2 lg:my-0 lg:ml-auto lg:space-x-8 lg:space-y-0">
          {isAuthenticated ? (
            <div className="flex ijustify-center items-center">
              <Link to="/profile">
                <img src="./image.png" alt="User Profile"  className="w-10 h-10 rounded-full object-cover transition-all duration-300 ease-in-out hover:scale-110" />
              </Link>
              <button onClick={handleLogout} className="whitespace-nowrap rounded-xl bg-blue-700 px-5 py-3 font-medium text-white">Logout</button>
            </div>
          ) : (
            <>
              <Link to="/signin" className="whitespace-nowrap rounded font-medium text-gray-700">Sign in</Link>
              <Link to="/signup" className="whitespace-nowrap rounded-xl bg-blue-700 px-5 py-3 font-medium text-white">Sign up</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
