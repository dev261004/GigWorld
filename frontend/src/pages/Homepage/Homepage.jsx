import Footer from "../../components/Footer/Footer";
import Hero from "../../components/Hero/Hero";
import Navbar from "../../components/Navbar/Navbar";

import SourceSites from "../../components/SourceSites/SourceSites";
import Contributors from "../../components/Contributors/Contributors";

const Homepage = () => {
  return (
    <div><div className="w-full  flex flex-col">
    <Navbar />
    <div className="flex flex-col p-7"><Hero /><SourceSites /><Contributors /><Footer /></div>
</div></div>
  )
}

export default Homepage