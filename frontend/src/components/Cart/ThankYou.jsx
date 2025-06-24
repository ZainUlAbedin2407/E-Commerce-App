import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react"; // Optional icon from lucide-react (install if needed)

const ThankYou = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <CheckCircle className="text-green-600 w-16 h-16 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Confirmed!</h2>
        <p className="text-gray-600 mb-6">
          Thank you for your order. You’ll receive a confirmation message shortly.
          Our team will process and ship your item soon.
        </p>
        <Link
          to="/"
          className="inline-block bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default ThankYou;
