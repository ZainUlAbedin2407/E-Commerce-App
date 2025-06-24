import { useState } from "react";
import { useNavigate } from "react-router-dom";

const cart = {
  products: [
    {
      name: "Stylish Jacket",
      size: "M",
      color: "black",
      price: 120,
      image: "https://picsum.photos/150?random=1",
    },
    {
      name: "Casual Sneakers",
      size: "42",
      color: "white",
      price: 70,
      image: "https://picsum.photos/150?random=2",
    },
  ],
  deliveryCharges: 1,
  totalPrice: 195,
};
const Checkout = () => {
  const navigate = useNavigate();
  const [checkoutId, setCheckoutId] = useState(null);
  const [shippingAddress, setShippingAddress] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    phone: "",
  });

  const handleCreateCheckout = (e) => {
    e.preventDefault();
    setCheckoutId(123);
  };

  // updated with COD option
  const handlePlaceOrder = () => {
    const orderData = {
      shippingAddress,
      paymentMethod: "cod",
      shippingFee: 200,
      cart,
      orderDate: new Date().toISOString(),
    };

    console.log("Order Placed:", orderData);
    navigate("/thank-you");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto py-10 px-6 tracking-tighter">
      {/* Left Section */}
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-2xl uppercase mb-6">Checkout</h2>
        <form onSubmit={handleCreateCheckout}>
          <h3 className="text-lg mb-4">Contact Details</h3>
          <div className="mb-4">
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              value="user@example.com"
              className="w-full p-2 border border-gray-200 rounded"
              disabled
            />
          </div>
          <h3 className="text-lg mb-4">Delivery</h3>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700">First Name</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-200 rounded"
                required
                value={shippingAddress.firstName}
                onChange={(e) =>
                  setShippingAddress({
                    ...shippingAddress,
                    firstName: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-gray-700">Last Name</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-200 rounded"
                required
                value={shippingAddress.lastName}
                onChange={(e) =>
                  setShippingAddress({
                    ...shippingAddress,
                    lastName: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Address</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-200 rounded"
              required
              value={shippingAddress.address}
              onChange={(e) =>
                setShippingAddress({
                  ...shippingAddress,
                  address: e.target.value,
                })
              }
            />
          </div>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700">City</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-200 rounded"
                required
                value={shippingAddress.city}
                onChange={(e) =>
                  setShippingAddress({
                    ...shippingAddress,
                    city: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-gray-700">Postal Code</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-200 rounded"
                required
                value={shippingAddress.postalCode}
                onChange={(e) =>
                  setShippingAddress({
                    ...shippingAddress,
                    postalCode: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Country</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-200 rounded"
              required
              value={shippingAddress.country}
              onChange={(e) =>
                setShippingAddress({
                  ...shippingAddress,
                  country: e.target.value,
                })
              }
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Phone</label>
            <input
              type="tel"
              className="w-full p-2 border border-gray-200 rounded"
              required
              value={shippingAddress.phone}
              onChange={(e) =>
                setShippingAddress({
                  ...shippingAddress,
                  phone: e.target.value,
                })
              }
            />
          </div>
          {/* Paypal Method which isn't avaialble in our region so */}
          {/* <div className="mt-6">
            {!checkoutId ? (
              <button
                type="submit"
                className="w-full bg-black text-white py-3 rounded"
              >
                Continue to Payment
              </button>
            ) : (
              <div>
                <h3 className="text-lg mb-4">Pay with Paypal</h3>
                // Paypal component 
              </div>
            )}
          </div> */}

          {/* i replaced it wil COD */}
          <div className="mt-6">
            {!checkoutId ? (
              <button
                type="submit"
                className="w-full bg-black text-white py-3 rounded"
              >
                Continue to Payment
              </button>
            ) : (
              <div className="mt-6">
                {/* 🔄 UPDATED: Shipping Method */}
                <h3 className="text-lg mb-2 font-semibold">Shipping Method</h3>
                <div className="relative mb-4">
                  <input
                    type="text"
                    value="Standard Shipping"
                    disabled
                    className="w-full p-3 pl-4 pr-20 border border-blue-500 bg-blue-100 rounded focus:outline-none text-gray-700 font-medium"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-600 font-semibold">
                    Rs. 200
                  </span>
                </div>

                {/* 🔄 UPDATED: Payment Method */}
                <h3 className="text-lg mb-2 font-semibold">Payment Method</h3>
                <p className="text-sm text-gray-500 mb-2">
                  All transactions are secure and encrypted.
                </p>
                <div className="mb-4">
                  <input
                    type="text"
                    value="Cash on Delivery (COD)"
                    disabled
                    className="w-full p-3 pl-4 border border-blue-500 bg-blue-100 rounded focus:outline-none text-gray-700 font-medium"
                  />
                </div>

                {/* 🔄 UPDATED: Confirm Order Button */}
                <button
                  onClick={handlePlaceOrder}
                  className="w-full bg-green-600 text-white py-3 rounded font-semibold hover:bg-green-700 transition"
                >
                  Confirm Order
                </button>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Right Section */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg mb-4">Order Summary</h3>
        <div className="border-t border-gray-200 py-4 mb-4">
          {cart.products.map((product, idx) => (
            <div
              className="flex items-start justify-between  py-2 border-b border-gray-200"
              key={idx}
            >
              <div className="flex items-start">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-20 h-24 object-cover mr-4"
                />
                <div>
                  <h3 className="text-md">{product.name}</h3>
                  <p className="text-gray-500">Size: {product.size}</p>
                  <p className="text-gray-500">Color: {product.color}</p>
                </div>
              </div>
              <p className="text-xl">${product.price?.toLocaleString()}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center text-lg mb-4">
          <p>Subtotal</p>
          <p>${cart.totalPrice?.toLocaleString()}</p>
        </div>
        <div className="flex justify-between items-center text-lg">
          <p>Shipping</p>
          <p>${cart.deliveryCharges}</p>
        </div>
        <div className="flex justify-between items-center text-lg border-t border-gray-200 pt-4">
          <p>Total</p>
          <p> ${(cart.totalPrice + cart.deliveryCharges)?.toLocaleString()} </p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
