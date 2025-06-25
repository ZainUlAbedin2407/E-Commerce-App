import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";
const OrderConfirmation = () => {
  const orderId = 12323;
  const orderDate = "13/12/2024";
  const deliveryDate = "23/12/2024";
  const deliveryAddress = "123 Fashion Street\nNew York, USA";

  const products = [
    {
      name: "Jacket",
      color: "black",
      size: "M",
      price: 150,
      qty: 1,
      image: "https://picsum.photos/50?random=1",
    },
    {
      name: "T-shirt",
      color: "black",
      size: "M",
      price: 120,
      qty: 2,
      image: "https://picsum.photos/50?random=2",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <CheckCircle className="text-green-600 w-16 h-16 mx-auto mb-4" />
        <h1 className="text-2xl md:text-3xl text-green-700 font-bold text-center mb-6">
          Thank You for Your Order!
        </h1>

        {/* Order Info */}
        <div className="flex justify-between mb-6 text-sm text-gray-600">
          <div>
            <p className="font-medium">Order ID: {orderId}</p>
            <p>Order date: {orderDate}</p>
          </div>
          <div className="text-right">
            <p className="font-medium text-green-700">
              Estimated Delivery: {deliveryDate}
            </p>
          </div>
        </div>

        {/* Products List */}
        <div className="border border-gray-200 rounded-md p-4 mb-6">
          {products.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between border-b border-gray-200 py-3 last:border-b-0"
            >
              <div className="flex items-center space-x-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-12 object-cover rounded"
                />
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-gray-500">
                    {item.color} | {item.size}
                  </p>
                </div>
              </div>
              <div className="text-right text-sm">
                <p className="font-medium">${item.price}</p>
                <p className="text-gray-500">Qty: {item.qty}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Payment & Delivery */}
        <div className="flex justify-between text-sm text-gray-700">
          <div>
            <p className="font-semibold mb-1">Payment</p>
            <p>Cash on Delivery</p>
          </div>
          <div className="text-right">
            <p className="font-semibold mb-1">Delivery</p>
            <p className="whitespace-pre-line">{deliveryAddress}</p>
          </div>
        </div>

        {/* Button */}
        <div className="text-center mt-8">
          <Link
            to="/"
            className="inline-block bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
