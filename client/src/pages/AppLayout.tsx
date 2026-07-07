import { Outlet } from "react-router-dom"
import Banner from "../components/Banner"
import Navbar from "../components/Navbar"


const AppLayout = () => {
  return (
    <>
    <Banner/>
    <Navbar/>
    <main className="min-h-screen">
      <Outlet/>
    </main>
    <p>footer</p>
    <p>CartSideBar</p>
    </>
  )
}

export default AppLayout