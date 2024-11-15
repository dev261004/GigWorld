// import React from "react";
// import { Link } from "react-router-dom";

// const UserProfilePage = () => {
//   return (
//     <div className="flex">
//       {/* Sidebar */}
//       <div className="w-64 bg-gray-200 p-4">
//         <h2 className="text-xl font-semibold">User Profile</h2>
//         <ul className="mt-4">
//           <li>
//             <Link to="/update-account" className="block py-2 px-4 hover:bg-gray-300 rounded">Update Account Details</Link>
//           </li>
//           <li>
//             <Link to="/job-application-status" className="block py-2 px-4 hover:bg-gray-300 rounded">Job Application Status</Link>
//           </li>
//           <li>
//             <button className="block py-2 px-4 hover:bg-gray-300 rounded" onClick={() => { /* logout logic */ }}>Logout</button>
//           </li>
//         </ul>
//       </div>

//       {/* Main Content */}
//       <div className="flex-1 p-8">
//         <h1 className="text-2xl font-bold">Welcome to Your Profile</h1>
//         <div className="mt-4">
//           <p>Here you can manage your account details, check your job application status, and more.</p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default UserProfilePage;
import React from "react";
import { Link } from "react-router-dom";

const UserProfilePage = () => {
  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-blue-700 text-white p-4 shadow-lg">
        <h2 className="text-xl font-semibold text-center text-white">User Profile</h2>
        <ul className="mt-4">
          <li>
            <Link to="/update-account" className="block py-2 px-4 bg-blue-600 hover:bg-blue-500 rounded transition duration-200 ease-in-out">Update Account Details</Link>
          </li>
          <li>
            <Link to="/job-application-status" className="block py-2 px-4 bg-blue-600 hover:bg-blue-500 rounded transition duration-200 ease-in-out">Job Application Status</Link>
          </li>
        </ul>
    <br></br>
        <button className="block w-full text-left py-2 px-4 bg-red-500 hover:bg-red-400 rounded transition duration-200 ease-in-out" onClick={() => { /* logout logic */ }}>Logout</button>
      
      
</div>

      {/* Main Content */}
      <div className="flex-1 p-8 bg-white">
        <h1 className="text-2xl font-bold text-gray-900">Welcome to Your Profile</h1>
        <div className="mt-4">
          <p>Here you can manage your account details, check your job application status, and more.</p>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
