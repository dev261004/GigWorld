import { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    question: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Send the form data via POST request to the API
    fetch('http://localhost:2610/api/v1/contact/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })
      .then((response) => response.json())
      .then((data) => {
        // Handle the response from the API
        console.log(data);
      })
      .catch((error) => {
        // Handle any errors
        console.error(error);
      });
  };

  return (
    <div className="sm:p-10 my-auto">
      <section className="mx-auto max-w-screen-xl md:rounded-md md:border md:shadow-lg">
        <div className="grid grid-cols-4 text-gray-800 lg:grid-cols-3">
          <div className="col-span-4 bg-gray-50 px-8 py-10 text-gray-800 md:col-span-2 md:border-r md:px-10 md:py-12 lg:col-span-1">
            <h2 className="mb-8 text-2xl font-black">Contact me</h2>
            <ul>
              <li className="mb-6 flex items-start text-left">
                {/* ...facebook logo */}
              </li>
              <li className="my-6 flex items-center text-left">
                {/* ... instagram logo*/}
              </li>
              <li className="my-6 flex items-center text-left">
                {/* ... twitter logo*/}
              </li>
            </ul>
          </div>
          <div className="order-first col-span-4 max-w-screen-md px-8 py-10 md:order-last md:col-span-2 md:px-10 md:py-12">
            <h2 className="mb-8 text-2xl font-black">Get in touch</h2>
            <p className="mt-2 mb-4 font-sans text-sm tracking-normal">
              Don't be shy to ask me a question.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="md:col-gap-4 mb-5 grid md:grid-cols-2">
                <input
                  className="col-span-1 w-full border-b py-3 text-sm outline-none focus:border-b-2 focus:border-black"
                  type="text"
                  placeholder="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
                <input
                  className="col-span-1 w-full border-b py-3 text-sm outline-none focus:border-b-2 focus:border-black"
                  type="email"
                  placeholder="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <textarea
                className="mb-10 w-full resize-y whitespace-pre-wrap border-b py-3 text-sm outline-none focus:border-b-2 focus:border-black"
                id=""
                rows={6}
                placeholder="Question"
                name="question"
                value={formData.question}
                onChange={handleChange}
              />
              <button
                type="submit"
                className="group flex cursor-pointer items-center rounded-xl bg-blue-600 bg-none px-8 py-4 text-center font-semibold leading-tight text-white"
              >
                Send
                <svg
                  className="group-hover:ml-8 ml-4 transition-all"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  role="img"
                  width="1em"
                  height="1em"
                  preserveAspectRatio="xMidYMid meet"
                  viewBox="0 0 24 24"
                >
                  {/* ... send button logo*/}
                </svg>
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
