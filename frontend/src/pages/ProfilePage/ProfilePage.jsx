import Navbar from "../../components/Navbar/Navbar";
import Sidebar from "../../components/Sidebar/Sidebar";

const ProfilePage = () => {
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
                    <h1 className="text-9xl">Profile page</h1>
                </div>
            </div>
        </div>
    )
}

export default ProfilePage;