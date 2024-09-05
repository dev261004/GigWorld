import Navbar from "../../components/Navbar/Navbar";
import React from 'react'
import Footer from "../../components/Footer/Footer";
import Contact from "../../components/Contact/Contact";

const ContactPage = () => {
  return (
    <div><div className="w-full  flex flex-col">
    <Navbar />
    <div className="flex flex-col p-7"><Contact /><Footer /></div>
</div></div>
  )
}

export default ContactPage;