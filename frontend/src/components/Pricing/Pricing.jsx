const Pricing = () => {
    return (
        <>
  <link
    href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
    rel="stylesheet"
  />
  <link
    href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&display=swap"
    rel="stylesheet"
  />
  <style
    dangerouslySetInnerHTML={{
      __html:
        "\n  :root {\n  font-family: 'IBM Plex Sans','Merriweather';\n  }\n"
    }}
  />
  <div className="mx-auto md:py-20 w-screen mb-10 w-full bg-slate-50 px-5 py-10 text-blue-800">
    <div className="mx-auto max-w-4xl lg:max-w-5xl lg:flex">
      <div className="md:flex lg:w-1/4 md:flex-col px-5">
        <div className="w-full flex-grow text-left">
          <h1 className="mb-5 text-4xl font-bold">Pricing</h1>
          <h3 className="text-md mb-5 font-medium">
            Lorem ipsum dolor sit amet consectetur adipisicing elit repellat
            dignissimos
          </h3>
        </div>
        <div className="mb-2 w-full">
          <p className="text-xs">*Please read the terms.</p>
        </div>
      </div>
      <div className="lg:w-3/4">
        <div className="mx-auto max-w-4xl md:flex">
          <div className="mx-auto mb-3 w-full rounded-md bg-white px-8 py-8 shadow-lg shadow-blue-100 md:my-2 md:flex md:w-1/3 md:max-w-none md:flex-col md:px-10 md:py-10">
            <div className="w-full flex-grow">
              <h2 className="mb-4 text-center font-bold uppercase">PERSONAL</h2>
              <h3 className="mb-5 text-center text-4xl font-bold">
                $25<span className="text-sm">/mo</span>
              </h3>
              <ul className="mb-8 text-sm">
                <li className="flex items-center leading-tight">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-blue-600 mr-2 h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Lorem ipsum
                </li>
                <li className="flex items-center leading-tight">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-blue-600 mr-2 h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Dolor sit amet
                </li>
              </ul>
            </div>
            <div className="w-full">
              <button className="w-full whitespace-nowrap rounded-md bg-gray-500 px-10 py-2 font-bold text-white transition-colors hover:bg-gray-700">
                Free Trial
              </button>
            </div>
          </div>
          <div className="mx-auto mb-3 w-full rounded-md bg-white px-8 py-8 shadow-lg shadow-blue-100 md:relative md:z-50 md:-mx-3 md:mb-0 md:flex md:w-1/3 md:max-w-none md:flex-col md:px-10 md:py-10">
            <div className="w-full flex-grow">
              <h2 className="mb-4 text-center font-bold uppercase">TEAM</h2>
              <h3 className="mb-5 text-center text-4xl font-bold md:text-5xl">
                $75<span className="text-sm">/mo</span>
              </h3>
              <ul className="mb-8 text-sm">
                <li className="flex items-center leading-tight">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-blue-600 mr-2 h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Lorem ipsum
                </li>
                <li className="flex items-center leading-tight">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-blue-600 mr-2 h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Dolor sit amet
                </li>
                <li className="flex items-center leading-tight">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-blue-600 mr-2 h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Consectetur
                </li>
                <li className="flex items-center leading-tight">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-blue-600 mr-2 h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Adipisicing
                </li>
                <li className="flex items-center leading-tight">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-blue-600 mr-2 h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Elit repellat
                </li>
              </ul>
            </div>
            <div className="w-full">
              <button className="w-full whitespace-nowrap rounded-md bg-blue-600 px-10 py-2 font-bold text-white transition-colors hover:bg-blue-700">
                Free Trial
              </button>
            </div>
          </div>
          <div className="mx-auto mb-3 w-full rounded-md bg-white px-8 py-8 shadow-lg shadow-blue-100 md:my-2 md:flex md:w-1/3 md:max-w-none md:flex-col md:px-10 md:py-10">
            <div className="w-full flex-grow">
              <h2 className="mb-4 text-center font-bold uppercase">PRO</h2>
              <h3 className="mb-5 text-center text-4xl font-bold">
                $250<span className="text-sm">/mo</span>
              </h3>
              <ul className="mb-8 text-sm">
                <li className="flex items-center leading-tight">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-blue-600 mr-2 h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Lorem ipsum
                </li>
                <li className="flex items-center leading-tight">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-blue-600 mr-2 h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Dolor sit amet
                </li>
                <li className="flex items-center leading-tight">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-blue-600 mr-2 h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Consectetur
                </li>
                <li className="flex items-center leading-tight">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-blue-600 mr-2 h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Adipisicing
                </li>
                <li className="flex items-center leading-tight">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-blue-600 mr-2 h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Much more...
                </li>
              </ul>
            </div>
            <div className="w-full">
              <button className="w-full whitespace-nowrap rounded-md bg-gray-500 px-10 py-2 font-bold text-white transition-colors hover:bg-gray-700">
                Free Trial
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</>

    )
}

export default Pricing;