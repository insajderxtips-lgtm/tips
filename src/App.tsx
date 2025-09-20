import { useSelector } from "react-redux";
import { HashRouter, Route, Routes } from "react-router";
import AboutUs from "./components/AboutUs";
import DefaultHomepage from "./components/Homepage";
import HowToPurchase, { StepTwo } from "./components/HowToPurchase";
import ArbitrageBetting from "./components/loggedUser/ArbitraryBetting/ArbitrageBetting";
import BestOdds from "./components/loggedUser/BestOdds";
import MyAccount from "./components/loggedUser/MyAccount";
import Sidebar from "./components/loggedUser/Sidebar";
import Statistics from "./components/loggedUser/Statistics";
import RenderTips from "./components/loggedUser/Tips/RenderTips";
import Login from "./components/Login";
import Navbar from "./components/Navbar";
import NotFound from "./components/NotFound";
import Protected from "./components/Protected";
import { RootState } from "./redux/store";
import Verifikacija from "./components/Verification";
import ResetPassword from "./components/ResetPassword";

function App() {
  const isLoggedIn = useSelector<RootState>(
    (state) => state.user.isAuthenticated
  );

  return (
    <div className={`h-[100vh] w-full ${isLoggedIn ? "flex" : ""} relative`}>
      <HashRouter>
        {!isLoggedIn ? <Navbar /> : <Sidebar />}
        <Routes>
          <Route path="/" element={<DefaultHomepage />} />
          <Route path="/onama" element={<AboutUs />} />

          <Route
            path="/kupi"
            element={
              <Protected protectionMode="verified">
                <HowToPurchase />
              </Protected>
            }
          >
            <Route
              path="/kupi/:paymentOption"
              element={
                <Protected protectionMode="verified">
                  <StepTwo />
                </Protected>
              }
            />
            <Route
              path="/kupi/uplatnica/potvrda"
              element={
                <Protected protectionMode="verified">
                  <p>p</p>
                </Protected>
              }
            />
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
              <Protected protectionMode="verified">
                <ArbitrageBetting />
              </Protected>
            }
          />
          <Route
            path="/statistike"
            element={
              <Protected protectionMode="verified">
                <Statistics />
              </Protected>
            }
          />
          <Route
            path="/freetips"
            element={
              <Protected protectionMode="verified">
                <RenderTips tier="free" />
              </Protected>
            }
          />
          <Route
            path="/premiumtips"
            element={
              <Protected protectionMode="verified">
                <RenderTips tier="premium" />
              </Protected>
            }
          />
          <Route
            path="/my-account"
            element={
              <Protected protectionMode="verified">
                <MyAccount />
              </Protected>
            }
          />

          <Route
            path="/najboljekvote"
            element={
              <Protected protectionMode="verified">
                <BestOdds />
              </Protected>
            }
          />
          <Route
            path="/verifikuj"
            element={
              <Protected protectionMode="loggedIn">
                <Verifikacija />
              </Protected>
            }
          />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </div>
  );
}

export default App;
