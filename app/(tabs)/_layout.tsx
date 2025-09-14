import { AntDesign } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";

const Layout = () => {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="home" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="dashboard" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="supplies"
        options={{
          title: "Supplies",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="shopping-cart" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="guide"
        options={{
          title: "Guide",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="book" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: "Report",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="file" color={color} size={size} />
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
