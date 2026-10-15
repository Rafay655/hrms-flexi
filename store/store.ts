// store/store.ts
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import ccPermissionReducer from "@/lib/stores/connect-central/permissionStore";
import ccSessionReducer from "@/lib/stores/connect-central/sessionStore";
import ccSecurityReducer from "@/lib/stores/connect-central/securityStore";
import storage from "./storage";

import authReducer from "./authSlice";
import sidebarReducer from "./sidebarSlice";
import onboardingReducer from "./onboarding-slice";

const authPersistConfig = {
  key: "auth",
  storage,
  whitelist: ["token", "user", "company", "roles", "permissions"],
};

const onboardingPersistConfig = {
  key: "onboarding",
  storage,
  whitelist: ["schema"],
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);

const persistedOnboardingReducer = persistReducer(
  onboardingPersistConfig,
  onboardingReducer
);

const rootReducer = combineReducers({
  auth: persistedAuthReducer,
  sidebar: sidebarReducer,
  onboarding: persistedOnboardingReducer,
   ccPermission: ccPermissionReducer,
    ccSession: ccSessionReducer,         // new
  ccSecurity: ccSecurityReducer,       // new
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;