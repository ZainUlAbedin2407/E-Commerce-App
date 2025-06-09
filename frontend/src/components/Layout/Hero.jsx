import { Link } from "react-router-dom";
import heroImg from "../../assets/heroImg.avif";
const Hero = () => {
  return (
    <section className="relative w-full">
      <img
        src={heroImg}
        alt="Rabbit"
        // className="w-full h-[400px] md:h-[600px] lg:h-[750px] object-cover"
        className="w-full h-auto max-h-screen object-center"
      />
      <div className="absolute inset-0 bg-black/5  flex items-center justify-center">
        <div className="text-center text-white p-6">
          <h1 className="text-3xl md:text-9xl font-bold tracking-tighter uppercase mb-4">
            Vacation <br /> Ready
          </h1>
          <p className="text-sm tracking-tighter md:text-lg mb-3 sm:mb-6">
            Explore our vacation-ready outfits with fast worldwide shipping,
          </p>
          <Link
            to="#"
            className="bg-white text-gray-950 px-4 py-1 md:px-6 md:py-2 rounded-sm text-lg"
          >
            Shop Now
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;
