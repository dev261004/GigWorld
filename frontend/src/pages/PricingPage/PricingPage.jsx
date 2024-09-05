import Navbar from "../../components/Navbar/Navbar";
import React from 'react'
import Pricing from "../../components/Pricing/Pricing";
import Footer from "../../components/Footer/Footer";

const PricingPage = () => {
  return (
    <div><div className="w-full  flex flex-col">
    <Navbar />
    <div className="flex flex-col p-7"><Pricing /><Footer /></div>
</div></div>
  )
}

export default PricingPage;