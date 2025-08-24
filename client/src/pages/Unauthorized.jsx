import React from 'react';

const Unauthorized = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <h1 className="text-6xl font-extrabold text-red-600 mb-4">401</h1>
      <h2 className="text-3xl font-semibold mb-6">Unauthorized Access</h2>
      <p className="text-gray-700 mb-8 max-w-md text-center">
        Sorry, you do not have permission to view this page. Please login or contact the administrator if you believe this is an error.
      </p>
      <a 
        href="/login" 
        className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
      >
        Go to Login
      </a>
    </div>
  );
};

export default Unauthorized;
