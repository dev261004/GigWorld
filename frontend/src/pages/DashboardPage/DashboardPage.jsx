import Navbar from "../../components/Navbar/Navbar";
import Statcard from "../../components/Stat/Statcard";

const DashboardPage = () => {
    return (
        <div className="flex flex-col w-full h-full">
            <div className="pb-5">
                <Navbar />
            </div>
            <div className="w-full flex flex-row justify-between m-2">
                <div className="w-1/3 m-2"><Statcard prop={{name: "total sale", data: "$90"}}/></div>
                <div className="w-1/3 m-2"><Statcard prop={{name: "total rental", data: "$10"}}/></div>
                <div className="w-1/3 m-2"><Statcard prop={{name: "total earnings", data: "$100"}}/></div>
            </div>
        </div>
    )
}

export default DashboardPage;