import { AntDesign, Foundation, MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";

const Layout = () => {
  return (
    <Tabs>
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="home" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="maps"
        options={{
          title: "Maps",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Foundation name="map" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="result"
        options={{
          title: "Result",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="storage" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="user" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
};

export default Layout;
