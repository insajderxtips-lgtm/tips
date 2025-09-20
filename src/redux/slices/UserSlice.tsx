import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserState {
  _id: string | null;
  username: string | null;
  email: string | null;
  tier: string | null;
  isAuthenticated: boolean;
  defaultCurrency: string | null;
  isVerified: boolean | null;
  vc: string | null;
}

const initialState: UserState = {
  _id: null,
  username: null,
  email: null,
  tier: null,
  isAuthenticated: false,
  defaultCurrency: null,
  isVerified: false,
  vc: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserState>) => {
      const { _id, username, email, tier, defaultCurrency, isVerified } =
        action.payload;
      state._id = _id;
      state.username = username;
      state.email = email;
      state.tier = tier;
      state.isAuthenticated = true;
      state.defaultCurrency = defaultCurrency;
      state.isVerified = isVerified;
    },
    logout: (state) => {
      state.email = null;
      state._id = null;
      state.username = null;
      state.tier = null;
      state.defaultCurrency = null;
      state.isAuthenticated = false;
      localStorage.removeItem("insajder_token");
    },
  },
});

export const { setUser, logout } = userSlice.actions;
export default userSlice.reducer;
