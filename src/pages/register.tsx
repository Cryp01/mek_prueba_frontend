import logo from "../assets/react.svg";
import { useState } from "react";
import { useAuthService } from "../services/authServices";
import { useLocation } from "react-router";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { register, error } = useAuthService();
  const location = useLocation();

  // Get redirect path from location state or default to notes
  const from = location.state?.from?.pathname || "/notes";

  const handleSubmit = async (e: React.FormEvent) => {
    console.log(from);
    e.preventDefault();
    await register(email, password);
  };
  return (
    <div className="bg-gray-100 flex justify-center items-center h-screen">
      <div className="w-1/2 h-screen hidden lg:flex  justify-center items-center">
        <img
          src={logo}
          alt="Placeholder Image"
          className="object-cover w-6/12"
        />
      </div>
      <div className="lg:p-36 md:p-52 sm:20 p-8 w-full lg:w-1/2">
        <h1 className="text-2xl font-semibold mb-4">Register</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-600">
              Email
            </label>
            <input
              type="text"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-600">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
            />
          </div>
          {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md py-2 px-4 w-full"
          >
            Register
          </button>
        </form>
        <div className="mt-6 text-blue-500 text-center">
          <a href="/login" className="hover:underline">
            Sign in Here
          </a>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
