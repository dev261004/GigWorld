import React from "react";
import boxicons from "boxicons";

const Contributors = () => {
  return (
    <section className="py-10">
      <h1 className="mb-2 text-center font-sans text-xl font-bold">
        Our Team
      </h1>
      <div className="mx-auto grid max-w-screen-lg justify-center px-4 sm:grid-cols-2 sm:gap-4 sm:px-8 md:grid-cols-3">
        <article className="mx-auto my-4 flex w-full flex-col overflow-hidden rounded-2xl border border-gray-300 bg-white text-gray-900 transition hover:translate-y-2 hover:shadow-lg">
          <a href="#">
            <img
              src="https://res.cloudinary.com/dsz5koczi/image/upload/v1731729313/qovnl2ha9zanmun04y0w.jpg"
              className="h-56 w-full object-cover"
              alt=""
            />
            <div className="flex-auto px-6 py-5">
              <h3 className="mt-4 mb-3 text-xl font-semibold xl:text-2xl">
                Kirtan Patel
              </h3>
              <p className="mb-4 text-base font-light">
                Lead frontend Develpoer
              </p>
              <span className="inline-block cursor-pointer select-none rounded-full border border-gray-800 bg-gray-800 px-2 py-1 text-center align-middle text-sm font-semibold leading-normal text-white no-underline shadow-sm">
                Learn More
              </span>
            </div>
          </a>
        </article>
        <article className="mx-auto my-4 flex w-full flex-col overflow-hidden rounded-2xl border border-gray-300 bg-white text-gray-900 transition hover:translate-y-2 hover:shadow-lg">
          <a href="#">
            <img
              src="https://res.cloudinary.com/dsz5koczi/image/upload/v1731729464/zgoltyj8yfcsjeacasug.jpg"
              className="h-56 w-full object-cover"
              alt=""
            />
            <div className="flex-auto px-6 py-5">
              <h3 className="mt-4 mb-3 text-xl font-semibold xl:text-2xl">
                Dev Agrawal
              </h3>
              <p className="mb-4 text-base font-light">
                Lead Backend Developer
              </p>
              <span className="inline-block cursor-pointer select-none rounded-full border border-gray-800 bg-gray-800 px-2 py-1 text-center align-middle text-sm font-semibold leading-normal text-white no-underline shadow-sm">
                Learn More
              </span>
            </div>
          </a>
        </article>
        <article className="mx-auto my-4 flex w-full flex-col overflow-hidden rounded-2xl border border-gray-300 bg-white text-gray-900 transition hover:translate-y-2 hover:shadow-lg">
          <a href="#">
            <img
              src="https://res.cloudinary.com/dsz5koczi/image/upload/v1731729470/bpidcfrsbvc0mbwr1yek.jpg"
              className="h-56 w-full object-cover"
              alt=""
            />
            <div className="flex-auto px-6 py-5">
              <h3 className="mt-4 mb-3 text-xl font-semibold xl:text-2xl">
                Sujal Morwani
              </h3>
              <p className="mb-4 text-base font-light">
                Research and operations
              </p>
              <span className="inline-block cursor-pointer select-none rounded-full border border-gray-800 bg-gray-800 px-2 py-1 text-center align-middle text-sm font-semibold leading-normal text-white no-underline shadow-sm">
                Learn More
              </span>
              {/* <span className="inline-block cursor-pointer select-none rounded-full border border-gray-80 px-2 py-1 text-center align-middle text-sm font-semibold leading-normal text-white no-underline shadow-sm">
                <a href="#"><i class="bx bxl-facebook-square"></i></a>
              </span> */}
              {/* <span className="inline-block cursor-pointer select-none rounded-full border border-gray-800 bg-gray-800 px-2 py-1 text-center align-middle text-sm font-semibold leading-normal text-white no-underline shadow-sm">
                <a href="#"></a>
              </span> */}
              {/* <span className="inline-block cursor-pointer select-none rounded-full border border-gray-800 bg-gray-800 px-2 py-1 text-center align-middle text-sm font-semibold leading-normal text-white no-underline shadow-sm">
                <a href="#"></a>
              </span> */}
            </div>
          </a>
        </article>
      </div>
    </section>
  );
};

export default Contributors;
