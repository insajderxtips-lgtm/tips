import { useSelector } from "react-redux";
import { HashRouter, Route, Routes } from "react-router";
import AboutUs from "./components/AboutUs";
import DefaultHomepage from "./components/Homepage";
import Login from "./components/Login";
import Navbar from "./components/Navbar";
import Protected from "./components/Protected";
import ArbitrageBetting from "./components/loggedUser/ArbitraryBetting/ArbitrageBetting";
import MyAccount from "./components/loggedUser/MyAccount";
import Sidebar from "./components/loggedUser/Sidebar";
import Statistics from "./components/loggedUser/Statistics";
import RenderTips from "./components/loggedUser/Tips/RenderTips";
import { RootState } from "./redux/store";
import HowToPurchase, { StepTwo } from "./components/HowToPurchase";
import BestOdds from "./components/loggedUser/BestOdds";
import NotFound from "./components/NotFound";

function App() {
  const isLoggedIn = useSelector<RootState>(
    (state) => state.user.username != null
  );

  return (
    <div className={`h-[100vh] w-full ${isLoggedIn ? "flex" : ""} relative`}>
      <HashRouter>
        {!isLoggedIn ? <Navbar /> : <Sidebar />}
        <Routes>
          <Route path="/" element={<DefaultHomepage />} />
          <Route path="/onama" element={<AboutUs />} />
          <Route path="/kupi" element={<HowToPurchase />}>
            <Route path="/kupi/:paymentOption" element={<StepTwo />} />
            <Route path="/kupi/uplatnica/potvrda" element={<p>p</p>}/>
          </Route>
          <Route
            path="/login"
            element={
              <Protected protectionMode="loggedOut">
                <Login mode="login" />
              </Protected>
            }
          />
          <Route
            path="/register"
            element={
              <Protected protectionMode="loggedOut">
                <Login mode="register" />
              </Protected>
            }
          />
          <Route
            path="/arbitragebetting"
            element={
              <Protected protectionMode="loggedIn">
                <ArbitrageBetting />
              </Protected>
            }
          />
          <Route
            path="/statistike"
            element={
              <Protected protectionMode="loggedIn">
                <Statistics />
              </Protected>
            }
          />
          <Route
            path="/freetips"
            element={
              <Protected protectionMode="loggedIn">
                <RenderTips tier="free" />
              </Protected>
            }
          />
          <Route
            path="/premiumtips"
            element={
              <Protected protectionMode="loggedIn">
                <RenderTips tier="premium" />
              </Protected>
            }
          />
          <Route
            path="/my-account"
            element={
              <Protected protectionMode="loggedIn">
                <MyAccount />
              </Protected>
            }
          />
          <Route
            path="/najboljekvote"
            element={
              <Protected protectionMode="loggedIn">
                <BestOdds />
              </Protected>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </div>
  );
}

export default App;
