import React from "react";
import "../styles/components/moreProfileBox.css";
import User_Profile_Icon from "../assets/svg/User_profile_Icon.svg";
import { NavLink, useHistory } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useSelector, useDispatch } from "react-redux";
// import {
//   profilePageDataAction,
//   setRootUserProfileDataState,
//   startProgressBar,
//   stopProgressBar,
//   openRightPartDrawer,
// } from "../services/redux-actions";
import { instance as axios } from "../services/axios";
import { toastInfo } from "../services/toast";
import constant from "../constant/constant";
import { useMediaQuery } from "react-responsive";
import { AppState, actionCreators } from "../services/redux";
import { bindActionCreators } from "redux";
import { toastError, toastSuccess } from "../services/toast";
import { AxiosError } from "axios";

const MoreProfileBox = (): JSX.Element => {
  const history = useHistory();
  const dispatch = useDispatch();
  const userProfileDetailStore = useSelector(
    (state: AppState) => state.setUserProfileDetailReducer
  );
  const moreProfileBoxState = useSelector(
    (state: AppState) => state.moreProfileBoxReducer
  );
  const rootUserProfileDataState = useSelector(
    (state: AppState) => state.rootUserProfileDataState
  );
  const isMax850px = useMediaQuery({
    query: `(max-width:${constant.mediaQueryRes.screen850}px)`,
  });
  const {
    profilePageDataAction,
    setRootUserProfileDataState,
    startProgressBar,
    stopProgressBar,
    openRightPartDrawer,
  } = bindActionCreators(actionCreators, dispatch);

  const date = new Date();
  const userLogOut = async (): Promise<void> => {
    try {
      startProgressBar();
      const res = await axios({
        method: "GET",
        url: "/u/logout",
        headers: {
          Accpet: "application/josn",
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
      stopProgressBar();
      history.push("/signin", { replace: true });
      if (res.status !== 200) {
        // const error = new Error(res.error);
        // throw error;
        toastError("Some Problem Occur, Please Try again later!!!");
      } else {
        toastSuccess("You are logged out");
      }
    } catch (error) {
      const err = error as AxiosError;
      stopProgressBar();
      if (err.response) {
        if (err.response.data.success === false) {
          toastError(err.response.data.msg);
        }
      } else {
        toastError("Some Problem Occur, Please Try again later!!!");
      }
    }
  };
  return (
    <>
      {moreProfileBoxState ? (
        <div className="More_Profile_Box_Container">
          <NavLink
            to={`/u/profile/${userProfileDetailStore.userID}/posts`}
            className="More_Profile_Box_User_Info"
            onClick={() => {
              const userObj = {
                ...userProfileDetailStore,
                isRootUserFollowed: false,
              };
              profilePageDataAction(userObj);
              if (!rootUserProfileDataState.fetchedRootUserProfileData) {
                setRootUserProfileDataState({
                  fetchedRootUserProfileData: false,
                  getRootUserProfileData: true,
                });
              }
              if (isMax850px) {
                openRightPartDrawer(false);
              }
            }}
          >
            <img
              src={
                userProfileDetailStore.picture
                  ? userProfileDetailStore.picture
                  : User_Profile_Icon
              }
              alt="user"
            />
            <p>Roman Ojha</p>
          </NavLink>
          <NavLink to="/u/setting" className="More_Profile_Box_Setting">
            <Icon
              icon="ant-design:setting-filled"
              className="More_Profile_Box_Icon"
            />
            <p>Setting</p>
          </NavLink>
          <div
            className="More_Profile_Box_Help"
            onClick={() => {
              toastInfo("Helping...");
            }}
          >
            <Icon icon="bxs:help-circle" className="More_Profile_Box_Icon" />
            <p>Help</p>
          </div>
          <div className="More_Profile_Box_logout" onClick={userLogOut}>
            <Icon icon="majesticons:logout" className="More_Profile_Box_Icon" />
            <p>Log Out</p>
          </div>
          <div className="More_Profile_Box_App_Info">
            <p
              onClick={() => {
                toastInfo(
                  `${constant.applicationName} ©️ ${date.getFullYear()}`
                );
              }}
            >
              {constant.applicationName} &copy; {date.getFullYear()}
            </p>
            <Icon
              icon="akar-icons:github-fill"
              className="More_Profile_Box_Github_Icon"
              onClick={() => {
                window.open(constant.applicationGithubUrl, "_blank");
              }}
            />
          </div>
        </div>
      ) : (
        ""
      )}
    </>
  );
};

export default MoreProfileBox;