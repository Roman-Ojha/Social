import React, { useEffect } from "react";
import MainPageSideBar from "./MainPageSideBar";
import MainPageStory from "./MainPageStory";
import MainPageMsgAndNtfBar from "./MainPageMsgAndNtfBar";
import MainPageRightSideComp from "./MainPageRightSideComp";
import HomePage from "./HomePage";
import VideoPage from "./VideoPage";
import MessagePage from "./MessagePage";
import SettingPage from "./SettingPage";
import ProfilePage from "./ProfilePage";
import { Switch, Route, useHistory } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { userMainInformationAction } from "../redux-actions/index";
let history;
const RoutingMainPage = () => {
  return (
    <>
      <Switch>
        <Route exact path="/u" component={HomePage} />
        <Route exact path="/u/video" component={VideoPage} />
        <Route exact path="/u/message" component={MessagePage} />
        <Route exact path="/u/setting" component={SettingPage} />
        <Route exact path="/u/profile" component={ProfilePage} />
      </Switch>
    </>
  );
};

const MainPage = () => {
  const userMainInformationStore = useSelector(
    (state) => state.setUserMainInformationReducer
  );
  const userMainInformationDispatch = useDispatch();
  history = useHistory();
  useEffect(() => {
    const getUserData = async () => {
      try {
        const res = await fetch("/u", {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        const userData = await res.json();
        if (!res.status === 200) {
          const error = new Error(res.error);
          throw error;
        }
        userMainInformationDispatch(userMainInformationAction(userData));
      } catch (err) {
        console.log(err);
        history.push("/signin");
      }
    };
    getUserData();
  }, []);

  return (
    <>
      <div className="MainPage_Container">
        <MainPageSideBar />
        <MainPageStory />
        <RoutingMainPage />
        <MainPageMsgAndNtfBar />
        <MainPageRightSideComp />
      </div>
    </>
  );
};

export default MainPage;
