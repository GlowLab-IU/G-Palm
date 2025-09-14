import * as SecureStore from "expo-secure-store";

const K = { access: "accessToken", refresh: "refreshToken" };

export async function saveTokens(accessToken: string, refreshToken?: string) {
  await SecureStore.setItemAsync(K.access, accessToken);
  if (refreshToken) await SecureStore.setItemAsync(K.refresh, refreshToken);
}

export async function getAccessToken() {
  return SecureStore.getItemAsync(K.access);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(K.access);
  await SecureStore.deleteItemAsync(K.refresh);
}
