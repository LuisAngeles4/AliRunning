import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

// Screeens
import LoginScreen from "../screens/LoginScreen";
import TrackingScreen from "../screens/TrackingScreen";
import HistoryScreen from "../screens/HistoryScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ManualRunScreen from "../screens/ManualRunScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#000",
          borderTopColor: "#FFD700",
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: "#FFD700",
        tabBarInactiveTintColor: "#FFF",
        tabBarIcon: ({ color, size }) => {
          let iconName = "ellipse";
          if (route.name === "Historial") iconName = "time";
          if (route.name === "Tracking") iconName = "walk";
          if (route.name === "Perfil") iconName = "person";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Historial" component={HistoryScreen} />
      <Tab.Screen name="Tracking" component={TrackingScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Auth flow */}
        <Stack.Screen name="Login" component={LoginScreen} />
        {/* App Principal */}
        
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="ManualRun" component={ManualRunScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
