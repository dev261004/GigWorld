import Navbar from "../../components/Navbar/Navbar";
import Statcard from "../../components/Stat/Statcard";
import Sidebar from "../../components/Sidebar/Sidebar";

const DashboardPage = () => {
    return (
        <div className="flex flex-col w-full h-full">
            <div>
                <Navbar />
            </div>
            <div className="grid sm:grid-cols-9 grid-cols-1">
                <div className="col-span-2">
                    <Sidebar />
                </div>
                <div className="w-full flex flex-row justify-between col-span-7">
                    <div className="w-1/3 m-2"><Statcard prop={{name: "total sale", data: "₹90"}}/></div>
                    <div className="w-1/3 m-2"><Statcard prop={{name: "total rental", data: "₹10"}}/></div>
                    <div className="w-1/3 m-2"><Statcard prop={{name: "total earnings", data: "₹100"}}/></div>
                </div>
            </div>
        </div>
    )
}

export default DashboardPage;