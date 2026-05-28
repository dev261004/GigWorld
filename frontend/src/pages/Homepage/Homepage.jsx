import Footer from "../../components/Footer/Footer";
import Hero from "../../components/Hero/Hero";
import HomeWorkflow from "../../components/HomeWorkflow/HomeWorkflow";
import Navbar from "../../components/Navbar/Navbar";
import SourceSites from "../../components/SourceSites/SourceSites";

const Homepage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <SourceSites />
        <HomeWorkflow />
      </main>
      <Footer />
    </div>
  );
};

export default Homepage
